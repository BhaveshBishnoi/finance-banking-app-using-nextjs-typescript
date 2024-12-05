import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(tags)
  } catch (error: unknown) {
    console.error('Failed to fetch tags:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    )
  }
}

// Handle POST request to add a new tag
export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    const newTag = await prisma.tag.create({
      data: { name }
    });
    return NextResponse.json(newTag);
  } catch (error) {
    console.error('Failed to add tag:', error);
    return NextResponse.json(
      { error: 'Failed to add tag' },
      { status: 500 }
    );
  }
} 