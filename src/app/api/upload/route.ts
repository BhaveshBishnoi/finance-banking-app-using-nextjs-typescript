import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { parse } from 'csv-parse/sync'

const prisma = new PrismaClient()

interface CSVRecord {
  date: string
  description: string
  amount: string
}

// Sample transaction descriptions with their default categories
const transactionData = [
  { description: 'Client Payment', type: 'credit', category: 'Income' },
  { description: 'Office Supplies', type: 'debit', category: 'Expense' },
  { description: 'Software Subscription', type: 'debit', category: 'Expense' },
  { description: 'Consulting Fee', type: 'credit', category: 'Income' },
  { description: 'Equipment Purchase', type: 'debit', category: 'Asset' },
  { description: 'Bank Loan', type: 'credit', category: 'Liability' },
  { description: 'Rent Income', type: 'credit', category: 'Income' },
  { description: 'Vehicle Purchase', type: 'debit', category: 'Asset' },
  { description: 'Mortgage Payment', type: 'debit', category: 'Liability' },
  { description: 'Investment Return', type: 'credit', category: 'Income' }
]

function generateRandomTransactions(count: number) {
  const transactions = []
  const today = new Date()
  
  for (let i = 0; i < count; i++) {
    const randomData = transactionData[Math.floor(Math.random() * transactionData.length)]
    const date = new Date(today)
    date.setDate(date.getDate() - Math.floor(Math.random() * 30))
    
    // Random amount between 100 and 10000
    const amount = Math.round(Math.random() * 9900 + 100)
    
    transactions.push({
      date,
      description: randomData.description,
      amount,
      type: randomData.type,
      category: randomData.category
    })
  }
  
  return transactions.sort((a, b) => b.date.getTime() - a.date.getTime())
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const accountId = formData.get('accountId') as string
    const isRandom = formData.get('isRandom') === 'true'
    
    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      )
    }

    let transactions;

    if (isRandom) {
      // Generate 20-50 random transactions
      const randomTransactionCount = Math.floor(Math.random() * 31) + 20
      const randomTransactions = generateRandomTransactions(randomTransactionCount)

      // Create transactions in database
      transactions = await Promise.all(
        randomTransactions.map(async (transaction) => {
          return prisma.transaction.create({
            data: {
              date: transaction.date,
              description: transaction.description,
              amount: transaction.amount,
              type: transaction.type,
              accountId,
              category: transaction.category,
            }
          })
        })
      )

      // Update account balance
      const totalBalance = transactions.reduce((sum: number, t) => {
        return sum + (t.type === 'credit' ? t.amount : -t.amount)
      }, 0)

      await prisma.account.update({
        where: { id: accountId },
        data: {
          balance: { increment: totalBalance }
        }
      })
    } else {
      if (!file) {
        return NextResponse.json(
          { error: 'File is required for CSV upload' },
          { status: 400 }
        )
      }

      // Handle CSV file upload here
      const text = await file.text()
      const records = parse(text, {
        columns: true,
        skip_empty_lines: true
      }) as CSVRecord[]

      transactions = await Promise.all(
        records.map(async (record) => {
          const amount = parseFloat(record.amount)
          return prisma.transaction.create({
            data: {
              date: new Date(record.date),
              description: record.description,
              amount: Math.abs(amount),
              type: amount >= 0 ? 'credit' : 'debit',
              accountId,
              category: amount >= 0 ? 'Income' : 'Expense',
            }
          })
        })
      )
    }

    return NextResponse.json({ 
      success: true, 
      transactionCount: transactions.length 
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to process transactions' },
      { status: 500 }
    )
  }
} 