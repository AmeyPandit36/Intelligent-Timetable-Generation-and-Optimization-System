"""Expand weekly teaching requirements into independently schedulable sessions."""

from .models import SchedulableSession, TeachingRequirement


def expand_teaching_requirements(
    requirements: list[TeachingRequirement],
) -> list[SchedulableSession]:
    sessions: list[SchedulableSession] = []
    for requirement in requirements:
        if requirement.weekly_frequency < 1:
            raise ValueError(f"{requirement.id}: weekly_frequency must be at least one")
        if requirement.duration_periods < 1:
            raise ValueError(f"{requirement.id}: duration_periods must be at least one")
        for occurrence in range(1, requirement.weekly_frequency + 1):
            sessions.append(
                SchedulableSession(
                    id=f"{requirement.id}__{occurrence}",
                    requirement_id=requirement.id,
                    subject_id=requirement.subject_id,
                    subject_code=requirement.subject_code,
                    faculty_id=requirement.faculty_id,
                    division_id=requirement.division_id,
                    batch_id=requirement.batch_id,
                    combined_division_ids=requirement.combined_division_ids,
                    session_type=requirement.session_type,
                    duration_periods=requirement.duration_periods,
                    required_resource_type=requirement.required_resource_type,
                    required_capabilities=requirement.required_capabilities,
                    student_count=requirement.student_count,
                )
            )
    return sessions
