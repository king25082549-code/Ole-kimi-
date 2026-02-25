import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

 type InstallmentRow = {
   id: string
   paid: boolean
   dueDate: Date
   amount: number
 }

// POST - บันทึกการชำระงวดผ่อน
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { installmentId } = body

    if (!installmentId || typeof installmentId !== 'string') {
      return NextResponse.json(
        { error: 'installmentId is required' },
        { status: 400 }
      )
    }
    
    // อัพเดทงวดผ่อนว่าชำระแล้ว
    await prisma.productInstallment.update({
      where: { id: installmentId },
      data: {
        paid: true,
        paidDate: new Date()
      }
    })
    
    // ดึงข้อมูลลูกค้าเพื่อคำนวณกำไรปัจจุบัน
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        installments: true
      }
    })
    
    if (customer) {
      const today = new Date()
      const installments = customer.installments as unknown as InstallmentRow[]

      const remainingInstallmentComputed = installments
        .filter((i) => !i.paid)
        .reduce((sum: number, i) => sum + i.amount, 0)

      const paidAmount = installments
        .filter((i) => i.paid)
        .reduce((sum: number, i) => sum + i.amount, 0)

      const currentProfit = paidAmount + customer.customerDownPayment - (customer.costPrice + customer.costBonus)

      const hasOverdue = installments.some((i) => !i.paid && i.dueDate.getTime() < today.getTime())

      const status = remainingInstallmentComputed === 0 && installments.length > 0
        ? 'completed'
        : hasOverdue
          ? 'overdue'
          : 'active'

      const remainingInstallment = status === 'completed' ? 0 : remainingInstallmentComputed

      await prisma.customer.update({
        where: { id },
        data: {
          remainingInstallment,
          currentProfit,
          status,
          completedAt: status === 'completed' ? new Date() : null
        }
      })
    }
    
    return NextResponse.json({ message: 'Payment recorded successfully' })
  } catch (error) {
    console.error('Error recording payment:', error)
    return NextResponse.json(
      { error: 'Failed to record payment' },
      { status: 500 }
    )
  }
}
