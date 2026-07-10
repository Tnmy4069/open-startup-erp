/* eslint-disable */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing tables
  await prisma.transaction.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.person.deleteMany({});
  await prisma.activityLog.deleteMany({});
  await prisma.reminder.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.setting.deleteMany({});

  // Seed default settings
  const setting = await prisma.setting.create({
    data: {
      id: 'global_config',
      communityName: 'CyberX Cybersecurity Community',
      bankName: 'HDFC Bank',
      bankAccount: '50200012345678',
      bankIfsc: 'HDFC0000123',
      upiId: 'cyberx@hdfcbank',
      defaultCurrency: 'INR',
      financialYear: '2026-2027',
      categories: 'Campus Session,Workshop,Sponsorship,Merchandise,Travel,Food,Equipment,Software,Marketing,Reimbursement,Miscellaneous',
      paymentMethods: 'Cash,UPI,Bank,Card,Cheque'
    }
  });
  console.log('Seeded settings:', setting.communityName);

  // Seed organizations
  const orgsData = [
    { name: 'SMC Corp', contactPerson: 'Sarah Jenkins', phone: '+919876543210', email: 'sarah@smc.org', address: 'Cyber Towers, Hyderabad', outstandingPayments: 0 },
    { name: 'GOC Solutions', contactPerson: 'George Miller', phone: '+919988776655', email: 'contact@goc.dev', address: 'Tech Park, Bangalore', outstandingPayments: 12000 },
    { name: 'Wisdom High School', contactPerson: 'Meera Sen', phone: '+919123456789', email: 'info@wisdom.edu', address: 'Main Road, Pune', outstandingPayments: -5000 }, // Overpaid/credit
    { name: 'CyberSec Global', contactPerson: 'Alex Carter', phone: '+918887776665', email: 'sponsor@cybersec.io', address: 'Financial District, Hyderabad', outstandingPayments: 0 }
  ];

  for (const org of orgsData) {
    await prisma.organization.create({ data: org });
  }
  console.log('Seeded organizations.');

  // Seed people
  const peopleData = [
    { name: 'Alice Sharma', phone: '+919876500001', email: 'alice@cyberx.org', role: 'Member', totalReceived: 0, totalPaid: 1500 },
    { name: 'Bob Johnson', phone: '+919876500002', email: 'bob@cyberx.org', role: 'Member', totalReceived: 25000, totalPaid: 0 },
    { name: 'Charlie Dev', phone: '+919876500003', email: 'charlie@gmail.com', role: 'Speaker', totalReceived: 10000, totalPaid: 0 },
    { name: 'Dave Wood', phone: '+919876500004', email: 'dave@vendor.com', role: 'Vendor', totalReceived: 0, totalPaid: 45000 },
    { name: 'Eve Patel', phone: '+919876500005', email: 'eve@gmail.com', role: 'Volunteer', totalReceived: 0, totalPaid: 0 },
    { name: 'Tanishq Roy', phone: '+919876500006', email: 'tanishq@cyberx.org', role: 'Student', totalReceived: 500, totalPaid: 0 }
  ];

  for (const person of peopleData) {
    await prisma.person.create({ data: person });
  }
  console.log('Seeded people.');

  // Seed Transactions
  const dateOffset = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  };

  const transactionsData = [
    {
      date: dateOffset(20),
      type: 'Income',
      purpose: 'Sponsorship',
      party: 'CyberSec Global',
      amount: 150000,
      status: 'Completed',
      paymentMethod: 'Bank',
      transactionBy: 'Bob Johnson',
      approvedBy: 'Alice Sharma',
      notes: 'Annual Platinum Sponsorship for CyberX CTF 2026',
      attachments: JSON.stringify([{ name: 'sponsor_agreement.pdf', url: '#', type: 'pdf' }]),
      referenceNumber: 'TXN887723901',
      utr: 'UTR887723901'
    },
    {
      date: dateOffset(15),
      type: 'Expense',
      purpose: 'Equipment',
      party: 'Dave Wood',
      amount: 45000,
      status: 'Completed',
      paymentMethod: 'UPI',
      transactionBy: 'Alice Sharma',
      approvedBy: 'Bob Johnson',
      notes: 'Purchase of 3x Raspberry Pi 5 Lab Kits and custom routers',
      attachments: JSON.stringify([{ name: 'invoice_4402.pdf', url: '#', type: 'pdf' }, { name: 'bill_pi.jpg', url: '#', type: 'image' }]),
      referenceNumber: 'UPI90812389',
      utr: 'UTR90812389'
    },
    {
      date: dateOffset(12),
      type: 'Income',
      purpose: 'Workshop',
      party: 'Wisdom High School',
      amount: 25000,
      status: 'Completed',
      paymentMethod: 'Bank',
      transactionBy: 'Bob Johnson',
      approvedBy: 'Alice Sharma',
      notes: 'Interactive Cybersafety session for high school students',
      attachments: JSON.stringify([]),
      referenceNumber: 'TXN99012389',
      utr: 'UTR99012389'
    },
    {
      date: dateOffset(8),
      type: 'Expense',
      purpose: 'Food',
      party: 'Alice Sharma',
      amount: 1500,
      status: 'Completed',
      paymentMethod: 'Cash',
      transactionBy: 'Alice Sharma',
      approvedBy: 'Bob Johnson',
      notes: 'Snacks & refreshments for CyberX Biweekly Meetup #14',
      attachments: JSON.stringify([{ name: 'pizza_bill.jpg', url: '#', type: 'image' }]),
      referenceNumber: 'CASH-MEET-14'
    },
    {
      date: dateOffset(5),
      type: 'Income',
      purpose: 'Merchandise',
      party: 'Tanishq Roy',
      amount: 500,
      status: 'Completed',
      paymentMethod: 'UPI',
      transactionBy: 'Eve Patel',
      approvedBy: 'Alice Sharma',
      notes: 'CyberX Hacking Hoodie (Size L)',
      attachments: JSON.stringify([]),
      referenceNumber: 'UPI7732109'
    },
    {
      date: dateOffset(4),
      type: 'Expense',
      purpose: 'Travel',
      party: 'Charlie Dev',
      amount: 10000,
      status: 'Completed',
      paymentMethod: 'Bank',
      transactionBy: 'Alice Sharma',
      approvedBy: 'Bob Johnson',
      notes: 'Flight reimbursement for keynote speaker (Charlie Dev) - CTF Meetup',
      attachments: JSON.stringify([{ name: 'flight_ticket.pdf', url: '#', type: 'pdf' }]),
      referenceNumber: 'TXN99102030',
      utr: 'UTR99102030'
    },
    {
      date: dateOffset(3),
      type: 'Expense',
      purpose: 'Software',
      party: 'GOC Solutions',
      amount: 12000,
      status: 'Pending',
      paymentMethod: 'Bank',
      transactionBy: 'Eve Patel',
      approvedBy: null,
      notes: 'Annual license fee for CTFd hosting and CyberX subdomain SSL certificates',
      attachments: JSON.stringify([{ name: 'ctfd_quote_2026.pdf', url: '#', type: 'pdf' }]),
      referenceNumber: 'INV-2026-08'
    },
    {
      date: dateOffset(2),
      type: 'Income',
      purpose: 'Sponsorship',
      party: 'SMC Corp',
      amount: 50000,
      status: 'Pending',
      paymentMethod: 'Cheque',
      transactionBy: 'Bob Johnson',
      approvedBy: null,
      notes: 'Merchandise and workshop sponsorship - pending cheque clearance',
      attachments: JSON.stringify([{ name: 'cheque_scan.jpg', url: '#', type: 'image' }]),
      referenceNumber: 'CHQ-889012'
    },
    {
      date: dateOffset(1),
      type: 'Refund',
      purpose: 'Workshop',
      party: 'Wisdom High School',
      amount: 5000,
      status: 'Completed',
      paymentMethod: 'Bank',
      transactionBy: 'Alice Sharma',
      approvedBy: 'Bob Johnson',
      notes: 'Refund of double payment for extra student seating at workshop',
      attachments: JSON.stringify([]),
      referenceNumber: 'TXN88992211',
      utr: 'UTR88992211'
    },
    {
      date: new Date(),
      type: 'Expense',
      purpose: 'Marketing',
      party: 'Eve Patel',
      amount: 3200,
      status: 'Pending',
      paymentMethod: 'Card',
      transactionBy: 'Eve Patel',
      approvedBy: null,
      notes: 'CyberX Stickers, banners and social media ads',
      attachments: JSON.stringify([{ name: 'banner_print_invoice.pdf', url: '#', type: 'pdf' }]),
      referenceNumber: 'CARD-FB-ADS'
    }
  ];

  for (const tx of transactionsData) {
    await prisma.transaction.create({ data: tx });
  }
  console.log('Seeded transactions.');

  // Seed Reminders
  const remindersData = [
    { title: 'Approve CTFd Software License payment', dueDate: dateOffset(-1), amount: 12000, type: 'Pending Payment', status: 'Active' },
    { title: 'Follow up on SMC Corp Sponsorship cheque clearance', dueDate: dateOffset(-3), amount: 50000, type: 'Upcoming Due', status: 'Active' },
    { title: 'Reimburse Eve Patel for Marketing Stickers & Banners', dueDate: dateOffset(-2), amount: 3200, type: 'Pending Reimbursement', status: 'Active' },
    { title: 'Outstanding payment invoice to GOC Solutions', dueDate: dateOffset(-10), amount: 12000, type: 'Overdue Payment', status: 'Active' }
  ];

  for (const rem of remindersData) {
    await prisma.reminder.create({ data: rem });
  }
  console.log('Seeded reminders.');

  // Seed Notifications
  const notificationsData = [
    { message: 'New expense transaction created by Eve Patel of INR 3,200', timestamp: dateOffset(0), status: 'Unread', type: 'New transaction' },
    { message: 'Sponsorship payment of INR 150,000 from CyberSec Global completed', timestamp: dateOffset(20), status: 'Read', type: 'Payment completed' },
    { message: 'Approval required for GOC Solutions software license of INR 12,000', timestamp: dateOffset(3), status: 'Unread', type: 'Approval required' }
  ];

  for (const notif of notificationsData) {
    await prisma.notification.create({ data: notif });
  }
  console.log('Seeded notifications.');

  // Seed Activity Logs
  const logsData = [
    { action: 'Login', timestamp: dateOffset(20), user: 'Bob Johnson', role: 'Super Admin', details: 'Logged in from IP 192.168.1.5' },
    { action: 'Created', timestamp: dateOffset(20), user: 'Bob Johnson', role: 'Super Admin', details: 'Added income transaction for CyberSec Global: INR 150,000' },
    { action: 'Approved', timestamp: dateOffset(20), user: 'Alice Sharma', role: 'Finance Head', details: 'Approved income transaction of INR 150,000' },
    { action: 'Created', timestamp: dateOffset(15), user: 'Alice Sharma', role: 'Finance Head', details: 'Added equipment purchase expense: INR 45,000' },
    { action: 'Approved', timestamp: dateOffset(15), user: 'Bob Johnson', role: 'Super Admin', details: 'Approved expense transaction: INR 45,000' },
    { action: 'Created', timestamp: dateOffset(3), user: 'Eve Patel', role: 'Committee Member', details: 'Submitted pending invoice for GOC Solutions Software license: INR 12,000' },
    { action: 'Exported', timestamp: dateOffset(2), user: 'Alice Sharma', role: 'Finance Head', details: 'Exported Monthly Finance Ledger to CSV' }
  ];

  for (const log of logsData) {
    await prisma.activityLog.create({ data: log });
  }
  console.log('Seeded activity logs.');

  console.log('Database successfully seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
