import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - ดึงข้อมูลบัตรเครดิตทั้งหมด
export async function GET() {
  try {
    const creditCards = await prisma.creditCard.findMany({
      include: {
        usages: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                productModel: true,
                status: true
              }
            },
            payments: {
              orderBy: { installmentNumber: 'asc' }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(creditCards)
  } catch (error) {
    console.error('Error fetching credit cards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credit cards' },
      { status: 500 }
    )
  }
}

// POST - สร้างบัตรเครดิตใหม่
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const creditCard = await prisma.creditCard.create({
      data: {
        name: body.name,
        limit: body.limit || 0,
        dueDate: body.dueDate
      }
    })
    
    return NextResponse.json(creditCard, { status: 201 })
  } catch (error) {
    console.error('Error creating credit card:', error)
    return NextResponse.json(
      { error: 'Failed to create credit card' },
      { status: 500 }
    )
  }
}
