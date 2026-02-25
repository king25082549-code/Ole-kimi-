'use client'

import { TrendingUp, TrendingDown, Wallet, AlertCircle, Users, CheckCircle, Clock, CreditCard, PiggyBank, HelpCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { DashboardSummary, Customer } from '@/types'

interface DashboardProps {
  summary: DashboardSummary | null
  onViewCustomer: () => void
  loading?: boolean
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function getDaysUntilDue(dueDate: string): number {
  const today = new Date()
  const due = new Date(dueDate)
  const diffTime = due.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function Dashboard({ summary, onViewCustomer, loading }: DashboardProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">ไม่สามารถโหลดข้อมูลได้</p>
      </div>
    )
  }

  // สถิติการเงิน - ต้นทุนกับยอดขายสลับตำแหน่ง
  const stats = [
    {
      title: 'ต้นทุนรวม',
      value: formatCurrency(summary.totalCost),
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      title: 'ยอดขายรวม',
      value: formatCurrency(summary.totalSales),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'ลูกค้าชำระแล้ว',
      value: formatCurrency(summary.totalCollected),
      icon: Wallet,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'ยอดคงเหลือลูกค้าชำระ',
      value: formatCurrency(summary.totalRemaining),
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ]

  // สถิติลูกค้า - เปลี่ยนตามที่ขอ
  const customerStats = [
    {
      title: 'ยอดผ่อนบัตรเครดิตเหลือ',
      value: formatCurrency(summary.creditCardRemaining),
      icon: CreditCard,
      color: 'text-purple-600'
    },
    {
      title: 'กำไรขาดทุนปัจจุบัน',
      value: formatCurrency(summary.currentProfit),
      icon: PiggyBank,
      color: summary.currentProfit >= 0 ? 'text-green-600' : 'text-red-600'
    },
    {
      title: 'กำไรขาดทุนทั้งหมด',
      value: formatCurrency(summary.totalProfit),
      icon: TrendingUp,
      color: summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
    }
  ]

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* หัวข้อ */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900">แดชบอร์ด</h2>
      </div>

      {/* สถิติการเงิน */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-3 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs lg:text-sm font-medium text-gray-500 truncate">{stat.title}</p>
                    <p className="text-sm lg:text-2xl font-bold text-gray-900 mt-1 truncate">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} p-2 lg:p-3 rounded-full flex-shrink-0 ml-2`}>
                    <Icon className={`w-4 h-4 lg:w-6 lg:h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* สถิติลูกค้า */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
        {customerStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-3 lg:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="text-center lg:text-left">
                    <p className="text-xs lg:text-sm font-medium text-gray-500">{stat.title}</p>
                    <p className={`text-xl lg:text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                    {/* เพิ่มคำอธิบาย */}
                    {stat.title === 'กำไรขาดทุนปัจจุบัน' && (
                      <p className="text-xs text-gray-500 mt-1">
                        ยอดที่ลูกค้าจ่ายมาแล้ว - ต้นทุนทั้งหมด
                      </p>
                    )}
                    {stat.title === 'กำไรขาดทุนทั้งหมด' && (
                      <p className="text-xs text-gray-500 mt-1">
                        ราคาขายทั้งหมด - ต้นทุนทั้งหมด
                      </p>
                    )}
                  </div>
                  <div className="hidden lg:block bg-gray-100 p-3 rounded-full">
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* สถิติจำนวนลูกค้า */}
      <div className="grid grid-cols-3 gap-3 lg:gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3 lg:p-4">
            <div className="text-center">
              <p className="text-xs text-blue-600">กำลังผ่อน</p>
              <p className="text-xl lg:text-2xl font-bold text-blue-800">{summary.activeCustomers}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-3 lg:p-4">
            <div className="text-center">
              <p className="text-xs text-green-600">ปิดการขาย</p>
              <p className="text-xl lg:text-2xl font-bold text-green-800">{summary.completedCustomers}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-3 lg:p-4">
            <div className="text-center">
              <p className="text-xs text-red-600">เลยกำหนด</p>
              <p className="text-xl lg:text-2xl font-bold text-red-800">{summary.overdueCustomers}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* อธิบายการคำนวณกำไร */}
      <Card className="bg-gray-50">
        <CardHeader className="p-4 lg:p-6">
          <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
            <HelpCircle className="w-4 h-4 lg:w-5 lg:h-5 text-gray-500" />
            อธิบายการคำนวณกำไร
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 lg:p-6 pt-0 lg:pt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-700">📊 กำไรขาดทุนปัจจุบัน ({formatCurrency(summary.currentProfit)})</h4>
              <p className="text-gray-600">คำนวณจาก: ยอดที่ลูกค้าจ่ายมาแล้วทั้งหมด - ต้นทุนทั้งหมด</p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>• ยอดจ่ายมาแล้ว: {formatCurrency(summary.totalCollected)}</p>
                <p>• ต้นทุนทั้งหมด: {formatCurrency(summary.totalCost)}</p>
                <p>• ผลลัพธ์: {formatCurrency(summary.totalCollected)} - {formatCurrency(summary.totalCost)} = {formatCurrency(summary.currentProfit)}</p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-700">📈 กำไรขาดทุนทั้งหมด ({formatCurrency(summary.totalProfit)})</h4>
              <p className="text-gray-600">คำนวณจาก: ราคาขายทั้งหมด - ต้นทุนทั้งหมด</p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>• ราคาขายทั้งหมด: {formatCurrency(summary.totalSales)}</p>
                <p>• ต้นทุนทั้งหมด: {formatCurrency(summary.totalCost)}</p>
                <p>• ผลลัพธ์: {formatCurrency(summary.totalSales)} - {formatCurrency(summary.totalCost)} = {formatCurrency(summary.totalProfit)}</p>
              </div>
            </div>
          </div>
          {summary.currentProfit < 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                <strong>หมายเหตุ:</strong> กำไรปัจจุบันติดลบ {formatCurrency(Math.abs(summary.currentProfit))} 
                เพราะลูกค้ายังจ่ายเงินไม่ถึงต้นทุนที่ซื้อสินค้ามา 
                (ต้นทุน {formatCurrency(summary.totalCost)} แต่ได้รับมาแค่ {formatCurrency(summary.totalCollected)})
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* รายละเอียดลูกค้าแต่ละคน */}
      <Card>
        <CardHeader className="p-4 lg:p-6">
          <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
            <Users className="w-4 h-4 lg:w-5 lg:h-5 text-blue-500" />
            รายละเอียดลูกค้าทั้งหมด
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 lg:p-6 pt-0 lg:pt-0">
          <div className="space-y-3">
            {(!summary.allCustomers || summary.allCustomers.length === 0) ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm lg:text-base">ยังไม่มีข้อมูลลูกค้า</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {summary.allCustomers.map((customer) => {
                  const paidAmount = customer.installments
                    .filter(i => i.paid)
                    .reduce((sum, i) => sum + i.amount, 0) + customer.customerDownPayment;
                  const totalCost = customer.costPrice + customer.costBonus;
                  
                  return (
                    <div key={customer.id} className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {customer.name} 
                        <span className={`ml-2 text-xs px-2 py-1 rounded ${
                          customer.status === 'completed' ? 'bg-green-100 text-green-800' :
                          customer.status === 'overdue' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {customer.status === 'completed' ? 'ปิดการขาย' :
                           customer.status === 'overdue' ? 'เลยกำหนด' : 'กำลังผ่อน'}
                        </span>
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">ชำระแล้ว:</span>
                          <span className="font-medium text-blue-600">{formatCurrency(paidAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">ต้นทุนรวม:</span>
                          <span className="font-medium text-orange-600">{formatCurrency(totalCost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">คงเหลือชำระ:</span>
                          <span className={`font-medium ${
                            customer.remainingInstallment === 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(customer.remainingInstallment)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {customer.productType} {customer.productModel}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ลูกค้าที่จะถึงนัดชำระ */}
      <Card>
        <CardHeader className="p-4 lg:p-6">
          <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
            <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-orange-500" />
            ลูกค้าที่จะถึงนัดชำระ (7 วัน)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 lg:p-6 pt-0 lg:pt-0">
          {summary.upcomingPayments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-10 h-10 lg:w-12 lg:h-12 mx-auto mb-3 text-green-500" />
              <p className="text-sm lg:text-base">ไม่มีลูกค้าที่จะถึงนัดชำระในเร็วๆ นี้</p>
            </div>
          ) : (
            <div className="space-y-2 lg:space-y-3">
              {summary.upcomingPayments.map((customer) => {
                const nextPayment = customer.installments?.find(i => !i.paid)
                if (!nextPayment) return null
                
                const daysUntil = getDaysUntilDue(nextPayment.dueDate)
                const isOverdue = daysUntil < 0
                
                return (
                  <div
                    key={customer.id}
                    className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-3 lg:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-2 lg:gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-gray-900 text-sm lg:text-base">{customer.name}</h4>
                        <Badge 
                          variant={isOverdue ? 'destructive' : daysUntil <= 3 ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {isOverdue ? `เลยกำหนด ${Math.abs(daysUntil)} วัน` : `อีก ${daysUntil} วัน`}
                        </Badge>
                      </div>
                      <p className="text-xs lg:text-sm text-gray-500 mt-1 truncate">
                        {customer.productType} {customer.productModel} | 
                        นัดชำระ: {formatDate(nextPayment.dueDate)} | 
                        ยอด: {formatCurrency(nextPayment.amount)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onViewCustomer}
                      className="w-full lg:w-auto text-xs lg:text-sm"
                    >
                      ดูรายละเอียด
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
