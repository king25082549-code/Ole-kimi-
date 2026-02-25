import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

 function toNumber(value: unknown, fallback = 0): number {
   const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
   return Number.isFinite(n) ? n : fallback
 }

 function toInt(value: unknown, fallback = 0): number {
   const n = toNumber(value, fallback)
   return Number.isFinite(n) ? Math.trunc(n) : fallback
 }

 function isValidDateString(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(new Date(value).getTime())
}

 type NormalizedInstallment = {
   installmentNumber: number
   dueDate: Date
   amount: number
   paid: boolean
   paidDate?: Date
 }

// GET - ดึงข้อมูลลูกค้าทั้งหมด
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    const where = status ? { status } : {}
    
    const customers = await prisma.customer.findMany({
      where,
      include: {
        installments: {
          orderBy: { installmentNumber: 'asc' }
        },
        creditCards: {
          include: {
            creditCard: true,
            payments: {
              orderBy: { installmentNumber: 'asc' }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(customers)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

// POST - สร้างลูกค้าใหม่
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const sellingPrice = toNumber(body.sellingPrice, 0)
    const costPrice = toNumber(body.costPrice, 0)
    const costBonus = toNumber(body.costBonus, 0)
    const customerDownPayment = toNumber(body.customerDownPayment, 0)

    // คำนวณกำไรทั้งหมด
    const totalProfit = sellingPrice - costPrice - costBonus

    const installmentsInput = Array.isArray(body.installments) ? body.installments : []
    const installments: NormalizedInstallment[] = installmentsInput
      .filter((inst: any) => typeof inst?.installmentNumber === 'number' || typeof inst?.installmentNumber === 'string')
      .filter((inst: any) => isValidDateString(inst?.dueDate))
      .map((inst: any) => ({
        installmentNumber: toInt(inst.installmentNumber, 0),
        dueDate: new Date(inst.dueDate),
        amount: toNumber(inst.amount, 0),
        paid: !!inst.paid,
        paidDate: inst.paidDate && isValidDateString(inst.paidDate) ? new Date(inst.paidDate) : undefined
      }))
      .filter((inst: any) => inst.installmentNumber > 0)

    const remainingInstallment = installments.filter(i => !i.paid).reduce((sum: number, i) => sum + i.amount, 0)
    const paidInstallments = installments.filter(i => i.paid).reduce((sum: number, i) => sum + i.amount, 0)
    const currentProfit = paidInstallments + customerDownPayment - (costPrice + costBonus)

    const today = new Date()
    const hasOverdue = installments.some((i) => !i.paid && i.dueDate.getTime() < today.getTime())
    const status = remainingInstallment === 0 && installments.length > 0 ? 'completed' : hasOverdue ? 'overdue' : 'active'
    const completedAt = status === 'completed' ? new Date() : null

    const customer = await prisma.customer.create({
      data: {
        name: body.name,
        phone: body.phone,
        address: body.address,
        productType: body.productType,
        productTypeOther: body.productTypeOther,
        productModel: body.productModel,
        serialNumber: body.serialNumber,
        costPrice,
        costBonus,
        downPaymentForPurchase: toNumber(body.downPaymentForPurchase, 0),
        sellingPrice,
        customerDownPayment,
        downPaymentInstallment: body.downPaymentInstallment || false,
        downPaymentMonths: body.downPaymentMonths != null ? toInt(body.downPaymentMonths) : undefined,
        downPaymentMonthly: body.downPaymentMonthly != null ? toNumber(body.downPaymentMonthly) : undefined,
        installmentMonths: toInt(body.installmentMonths, 0),
        monthlyPayment: toNumber(body.monthlyPayment, 0),
        paymentDueDate: toInt(body.paymentDueDate, 1) || 1,
        remainingInstallment,
        totalProfit: totalProfit,
        currentProfit,
        status,
        completedAt,
        installments: {
          create: installments.map((inst: any) => ({
            installmentNumber: inst.installmentNumber,
            dueDate: inst.dueDate,
            amount: inst.amount,
            paid: inst.paid,
            paidDate: inst.paidDate
          }))
        },
        creditCards: {
          create: body.creditCards?.map((card: any) => ({
            creditCardId: card.creditCardId,
            amount: toNumber(card.amount, 0),
            installments: toInt(card.installments, 0),
            monthlyPayment: toNumber(card.monthlyPayment, 0),
            remainingAmount: toNumber(card.remainingAmount, 0),
            payments: {
              create: card.payments?.map((payment: any) => ({
                installmentNumber: toInt(payment.installmentNumber, 0),
                dueDate: new Date(payment.dueDate),
                amount: toNumber(payment.amount, 0),
                paid: !!payment.paid,
                paidDate: payment.paidDate && isValidDateString(payment.paidDate) ? new Date(payment.paidDate) : undefined
              })) || []
            }
          })) || []
        }
      },
      include: {
        installments: true,
        creditCards: {
          include: {
            payments: true
          }
        }
      }
    })
    
    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}
