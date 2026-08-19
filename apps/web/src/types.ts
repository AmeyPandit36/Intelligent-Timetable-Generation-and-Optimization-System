export type PageId = 'dashboard' | 'academic' | 'faculty' | 'infrastructure' | 'requirements' | 'policies' | 'generation' | 'timetable' | 'diagnostics' | 'imports' | 'agent';

export type Faculty = {
  id: string; code: string; name: string; initials: string; title: string; department: string;
  email: string; maxWeeklyWorkload: number; assignedHours: number; eligibleSubjects: string[];
  unavailable: string[]; status: string;
};

export type Resource = {
  id: string; code: string; name: string; type: string; building: string; floor: string;
  department: string; capacity: number; capabilities: string[]; utilization: number; active: boolean;
};

export type Policy = {
  id: string; name: string; type: string; department: string; description: string;
  primaryOwner: string | null; fallbackOwners: string[]; weight: number; active: boolean; updatedAt: string;
};

export type Assignment = {
  id: string; subjectCode: string; subjectName: string; facultyId: string; facultyName: string;
  cohort: string; day: string; startSlot: number; duration: number; roomId: string; roomName: string;
  type: string; color: string;
};

export type Schedule = {
  id: string; name: string; status: string; version: number; generatedAt: string; objectiveScore: number;
  validation: { valid: boolean; hardConflicts: number; warnings: number };
  slots: { label: string; end: string }[]; days: string[]; assignments: Assignment[];
};
