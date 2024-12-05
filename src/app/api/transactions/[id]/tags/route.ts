import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { tagName } = await request.json()

    // Assuming you have a relation between transactions and tags
    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        tags: {
          connect: { name: tagName } // Adjust this according to your schema
        }
      }
    })

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Failed to add tag:', error)
    return NextResponse.json(
      { error: 'Failed to add tag' },
      { status: 500 }
    )
  }
}
