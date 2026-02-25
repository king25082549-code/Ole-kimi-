import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - ดึงข้อมูลลูกค้ารายบุคคล
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const customer = await prisma.customer.findUnique({
      where: { id },
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
      }
    })
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    )
  }
}

// PUT - อัพเดทข้อมูลลูกค้า
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // คำนวณกำไรทั้งหมด
    const totalProfit = (body.sellingPrice || 0) - (body.costPrice || 0) - (body.costBonus || 0)
    
    // คำนวณกำไรปัจจุบัน (เงินที่เก็บได้แล้ว)
    const paidInstallments = body.installments?.filter((i: any) => i.paid).reduce((sum: number, i: any) => sum + i.amount, 0) || 0
    const currentProfit = Math.min(paidInstallments + (body.customerDownPayment || 0), totalProfit)
    
    // ลบ installments และ creditCards เก่าก่อน แล้วสร้างใหม่
    await prisma.productInstallment.deleteMany({
      where: { customerId: id }
    })
    
    await prisma.cardPayment.deleteMany({
      where: {
        creditCardUsage: {
          customerId: id
        }
      }
    })
    
    await prisma.creditCardUsage.deleteMany({
      where: { customerId: id }
    })
    
    const customer = await prisma.customer.update({
      where: { id },
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
        currentProfit: currentProfit,
        status: body.status || 'active',
        completedAt: body.completedAt ? new Date(body.completedAt) : null,
        installments: {
          create: body.installments?.map((inst: any) => ({
            installmentNumber: inst.installmentNumber,
            dueDate: new Date(inst.dueDate),
            amount: inst.amount,
            paid: inst.paid || false,
            paidDate: inst.paidDate ? new Date(inst.paidDate) : null
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
                paid: payment.paid || false,
                paidDate: payment.paidDate ? new Date(payment.paidDate) : null
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
    
    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    )
  }
}

// DELETE - ลบลูกค้า
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await prisma.customer.delete({
      where: { id }
    })
    
    return NextResponse.json({ message: 'Customer deleted successfully' })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    )
  }
}
