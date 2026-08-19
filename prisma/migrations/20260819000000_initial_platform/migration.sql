-- Initial production schema, including Phase 7 faculty workload and eligibility.
CREATE TYPE "ResourceType" AS ENUM ('CLASSROOM', 'LAB', 'WORKSHOP');
CREATE TYPE "SessionType" AS ENUM ('LECTURE', 'PRACTICAL', 'TUTORIAL', 'SEMINAR');
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY');
CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE', 'HARD_UNAVAILABLE');
CREATE TYPE "PolicyType" AS ENUM ('RESOURCE_FALLBACK', 'TIME_PREFERENCE', 'GAP_MINIMIZATION', 'BUILDING_MOVEMENT', 'CUSTOM');
CREATE TYPE "TimetableStatus" AS ENUM ('DRAFT', 'REVIEWED', 'PUBLISHED');

CREATE TABLE "AcademicYear" (
  "id" TEXT NOT NULL,
  "year" TEXT NOT NULL,
  "startsOn" TIMESTAMP(3) NOT NULL,
  "endsOn" TIMESTAMP(3) NOT NULL,
  "isCurrent" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AcademicYear_year_key" ON "AcademicYear"("year");

CREATE TABLE "Department" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "color" TEXT DEFAULT '#2E7D6E',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

CREATE TABLE "Program" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "departmentId" TEXT NOT NULL,
  "academicYearId" TEXT NOT NULL,
  "durationYears" INTEGER NOT NULL DEFAULT 4,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Program_departmentId_code_key" ON "Program"("departmentId", "code");
CREATE INDEX "Program_academicYearId_idx" ON "Program"("academicYearId");

CREATE TABLE "AcademicLevel" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "yearIndex" INTEGER NOT NULL,
  "programId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AcademicLevel_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AcademicLevel_programId_yearIndex_key" ON "AcademicLevel"("programId", "yearIndex");

CREATE TABLE "Division" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "academicLevelId" TEXT NOT NULL,
  "studentCount" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Division_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Division_academicLevelId_code_key" ON "Division"("academicLevelId", "code");

CREATE TABLE "Batch" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "divisionId" TEXT NOT NULL,
  "studentCount" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Batch_divisionId_code_key" ON "Batch"("divisionId", "code");

CREATE TABLE "Faculty" (
  "id" TEXT NOT NULL,
  "employeeCode" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "title" TEXT,
  "departmentId" TEXT NOT NULL,
  "maxWeeklyWorkload" DOUBLE PRECISION NOT NULL DEFAULT 18,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Faculty_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Faculty_employeeCode_key" ON "Faculty"("employeeCode");
CREATE UNIQUE INDEX "Faculty_email_key" ON "Faculty"("email");
CREATE INDEX "Faculty_departmentId_idx" ON "Faculty"("departmentId");

CREATE TABLE "FacultyAvailability" (
  "id" TEXT NOT NULL,
  "facultyId" TEXT NOT NULL,
  "dayOfWeek" "DayOfWeek" NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "status" "AvailabilityStatus" NOT NULL DEFAULT 'HARD_UNAVAILABLE',
  "note" TEXT,
  CONSTRAINT "FacultyAvailability_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "FacultyAvailability_facultyId_dayOfWeek_idx" ON "FacultyAvailability"("facultyId", "dayOfWeek");

CREATE TABLE "Subject" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "departmentId" TEXT NOT NULL,
  "credits" DOUBLE PRECISION NOT NULL,
  "defaultType" "SessionType" NOT NULL DEFAULT 'LECTURE',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Subject_code_key" ON "Subject"("code");

CREATE TABLE "FacultyEligibility" (
  "id" TEXT NOT NULL,
  "facultyId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "proficiencyLevel" INTEGER NOT NULL DEFAULT 1,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "validFrom" TIMESTAMP(3),
  "validUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FacultyEligibility_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FacultyEligibility_facultyId_subjectId_key" ON "FacultyEligibility"("facultyId", "subjectId");
CREATE INDEX "FacultyEligibility_subjectId_idx" ON "FacultyEligibility"("subjectId");

CREATE TABLE "Building" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Building_code_key" ON "Building"("code");

CREATE TABLE "Floor" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "floorNumber" INTEGER NOT NULL,
  "buildingId" TEXT NOT NULL,
  CONSTRAINT "Floor_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Floor_buildingId_floorNumber_key" ON "Floor"("buildingId", "floorNumber");

CREATE TABLE "DepartmentTerritory" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "floorId" TEXT NOT NULL,
  "departmentId" TEXT NOT NULL,
  CONSTRAINT "DepartmentTerritory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DepartmentTerritory_floorId_departmentId_name_key" ON "DepartmentTerritory"("floorId", "departmentId", "name");

CREATE TABLE "Resource" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "resourceType" "ResourceType" NOT NULL,
  "capacity" INTEGER NOT NULL,
  "buildingId" TEXT NOT NULL,
  "floorId" TEXT NOT NULL,
  "territoryId" TEXT,
  "departmentId" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "capabilities" TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Resource_code_key" ON "Resource"("code");
CREATE INDEX "Resource_resourceType_isActive_idx" ON "Resource"("resourceType", "isActive");
CREATE INDEX "Resource_buildingId_floorId_idx" ON "Resource"("buildingId", "floorId");

CREATE TABLE "ResourceAvailability" (
  "id" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "dayOfWeek" "DayOfWeek" NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "status" "AvailabilityStatus" NOT NULL DEFAULT 'HARD_UNAVAILABLE',
  "note" TEXT,
  CONSTRAINT "ResourceAvailability_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TeachingRequirement" (
  "id" TEXT NOT NULL,
  "academicYearId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "facultyId" TEXT NOT NULL,
  "departmentId" TEXT NOT NULL,
  "academicLevelId" TEXT NOT NULL,
  "divisionId" TEXT,
  "batchId" TEXT,
  "isCombined" BOOLEAN NOT NULL DEFAULT false,
  "sessionType" "SessionType" NOT NULL,
  "durationPeriods" INTEGER NOT NULL,
  "weeklyFrequency" INTEGER NOT NULL,
  "requiredResourceType" "ResourceType" NOT NULL,
  "requiredCapabilities" TEXT[],
  "preferredDays" "DayOfWeek"[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TeachingRequirement_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TeachingRequirement_academicYearId_departmentId_idx" ON "TeachingRequirement"("academicYearId", "departmentId");
CREATE INDEX "TeachingRequirement_facultyId_idx" ON "TeachingRequirement"("facultyId");

CREATE TABLE "Policy" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "departmentId" TEXT,
  "policyType" "PolicyType" NOT NULL,
  "rulesJson" JSONB NOT NULL,
  "weight" INTEGER NOT NULL DEFAULT 100,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Policy_departmentId_policyType_idx" ON "Policy"("departmentId", "policyType");

CREATE TABLE "TimetableVersion" (
  "id" TEXT NOT NULL,
  "academicYearId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" "TimetableStatus" NOT NULL DEFAULT 'DRAFT',
  "dataJson" JSONB NOT NULL,
  "validationJson" JSONB,
  "objectiveScore" DOUBLE PRECISION,
  "version" INTEGER NOT NULL DEFAULT 1,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  CONSTRAINT "TimetableVersion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TimetableVersion_academicYearId_version_key" ON "TimetableVersion"("academicYearId", "version");

CREATE TABLE "_CombinedDivisions" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);
CREATE UNIQUE INDEX "_CombinedDivisions_AB_unique" ON "_CombinedDivisions"("A", "B");
CREATE INDEX "_CombinedDivisions_B_index" ON "_CombinedDivisions"("B");

ALTER TABLE "Program" ADD CONSTRAINT "Program_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Program" ADD CONSTRAINT "Program_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AcademicLevel" ADD CONSTRAINT "AcademicLevel_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Division" ADD CONSTRAINT "Division_academicLevelId_fkey" FOREIGN KEY ("academicLevelId") REFERENCES "AcademicLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Faculty" ADD CONSTRAINT "Faculty_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FacultyAvailability" ADD CONSTRAINT "FacultyAvailability_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FacultyEligibility" ADD CONSTRAINT "FacultyEligibility_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FacultyEligibility" ADD CONSTRAINT "FacultyEligibility_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Floor" ADD CONSTRAINT "Floor_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DepartmentTerritory" ADD CONSTRAINT "DepartmentTerritory_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "Floor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DepartmentTerritory" ADD CONSTRAINT "DepartmentTerritory_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "Floor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_territoryId_fkey" FOREIGN KEY ("territoryId") REFERENCES "DepartmentTerritory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ResourceAvailability" ADD CONSTRAINT "ResourceAvailability_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeachingRequirement" ADD CONSTRAINT "TeachingRequirement_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TeachingRequirement" ADD CONSTRAINT "TeachingRequirement_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TeachingRequirement" ADD CONSTRAINT "TeachingRequirement_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TeachingRequirement" ADD CONSTRAINT "TeachingRequirement_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TeachingRequirement" ADD CONSTRAINT "TeachingRequirement_academicLevelId_fkey" FOREIGN KEY ("academicLevelId") REFERENCES "AcademicLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TeachingRequirement" ADD CONSTRAINT "TeachingRequirement_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TeachingRequirement" ADD CONSTRAINT "TeachingRequirement_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimetableVersion" ADD CONSTRAINT "TimetableVersion_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "_CombinedDivisions" ADD CONSTRAINT "_CombinedDivisions_A_fkey" FOREIGN KEY ("A") REFERENCES "Division"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_CombinedDivisions" ADD CONSTRAINT "_CombinedDivisions_B_fkey" FOREIGN KEY ("B") REFERENCES "TeachingRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
