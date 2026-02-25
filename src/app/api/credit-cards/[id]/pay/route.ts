/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { paymentDate, amount } = body

    if (!paymentDate || !amount || amount <= 0) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 })
    }

    const paymentAmount = parseFloat(amount)

    // ดึงข้อมูลบัตรพร้อมยอดใช้รวมและการจ่ายก่อนหน้า
    const card = await prisma.creditCard.findUnique({
      where: { id },
      include: {
        usages: true,
        payments: true,
      }
    })

    if (!card) {
      return NextResponse.json({ error: 'ไม่พบบัตรเครดิต' }, { status: 404 })
    }

    // คำนวณยอดใช้รวมทั้งหมด
    const totalUsed = card.usages.reduce((sum: number, u: any) => sum + u.amount, 0)
    // คำนวณยอดจ่ายไปแล้วทั้งหมด
    const totalPaid = card.payments.reduce((sum: number, p: any) => sum + p.amount, 0)
    // ยอดคงเหลือก่อนจ่ายครั้งนี้
    const currentRemaining = Math.max(0, totalUsed - totalPaid)
    // ยอดคงเหลือหลังจ่ายครั้งนี้
    const remainingBalance = Math.max(0, currentRemaining - paymentAmount)

    // บันทึกการจ่ายลง DB
    const payment = await prisma.creditCardPayment.create({
      data: {
        creditCardId: id,
        paymentDate: new Date(paymentDate),
        amount: paymentAmount,
        remainingBalance,
      }
    })

    // อัปเดต remainingAmount ใน CreditCardUsage ตามสัดส่วน
    if (paymentAmount > 0 && card.usages.length > 0) {
      let remainingToDeduct = paymentAmount
      for (const usage of card.usages) {
        if (remainingToDeduct <= 0) break
        if (usage.remainingAmount <= 0) continue
        const deduct = Math.min(usage.remainingAmount, remainingToDeduct)
        await prisma.creditCardUsage.update({
          where: { id: usage.id },
          data: { remainingAmount: Math.max(0, usage.remainingAmount - deduct) }
        })
        remainingToDeduct -= deduct
      }
    }

    return NextResponse.json({
      payment,
      totalPaid: totalPaid + paymentAmount,
      remainingBalance,
    })
  } catch (error: any) {
    console.error('Error recording credit card payment:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const payments = await prisma.creditCardPayment.findMany({
      where: { creditCardId: id },
      orderBy: { paymentDate: 'desc' }
    })

    return NextResponse.json(payments)
  } catch (error: any) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
