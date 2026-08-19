"""Independent post-solve validation; this intentionally does not trust solver state."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping

from .models import Assignment, CandidateBlock, Faculty, Resource, SchedulableSession


@dataclass(frozen=True)
class ValidationReport:
    is_valid: bool
    errors: tuple[str, ...]
    checks_run: int


def validate_generated_timetable(
    assignments: list[Assignment],
    sessions_by_id: Mapping[str, SchedulableSession],
    blocks_by_id: Mapping[str, CandidateBlock],
    resources_by_id: Mapping[str, Resource],
    faculty_by_id: Mapping[str, Faculty],
    faculty_blackouts: Mapping[str, set[tuple[str, int]]] | None = None,
) -> ValidationReport:
    errors: list[str] = []
    blackouts = faculty_blackouts or {}
    assigned_sessions = {item.session_id for item in assignments}
    missing = set(sessions_by_id) - assigned_sessions
    if missing:
        errors.append(f"Missing assignments for: {', '.join(sorted(missing))}")

    room_busy: dict[tuple[str, str, int], str] = {}
    faculty_busy: dict[tuple[str, str, int], str] = {}
    cohort_busy: dict[tuple[str, str, int], str] = {}
    workload_minutes: dict[str, int] = {}
    for assignment in assignments:
        session = sessions_by_id[assignment.session_id]
        block = blocks_by_id[assignment.block_id]
        resource = resources_by_id[assignment.resource_id]
        faculty = faculty_by_id[session.faculty_id]
        if not resource.is_active or resource.resource_type != session.required_resource_type:
            errors.append(f"{session.id} uses incompatible resource {resource.id}.")
        if resource.capacity < session.student_count:
            errors.append(f"{resource.id} is too small for {session.id}.")
        if not session.required_capabilities.issubset(resource.capabilities):
            errors.append(f"{resource.id} lacks capabilities for {session.id}.")
        if session.subject_id not in faculty.eligible_subject_ids:
            errors.append(f"{faculty.name} is not eligible for {session.subject_id}.")
        workload_minutes[faculty.id] = workload_minutes.get(faculty.id, 0) + session.duration_periods * 60
        for period in block.period_indices:
            if (block.day, period) in blackouts.get(faculty.id, set()):
                errors.append(f"{session.id} overlaps a blackout for {faculty.name}.")
            for busy, key, label in (
                (room_busy, (resource.id, block.day, period), "room"),
                (faculty_busy, (faculty.id, block.day, period), "faculty"),
            ):
                if key in busy:
                    errors.append(f"{label.title()} collision: {session.id} and {busy[key]}.")
                busy[key] = session.id
            for cohort in session.cohort_ids:
                key = (cohort, block.day, period)
                if key in cohort_busy:
                    errors.append(f"Cohort collision: {session.id} and {cohort_busy[key]}.")
                cohort_busy[key] = session.id
    for faculty_id, minutes in workload_minutes.items():
        if minutes > faculty_by_id[faculty_id].max_weekly_workload * 60:
            errors.append(f"{faculty_by_id[faculty_id].name} exceeds the weekly workload cap.")
    return ValidationReport(not errors, tuple(errors), checks_run=8)
