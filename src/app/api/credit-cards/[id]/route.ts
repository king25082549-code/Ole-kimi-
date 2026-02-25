import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - ดึงข้อมูลบัตรเครดิตรายบุคคล
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const creditCard = await prisma.creditCard.findUnique({
      where: { id },
      include: {
        usages: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                productModel: true,
                productType: true,
                status: true
              }
            },
            payments: {
              orderBy: { installmentNumber: 'asc' }
            }
          }
        }
      }
    })
    
    if (!creditCard) {
      return NextResponse.json(
        { error: 'Credit card not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(creditCard)
  } catch (error) {
    console.error('Error fetching credit card:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credit card' },
      { status: 500 }
    )
  }
}

// PUT - อัพเดทข้อมูลบัตรเครดิต
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const creditCard = await prisma.creditCard.update({
      where: { id },
      data: {
        name: body.name,
        limit: body.limit,
        dueDate: body.dueDate
      },
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
            payments: true
          }
        }
      }
    })
    
    return NextResponse.json(creditCard)
  } catch (error) {
    console.error('Error updating credit card:', error)
    return NextResponse.json(
      { error: 'Failed to update credit card' },
      { status: 500 }
    )
  }
}

// DELETE - ลบบัตรเครดิต
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await prisma.creditCard.delete({
      where: { id }
    })
    
    return NextResponse.json({ message: 'Credit card deleted successfully' })
  } catch (error) {
    console.error('Error deleting credit card:', error)
    return NextResponse.json(
      { error: 'Failed to delete credit card' },
      { status: 500 }
    )
  }
}
