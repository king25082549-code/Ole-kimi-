'use client'

import { useState } from 'react'
import { Plus, Search, Eye, Edit, Trash2, CheckCircle, CreditCard, Phone, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Customer } from '@/types'

interface CustomerListProps {
  customers: Customer[]
  onAddNew: () => void
  onEdit: (customer: Customer) => void
  onDelete: (id: string) => void
  onComplete: (id: string) => void
  onPayInstallment: (customerId: string, installmentId: string) => void
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

export function CustomerList({ customers, onAddNew, onEdit, onDelete, onComplete, onPayInstallment, loading }: CustomerListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'overdue'>('all')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.phone.includes(searchTerm) ||
                         c.productModel.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const handleView = (customer: Customer) => {
    setSelectedCustomer(customer)
    setViewDialogOpen(true)
  }

  const handlePay = (customerId: string, installmentId: string) => {
    onPayInstallment(customerId, installmentId)
    // อัพเดทข้อมูลใน dialog
    const updated = customers.find(c => c.id === customerId)
    if (updated) setSelectedCustomer(updated)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* หัวข้อและปุ่ม */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900">ลูกค้าซื้อผ่อน</h2>
        <Button onClick={onAddNew} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มลูกค้าใหม่
        </Button>
      </div>

      {/* ตัวกรองสถานะและค้นหา */}
      <div className="space-y-3">
        {/* ตัวกรองสถานะ - scroll แนวนอนบนมือถือ */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-0">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            ทั้งหมด ({customers.length})
          </Button>
          <Button
            variant={statusFilter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('active')}
          >
            กำลังผ่อน ({customers.filter(c => c.status === 'active').length})
          </Button>
          <Button
            variant={statusFilter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('completed')}
          >
            ปิดการขาย ({customers.filter(c => c.status === 'completed').length})
          </Button>
          <Button
            variant={statusFilter === 'overdue' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('overdue')}
          >
            เลยกำหนด ({customers.filter(c => c.status === 'overdue').length})
          </Button>
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
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">ไม่พบลูกค้า</h3>
          <p className="text-gray-500 mt-1">{searchTerm ? 'ลองค้นหาด้วยคำอื่น' : 'ยังไม่มีลูกค้า กด "เพิ่มลูกค้าใหม่" เพื่อเริ่มต้น'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">
          {filteredCustomers.map((customer) => {
            const nextPayment = customer.installments?.find(i => !i.paid)
            const daysUntil = nextPayment ? getDaysUntilDue(nextPayment.dueDate) : null
            const isOverdue = daysUntil !== null && daysUntil < 0
            
            return (
              <Card key={customer.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{customer.name}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{customer.phone}</span>
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={
                        customer.status === 'completed' ? 'secondary' :
                        isOverdue ? 'destructive' : 'default'
                      } 
                      className={`flex-shrink-0 ml-2 ${
                        customer.status === 'completed' ? 'bg-green-100 text-green-800' :
                        isOverdue ? 'bg-red-500 text-white' : ''
                      }`}
                    >
                      {customer.status === 'completed' ? 'ปิดการขาย' :
                       isOverdue ? 'เลยกำหนด' : 'กำลังผ่อน'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1.5 mb-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 flex-shrink-0">ราคาขาย:</span>
                      <span className="font-medium text-green-600">{formatCurrency(customer.sellingPrice)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 flex-shrink-0">ยอดผ่อนมาแล้ว:</span>
                      <span className="font-medium text-blue-600">
                        {formatCurrency(
                          (customer.installments?.filter(i => i.paid).reduce((sum, i) => sum + i.amount, 0) || 0) + 
                          customer.customerDownPayment
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 flex-shrink-0">เหลือลูกค้าต้องชำระ:</span>
                      <span className="font-medium text-orange-600">{formatCurrency(customer.remainingInstallment)}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleView(customer)}>
                      <Eye className="w-4 h-4 mr-1" />
                      ดู
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onEdit(customer)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onDelete(customer.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog ดูรายละเอียด */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0">
          <DialogHeader className="p-4 lg:p-6 border-b">
            <DialogTitle className="flex items-center justify-between text-base lg:text-lg">
              <span>รายละเอียดลูกค้า: {selectedCustomer?.name}</span>
              {selectedCustomer && (
                <Badge variant={selectedCustomer.status === 'completed' ? 'default' : 'secondary'}>
                  {selectedCustomer.status === 'completed' ? 'ปิดการขาย' : 'กำลังผ่อน'}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[calc(90vh-80px)]">
            {selectedCustomer && (
              <div className="p-4 lg:p-6 space-y-6">
                {/* ข้อมูลทั่วไป */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">เบอร์โทร</p>
                    <p className="font-medium">{selectedCustomer.phone}</p>
                  </div>
                  <div>
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
                      <p className="text-sm text-gray-500">ต้นทุนสินค้า</p>
                      <p className="font-medium">{formatCurrency(selectedCustomer.costPrice)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">ต้นทุนของแถม</p>
                      <p className="font-medium">{formatCurrency(selectedCustomer.costBonus)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">ราคาขาย</p>
                      <p className="font-medium text-green-600">{formatCurrency(selectedCustomer.sellingPrice)}</p>
                    </div>
                  </div>
                </div>

                {/* กำไร */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">สรุปการเงิน</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm text-purple-600">ยอดที่ชำระมาแล้วทั้งหมด</p>
                      <p className="text-xl font-bold text-purple-800">
                        {formatCurrency(
                          (selectedCustomer.installments?.filter(i => i.paid).reduce((sum, i) => sum + i.amount, 0) || 0) + 
                          selectedCustomer.customerDownPayment
                        )}
                      </p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="text-sm text-orange-600">ต้นทุนรวม (สินค้า + ของแถม)</p>
                      <p className="text-xl font-bold text-orange-800">
                        {formatCurrency(selectedCustomer.costPrice + selectedCustomer.costBonus)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-600">กำไรที่จะได้ทั้งหมด</p>
                      <p className="text-xl font-bold text-blue-800">{formatCurrency(selectedCustomer.totalProfit)}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-600">กำไรปัจจุบัน</p>
                      <p className={`text-xl font-bold ${selectedCustomer.currentProfit >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                        {formatCurrency(selectedCustomer.currentProfit)}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">สถานะ</p>
                      <p className="text-lg font-bold text-gray-800">
                        {selectedCustomer.currentProfit >= selectedCustomer.totalProfit ? '✓ ได้ทุนคืนแล้ว' : 'ยังไม่ได้ทุนคืน'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* บัตรเครดิต */}
                {selectedCustomer.creditCards && selectedCustomer.creditCards.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      บัตรเครดิตที่ใช้
                    </h4>
                    <div className="space-y-2">
                      {selectedCustomer.creditCards.map((card, idx) => (
                        <div key={card.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">บัตรที่ {idx + 1}</span>
                            <span className="text-sm text-gray-500">ยอดรูด: {formatCurrency(card.amount)}</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            ผ่อน {card.installments} เดือน งวดละ {formatCurrency(card.monthlyPayment)}
                          </p>
                          <p className="text-sm text-orange-600">
                            ค้างชำระบัตร: {formatCurrency(card.remainingAmount)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* งวดผ่อน */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">งวดผ่อนสินค้า ({selectedCustomer.installments?.length || 0} งวด)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedCustomer.installments?.map((inst) => {
                      const daysUntil = getDaysUntilDue(inst.dueDate)
                      const isOverdue = daysUntil < 0 && !inst.paid
                      
                      return (
                        <div 
                          key={inst.id} 
                          className={`p-3 rounded-lg border ${inst.paid ? 'bg-green-50 border-green-200' : isOverdue ? 'bg-red-50 border-red-200' : 'bg-gray-50'}`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">งวดที่ {inst.installmentNumber}</span>
                            <span className={inst.paid ? 'text-green-600' : isOverdue ? 'text-red-600' : 'text-gray-900'}>
                              {formatCurrency(inst.amount)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            ครบกำหนด: {formatDate(inst.dueDate)}
                            {!inst.paid && (
                              <span className={`ml-2 ${isOverdue ? 'text-red-600' : 'text-blue-600'}`}>
                                ({isOverdue ? `เลยกำหนด ${Math.abs(daysUntil)} วัน` : `อีก ${daysUntil} วัน`})
                              </span>
                            )}
                          </p>
                          {inst.paid ? (
                            <p className="text-sm text-green-600 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              ชำระแล้ว {inst.paidDate && `(${formatDate(inst.paidDate)})`}
                            </p>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-2 w-full"
                              onClick={() => handlePay(selectedCustomer.id, inst.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              บันทึกการชำระ
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* ปิดการขาย */}
                {selectedCustomer.status === 'active' && selectedCustomer.remainingInstallment === 0 && (
                  <div className="border-t pt-4">
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        onComplete(selectedCustomer.id)
                        setViewDialogOpen(false)
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      ย้ายไปปิดการขาย
                    </Button>
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
