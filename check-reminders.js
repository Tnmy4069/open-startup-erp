const { PrismaClient } = require('@prisma/client');

async function checkReminders() {
  const prisma = new PrismaClient();
  await prisma.$connect();
  const reminders = await prisma.reminder.findMany();
  console.log(`Found ${reminders.length} reminders:`);
  reminders.forEach(r => {
    console.log(`- ID: ${r.id}, Title: ${r.title}, Due: ${r.dueDate}, Amount: ${r.amount}, Type: ${r.type}, Status: ${r.status}`);
  });
  await prisma.$disconnect();
}

checkReminders().catch(console.error);
