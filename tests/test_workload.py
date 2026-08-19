from solver.cpsat_solver import solve_sessions
from solver.models import Faculty, Resource, TeachingRequirement
from solver.session_builder import expand_teaching_requirements
from solver.workload import calculate_required_hours, validate_workload_caps


def requirement(identifier: str, frequency: int, duration: int = 1) -> TeachingRequirement:
    return TeachingRequirement(
        id=identifier,
        subject_id="subj-db",
        subject_code="IT301",
        faculty_id="fac-meena",
        division_id="div-a",
        batch_id=None,
        duration_periods=duration,
        weekly_frequency=frequency,
        required_resource_type="CLASSROOM",
        student_count=30,
    )


def test_calculates_weekly_hours_from_frequency_and_duration():
    requirements = [requirement("lecture", 3), requirement("practical", 1, duration=2)]
    assert calculate_required_hours(requirements) == {"fac-meena": 5.0}


def test_reports_requirement_set_above_faculty_workload_cap():
    faculty = Faculty("fac-meena", "Dr. Meena Iyer", 4, frozenset({"subj-db"}))
    requirements = [requirement("lecture", 3), requirement("practical", 1, duration=2)]
    violations = validate_workload_caps(requirements, {faculty.id: faculty})
    assert len(violations) == 1
    assert violations[0].required_hours == 5
    assert violations[0].maximum_hours == 4
    assert "exceeding the 4-hour workload cap" in violations[0].message


def test_solver_rejects_sessions_above_faculty_workload_cap_before_search():
    faculty = Faculty("fac-meena", "Dr. Meena Iyer", 2, frozenset({"subj-db"}))
    sessions = expand_teaching_requirements([requirement("lecture", 3)])
    room = Resource("room-1", "CLASSROOM", 60)
    result = solve_sessions(sessions, [room], {faculty.id: faculty}, days=("MONDAY",), periods_per_day=5)
    assert result.status == "INFEASIBLE"
    assert "capped at 2" in result.message


def test_schedule_at_exact_workload_cap_is_allowed():
    faculty = Faculty("fac-meena", "Dr. Meena Iyer", 3, frozenset({"subj-db"}))
    sessions = expand_teaching_requirements([requirement("lecture", 3)])
    room = Resource("room-1", "CLASSROOM", 60)
    result = solve_sessions(sessions, [room], {faculty.id: faculty}, days=("MONDAY",), periods_per_day=3)
    assert result.status in {"OPTIMAL", "FEASIBLE"}
    assert len(result.assignments) == 3
