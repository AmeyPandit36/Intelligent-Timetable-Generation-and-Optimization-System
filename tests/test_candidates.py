from solver.candidates import filter_valid_resources, generate_candidate_blocks
from solver.models import Resource, SchedulableSession


def practical() -> SchedulableSession:
    return SchedulableSession(
        id="session-1",
        requirement_id="req-1",
        subject_id="subj-sql",
        subject_code="IT302L",
        faculty_id="fac-1",
        division_id="div-a",
        batch_id="batch-a1",
        combined_division_ids=(),
        session_type="PRACTICAL",
        duration_periods=2,
        required_resource_type="LAB",
        required_capabilities=frozenset({"Computers", "SQL"}),
        student_count=31,
    )


def test_candidate_blocks_are_contiguous_and_respect_blackouts():
    blocks = generate_candidate_blocks(practical(), ("MONDAY",), 5, {("MONDAY", 2)})
    assert [block.period_indices for block in blocks] == [(0, 1), (3, 4)]


def test_resource_filter_enforces_all_hard_requirements():
    resources = [
        Resource("valid", "LAB", 36, frozenset({"Computers", "SQL"})),
        Resource("small", "LAB", 20, frozenset({"Computers", "SQL"})),
        Resource("no-sql", "LAB", 36, frozenset({"Computers"})),
        Resource("inactive", "LAB", 36, frozenset({"Computers", "SQL"}), False),
        Resource("classroom", "CLASSROOM", 60, frozenset({"Computers", "SQL"})),
    ]
    assert [room.id for room in filter_valid_resources(practical(), resources)] == ["valid"]
