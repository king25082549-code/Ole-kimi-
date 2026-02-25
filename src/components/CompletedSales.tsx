'use client'

import { useState } from 'react'
import { Search, CheckCircle, Calendar, User, Phone, Package } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Customer } from '@/types'

interface CompletedSalesProps {
  customers: Customer[]
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
    month: 'long',
    day: 'numeric'
  })
}

export function CompletedSales({ customers, loading }: CompletedSalesProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const completedCustomers = customers.filter(c => c.status === 'completed')
  
  const filteredCustomers = completedCustomers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.productModel.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // คำนวณสถิติ
  const totalSales = completedCustomers.reduce((sum, c) => sum + c.sellingPrice, 0)
  const totalProfit = completedCustomers.reduce((sum, c) => sum + (c.sellingPrice - c.costPrice - c.costBonus), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* หัวข้อ */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900">ปิดการขายแล้ว</h2>
      </div>

      {/* สถิติ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">ปิดการขายทั้งหมด</p>
                <p className="text-2xl lg:text-3xl font-bold text-green-900">{completedCustomers.length} ราย</p>
              </div>
              <div className="bg-green-200 p-2 lg:p-3 rounded-full">
                <CheckCircle className="w-5 h-5 lg:w-6 lg:h-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">ยอดขายรวม</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900">{formatCurrency(totalSales)}</p>
              </div>
              <div className="bg-blue-100 p-2 lg:p-3 rounded-full">
                <Calendar className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">กำไรรวม</p>
                <p className="text-xl lg:text-2xl font-bold text-green-600">{formatCurrency(totalProfit)}</p>
              </div>
              <div className="bg-green-100 p-2 lg:p-3 rounded-full">
                <CheckCircle className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ค้นหา */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="ค้นหาลูกค้า ชื่อ เบอร์โทร หรือรุ่น..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* รายการ */}
      {filteredCustomers.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">
            {searchTerm ? 'ไม่พบรายการ' : 'ยังไม่มีรายการปิดการขาย'}
          </h3>
          <p className="text-gray-500 mt-1">
            {searchTerm ? 'ลองค้นหาด้วยคำอื่น' : 'รายการที่ผ่อนครบจะถูกย้ายมาที่นี่อัตโนมัติ'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => (
            <Card 
              key={customer.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedCustomer(customer)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
                      <User className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{customer.name}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{customer.phone}</span>
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-600 flex-shrink-0 ml-2">
                    ปิดการขาย
                  </Badge>
                </div>
                
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{customer.productType} {customer.productModel}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">ราคาขาย:</span>
                    <span className="font-medium text-green-600">{formatCurrency(customer.sellingPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">กำไร:</span>
                    <span className="font-medium text-blue-600">
                      {formatCurrency(customer.sellingPrice - customer.costPrice - customer.costBonus)}
                    </span>
                  </div>
                  {customer.completedAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">ปิดการขาย:</span>
                      <span className="text-sm">{formatDate(customer.completedAt)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog ดูรายละเอียด */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0">
          <DialogHeader className="p-4 lg:p-6 border-b">
            <DialogTitle className="flex items-center justify-between">
              <span>รายละเอียดการปิดการขาย</span>
              <Badge className="bg-green-600">ปิดการขาย</Badge>
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-80px)]">
            {selectedCustomer && (
              <div className="p-4 lg:p-6 space-y-6">
                {/* ข้อมูลลูกค้า */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">ชื่อลูกค้า</p>
                    <p className="font-medium">{selectedCustomer.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">เบอร์โทร</p>
                    <p className="font-medium">{selectedCustomer.phone}</p>
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <p className="text-sm text-gray-500">ที่อยู่</p>
                    <p className="font-medium">{selectedCustomer.address || '-'}</p>
                  </div>
                </div>

                {/* ข้อมูลสินค้า */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">ข้อมูลสินค้า</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">สินค้า</p>
                      <p className="font-medium">{selectedCustomer.productType} {selectedCustomer.productModel}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">เลขเครื่อง</p>
                      <p className="font-medium">{selectedCustomer.serialNumber || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">ต้นทุน</p>
                      <p className="font-medium">{formatCurrency(selectedCustomer.costPrice + selectedCustomer.costBonus)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">ราคาขาย</p>
                      <p className="font-medium text-green-600">{formatCurrency(selectedCustomer.sellingPrice)}</p>
                    </div>
                  </div>
                </div>

                {/* สรุปการเงิน */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">สรุปการเงิน</h4>
                  <div className="bg-green-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ราคาขาย</span>
                      <span className="font-medium">{formatCurrency(selectedCustomer.sellingPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ต้นทุน</span>
                      <span className="font-medium">{formatCurrency(selectedCustomer.costPrice + selectedCustomer.costBonus)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">วางดาวน์</span>
                      <span className="font-medium">{formatCurrency(selectedCustomer.customerDownPayment)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between text-lg">
                      <span className="font-semibold text-green-800">กำไร</span>
                      <span className="font-bold text-green-800">
                        {formatCurrency(selectedCustomer.sellingPrice - selectedCustomer.costPrice - selectedCustomer.costBonus)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ประวัติการผ่อน */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">ประวัติการผ่อน ({selectedCustomer.installments?.length || 0} งวด)</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {selectedCustomer.installments?.map((inst) => (
                      <div 
                        key={inst.id} 
                        className="p-2 bg-green-50 border border-green-200 rounded text-center"
                      >
                        <p className="text-xs text-gray-500">งวดที่ {inst.installmentNumber}</p>
                        <p className="font-medium text-green-700 text-sm">{formatCurrency(inst.amount)}</p>
                        <p className="text-xs text-green-600">✓ ชำระแล้ว</p>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedCustomer.completedAt && (
                  <div className="border-t pt-4 text-center">
                    <p className="text-sm text-gray-500">ปิดการขายวันที่</p>
                    <p className="font-medium text-lg">{formatDate(selectedCustomer.completedAt)}</p>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
