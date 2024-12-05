import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // First create a sample account
  const account = await prisma.account.create({
    data: {
      name: 'Main Checking',
      bankName: 'Chase Bank',
      accountNumber: '****1234',
      balance: 1000.00,
    },
  })

  // Create transactions one by one to include tags
  const transactions = await Promise.all([
    prisma.transaction.create({
      data: {
        accountId: account.id,
        date: new Date('2024-01-15'),
        amount: 1000.00,
        type: 'credit',
        description: 'Salary deposit',
        category: 'Income',
        tags: {
          create: [{ name: 'salary' }]
        }
      },
    }),
    prisma.transaction.create({
      data: {
        accountId: account.id,
        date: new Date('2024-01-16'),
        amount: 50.00,
        type: 'debit',
        description: 'Grocery shopping',
        category: 'Expense',
        tags: {
          create: [{ name: 'groceries' }]
        }
      },
    }),
    prisma.transaction.create({
      data: {
        accountId: account.id,
        date: new Date('2024-01-17'),
        amount: 100.00,
        type: 'debit',
        description: 'Utility bill',
        category: 'Expense',
        tags: {
          create: [{ name: 'utilities' }]
        }
      },
    }),
  ])

  console.log('Seed data created:', { account, transactions })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 