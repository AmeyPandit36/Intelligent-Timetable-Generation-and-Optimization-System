"""Intelligent timetable optimization service."""

from .cpsat_solver import SolveResult, solve_sessions
from .eligibility import validate_faculty_eligibility
from .session_builder import expand_teaching_requirements
from .workload import validate_workload_caps

__all__ = [
    "SolveResult",
    "expand_teaching_requirements",
    "solve_sessions",
    "validate_faculty_eligibility",
    "validate_workload_caps",
]
