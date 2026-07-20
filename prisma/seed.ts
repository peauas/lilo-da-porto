import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@lilodaporto.com";
  const password = process.env.ADMIN_PASSWORD ?? "admin123";
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Administrador",
      passwordHash,
    },
  });

  console.log(`Admin user: ${user.email}`);

  const employeeCount = await prisma.employee.count({ where: { userId: user.id } });
  if (employeeCount === 0) {
    await prisma.employee.create({
      data: {
        userId: user.id,
        name: "Funcionário Exemplo",
        cpf: "12345678901",
        phone: "11999999999",
        defaultPercentage: 70,
        status: "ACTIVE",
        pix: "11999999999",
        bank: "Banco Exemplo",
        agency: "0001",
        account: "12345-6",
      },
    });
    console.log("Sample employee created");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
