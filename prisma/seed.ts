import { PrismaClient, ResourceType, SessionType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const year = await prisma.academicYear.upsert({
    where: { year: '2026-2027' },
    update: { isCurrent: true },
    create: {
      id: 'ay-2026',
      year: '2026-2027',
      startsOn: new Date('2026-07-01'),
      endsOn: new Date('2027-06-30'),
      isCurrent: true,
    },
  });

  const department = await prisma.department.upsert({
    where: { code: 'IT' },
    update: {},
    create: { id: 'dept-it', code: 'IT', name: 'Information Technology', color: '#28786d' },
  });
  const cse = await prisma.department.upsert({
    where: { code: 'CSE' },
    update: {},
    create: { id: 'dept-cse', code: 'CSE', name: 'Computer Science & Engineering', color: '#426a9b' },
  });

  const program = await prisma.program.upsert({
    where: { departmentId_code: { departmentId: department.id, code: 'BTECH-IT' } },
    update: {},
    create: { id: 'prog-it', name: 'B.Tech Information Technology', code: 'BTECH-IT', departmentId: department.id, academicYearId: year.id },
  });
  const level = await prisma.academicLevel.upsert({
    where: { programId_yearIndex: { programId: program.id, yearIndex: 3 } },
    update: {},
    create: { id: 'level-ty-it', name: 'Third Year', code: 'TY', yearIndex: 3, programId: program.id },
  });
  const division = await prisma.division.upsert({
    where: { academicLevelId_code: { academicLevelId: level.id, code: 'A' } },
    update: { studentCount: 62 },
    create: { id: 'div-ty-it-a', name: 'Division A', code: 'A', academicLevelId: level.id, studentCount: 62 },
  });
  const batch = await prisma.batch.upsert({
    where: { divisionId_code: { divisionId: division.id, code: 'A1' } },
    update: { studentCount: 31 },
    create: { id: 'batch-ty-it-a1', name: 'Batch A1', code: 'A1', divisionId: division.id, studentCount: 31 },
  });

  const subject = await prisma.subject.upsert({
    where: { code: 'IT302L' },
    update: {},
    create: { id: 'subj-sql', code: 'IT302L', name: 'SQL Laboratory', departmentId: department.id, credits: 2, defaultType: SessionType.PRACTICAL },
  });
  const faculty = await prisma.faculty.upsert({
    where: { employeeCode: 'FAC-023' },
    update: { maxWeeklyWorkload: 18 },
    create: { id: 'fac-meena', employeeCode: 'FAC-023', name: 'Dr. Meena Iyer', email: 'meena.iyer@college.edu', title: 'Associate Professor', departmentId: department.id, maxWeeklyWorkload: 18 },
  });
  await prisma.facultyEligibility.upsert({
    where: { facultyId_subjectId: { facultyId: faculty.id, subjectId: subject.id } },
    update: { isPrimary: true },
    create: { id: 'elig-meena-sql', facultyId: faculty.id, subjectId: subject.id, proficiencyLevel: 3, isPrimary: true },
  });

  const building = await prisma.building.upsert({
    where: { code: 'TECH' },
    update: {},
    create: { id: 'building-tech', code: 'TECH', name: 'Technology Block' },
  });
  const floor = await prisma.floor.upsert({
    where: { buildingId_floorNumber: { buildingId: building.id, floorNumber: 2 } },
    update: {},
    create: { id: 'floor-tech-2', name: 'Second Floor', floorNumber: 2, buildingId: building.id },
  });
  const territory = await prisma.departmentTerritory.upsert({
    where: { floorId_departmentId_name: { floorId: floor.id, departmentId: department.id, name: 'IT Laboratories' } },
    update: {},
    create: { id: 'territory-it-labs', name: 'IT Laboratories', floorId: floor.id, departmentId: department.id },
  });
  await prisma.resource.upsert({
    where: { code: 'IT-L1' },
    update: { capacity: 36, isActive: true },
    create: { id: 'room-it-l1', code: 'IT-L1', name: 'IT Database Laboratory', resourceType: ResourceType.LAB, capacity: 36, buildingId: building.id, floorId: floor.id, territoryId: territory.id, departmentId: department.id, capabilities: ['Computers', 'SQL', 'Linux'] },
  });

  await prisma.teachingRequirement.upsert({
    where: { id: 'req-sql-a1' },
    update: {},
    create: {
      id: 'req-sql-a1',
      academicYearId: year.id,
      subjectId: subject.id,
      facultyId: faculty.id,
      departmentId: department.id,
      academicLevelId: level.id,
      divisionId: division.id,
      batchId: batch.id,
      sessionType: SessionType.PRACTICAL,
      durationPeriods: 2,
      weeklyFrequency: 1,
      requiredResourceType: ResourceType.LAB,
      requiredCapabilities: ['Computers', 'SQL'],
      preferredDays: [],
    },
  });

  console.log(`Seeded ${year.year}: ${department.code}, ${cse.code}, faculty eligibility, campus resource, and teaching requirement.`);
}

main().finally(() => prisma.$disconnect());
