'use client'

import { useState } from 'react'
import { Plus, Trash2, Edit, Save, X, CreditCard as CreditCardIcon, AlertCircle, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { CreditCard } from '@/types'

interface CreditCardManagerProps {
  creditCards: CreditCard[]
  onAdd: (card: Partial<CreditCard>) => void
  onUpdate: (id: string, updates: Partial<CreditCard>) => void
  onDelete: (id: string) => void
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

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

export function CreditCardManager({ creditCards, onAdd, onUpdate, onDelete, loading }: CreditCardManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null)
  const [viewCard, setViewCard] = useState<CreditCard | null>(null)
  
  // Form states
  const [name, setName] = useState('')
  const [limit, setLimit] = useState('')
  const [dueDate, setDueDate] = useState('')

  const resetForm = () => {
    setName('')
    setLimit('')
    setDueDate('')
  }

  const handleSubmit = () => {
    if (!name || !dueDate) return
    
    onAdd({
      name,
      limit: parseFloat(limit) || 0,
      dueDate: parseInt(dueDate)
    })
    
    resetForm()
    setIsAdding(false)
  }

  const handleUpdate = () => {
    if (!editingCard) return
    
    onUpdate(editingCard.id, {
      name: editingCard.name,
      limit: editingCard.limit,
      dueDate: editingCard.dueDate
    })
    
    setEditingCard(null)
  }

  // ตรวจสอบบัตรที่ใกล้ครบกำหนด
  const getUpcomingCards = () => {
    const today = new Date()
    const currentDay = today.getDate()
    
    return creditCards.filter(card => {
      const daysUntil = card.dueDate - currentDay
      return daysUntil >= 0 && daysUntil <= 3
    })
  }

  const upcomingCards = getUpcomingCards()

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
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900">บัตรเครดิต</h2>
        <Button onClick={() => setIsAdding(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มบัตรเครดิต
        </Button>
      </div>

      {/* แจ้งเตือนบัตรใกล้ครบกำหนด */}
      {upcomingCards.length > 0 && (
        <Card className="bg-orange-50 border-orange-200">
          <CardHeader className="p-4">
            <CardTitle className="flex items-center gap-2 text-orange-800 text-base">
              <AlertCircle className="w-5 h-5" />
              บัตรเครดิตใกล้ครบกำหนดชำระ
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-2">
              {upcomingCards.map(card => {
                const today = new Date()
                const daysUntil = card.dueDate - today.getDate()
                
                return (
                  <div key={card.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div>
                      <p className="font-medium text-orange-900">{card.name}</p>
                      <p className="text-sm text-orange-700">
                        ครบกำหนดวันที่ {card.dueDate} ของทุกเดือน
                      </p>
                    </div>
                    <Badge variant={daysUntil === 0 ? 'destructive' : 'default'}>
                      {daysUntil === 0 ? 'วันนี้' : `อีก ${daysUntil} วัน`}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ฟอร์มเพิ่มบัตร */}
      {isAdding && (
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-base">เพิ่มบัตรเครดิตใหม่</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cardName">ชื่อบัตร <span className="text-red-500">*</span></Label>
                <Input
                  id="cardName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น บัตรกรุงศรี"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardLimit">วงเงินบัตร (บาท)</Label>
                <Input
                  id="cardLimit"
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  placeholder="วงเงินบัตร"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardDueDate">วันครบกำหนดชำระ <span className="text-red-500">*</span></Label>
                <Input
                  id="cardDueDate"
                  type="number"
                  min="1"
                  max="31"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  placeholder="วันที่ของทุกเดือน"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setIsAdding(false); resetForm(); }}>
                <X className="w-4 h-4 mr-2" />
                ยกเลิก
              </Button>
              <Button onClick={handleSubmit} disabled={!name || !dueDate}>
                <Save className="w-4 h-4 mr-2" />
                บันทึก
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* รายการบัตร */}
      {creditCards.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCardIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">ยังไม่มีบัตรเครดิต</h3>
          <p className="text-gray-500 mt-1">กด "เพิ่มบัตรเครดิต" เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {creditCards.map((card) => {
            const today = new Date()
            const daysUntil = card.dueDate - today.getDate()
            const isUpcoming = daysUntil >= 0 && daysUntil <= 3
            
            // นับจำนวนลูกค้าที่ใช้บัตรนี้
            const customerCount = card.usages?.length || 0
            
            return (
              <Card key={card.id} className={`hover:shadow-lg transition-shadow ${isUpcoming ? 'border-orange-300' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                        <CreditCardIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{card.name}</h3>
                        <p className="text-sm text-gray-500 truncate">
                          วงเงิน: {formatCurrency(card.limit)}
                        </p>
                      </div>
                    </div>
                    {isUpcoming && (
                      <Badge variant="destructive" className="flex-shrink-0 ml-2">
                        {daysUntil === 0 ? 'วันนี้' : `อีก ${daysUntil} วัน`}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1.5 mb-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">ครบกำหนด:</span>
                      <span className="font-medium">วันที่ {card.dueDate}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">การใช้งาน:</span>
                      <span className="font-medium">{customerCount} รายการ</span>
                    </div>
                    {customerCount > 0 && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">ผ่อนให้ลูกค้า:</span>
                      </div>
                    )}
                    {card.usages && card.usages.slice(0, 2).map((usage, idx) => (
                      <div key={idx} className="text-xs text-gray-500 pl-6">
                        • {usage.customer?.name} ({usage.customer?.productModel})
                      </div>
                    ))}
                    {customerCount > 2 && (
                      <div className="text-xs text-gray-400 pl-6">
                        และอีก {customerCount - 2} ราย
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setViewCard(card)}
                    >
                      ดู
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditingCard(card)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onDelete(card.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog แก้ไข */}
      <Dialog open={!!editingCard} onOpenChange={() => setEditingCard(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขบัตรเครดิต</DialogTitle>
          </DialogHeader>
          {editingCard && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>ชื่อบัตร</Label>
                <Input
                  value={editingCard.name}
                  onChange={(e) => setEditingCard({ ...editingCard, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>วงเงินบัตร (บาท)</Label>
                <Input
                  type="number"
                  value={editingCard.limit}
                  onChange={(e) => setEditingCard({ ...editingCard, limit: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>วันครบกำหนดชำระ</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={editingCard.dueDate}
                  onChange={(e) => setEditingCard({ ...editingCard, dueDate: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditingCard(null)}>
                  ยกเลิก
                </Button>
                <Button onClick={handleUpdate}>
                  <Save className="w-4 h-4 mr-2" />
                  บันทึก
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog ดูรายละเอียด */}
      <Dialog open={!!viewCard} onOpenChange={() => setViewCard(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0">
          <DialogHeader className="p-4 lg:p-6 border-b">
            <DialogTitle>รายละเอียดบัตร: {viewCard?.name}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-80px)]">
            {viewCard && (
              <div className="p-4 lg:p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">วงเงินบัตร</p>
                    <p className="font-medium">{formatCurrency(viewCard.limit)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">วันครบกำหนดชำระ</p>
                    <p className="font-medium">วันที่ {viewCard.dueDate} ของทุกเดือน</p>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    ผ่อนให้ลูกค้า ({viewCard.usages?.length || 0} ราย)
                  </h4>
                  {(!viewCard.usages || viewCard.usages.length === 0) ? (
                    <p className="text-gray-500 text-center py-4">ยังไม่มีประวัติการใช้งาน</p>
                  ) : (
                    <div className="space-y-2">
                      {viewCard.usages.map((usage, idx) => (
                        <div key={usage.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-medium">{usage.customer?.name}</span>
                              <p className="text-sm text-gray-500">{usage.customer?.productType} {usage.customer?.productModel}</p>
                            </div>
                            <Badge variant={usage.customer?.status === 'completed' ? 'default' : 'secondary'}>
                              {usage.customer?.status === 'completed' ? 'ปิดการขาย' : 'กำลังผ่อน'}
                            </Badge>
                          </div>
                          <div className="mt-2 text-sm">
                            <p className="text-gray-600">ยอดรูด: {formatCurrency(usage.amount)}</p>
                            <p className="text-gray-600">ผ่อน {usage.installments} เดือน งวดละ {formatCurrency(usage.monthlyPayment)}</p>
                            <p className="text-orange-600">ค้างชำระ: {formatCurrency(usage.remainingAmount)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
