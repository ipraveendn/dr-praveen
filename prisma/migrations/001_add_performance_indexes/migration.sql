-- CreateIndex
CREATE INDEX "idx_patient_phone" ON "Patient"("phone");

-- AlterTable - Add unique constraint to Clinic.name
ALTER TABLE "Clinic" ADD CONSTRAINT "clinic_name_unique" UNIQUE("name");

-- CreateIndex - Token performance optimization
CREATE INDEX "idx_token_clinic_appointmentdate" ON "Token"("clinicId" DESC, "appointmentDate" DESC);

-- CreateIndex - Token status filtering
CREATE INDEX "idx_token_status" ON "Token"("status") WHERE "status" IN ('WAITING', 'SERVING');
