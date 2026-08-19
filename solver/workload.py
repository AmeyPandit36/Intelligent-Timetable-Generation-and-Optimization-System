"""Weekly faculty workload accounting and CP-SAT upper bounds."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Mapping

from .models import Faculty, SchedulableSession, TeachingRequirement


@dataclass(frozen=True)
class WorkloadViolation:
    faculty_id: str
    faculty_name: str
    required_hours: float
    maximum_hours: float

    @property
    def message(self) -> str:
        return (
            f"{self.faculty_name} requires {self.required_hours:g} weekly hours, "
            f"exceeding the {self.maximum_hours:g}-hour workload cap."
        )


def calculate_required_hours(
    requirements: list[TeachingRequirement], period_minutes: int = 60
) -> dict[str, float]:
    if period_minutes <= 0:
        raise ValueError("period_minutes must be positive")
    totals: dict[str, float] = {}
    for requirement in requirements:
        periods = requirement.duration_periods * requirement.weekly_frequency
        totals[requirement.faculty_id] = totals.get(requirement.faculty_id, 0.0) + (
            periods * period_minutes / 60
        )
    return totals


def validate_workload_caps(
    requirements: list[TeachingRequirement],
    faculty_by_id: Mapping[str, Faculty],
    period_minutes: int = 60,
) -> list[WorkloadViolation]:
    violations: list[WorkloadViolation] = []
    for faculty_id, required_hours in calculate_required_hours(requirements, period_minutes).items():
        faculty = faculty_by_id.get(faculty_id)
        if faculty and required_hours > faculty.max_weekly_workload + 1e-9:
            violations.append(
                WorkloadViolation(
                    faculty.id,
                    faculty.name,
                    required_hours,
                    faculty.max_weekly_workload,
                )
            )
    return violations


def assert_workload_caps(
    requirements: list[TeachingRequirement],
    faculty_by_id: Mapping[str, Faculty],
    period_minutes: int = 60,
) -> None:
    violations = validate_workload_caps(requirements, faculty_by_id, period_minutes)
    if violations:
        raise ValueError(" ".join(violation.message for violation in violations))


def add_workload_cap_constraints(
    model: Any,
    assignment_vars: Mapping[tuple[str, str, str], Any],
    sessions_by_id: Mapping[str, SchedulableSession],
    faculty_by_id: Mapping[str, Faculty],
    period_minutes: int = 60,
) -> int:
    """Add one integer workload limit per known faculty member.

    Coefficients are expressed in minutes to keep the CP-SAT model integral. A
    session has multiple assignment candidates, but exact-assignment constraints
    guarantee precisely one contributes to the faculty total.
    """
    terms_by_faculty: dict[str, list[Any]] = {faculty_id: [] for faculty_id in faculty_by_id}
    for (session_id, _block_id, _resource_id), variable in assignment_vars.items():
        session = sessions_by_id[session_id]
        if session.faculty_id in terms_by_faculty:
            terms_by_faculty[session.faculty_id].append(
                variable * session.duration_periods * period_minutes
            )

    added = 0
    for faculty_id, terms in terms_by_faculty.items():
        if not terms:
            continue
        faculty = faculty_by_id[faculty_id]
        maximum_minutes = round(faculty.max_weekly_workload * 60)
        model.Add(sum(terms) <= maximum_minutes)
        added += 1
    return added
