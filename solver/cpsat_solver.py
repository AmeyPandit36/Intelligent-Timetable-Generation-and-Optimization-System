"""Google OR-Tools CP-SAT timetable formulation with an exact fallback solver."""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from typing import Iterable, Mapping

from .candidates import filter_valid_resources, generate_candidate_blocks
from .eligibility import add_eligibility_constraints
from .models import Assignment, Faculty, Resource, SchedulableSession
from .workload import add_workload_cap_constraints


@dataclass(frozen=True)
class SolveResult:
    status: str
    assignments: tuple[Assignment, ...] = ()
    objective_score: float | None = None
    engine: str = "CP-SAT"
    message: str = ""


def solve_sessions(
    sessions: list[SchedulableSession],
    resources: list[Resource],
    faculty_by_id: Mapping[str, Faculty],
    days: tuple[str, ...] = ("MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"),
    periods_per_day: int = 7,
    faculty_blackouts: Mapping[str, set[tuple[str, int]]] | None = None,
    assignment_penalties: Mapping[tuple[str, str], int] | None = None,
    time_limit_seconds: float = 30,
) -> SolveResult:
    """Build and solve all hard constraints, minimizing optional room penalties."""
    workload_minutes: dict[str, int] = defaultdict(int)
    for session in sessions:
        faculty = faculty_by_id.get(session.faculty_id)
        if faculty is None:
            return SolveResult(status="INFEASIBLE", message=f"Session {session.id} references unknown faculty {session.faculty_id}.")
        if session.subject_id not in faculty.eligible_subject_ids:
            return SolveResult(status="INFEASIBLE", message=f"{faculty.name} is not eligible to teach {session.subject_id}.")
        workload_minutes[faculty.id] += session.duration_periods * 60
    for faculty_id, required_minutes in workload_minutes.items():
        faculty = faculty_by_id[faculty_id]
        if required_minutes > round(faculty.max_weekly_workload * 60):
            return SolveResult(
                status="INFEASIBLE",
                message=f"{faculty.name} requires {required_minutes / 60:g} hours but is capped at {faculty.max_weekly_workload:g}.",
            )

    try:
        from ortools.sat.python import cp_model
    except ImportError:
        return _solve_with_backtracking(
            sessions,
            resources,
            days,
            periods_per_day,
            faculty_blackouts or {},
            assignment_penalties or {},
        )

    model = cp_model.CpModel()
    blackouts = faculty_blackouts or {}
    penalties = assignment_penalties or {}
    candidates: dict[str, list[tuple[object, Resource]]] = {}

    for session in sessions:
        blocks = generate_candidate_blocks(
            session,
            days,
            periods_per_day,
            blocked_periods=blackouts.get(session.faculty_id, set()),
        )
        valid_resources = filter_valid_resources(session, resources)
        candidates[session.id] = [(block, resource) for block in blocks for resource in valid_resources]
        if not candidates[session.id]:
            return SolveResult(
                status="INFEASIBLE",
                message=f"Session {session.id} has no valid time-and-resource candidates.",
            )

    variables: dict[tuple[str, str, str], object] = {}
    for session in sessions:
        for block, resource in candidates[session.id]:
            key = (session.id, block.id, resource.id)
            variables[key] = model.NewBoolVar(f"y_{session.id}_{block.id}_{resource.id}")
        model.Add(
            sum(variables[(session.id, block.id, resource.id)] for block, resource in candidates[session.id])
            == 1
        )

    room_periods: dict[tuple[str, str, int], list[object]] = defaultdict(list)
    faculty_periods: dict[tuple[str, str, int], list[object]] = defaultdict(list)
    cohort_periods: dict[tuple[str, str, int], list[object]] = defaultdict(list)
    sessions_by_id = {session.id: session for session in sessions}

    for session in sessions:
        for block, resource in candidates[session.id]:
            variable = variables[(session.id, block.id, resource.id)]
            for period in block.period_indices:
                room_periods[(resource.id, block.day, period)].append(variable)
                faculty_periods[(session.faculty_id, block.day, period)].append(variable)
                for cohort_id in session.cohort_ids:
                    cohort_periods[(cohort_id, block.day, period)].append(variable)

    for grouped_vars in (*room_periods.values(), *faculty_periods.values(), *cohort_periods.values()):
        if len(grouped_vars) > 1:
            model.Add(sum(grouped_vars) <= 1)

    add_eligibility_constraints(model, variables, sessions_by_id, faculty_by_id)
    add_workload_cap_constraints(model, variables, sessions_by_id, faculty_by_id)

    objective_terms = []
    for (session_id, block_id, resource_id), variable in variables.items():
        penalty = penalties.get((session_id, resource_id), 0)
        if penalty:
            objective_terms.append(variable * penalty)
    if objective_terms:
        model.Minimize(sum(objective_terms))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = time_limit_seconds
    solver.parameters.num_search_workers = 8
    status = solver.Solve(model)
    status_name = solver.StatusName(status)
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return SolveResult(status=status_name, message="No assignment satisfies every hard constraint.")

    solved: list[Assignment] = []
    for (session_id, block_id, resource_id), variable in variables.items():
        if solver.Value(variable):
            solved.append(Assignment(session_id, block_id, resource_id))
    objective = solver.ObjectiveValue() if objective_terms else 0.0
    return SolveResult(status=status_name, assignments=tuple(solved), objective_score=objective)


def _solve_with_backtracking(
    sessions: list[SchedulableSession],
    resources: list[Resource],
    days: tuple[str, ...],
    periods_per_day: int,
    faculty_blackouts: Mapping[str, set[tuple[str, int]]],
    penalties: Mapping[tuple[str, str], int],
) -> SolveResult:
    """Pure-Python exact fallback used when the native OR-Tools wheel is unavailable."""
    candidate_map = {}
    for session in sessions:
        blocks = generate_candidate_blocks(session, days, periods_per_day, faculty_blackouts.get(session.faculty_id, set()))
        rooms = filter_valid_resources(session, resources)
        candidate_map[session.id] = [(block, room) for block in blocks for room in rooms]
        if not candidate_map[session.id]:
            return SolveResult(status="INFEASIBLE", engine="BACKTRACKING", message=f"Session {session.id} has no valid candidates.")

    ordered = sorted(sessions, key=lambda item: len(candidate_map[item.id]))
    room_busy: set[tuple[str, str, int]] = set()
    faculty_busy: set[tuple[str, str, int]] = set()
    cohort_busy: set[tuple[str, str, int]] = set()
    current: list[Assignment] = []
    best: list[Assignment] | None = None
    best_penalty = float("inf")

    def search(index: int, score: int) -> None:
        nonlocal best, best_penalty
        if score >= best_penalty:
            return
        if index == len(ordered):
            best, best_penalty = list(current), score
            return
        session = ordered[index]
        ranked = sorted(candidate_map[session.id], key=lambda pair: penalties.get((session.id, pair[1].id), 0))
        for block, resource in ranked:
            room_keys = {(resource.id, block.day, p) for p in block.period_indices}
            faculty_keys = {(session.faculty_id, block.day, p) for p in block.period_indices}
            cohort_keys = {(cohort, block.day, p) for cohort in session.cohort_ids for p in block.period_indices}
            if room_keys & room_busy or faculty_keys & faculty_busy or cohort_keys & cohort_busy:
                continue
            room_busy.update(room_keys)
            faculty_busy.update(faculty_keys)
            cohort_busy.update(cohort_keys)
            current.append(Assignment(session.id, block.id, resource.id))
            search(index + 1, score + penalties.get((session.id, resource.id), 0))
            current.pop()
            room_busy.difference_update(room_keys)
            faculty_busy.difference_update(faculty_keys)
            cohort_busy.difference_update(cohort_keys)

    search(0, 0)
    if best is None:
        return SolveResult(status="INFEASIBLE", engine="BACKTRACKING", message="No assignment satisfies every hard constraint.")
    return SolveResult(status="OPTIMAL", assignments=tuple(best), objective_score=best_penalty, engine="BACKTRACKING")
