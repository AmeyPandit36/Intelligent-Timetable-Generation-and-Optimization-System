"""Continuous candidate time-block and hard resource filtering helpers."""

from .models import CandidateBlock, Resource, SchedulableSession


def generate_candidate_blocks(
    session: SchedulableSession,
    days: tuple[str, ...],
    periods_per_day: int,
    blocked_periods: set[tuple[str, int]] | None = None,
) -> list[CandidateBlock]:
    blocked = blocked_periods or set()
    blocks: list[CandidateBlock] = []
    for day in days:
        for start in range(periods_per_day - session.duration_periods + 1):
            indices = tuple(range(start, start + session.duration_periods))
            if any((day, period) in blocked for period in indices):
                continue
            blocks.append(CandidateBlock(f"{day}:{start}:{session.duration_periods}", day, start, indices))
    return blocks


def filter_valid_resources(session: SchedulableSession, resources: list[Resource]) -> list[Resource]:
    return [
        resource
        for resource in resources
        if resource.is_active
        and resource.resource_type == session.required_resource_type
        and resource.capacity >= session.student_count
        and session.required_capabilities.issubset(resource.capabilities)
    ]
