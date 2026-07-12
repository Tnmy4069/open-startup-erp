const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const people = [
  { name: 'Tanmay', email: 'tanmay@cyberx.org.in' },
  { name: 'Om',     email: 'om@cyberx.org.in' },
  { name: 'Sakshi', email: 'sakshi@cyberx.org.in' },
  { name: 'Sanika', email: 'sanika@cyberx.org.in' },
  { name: 'Parth',  email: 'parth@cyberx.org.in' },
  { name: 'Pranav', email: 'pranav@cyberx.org.in' },
  { name: 'Abhishek', email: 'abhishek@cyberx.org.in' },
];

async function main() {
  let created = 0;
  let skipped = 0;

  for (const p of people) {
    const existing = await prisma.person.findUnique({ where: { name: p.name } });
    if (existing) {
      console.log(`⚠  Skipped (already exists): ${p.name}`);
      skipped++;
      continue;
    }
    await prisma.person.create({
      data: {
        name:  p.name,
        email: p.email,
        phone: '',          // fill in later
        role:  'Member',
      },
    });
    console.log(`✓  Created: ${p.name} (${p.email})`);
    created++;
  }

  console.log(`\nDone — ${created} created, ${skipped} skipped.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
