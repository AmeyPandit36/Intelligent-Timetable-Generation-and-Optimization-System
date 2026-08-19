"""Domain models shared by session expansion, validation and solving.

The solver receives a complete immutable snapshot for each generation run; it never
queries the application database directly.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal


SessionType = Literal["LECTURE", "PRACTICAL", "TUTORIAL", "SEMINAR"]
ResourceType = Literal["CLASSROOM", "LAB", "WORKSHOP"]


@dataclass(frozen=True)
class Faculty:
    id: str
    name: str
    max_weekly_workload: float
    eligible_subject_ids: frozenset[str] = field(default_factory=frozenset)


@dataclass(frozen=True)
class TeachingRequirement:
    id: str
    subject_id: str
    subject_code: str
    faculty_id: str
    division_id: str | None
    batch_id: str | None
    combined_division_ids: tuple[str, ...] = ()
    session_type: SessionType = "LECTURE"
    duration_periods: int = 1
    weekly_frequency: int = 1
    required_resource_type: ResourceType = "CLASSROOM"
    required_capabilities: frozenset[str] = field(default_factory=frozenset)
    student_count: int = 0


@dataclass(frozen=True)
class SchedulableSession:
    id: str
    requirement_id: str
    subject_id: str
    subject_code: str
    faculty_id: str
    division_id: str | None
    batch_id: str | None
    combined_division_ids: tuple[str, ...]
    session_type: SessionType
    duration_periods: int
    required_resource_type: ResourceType
    required_capabilities: frozenset[str]
    student_count: int

    @property
    def cohort_ids(self) -> tuple[str, ...]:
        """Return every cohort locked while this session runs."""
        ids: list[str] = []
        if self.division_id:
            ids.append(self.division_id)
        if self.batch_id:
            ids.append(self.batch_id)
        ids.extend(self.combined_division_ids)
        return tuple(dict.fromkeys(ids))


@dataclass(frozen=True)
class Resource:
    id: str
    resource_type: ResourceType
    capacity: int
    capabilities: frozenset[str] = field(default_factory=frozenset)
    is_active: bool = True
    department_id: str | None = None
    building_id: str | None = None


@dataclass(frozen=True)
class CandidateBlock:
    id: str
    day: str
    start_period: int
    period_indices: tuple[int, ...]


@dataclass(frozen=True)
class Assignment:
    session_id: str
    block_id: str
    resource_id: str
