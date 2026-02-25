import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    
    // คำนวณกำไรทั้งหมด
    const totalProfit = body.sellingPrice - body.costPrice - (body.costBonus || 0)
    
    const customer = await prisma.customer.create({
      data: {
        name: body.name,
        phone: body.phone,
        address: body.address,
        productType: body.productType,
        productTypeOther: body.productTypeOther,
        productModel: body.productModel,
        serialNumber: body.serialNumber,
        costPrice: body.costPrice || 0,
        costBonus: body.costBonus || 0,
        downPaymentForPurchase: body.downPaymentForPurchase || 0,
        sellingPrice: body.sellingPrice || 0,
        customerDownPayment: body.customerDownPayment || 0,
        downPaymentInstallment: body.downPaymentInstallment || false,
        downPaymentMonths: body.downPaymentMonths,
        downPaymentMonthly: body.downPaymentMonthly,
        installmentMonths: body.installmentMonths || 0,
        monthlyPayment: body.monthlyPayment || 0,
        paymentDueDate: body.paymentDueDate || 1,
        remainingInstallment: body.remainingInstallment || 0,
        totalProfit: totalProfit,
        currentProfit: body.customerDownPayment || 0,
        status: 'active',
        installments: {
          create: body.installments?.map((inst: any) => ({
            installmentNumber: inst.installmentNumber,
            dueDate: new Date(inst.dueDate),
            amount: inst.amount,
            paid: inst.paid || false
          })) || []
        },
        creditCards: {
          create: body.creditCards?.map((card: any) => ({
            creditCardId: card.creditCardId,
            amount: card.amount,
            installments: card.installments,
            monthlyPayment: card.monthlyPayment,
            remainingAmount: card.remainingAmount,
            payments: {
              create: card.payments?.map((payment: any) => ({
                installmentNumber: payment.installmentNumber,
                dueDate: new Date(payment.dueDate),
                amount: payment.amount,
                paid: payment.paid || false
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
