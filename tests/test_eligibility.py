from solver.cpsat_solver import solve_sessions
from solver.eligibility import validate_faculty_eligibility
from solver.models import Faculty, Resource, TeachingRequirement
from solver.session_builder import expand_teaching_requirements


def make_requirement(subject_id: str = "subj-db") -> TeachingRequirement:
    return TeachingRequirement(
        id="req-1",
        subject_id=subject_id,
        subject_code="IT301",
        faculty_id="fac-meena",
        division_id="div-a",
        batch_id=None,
        required_resource_type="CLASSROOM",
        student_count=30,
    )


def test_ineligible_subject_is_reported():
    faculty = Faculty("fac-meena", "Dr. Meena Iyer", 18, frozenset({"subj-sql"}))
    violations = validate_faculty_eligibility([make_requirement()], {faculty.id: faculty})
    assert len(violations) == 1
    assert violations[0].subject_id == "subj-db"


def test_solver_rejects_ineligible_assignment():
    faculty = Faculty("fac-meena", "Dr. Meena Iyer", 18, frozenset({"subj-sql"}))
    result = solve_sessions(
        expand_teaching_requirements([make_requirement()]),
        [Resource("room-1", "CLASSROOM", 60)],
        {faculty.id: faculty},
        days=("MONDAY",),
        periods_per_day=2,
    )
    assert result.status == "INFEASIBLE"
    assert "not eligible" in result.message
