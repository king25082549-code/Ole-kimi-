import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - ดึงข้อมูลสรุปสำหรับ Dashboard
export async function GET() {
  try {
    // ดึงข้อมูลลูกค้าทั้งหมด
    const customers = await prisma.customer.findMany({
      include: {
        installments: true,
        creditCards: {
          include: {
            payments: true
          }
        }
      }
    })
    
    // คำนวณสถิติ
    const activeCustomers = customers.filter(c => c.status === 'active')
    const completedCustomers = customers.filter(c => c.status === 'completed')
    
    // ยอดขายรวม (จากลูกค้าทั้งหมด)
    const totalSales = customers.reduce((sum, c) => sum + c.sellingPrice, 0)
    
    // ต้นทุนรวม (จากลูกค้าทั้งหมด)
    const totalCost = customers.reduce((sum, c) => sum + c.costPrice + c.costBonus, 0)
    
    // เงินที่เก็บได้แล้ว (ลูกค้าชำระแล้ว)
    const totalCollected = customers.reduce((sum, c) => {
      const paidInstallments = c.installments.filter(i => i.paid).reduce((s, i) => s + i.amount, 0)
      return sum + paidInstallments + c.customerDownPayment
    }, 0)
    
    // ยอดค้างชำระ (ลูกค้ายังไม่ชำระ)
    const totalRemaining = customers.reduce((sum, c) => sum + c.remainingInstallment, 0)
    
    // กำไรขาดทุนทั้งหมด
    const totalProfit = customers.reduce((sum, c) => sum + c.totalProfit, 0)
    
    // กำไรขาดทุนปัจจุบัน - คำนวณใหม่โดยตรง
    const currentProfit = customers.reduce((sum, c) => {
      const paidInstallments = c.installments.filter(i => i.paid).reduce((s, i) => s + i.amount, 0)
      const totalPaid = paidInstallments + c.customerDownPayment
      const totalCost = c.costPrice + c.costBonus
      return sum + (totalPaid - totalCost)
    }, 0)
    
    // ยอดผ่อนบัตรเครดิตค้างชำระ
    const creditCardRemaining = customers.reduce((sum, c) => {
      return sum + c.creditCards.reduce((cardSum, card) => cardSum + card.remainingAmount, 0)
    }, 0)
    
    // ลูกค้าที่จะถึงนัดชำระ (7 วัน) - รวมทั้ง active และ overdue ที่ยังมีงวดที่ต้องจ่าย
    const today = new Date()
    const customersWithPayments = customers.filter(c => 
      (c.status === 'active' || c.status === 'overdue') && 
      c.installments.some(i => !i.paid)
    )
    const upcomingPayments = customersWithPayments.filter(c => {
      const nextPayment = c.installments.find(i => !i.paid)
      if (!nextPayment) return false
      const dueDate = new Date(nextPayment.dueDate)
      const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return diffDays <= 7 && diffDays >= -7
    }).sort((a, b) => {
      const aNext = a.installments.find(i => !i.paid)
      const bNext = b.installments.find(i => !i.paid)
      if (!aNext || !bNext) return 0
      return new Date(aNext.dueDate).getTime() - new Date(bNext.dueDate).getTime()
    })
    
    return NextResponse.json({
      totalSales,
      totalCost,
      totalCollected,
      totalRemaining,
      totalProfit,
      currentProfit,
      creditCardRemaining,
      upcomingPayments,
      activeCustomers: activeCustomers.length,
      completedCustomers: completedCustomers.length,
      overdueCustomers: customers.filter(c => c.status === 'overdue').length,
      allCustomers: customers.map(c => ({
        id: c.id,
        name: c.name,
        status: c.status,
        productType: c.productType,
        productModel: c.productModel,
        sellingPrice: c.sellingPrice,
        costPrice: c.costPrice,
        costBonus: c.costBonus,
        customerDownPayment: c.customerDownPayment,
        remainingInstallment: c.remainingInstallment,
        currentProfit: c.currentProfit,
        installments: c.installments
      }))
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
