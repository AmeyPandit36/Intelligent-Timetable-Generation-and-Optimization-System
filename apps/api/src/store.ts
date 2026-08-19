export type ScheduleAssignment = {
  id: string;
  subjectCode: string;
  subjectName: string;
  facultyId: string;
  facultyName: string;
  cohort: string;
  day: string;
  startSlot: number;
  duration: number;
  roomId: string;
  roomName: string;
  type: 'LECTURE' | 'PRACTICAL' | 'TUTORIAL';
  color: string;
};

export const departments = [
  { id: 'dept-it', code: 'IT', name: 'Information Technology', color: '#28786d', programs: 1, faculty: 14, students: 284 },
  { id: 'dept-cse', code: 'CSE', name: 'Computer Science & Engineering', color: '#426a9b', programs: 1, faculty: 18, students: 356 },
  { id: 'dept-aiml', code: 'AIML', name: 'CSE — AI & Machine Learning', color: '#7058a6', programs: 1, faculty: 11, students: 238 },
  { id: 'dept-entc', code: 'ENTC', name: 'Electronics & Telecommunication', color: '#a7613e', programs: 1, faculty: 15, students: 302 },
  { id: 'dept-mech', code: 'MECH', name: 'Mechanical Engineering', color: '#b07a2e', programs: 1, faculty: 16, students: 318 },
  { id: 'dept-electrical', code: 'ELEC', name: 'Electrical Engineering', color: '#477d8a', programs: 1, faculty: 13, students: 274 },
  { id: 'dept-fe', code: 'FE', name: 'First Year Engineering', color: '#39764e', programs: 1, faculty: 21, students: 472 },
  { id: 'dept-mca', code: 'MCA', name: 'Master of Computer Applications', color: '#8a5a73', programs: 1, faculty: 9, students: 128 },
];

export const faculty = [
  { id: 'fac-meena', code: 'FAC-023', name: 'Dr. Meena Iyer', initials: 'MI', title: 'Associate Professor', department: 'IT', email: 'meena.iyer@college.edu', maxWeeklyWorkload: 18, assignedHours: 14, eligibleSubjects: ['Database Systems', 'SQL Laboratory', 'Data Mining'], unavailable: ['Wed 09:00–12:15'], status: 'AVAILABLE' },
  { id: 'fac-patil', code: 'FAC-031', name: 'Prof. Rahul Patil', initials: 'RP', title: 'Assistant Professor', department: 'IT', email: 'rahul.patil@college.edu', maxWeeklyWorkload: 18, assignedHours: 16, eligibleSubjects: ['Computer Networks', 'Network Laboratory'], unavailable: ['Mon 14:00–17:15'], status: 'AVAILABLE' },
  { id: 'fac-shah', code: 'FAC-017', name: 'Dr. Kavita Shah', initials: 'KS', title: 'Professor', department: 'IT', email: 'kavita.shah@college.edu', maxWeeklyWorkload: 16, assignedHours: 12, eligibleSubjects: ['Operating Systems', 'Systems Programming'], unavailable: ['Fri — full day'], status: 'LIMITED' },
  { id: 'fac-kulkarni', code: 'FAC-044', name: 'Prof. Anand Kulkarni', initials: 'AK', title: 'Assistant Professor', department: 'IT', email: 'anand.kulkarni@college.edu', maxWeeklyWorkload: 20, assignedHours: 18, eligibleSubjects: ['Web Technology', 'Cloud Computing'], unavailable: [], status: 'AVAILABLE' },
  { id: 'fac-joshi', code: 'FAC-008', name: 'Dr. Sneha Joshi', initials: 'SJ', title: 'Professor & HOD', department: 'CSE', email: 'sneha.joshi@college.edu', maxWeeklyWorkload: 14, assignedHours: 10, eligibleSubjects: ['Machine Learning', 'Artificial Intelligence'], unavailable: ['Tue 09:00–11:00'], status: 'AVAILABLE' },
  { id: 'fac-nair', code: 'FAC-052', name: 'Prof. Vivek Nair', initials: 'VN', title: 'Assistant Professor', department: 'AIML', email: 'vivek.nair@college.edu', maxWeeklyWorkload: 18, assignedHours: 14, eligibleSubjects: ['Machine Learning Lab', 'Python Programming'], unavailable: ['Thu 15:00–17:15'], status: 'AVAILABLE' },
];

export const resources = [
  { id: 'room-it301', code: 'IT-301', name: 'IT Smart Classroom 301', type: 'CLASSROOM', building: 'Technology Block', floor: '3rd Floor', department: 'IT', capacity: 72, capabilities: ['Smart Board', 'Projector'], utilization: 78, active: true },
  { id: 'room-itl1', code: 'IT-L1', name: 'IT Database Laboratory', type: 'LAB', building: 'Technology Block', floor: '2nd Floor', department: 'IT', capacity: 36, capabilities: ['Computers', 'SQL', 'Linux'], utilization: 91, active: true },
  { id: 'room-itl2', code: 'IT-L2', name: 'IT Network Laboratory', type: 'LAB', building: 'Technology Block', floor: '2nd Floor', department: 'IT', capacity: 36, capabilities: ['Computers', 'Networking', 'Linux'], utilization: 84, active: true },
  { id: 'room-csel1', code: 'CSE-L1', name: 'CSE Computing Laboratory', type: 'LAB', building: 'Technology Block', floor: '1st Floor', department: 'CSE', capacity: 40, capabilities: ['Computers', 'SQL', 'GPU'], utilization: 73, active: true },
  { id: 'room-aud', code: 'AUD-01', name: 'Central Auditorium', type: 'CLASSROOM', building: 'Main Building', floor: 'Ground Floor', department: 'Shared', capacity: 220, capabilities: ['Projector', 'Audio System'], utilization: 62, active: true },
  { id: 'room-mw1', code: 'ME-W1', name: 'Mechanical Workshop', type: 'WORKSHOP', building: 'Workshop Block', floor: 'Ground Floor', department: 'MECH', capacity: 45, capabilities: ['CAD', 'Fabrication'], utilization: 69, active: true },
];

export type PolicyRecord = {
  id: string;
  name: string;
  type: string;
  department: string;
  description: string;
  primaryOwner: string | null;
  fallbackOwners: string[];
  weight: number;
  active: boolean;
  updatedAt: string;
};

export const policies: PolicyRecord[] = [
  { id: 'pol-1', name: 'IT lab ownership priority', type: 'RESOURCE_FALLBACK', department: 'IT', description: 'Use IT laboratories first, then CSE and AIML labs.', primaryOwner: 'IT', fallbackOwners: ['CSE', 'AIML'], weight: 100, active: true, updatedAt: '2 hours ago' },
  { id: 'pol-2', name: 'Minimize faculty idle gaps', type: 'GAP_MINIMIZATION', department: 'All departments', description: 'Avoid idle windows longer than one period for faculty.', primaryOwner: null, fallbackOwners: [], weight: 70, active: true, updatedAt: 'Yesterday' },
  { id: 'pol-3', name: 'First-year compact day', type: 'TIME_PREFERENCE', department: 'FE', description: 'Keep first-year teaching between 09:00 and 16:00.', primaryOwner: null, fallbackOwners: [], weight: 85, active: true, updatedAt: '3 days ago' },
  { id: 'pol-4', name: 'Reduce campus movement', type: 'BUILDING_MOVEMENT', department: 'All departments', description: 'Penalize consecutive sessions in different buildings.', primaryOwner: null, fallbackOwners: [], weight: 45, active: true, updatedAt: '1 week ago' },
];

export const assignments: ScheduleAssignment[] = [
  { id: 'a1', subjectCode: 'IT301', subjectName: 'Database Systems', facultyId: 'fac-meena', facultyName: 'Dr. Meena Iyer', cohort: 'TY IT — A', day: 'Monday', startSlot: 0, duration: 1, roomId: 'room-it301', roomName: 'IT-301', type: 'LECTURE', color: 'teal' },
  { id: 'a2', subjectCode: 'IT303', subjectName: 'Computer Networks', facultyId: 'fac-patil', facultyName: 'Prof. Rahul Patil', cohort: 'TY IT — A', day: 'Monday', startSlot: 1, duration: 1, roomId: 'room-it301', roomName: 'IT-301', type: 'LECTURE', color: 'blue' },
  { id: 'a3', subjectCode: 'IT305', subjectName: 'Operating Systems', facultyId: 'fac-shah', facultyName: 'Dr. Kavita Shah', cohort: 'TY IT — A', day: 'Monday', startSlot: 2, duration: 1, roomId: 'room-it301', roomName: 'IT-301', type: 'LECTURE', color: 'amber' },
  { id: 'a4', subjectCode: 'IT302L', subjectName: 'SQL Laboratory', facultyId: 'fac-meena', facultyName: 'Dr. Meena Iyer', cohort: 'TY IT — A1', day: 'Monday', startSlot: 4, duration: 2, roomId: 'room-itl1', roomName: 'IT-L1', type: 'PRACTICAL', color: 'purple' },
  { id: 'a5', subjectCode: 'IT307', subjectName: 'Web Technology', facultyId: 'fac-kulkarni', facultyName: 'Prof. Anand Kulkarni', cohort: 'TY IT — A', day: 'Tuesday', startSlot: 0, duration: 1, roomId: 'room-it301', roomName: 'IT-301', type: 'LECTURE', color: 'rose' },
  { id: 'a6', subjectCode: 'IT301', subjectName: 'Database Systems', facultyId: 'fac-meena', facultyName: 'Dr. Meena Iyer', cohort: 'TY IT — A', day: 'Tuesday', startSlot: 1, duration: 1, roomId: 'room-it301', roomName: 'IT-301', type: 'LECTURE', color: 'teal' },
  { id: 'a7', subjectCode: 'IT304L', subjectName: 'Network Laboratory', facultyId: 'fac-patil', facultyName: 'Prof. Rahul Patil', cohort: 'TY IT — A1', day: 'Tuesday', startSlot: 2, duration: 2, roomId: 'room-itl2', roomName: 'IT-L2', type: 'PRACTICAL', color: 'blue' },
  { id: 'a8', subjectCode: 'ILOC301', subjectName: 'Data Analytics', facultyId: 'fac-joshi', facultyName: 'Dr. Sneha Joshi', cohort: 'TY IT — A', day: 'Tuesday', startSlot: 5, duration: 1, roomId: 'room-aud', roomName: 'AUD-01', type: 'LECTURE', color: 'green' },
  { id: 'a9', subjectCode: 'IT303', subjectName: 'Computer Networks', facultyId: 'fac-patil', facultyName: 'Prof. Rahul Patil', cohort: 'TY IT — A', day: 'Wednesday', startSlot: 2, duration: 1, roomId: 'room-it301', roomName: 'IT-301', type: 'LECTURE', color: 'blue' },
  { id: 'a10', subjectCode: 'IT305', subjectName: 'Operating Systems', facultyId: 'fac-shah', facultyName: 'Dr. Kavita Shah', cohort: 'TY IT — A', day: 'Wednesday', startSlot: 3, duration: 1, roomId: 'room-it301', roomName: 'IT-301', type: 'LECTURE', color: 'amber' },
  { id: 'a11', subjectCode: 'IT308L', subjectName: 'Web Technology Lab', facultyId: 'fac-kulkarni', facultyName: 'Prof. Anand Kulkarni', cohort: 'TY IT — A1', day: 'Wednesday', startSlot: 4, duration: 2, roomId: 'room-csel1', roomName: 'CSE-L1', type: 'PRACTICAL', color: 'rose' },
  { id: 'a12', subjectCode: 'IT307', subjectName: 'Web Technology', facultyId: 'fac-kulkarni', facultyName: 'Prof. Anand Kulkarni', cohort: 'TY IT — A', day: 'Thursday', startSlot: 0, duration: 1, roomId: 'room-it301', roomName: 'IT-301', type: 'LECTURE', color: 'rose' },
  { id: 'a13', subjectCode: 'IT305', subjectName: 'Operating Systems', facultyId: 'fac-shah', facultyName: 'Dr. Kavita Shah', cohort: 'TY IT — A', day: 'Thursday', startSlot: 1, duration: 1, roomId: 'room-it301', roomName: 'IT-301', type: 'LECTURE', color: 'amber' },
  { id: 'a14', subjectCode: 'IT306T', subjectName: 'OS Tutorial', facultyId: 'fac-shah', facultyName: 'Dr. Kavita Shah', cohort: 'TY IT — A', day: 'Thursday', startSlot: 2, duration: 1, roomId: 'room-it301', roomName: 'IT-301', type: 'TUTORIAL', color: 'amber' },
  { id: 'a15', subjectCode: 'IT302L', subjectName: 'SQL Laboratory', facultyId: 'fac-meena', facultyName: 'Dr. Meena Iyer', cohort: 'TY IT — A2', day: 'Thursday', startSlot: 4, duration: 2, roomId: 'room-itl1', roomName: 'IT-L1', type: 'PRACTICAL', color: 'purple' },
  { id: 'a16', subjectCode: 'IT301', subjectName: 'Database Systems', facultyId: 'fac-meena', facultyName: 'Dr. Meena Iyer', cohort: 'TY IT — A', day: 'Friday', startSlot: 0, duration: 1, roomId: 'room-it301', roomName: 'IT-301', type: 'LECTURE', color: 'teal' },
  { id: 'a17', subjectCode: 'IT303', subjectName: 'Computer Networks', facultyId: 'fac-patil', facultyName: 'Prof. Rahul Patil', cohort: 'TY IT — A', day: 'Friday', startSlot: 1, duration: 1, roomId: 'room-it301', roomName: 'IT-301', type: 'LECTURE', color: 'blue' },
  { id: 'a18', subjectCode: 'IT308L', subjectName: 'Web Technology Lab', facultyId: 'fac-kulkarni', facultyName: 'Prof. Anand Kulkarni', cohort: 'TY IT — A2', day: 'Friday', startSlot: 2, duration: 2, roomId: 'room-csel1', roomName: 'CSE-L1', type: 'PRACTICAL', color: 'rose' },
  { id: 'a19', subjectCode: 'ILOC301', subjectName: 'Data Analytics', facultyId: 'fac-joshi', facultyName: 'Dr. Sneha Joshi', cohort: 'TY IT — A', day: 'Friday', startSlot: 5, duration: 1, roomId: 'room-aud', roomName: 'AUD-01', type: 'LECTURE', color: 'green' },
];

export const diagnostics = [
  { id: 'diag-1', severity: 'warning', title: 'High utilization in IT Database Laboratory', detail: 'IT-L1 is at 91% weekly utilization. Two practical sessions have only one valid candidate block.', category: 'Resource capacity', entity: 'IT-L1', action: 'Review fallback policy' },
  { id: 'diag-2', severity: 'info', title: 'Narrow availability for Dr. Kavita Shah', detail: 'Friday blackout leaves 16 valid periods for 12 required teaching hours.', category: 'Faculty availability', entity: 'FAC-017', action: 'View availability' },
  { id: 'diag-3', severity: 'resolved', title: 'CSE fallback laboratory enabled', detail: 'The IT resource fallback policy adds 14 viable room candidates for web practicals.', category: 'Policy', entity: 'pol-1', action: 'View policy' },
];

export const readiness = [
  { label: 'Academic structure', value: 100, count: '8 departments' },
  { label: 'Faculty & eligibility', value: 94, count: '112 of 119 mapped' },
  { label: 'Infrastructure', value: 100, count: '68 active rooms' },
  { label: 'Teaching requirements', value: 88, count: '427 of 484 ready' },
];
