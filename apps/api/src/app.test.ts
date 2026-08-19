import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app.js';

describe('timetable API', () => {
  const app = createApp();

  it('reports service health', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.solver).toBe('ready');
  });

  it('returns a validated current schedule', async () => {
    const response = await request(app).get('/api/schedules/current');
    expect(response.status).toBe(200);
    expect(response.body.validation.hardConflicts).toBe(0);
    expect(response.body.assignments.length).toBeGreaterThan(10);
  });

  it('rejects workload above the faculty cap before solving', async () => {
    const response = await request(app).post('/api/schedule/generate').send({
      academicYear: '2026–27',
      department: 'IT',
      timeLimitSeconds: 30,
      optimizeGaps: true,
      optimizeMovement: true,
      requirements: [
        { id: 'r1', subjectId: 'Database', facultyId: 'fac-meena', weeklyHours: 12 },
        { id: 'r2', subjectId: 'SQL', facultyId: 'fac-meena', weeklyHours: 8 },
      ],
    });
    expect(response.status).toBe(422);
    expect(response.body.code).toBe('WORKLOAD_CAP_EXCEEDED');
  });

  it('rejects a faculty member who is not eligible for a subject', async () => {
    const response = await request(app).post('/api/schedule/generate').send({
      requirements: [{ id: 'r1', subjectId: 'Thermodynamics', facultyId: 'fac-meena', weeklyHours: 2 }],
    });
    expect(response.status).toBe(422);
    expect(response.body.code).toBe('FACULTY_INELIGIBLE');
  });
});
