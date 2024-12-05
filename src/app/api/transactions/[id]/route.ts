import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { category, comment } = await request.json()

    const transaction = await prisma.transaction.update({
      where: { id },
      data: { category, comment }
    })

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Failed to update transaction:', error)
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    )
  }
} 