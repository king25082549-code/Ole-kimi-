import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - บันทึกการชำระงวดผ่อน
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { installmentId } = body
    
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
      // คำนวณยอดค้างชำระ
      const remainingInstallment = customer.installments
        .filter(i => !i.paid || i.id === installmentId)
        .filter(i => i.id !== installmentId)
        .reduce((sum, i) => sum + i.amount, 0)
      
      // คำนวณกำไรปัจจุบัน
      const paidAmount = customer.installments
        .filter(i => i.paid || i.id === installmentId)
        .reduce((sum, i) => sum + i.amount, 0)
      const currentProfit = Math.min(paidAmount + customer.customerDownPayment, customer.totalProfit)
      
      // ตรวจสอบว่าผ่อนครบหรือยัง
      const allPaid = customer.installments.every(i => i.paid || i.id === installmentId)
      
      await prisma.customer.update({
        where: { id },
        data: {
          remainingInstallment,
          currentProfit,
          status: allPaid ? 'completed' : 'active',
          completedAt: allPaid ? new Date() : null
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
