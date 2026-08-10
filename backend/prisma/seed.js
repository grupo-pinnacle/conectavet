const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const PASSWORD = 'test1234';

const demoUsers = [
  {
    email: 'cliente.demo@conectavet.com',
    firstName: 'Cliente',
    lastName: 'Demo',
    role: 'CLIENT',
  },
  {
    email: 'vet.demo@conectavet.com',
    firstName: 'Vet',
    lastName: 'Demo',
    role: 'VET',
    isOnline: true,
  },
  {
    email: 'vet.demo2@conectavet.com',
    firstName: 'Vet',
    lastName: 'Demo 2',
    role: 'VET',
    isOnline: true,
  },
];

(async () => {
  const hash = await bcrypt.hash(PASSWORD, 10);
  let created = 0;
  for (const u of demoUsers) {
    const exists = await prisma.user.findUnique({ where: { email: u.email } });
    if (exists) {
      console.log(`  ya existia: ${u.email}`);
      continue;
    }
    await prisma.user.create({
      data: {
        email: u.email,
        password: hash,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        isOnline: u.isOnline,
      },
    });
    created++;
    console.log(`  creado: ${u.email} (${u.role})`);
  }
  const client = await prisma.user.findUnique({ where: { email: 'cliente.demo@conectavet.com' } });
  if (client && !(await prisma.pet.findFirst({ where: { ownerId: client.id } }))) {
    await prisma.pet.create({
      data: { name: 'Rex', species: 'Perro', breed: 'Labrador', age: 3, weight: 25.5, ownerId: client.id },
    });
    console.log('  mascota creada: Rex');
  }
  console.log(`\nSeed listo. Password de todos: ${PASSWORD}`);
  await prisma.$disconnect();
})().catch((e) => {
  console.error('ERROR SEED:', e.message);
  process.exit(1);
});
