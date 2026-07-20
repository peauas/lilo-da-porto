-- Multi-tenant isolation: cada Employee/Service/MonthlySheet/EmployeeDocument passa a
-- pertencer a um usuário (userId). Conforme decidido, os dados existentes são zerados
-- para começar do zero (as contas de usuário são preservadas).

-- Zera os dados de negócio (mantém a tabela User e PasswordResetToken)
TRUNCATE TABLE "MonthlySheetHistory", "MonthlySheet", "Service", "EmployeeDocument", "Employee" RESTART IDENTITY CASCADE;

-- DropIndex (CPF deixa de ser único globalmente)
DROP INDEX IF EXISTS "Employee_cpf_key";

-- AlterTable: adiciona userId (NOT NULL após truncate)
ALTER TABLE "Employee" ADD COLUMN "userId" TEXT NOT NULL;
ALTER TABLE "EmployeeDocument" ADD COLUMN "userId" TEXT NOT NULL;
ALTER TABLE "Service" ADD COLUMN "userId" TEXT NOT NULL;
ALTER TABLE "MonthlySheet" ADD COLUMN "userId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_cpf_key" ON "Employee"("userId", "cpf");
CREATE INDEX "Employee_userId_idx" ON "Employee"("userId");
CREATE INDEX "EmployeeDocument_userId_idx" ON "EmployeeDocument"("userId");
CREATE INDEX "Service_userId_idx" ON "Service"("userId");
CREATE INDEX "MonthlySheet_userId_idx" ON "MonthlySheet"("userId");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmployeeDocument" ADD CONSTRAINT "EmployeeDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Service" ADD CONSTRAINT "Service_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MonthlySheet" ADD CONSTRAINT "MonthlySheet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
