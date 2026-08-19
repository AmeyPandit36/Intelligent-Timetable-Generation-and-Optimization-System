"""Compile resource ownership policies into per-candidate objective penalties."""

from __future__ import annotations

from dataclasses import dataclass

from .models import Resource, SchedulableSession


@dataclass(frozen=True)
class ResourceFallbackPolicy:
    department_id: str
    primary_owner: str
    fallback_owners: tuple[str, ...]
    fallback_penalty: int = 100
    allow_cross_department: bool = True


def resource_assignment_penalties(
    sessions: list[SchedulableSession],
    resources: list[Resource],
    session_departments: dict[str, str],
    policies: list[ResourceFallbackPolicy],
) -> dict[tuple[str, str], int]:
    policy_by_department = {policy.department_id: policy for policy in policies}
    penalties: dict[tuple[str, str], int] = {}
    for session in sessions:
        policy = policy_by_department.get(session_departments.get(session.id, ""))
        if not policy:
            continue
        for resource in resources:
            if resource.department_id == policy.primary_owner:
                penalties[(session.id, resource.id)] = 0
            elif resource.department_id in policy.fallback_owners:
                rank = policy.fallback_owners.index(resource.department_id) + 1
                penalties[(session.id, resource.id)] = policy.fallback_penalty * rank
            elif policy.allow_cross_department:
                penalties[(session.id, resource.id)] = policy.fallback_penalty * (len(policy.fallback_owners) + 2)
    return penalties
