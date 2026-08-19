"""Faculty-to-subject eligibility hard constraints.

Eligibility is checked before candidate generation for fast, actionable failures and
is also encoded into CP-SAT so future models with alternative faculty candidates
cannot bypass teaching permissions.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Mapping

from .models import Faculty, SchedulableSession, TeachingRequirement


@dataclass(frozen=True)
class EligibilityViolation:
    requirement_id: str
    faculty_id: str
    subject_id: str
    message: str


def validate_faculty_eligibility(
    requirements: list[TeachingRequirement], faculty_by_id: Mapping[str, Faculty]
) -> list[EligibilityViolation]:
    violations: list[EligibilityViolation] = []
    for requirement in requirements:
        faculty = faculty_by_id.get(requirement.faculty_id)
        if faculty is None:
            violations.append(
                EligibilityViolation(
                    requirement.id,
                    requirement.faculty_id,
                    requirement.subject_id,
                    f"Requirement {requirement.id} references an unknown faculty member.",
                )
            )
        elif requirement.subject_id not in faculty.eligible_subject_ids:
            violations.append(
                EligibilityViolation(
                    requirement.id,
                    faculty.id,
                    requirement.subject_id,
                    f"{faculty.name} is not eligible to teach subject {requirement.subject_id}.",
                )
            )
    return violations


def assert_faculty_eligibility(
    requirements: list[TeachingRequirement], faculty_by_id: Mapping[str, Faculty]
) -> None:
    violations = validate_faculty_eligibility(requirements, faculty_by_id)
    if violations:
        raise ValueError(" ".join(violation.message for violation in violations))


def add_eligibility_constraints(
    model: Any,
    assignment_vars: Mapping[tuple[str, str, str], Any],
    sessions_by_id: Mapping[str, SchedulableSession],
    faculty_by_id: Mapping[str, Faculty],
) -> int:
    """Force every candidate of an ineligible session to false.

    Returns the number of constraints added. ``Any`` keeps this module importable
    without OR-Tools, which is useful for lightweight validation workers.
    """
    added = 0
    for (session_id, _block_id, _resource_id), variable in assignment_vars.items():
        session = sessions_by_id[session_id]
        faculty = faculty_by_id.get(session.faculty_id)
        if faculty is None or session.subject_id not in faculty.eligible_subject_ids:
            model.Add(variable == 0)
            added += 1
    return added
