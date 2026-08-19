"""FastAPI boundary for deterministic timetable generation."""

from __future__ import annotations

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from .cpsat_solver import solve_sessions
from .eligibility import validate_faculty_eligibility
from .models import Faculty, Resource, TeachingRequirement
from .session_builder import expand_teaching_requirements
from .workload import validate_workload_caps

app = FastAPI(
    title="Timetable Optimization Service",
    version="1.0.0",
    description="Deterministic CP-SAT scheduling with workload and eligibility enforcement.",
)


class ApiModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


class FacultyInput(ApiModel):
    id: str
    name: str
    max_weekly_workload: float = Field(alias="maxWeeklyWorkload", ge=0)
    eligible_subject_ids: list[str] = Field(default_factory=list, alias="eligibleSubjectIds")


class RequirementInput(ApiModel):
    id: str
    subject_id: str = Field(alias="subjectId")
    subject_code: str = Field(alias="subjectCode")
    faculty_id: str = Field(alias="facultyId")
    division_id: str | None = Field(default=None, alias="divisionId")
    batch_id: str | None = Field(default=None, alias="batchId")
    combined_division_ids: list[str] = Field(default_factory=list, alias="combinedDivisionIds")
    session_type: str = Field(default="LECTURE", alias="sessionType")
    duration_periods: int = Field(default=1, alias="durationPeriods", ge=1)
    weekly_frequency: int = Field(default=1, alias="weeklyFrequency", ge=1)
    required_resource_type: str = Field(default="CLASSROOM", alias="requiredResourceType")
    required_capabilities: list[str] = Field(default_factory=list, alias="requiredCapabilities")
    student_count: int = Field(default=0, alias="studentCount", ge=0)


class ResourceInput(ApiModel):
    id: str
    resource_type: str = Field(alias="resourceType")
    capacity: int = Field(ge=0)
    capabilities: list[str] = Field(default_factory=list)
    is_active: bool = Field(default=True, alias="isActive")
    department_id: str | None = Field(default=None, alias="departmentId")
    building_id: str | None = Field(default=None, alias="buildingId")


class BlackoutInput(ApiModel):
    faculty_id: str = Field(alias="facultyId")
    day: str
    periods: list[int]


class ScheduleRequest(ApiModel):
    faculty: list[FacultyInput]
    requirements: list[RequirementInput]
    resources: list[ResourceInput]
    days: list[str] = Field(default_factory=lambda: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"])
    periods_per_day: int = Field(default=7, alias="periodsPerDay", ge=1, le=20)
    period_minutes: int = Field(default=60, alias="periodMinutes", ge=1)
    faculty_blackouts: list[BlackoutInput] = Field(default_factory=list, alias="facultyBlackouts")
    time_limit_seconds: float = Field(default=30, alias="timeLimitSeconds", gt=0, le=600)


def _map_request(request: ScheduleRequest):
    faculty = {
        item.id: Faculty(item.id, item.name, item.max_weekly_workload, frozenset(item.eligible_subject_ids))
        for item in request.faculty
    }
    requirements = [
        TeachingRequirement(
            id=item.id,
            subject_id=item.subject_id,
            subject_code=item.subject_code,
            faculty_id=item.faculty_id,
            division_id=item.division_id,
            batch_id=item.batch_id,
            combined_division_ids=tuple(item.combined_division_ids),
            session_type=item.session_type,  # type: ignore[arg-type]
            duration_periods=item.duration_periods,
            weekly_frequency=item.weekly_frequency,
            required_resource_type=item.required_resource_type,  # type: ignore[arg-type]
            required_capabilities=frozenset(item.required_capabilities),
            student_count=item.student_count,
        )
        for item in request.requirements
    ]
    resources = [
        Resource(
            item.id,
            item.resource_type,  # type: ignore[arg-type]
            item.capacity,
            frozenset(item.capabilities),
            item.is_active,
            item.department_id,
            item.building_id,
        )
        for item in request.resources
    ]
    return faculty, requirements, resources


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy", "engine": "OR-Tools CP-SAT"}


@app.post("/schedule")
def schedule(request: ScheduleRequest):
    faculty, requirements, resources = _map_request(request)
    eligibility = validate_faculty_eligibility(requirements, faculty)
    if eligibility:
        raise HTTPException(
            422,
            {"code": "FACULTY_INELIGIBLE", "violations": [item.__dict__ for item in eligibility]},
        )
    workload = validate_workload_caps(requirements, faculty, request.period_minutes)
    if workload:
        raise HTTPException(
            422,
            {"code": "WORKLOAD_CAP_EXCEEDED", "violations": [{**item.__dict__, "message": item.message} for item in workload]},
        )

    sessions = expand_teaching_requirements(requirements)
    blackouts: dict[str, set[tuple[str, int]]] = {}
    for item in request.faculty_blackouts:
        blackouts.setdefault(item.faculty_id, set()).update((item.day, period) for period in item.periods)
    result = solve_sessions(
        sessions,
        resources,
        faculty,
        tuple(request.days),
        request.periods_per_day,
        blackouts,
        time_limit_seconds=request.time_limit_seconds,
    )
    if result.status not in {"OPTIMAL", "FEASIBLE"}:
        raise HTTPException(422, {"code": "SCHEDULE_INFEASIBLE", "message": result.message})
    return {
        "status": result.status,
        "engine": result.engine,
        "objectiveScore": result.objective_score,
        "sessionCount": len(sessions),
        "assignments": [
            {"sessionId": item.session_id, "blockId": item.block_id, "resourceId": item.resource_id}
            for item in result.assignments
        ],
    }
