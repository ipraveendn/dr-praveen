-- ============================================================================
-- APPOINTMENT SYSTEM MIGRATION
-- Purpose: Add Appointment table and active-slot partial unique constraint
-- Applied to: Supabase / PostgreSQL
-- Safe: Yes - Non-breaking, adds new table and indexes, leaves Token system intact
-- ============================================================================

-- Create Enum for AppointmentStatus
DO $$ BEGIN
    CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Appointment table
CREATE TABLE IF NOT EXISTS "Appointment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinicId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "appointmentDate" DATE NOT NULL,
    "appointmentTime" VARCHAR(10) NOT NULL,
    "consultationMode" VARCHAR(20) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'CONFIRMED',
    "paymentMethod" VARCHAR(50),
    "reason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(6),

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Appointment_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- Partial Unique Index: Prevents double-booking for active appointments in the same clinic/date/time
-- Consultation mode does NOT participate in uniqueness.
-- Cancelled appointments do NOT block the slot.
CREATE UNIQUE INDEX IF NOT EXISTS "unique_active_clinic_appointment_slot" 
ON "Appointment" ("clinicId", "appointmentDate", "appointmentTime") 
WHERE "status" != 'CANCELLED';

-- Supporting performance indexes
CREATE INDEX IF NOT EXISTS "idx_appointment_clinic_date" ON "Appointment"("clinicId", "appointmentDate");
CREATE INDEX IF NOT EXISTS "idx_appointment_patient" ON "Appointment"("patientId");
CREATE INDEX IF NOT EXISTS "idx_appointment_status" ON "Appointment"("status");
