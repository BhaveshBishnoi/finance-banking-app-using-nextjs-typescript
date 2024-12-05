import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        transactions: {
          orderBy: {
            date: 'desc'
          },
          take: 5
        }
      }
    })
    
    return NextResponse.json(accounts)
  } catch (error) {
    console.error('Failed to fetch accounts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Account name is required' },
        { status: 400 }
      )
    }

    const account = await prisma.account.create({
      data: {
        name,
        bankName: 'Default Bank',
        accountNumber: '****0000',
        balance: 0,
      }
    })

    return NextResponse.json(account)
  } catch (error: unknown) {
    console.error('Failed to create account:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
} 