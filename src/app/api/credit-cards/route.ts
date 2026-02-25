/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type PaymentRow = {
  id: string
  dueDate: Date
  amount: number
  paid: boolean
}

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
                productType: true,
                status: true
              }
            },
            payments: {
              orderBy: { installmentNumber: 'asc' }
            }
          }
        },
        payments: {
          orderBy: { paymentDate: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // คำนวณข้อมูลสรุปสำหรับแต่ละบัตร
    const now = new Date()
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const creditCardsWithSummary = creditCards.map((card: any) => {
      const totalUsed = card.usages.reduce((sum: number, usage: any) => sum + usage.amount, 0)
      const totalRemaining = card.usages.reduce((sum: number, usage: any) => sum + usage.remainingAmount, 0)

      // คำนวณยอดจ่ายบัตรจริง (จาก CreditCardPayment)
      const totalCardPaid = (card.payments ?? []).reduce((sum: number, p: any) => sum + Number(p.amount), 0)
      // วงเงินที่ใช้ไปสุทธิ = ยอดใช้รวม - ยอดที่จ่ายบัตรคืนแล้ว
      const netUsed = Math.max(0, totalUsed - totalCardPaid)
      // วงเงินคงเหลือ = limit - netUsed
      const availableBalance = card.limit - netUsed
      // ยอดคงเหลือที่ต้องจ่ายบัตร
      const cardDebt = Math.max(0, totalUsed - totalCardPaid)

      const allInstallmentPayments: PaymentRow[] = (card.usages ?? [])
        .flatMap((u: any) => (u?.payments ?? []))
        .map((p: any) => ({
          id: String(p.id),
          dueDate: new Date(p.dueDate),
          amount: Number(p.amount) || 0,
          paid: !!p.paid
        }))

      const unpaidPayments = allInstallmentPayments.filter(p => !p.paid)

      const dueWithin7Days = unpaidPayments
        .filter(p => p.dueDate.getTime() >= now.getTime() && p.dueDate.getTime() <= in7Days.getTime())
        .reduce((sum: number, p) => sum + p.amount, 0)

      return {
        ...card,
        totalUsed,
        totalRemaining,
        availableBalance,
        cardDebt,
        totalCardPaid,
        dueWithin7Days,
        utilizationRate: card.limit > 0 ? (netUsed / card.limit) * 100 : 0
      }
    })
    
    return NextResponse.json(creditCardsWithSummary)
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
