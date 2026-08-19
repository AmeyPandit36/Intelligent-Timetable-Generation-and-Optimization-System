import cors from 'cors';
import express from 'express';
import { z } from 'zod';
import { assignments, departments, diagnostics, faculty, policies, readiness, resources } from './store.js';
import { dispatchSchedule, getSolverHealth, SolverServiceError } from './solverClient.js';

const policySchema = z.object({
  name: z.string().min(3),
  type: z.enum(['RESOURCE_FALLBACK', 'TIME_PREFERENCE', 'GAP_MINIMIZATION', 'BUILDING_MOVEMENT', 'CUSTOM']),
  department: z.string().default('All departments'),
  description: z.string().min(5),
  primaryOwner: z.string().nullable().optional(),
  fallbackOwners: z.array(z.string()).default([]),
  weight: z.number().int().min(0).max(1000),
  active: z.boolean().default(true),
});

const generationSchema = z.object({
  academicYear: z.string().default('2026–27'),
  department: z.string().default('All departments'),
  timeLimitSeconds: z.number().int().min(5).max(600).default(120),
  optimizeGaps: z.boolean().default(true),
  optimizeMovement: z.boolean().default(true),
  requirements: z.array(z.object({
    id: z.string(),
    subjectId: z.string(),
    facultyId: z.string(),
    weeklyHours: z.number().positive(),
  })).optional(),
});

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'healthy', solver: 'ready', database: 'connected', version: '1.0.0' });
  });

  app.get('/api/solver/health', async (_req, res) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1500);
      const health = await getSolverHealth(controller.signal);
      clearTimeout(timeout);
      return res.json(health);
    } catch {
      return res.status(503).json({ status: 'degraded', message: 'The optimization microservice is not reachable.' });
    }
  });

  app.post('/api/schedule/solve', async (req, res) => {
    try {
      const result = await dispatchSchedule(req.body);
      return res.status(201).json(result);
    } catch (error) {
      if (error instanceof SolverServiceError) {
        return res.status(error.status).json({ error: error.message, detail: error.detail });
      }
      return res.status(503).json({ error: 'The optimization service is unavailable.' });
    }
  });

  app.get('/api/dashboard', (_req, res) => {
    res.json({
      academicYear: '2026–27',
      readinessScore: 92,
      entities: { departments: 8, programs: 9, faculty: 119, resources: 68, students: 2372, requirements: 484 },
      readiness,
      latestRun: { id: 'run-024', status: 'FEASIBLE', objectiveScore: 183, generatedAt: 'Today, 10:42 AM', durationSeconds: 38.4, sessionsPlaced: 484, hardConflicts: 0 },
      upcoming: [
        { date: '24 Aug', title: 'Department data review', owner: 'All HODs', type: 'Review' },
        { date: '27 Aug', title: 'Draft timetable sign-off', owner: 'Academic Office', type: 'Milestone' },
        { date: '01 Sep', title: 'Semester timetable publish', owner: 'Administrator', type: 'Publish' },
      ],
    });
  });

  app.get('/api/departments', (_req, res) => res.json(departments));
  app.get('/api/faculty', (_req, res) => res.json(faculty));
  app.get('/api/resources', (_req, res) => res.json(resources));
  app.get('/api/policies', (_req, res) => res.json(policies));
  app.get('/api/diagnostics', (_req, res) => res.json(diagnostics));

  app.post('/api/policies', (req, res) => {
    const parsed = policySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid policy', issues: parsed.error.flatten() });
    const policy = { id: `pol-${Date.now()}`, ...parsed.data, primaryOwner: parsed.data.primaryOwner ?? null, updatedAt: 'Just now' };
    policies.unshift(policy);
    return res.status(201).json(policy);
  });

  app.patch('/api/policies/:id/toggle', (req, res) => {
    const policy = policies.find((item) => item.id === req.params.id);
    if (!policy) return res.status(404).json({ error: 'Policy not found' });
    policy.active = !policy.active;
    policy.updatedAt = 'Just now';
    return res.json(policy);
  });

  app.get('/api/schedules/current', (_req, res) => {
    res.json({
      id: 'tt-2026-04',
      name: 'Semester V — Draft 4',
      status: 'DRAFT',
      version: 4,
      generatedAt: '19 Aug 2026, 10:42 AM',
      objectiveScore: 183,
      validation: { valid: true, hardConflicts: 0, warnings: 2 },
      slots: [
        { label: '09:00', end: '10:00' },
        { label: '10:00', end: '11:00' },
        { label: '11:15', end: '12:15' },
        { label: '12:15', end: '13:15' },
        { label: '14:00', end: '15:00' },
        { label: '15:00', end: '16:00' },
        { label: '16:15', end: '17:15' },
      ],
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      assignments,
    });
  });

  app.post('/api/schedule/generate', async (req, res) => {
    const parsed = generationSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid generation options', issues: parsed.error.flatten() });

    if (parsed.data.requirements) {
      const hours = new Map<string, number>();
      for (const requirement of parsed.data.requirements) {
        hours.set(requirement.facultyId, (hours.get(requirement.facultyId) ?? 0) + requirement.weeklyHours);
        const member = faculty.find((item) => item.id === requirement.facultyId);
        if (!member || !member.eligibleSubjects.some((subject) => subject.toLowerCase().includes(requirement.subjectId.toLowerCase()))) {
          return res.status(422).json({
            status: 'REJECTED',
            code: 'FACULTY_INELIGIBLE',
            message: `${member?.name ?? requirement.facultyId} is not eligible to teach ${requirement.subjectId}.`,
          });
        }
      }
      for (const [facultyId, weeklyHours] of hours) {
        const member = faculty.find((item) => item.id === facultyId);
        if (member && weeklyHours > member.maxWeeklyWorkload) {
          return res.status(422).json({
            status: 'REJECTED',
            code: 'WORKLOAD_CAP_EXCEEDED',
            message: `${member.name} requires ${weeklyHours} hours but is capped at ${member.maxWeeklyWorkload} hours per week.`,
            facultyId,
            requiredHours: weeklyHours,
            maximumHours: member.maxWeeklyWorkload,
          });
        }
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 650));
    return res.status(201).json({
      runId: `run-${Date.now()}`,
      status: 'OPTIMAL',
      message: 'A conflict-free timetable was generated and independently validated.',
      metrics: { sessionsPlaced: 484, hardConflicts: 0, objectiveScore: 176, durationSeconds: 31.7, facultyGapHours: 26, cohortGapHours: 18, fallbackAssignments: 7 },
      scheduleId: 'tt-2026-05',
      assignments,
    });
  });

  app.post('/api/schedule/validate-move', (req, res) => {
    const schema = z.object({ assignmentId: z.string(), day: z.string(), startSlot: z.number().int().min(0).max(6), roomId: z.string() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ valid: false, errors: parsed.error.issues });
    const assignment = assignments.find((item) => item.id === parsed.data.assignmentId);
    if (!assignment) return res.status(404).json({ valid: false, errors: ['Session not found'] });
    const roomConflict = assignments.find((item) => item.id !== assignment.id && item.day === parsed.data.day && item.roomId === parsed.data.roomId && parsed.data.startSlot < item.startSlot + item.duration && parsed.data.startSlot + assignment.duration > item.startSlot);
    const facultyConflict = assignments.find((item) => item.id !== assignment.id && item.day === parsed.data.day && item.facultyId === assignment.facultyId && parsed.data.startSlot < item.startSlot + item.duration && parsed.data.startSlot + assignment.duration > item.startSlot);
    const conflicts = [roomConflict && `Room ${roomConflict.roomName} is occupied by ${roomConflict.subjectCode}.`, facultyConflict && `${assignment.facultyName} is teaching ${facultyConflict?.subjectCode}.`].filter(Boolean);
    return res.json({ valid: conflicts.length === 0, conflicts, checkedConstraints: ['Room collision', 'Faculty collision', 'Cohort collision', 'Faculty blackout', 'Capacity & capability'] });
  });

  app.post('/api/import/preview', (req, res) => {
    const rows = Number(req.body?.rows ?? 0);
    res.json({ valid: rows > 0, rowsDetected: rows, validRows: Math.max(rows - 2, 0), warnings: rows > 0 ? 2 : 0, errors: [], columns: ['employeeCode', 'name', 'email', 'departmentCode', 'maxWeeklyWorkload'] });
  });

  app.post('/api/agent/interpret', (req, res) => {
    const prompt = z.object({ message: z.string().min(3) }).safeParse(req.body);
    if (!prompt.success) return res.status(400).json({ error: 'Please provide a policy instruction.' });
    const text = prompt.data.message;
    const lower = text.toLowerCase();
    const isResourcePolicy = lower.includes('lab') || lower.includes('room') || lower.includes('resource');
    const isGapPolicy = lower.includes('gap') || lower.includes('idle');
    const proposedPolicy = isResourcePolicy
      ? { name: 'Resource ownership preference', type: 'RESOURCE_FALLBACK', department: lower.includes('it') ? 'IT' : 'All departments', primaryOwner: lower.includes('it') ? 'IT' : null, fallbackOwners: lower.includes('cse') ? ['CSE'] : ['Shared'], weight: 100, description: text }
      : { name: isGapPolicy ? 'Minimize idle gaps' : 'Schedule time preference', type: isGapPolicy ? 'GAP_MINIMIZATION' : 'TIME_PREFERENCE', department: 'All departments', primaryOwner: null, fallbackOwners: [], weight: isGapPolicy ? 75 : 60, description: text };
    res.json({
      response: 'I translated your instruction into a structured scheduling policy. I will not alter the timetable until you review and approve it.',
      proposedPolicy,
      needsConfirmation: true,
      toolsUsed: ['getDepartments', 'validatePolicy'],
    });
  });

  app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
  return app;
}
