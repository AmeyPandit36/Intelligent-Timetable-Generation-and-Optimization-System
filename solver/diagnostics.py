"""Fast pre-solve bottleneck diagnostics for actionable infeasibility reports."""

from __future__ import annotations

from dataclasses import dataclass

from .candidates import filter_valid_resources
from .models import Faculty, Resource, SchedulableSession


@dataclass(frozen=True)
class Diagnostic:
    code: str
    severity: str
    entity_id: str
    message: str
    suggestion: str


def diagnose_candidate_shortages(
    sessions: list[SchedulableSession],
    resources: list[Resource],
    faculty_by_id: dict[str, Faculty],
    periods_per_week: int,
) -> list[Diagnostic]:
    findings: list[Diagnostic] = []
    for session in sessions:
        valid_rooms = filter_valid_resources(session, resources)
        if not valid_rooms:
            findings.append(Diagnostic(
                "NO_VALID_RESOURCE", "ERROR", session.id,
                f"No active {session.required_resource_type.lower()} has capacity {session.student_count} and capabilities {sorted(session.required_capabilities)}.",
                "Add a capable room, lower enrollment, or configure an allowed fallback resource.",
            ))
    workload: dict[str, int] = {}
    for session in sessions:
        workload[session.faculty_id] = workload.get(session.faculty_id, 0) + session.duration_periods
    for faculty_id, periods in workload.items():
        faculty = faculty_by_id.get(faculty_id)
        if faculty and periods > faculty.max_weekly_workload:
            findings.append(Diagnostic(
                "WORKLOAD_CAP_EXCEEDED", "ERROR", faculty_id,
                f"{faculty.name} requires {periods} hours against a {faculty.max_weekly_workload:g}-hour cap.",
                "Reassign one or more requirements to an eligible faculty member.",
            ))
        elif periods > periods_per_week:
            findings.append(Diagnostic(
                "INSUFFICIENT_TIME", "ERROR", faculty_id,
                f"{periods} faculty periods must fit into only {periods_per_week} available periods.",
                "Expand availability or redistribute teaching requirements.",
            ))
    return findings
