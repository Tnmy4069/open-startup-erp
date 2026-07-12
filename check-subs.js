const { PrismaClient } = require('@prisma/client');

async function checkSubscriptions() {
  const prisma = new PrismaClient();
  await prisma.$connect();
  const subs = await prisma.pushSubscription.findMany();
  console.log(`Found ${subs.length} push subscriptions:`);
  subs.forEach(s => {
    console.log(`- ID: ${s.id}, Endpoint: ${s.endpoint.slice(0, 80)}..., UserID: ${s.userId}`);
  });
  await prisma.$disconnect();
}

checkSubscriptions().catch(console.error);
