'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, X, Calculator, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Customer, ProductType, CreditCardUsage, ProductInstallment, CardPayment } from '@/types'

interface CustomerFormProps {
  creditCards: { id: string; name: string }[]
  onSave: (customer: Partial<Customer>) => void
  onCancel: () => void
  editingCustomer?: Customer | null
}

const productTypes: ProductType[] = ['iPad', 'iPhone', 'MacBook', 'Notebook', 'อื่นๆ']

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export function CustomerForm({ creditCards, onSave, onCancel, editingCustomer }: CustomerFormProps) {
  const isEditing = !!editingCustomer
  
  // ข้อมูลลูกค้า
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  
  // ข้อมูลสินค้า
  const [productType, setProductType] = useState<ProductType>('iPhone')
  const [productTypeOther, setProductTypeOther] = useState('')
  const [productModel, setProductModel] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [costBonus, setCostBonus] = useState('')
  const [downPaymentForPurchase, setDownPaymentForPurchase] = useState('')
  
  // บัตรเครดิต
  const [cardUsages, setCardUsages] = useState<CreditCardUsage[]>([])
  
  // ราคาขาย
  const [sellingPrice, setSellingPrice] = useState('')
  const [customerDownPayment, setCustomerDownPayment] = useState('')
  const [downPaymentOption, setDownPaymentOption] = useState<'full' | 'installment'>('full')
  const [downPaymentMonths, setDownPaymentMonths] = useState(1)
  
  // การผ่อน
  const [installmentMonths, setInstallmentMonths] = useState('')
  const [paymentDueDate, setPaymentDueDate] = useState('')
  const [installments, setInstallments] = useState<ProductInstallment[]>([])

  // โหลดข้อมูลเมื่อแก้ไข
  useEffect(() => {
    if (editingCustomer) {
      setName(editingCustomer.name)
      setPhone(editingCustomer.phone)
      setAddress(editingCustomer.address || '')
      setProductType(editingCustomer.productType)
      setProductTypeOther(editingCustomer.productTypeOther || '')
      setProductModel(editingCustomer.productModel)
      setSerialNumber(editingCustomer.serialNumber || '')
      setCostPrice(editingCustomer.costPrice.toString())
      setCostBonus(editingCustomer.costBonus.toString())
      setDownPaymentForPurchase(editingCustomer.downPaymentForPurchase.toString())
      setSellingPrice(editingCustomer.sellingPrice.toString())
      setCustomerDownPayment(editingCustomer.customerDownPayment.toString())
      setDownPaymentOption(editingCustomer.downPaymentInstallment ? 'installment' : 'full')
      setDownPaymentMonths(editingCustomer.downPaymentMonths || 1)
      setInstallmentMonths(editingCustomer.installmentMonths.toString())
      setPaymentDueDate(editingCustomer.paymentDueDate.toString())
      setInstallments(editingCustomer.installments || [])
      setCardUsages(editingCustomer.creditCards || [])
    }
  }, [editingCustomer])

  // เพิ่มบัตรเครดิต
  const addCardUsage = () => {
    setCardUsages([...cardUsages, {
      id: generateId(),
      creditCardId: '',
      customerId: editingCustomer?.id || '',
      amount: 0,
      installments: 0,
      monthlyPayment: 0,
      remainingAmount: 0,
      payments: []
    }])
  }

  // อัพเดทบัตรเครดิต
  const updateCardUsage = (index: number, field: keyof CreditCardUsage, value: any) => {
    const newUsages = [...cardUsages]
    newUsages[index] = { ...newUsages[index], [field]: value }
    
    // คำนวณยอดผ่อนต่อเดือน
    if (field === 'amount' || field === 'installments') {
      const amount = field === 'amount' ? value : newUsages[index].amount
      const months = field === 'installments' ? value : newUsages[index].installments
      if (months > 0) {
        newUsages[index].monthlyPayment = Math.ceil(amount / months)
        newUsages[index].remainingAmount = amount
      }
    }
    
    setCardUsages(newUsages)
  }

  // ลบบัตรเครดิต
  const removeCardUsage = (index: number) => {
    setCardUsages(cardUsages.filter((_, i) => i !== index))
  }

  // สร้างงวดผ่อนบัตรเครดิต
  const generateCardPayments = (usage: CreditCardUsage): CardPayment[] => {
    const payments: CardPayment[] = []
    const today = new Date()
    
    for (let i = 0; i < usage.installments; i++) {
      const dueDate = new Date(today)
      dueDate.setMonth(dueDate.getMonth() + i + 1)
      
      payments.push({
        id: generateId(),
        creditCardUsageId: usage.id,
        installmentNumber: i + 1,
        dueDate: dueDate.toISOString().split('T')[0],
        amount: usage.monthlyPayment,
        paid: false
      })
    }
    
    return payments
  }

  // คำนวณงวดผ่อน
  const calculateInstallments = () => {
    const sellPrice = parseFloat(sellingPrice) || 0
    const downPay = parseFloat(customerDownPayment) || 0
    const months = parseInt(installmentMonths) || 0
    const dueDay = parseInt(paymentDueDate) || 1
    
    if (sellPrice <= 0 || months <= 0) return
    
    const remaining = sellPrice - downPay
    const monthly = Math.ceil(remaining / months)
    
    const newInstallments: ProductInstallment[] = []
    const today = new Date()
    
    for (let i = 0; i < months; i++) {
      const dueDate = new Date(today.getFullYear(), today.getMonth() + i + 1, dueDay)
      
      newInstallments.push({
        id: generateId(),
        customerId: editingCustomer?.id || '',
        installmentNumber: i + 1,
        dueDate: dueDate.toISOString().split('T')[0],
        amount: monthly,
        paid: false
      })
    }
    
    setInstallments(newInstallments)
  }

  // อัพเดทงวดผ่อน
  const updateInstallment = (index: number, dueDate: string) => {
    const newInstallments = [...installments]
    newInstallments[index] = { ...newInstallments[index], dueDate }
    setInstallments(newInstallments)
  }

  // คำนวณกำไร
  const calculateProfit = () => {
    const sell = parseFloat(sellingPrice) || 0
    const cost = parseFloat(costPrice) || 0
    const bonus = parseFloat(costBonus) || 0
    return sell - cost - bonus
  }

  // บันทึกข้อมูล
  const handleSave = () => {
    // คำนวณยอดผ่อนดาวน์
    const downPay = parseFloat(customerDownPayment) || 0
    let calculatedDownPaymentMonths = 0
    let downPaymentMonthly = 0
    
    if (downPaymentOption === 'installment' && downPay > 0) {
      calculatedDownPaymentMonths = downPaymentMonths
      downPaymentMonthly = Math.ceil(downPay / downPaymentMonths)
    }
    
    // สร้างบัตรเครดิตพร้อมงวดผ่อน
    const finalCardUsages = cardUsages.map(usage => ({
      ...usage,
      payments: generateCardPayments(usage)
    }))
    
    // คำนวณกำไร
    const totalProfit = calculateProfit()
    const paidAmount = installments.filter(i => i.paid).reduce((sum, i) => sum + i.amount, 0)
    const currentProfit = Math.min(paidAmount + downPay, totalProfit)
    
    const customerData: Partial<Customer> = {
      name,
      phone,
      address,
      productType,
      productTypeOther: productType === 'อื่นๆ' ? productTypeOther : undefined,
      productModel,
      serialNumber,
      costPrice: parseFloat(costPrice) || 0,
      costBonus: parseFloat(costBonus) || 0,
      downPaymentForPurchase: parseFloat(downPaymentForPurchase) || 0,
      creditCards: finalCardUsages,
      sellingPrice: parseFloat(sellingPrice) || 0,
      customerDownPayment: downPay,
      downPaymentInstallment: downPaymentOption === 'installment',
      downPaymentMonths: downPaymentOption === 'installment' ? calculatedDownPaymentMonths : undefined,
      downPaymentMonthly: downPaymentOption === 'installment' ? downPaymentMonthly : undefined,
      remainingInstallment: installments.filter(i => !i.paid).reduce((sum, i) => sum + i.amount, 0),
      installmentMonths: parseInt(installmentMonths) || 0,
      monthlyPayment: installments.length > 0 ? installments[0].amount : 0,
      paymentDueDate: parseInt(paymentDueDate) || 1,
      installments,
      totalProfit,
      currentProfit,
      status: 'active' as const
    }
    
    if (editingCustomer) {
      customerData.id = editingCustomer.id
    }
    
    onSave(customerData)
  }

  // ตรวจสอบความถูกต้อง - แก้ไขให้บันทึกได้แม้ข้อมูลไม่ครบ
  const isValid = name && phone && productModel && sellingPrice

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* หัวข้อ */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onCancel} className="flex-shrink-0">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
          {isEditing ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มลูกค้าซื้อผ่อน'}
        </h2>
      </div>

      <ScrollArea className="h-[calc(100vh-140px)]">
        <div className="space-y-4 pb-20">
          {/* ข้อมูลลูกค้า */}
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base">ข้อมูลลูกค้า</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">ชื่อ <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ชื่อลูกค้า"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">เบอร์โทร <span className="text-red-500">*</span></Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="เบอร์โทรศัพท์"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">ที่อยู่</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="ที่อยู่ลูกค้า"
                />
              </div>
            </CardContent>
          </Card>

          {/* ข้อมูลสินค้า */}
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base">ข้อมูลสินค้า</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ประเภทสินค้า</Label>
                  <Select value={productType} onValueChange={(v) => setProductType(v as ProductType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {productTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {productType === 'อื่นๆ' && (
                  <div className="space-y-2">
                    <Label>ระบุประเภท</Label>
                    <Input
                      value={productTypeOther}
                      onChange={(e) => setProductTypeOther(e.target.value)}
                      placeholder="ระบุประเภทสินค้า"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="model">ชื่อรุ่น <span className="text-red-500">*</span></Label>
                  <Input
                    id="model"
                    value={productModel}
                    onChange={(e) => setProductModel(e.target.value)}
                    placeholder="เช่น iPhone 15 Pro Max 256GB"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serial">เลขประจำเครื่อง (IMEI/SN)</Label>
                  <Input
                    id="serial"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="เลขประจำเครื่อง"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="costPrice">ต้นทุนสินค้า (บาท)</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="ราคาซื้อสินค้า"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costBonus">ต้นทุนของแถม (บาท)</Label>
                  <Input
                    id="costBonus"
                    type="number"
                    value={costBonus}
                    onChange={(e) => setCostBonus(e.target.value)}
                    placeholder="ราคาของแถม"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="downPurchase">วางดาวน์ซื้อสินค้า (บาท)</Label>
                  <Input
                    id="downPurchase"
                    type="number"
                    value={downPaymentForPurchase}
                    onChange={(e) => setDownPaymentForPurchase(e.target.value)}
                    placeholder="ยอดวางดาวน์ตอนซื้อสินค้า"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* บัตรเครดิต */}
          <Card>
            <CardHeader className="p-4 flex flex-row items-center justify-between">
              <CardTitle className="text-base">บัตรเครดิตที่ใช้</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addCardUsage}>
                <Plus className="w-4 h-4 mr-1" />
                เพิ่ม
              </Button>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              {cardUsages.length === 0 ? (
                <p className="text-gray-500 text-center py-4 text-sm">ยังไม่มีบัตรเครดิต กด "เพิ่มบัตร" เพื่อเพิ่ม</p>
              ) : (
                cardUsages.map((usage, index) => (
                  <div key={usage.id} className="p-3 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">บัตรที่ {index + 1}</Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCardUsage(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="space-y-2">
                        <Label className="text-sm">เลือกบัตร</Label>
                        <Select
                          value={usage.creditCardId}
                          onValueChange={(v) => updateCardUsage(index, 'creditCardId', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกบัตร" />
                          </SelectTrigger>
                          <SelectContent>
                            {creditCards.map(card => (
                              <SelectItem key={card.id} value={card.id}>{card.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">ยอดรูดบัตร (บาท)</Label>
                        <Input
                          type="number"
                          value={usage.amount || ''}
                          onChange={(e) => updateCardUsage(index, 'amount', parseFloat(e.target.value) || 0)}
                          placeholder="ยอดรูด"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">ผ่อน (เดือน)</Label>
                        <Input
                          type="number"
                          value={usage.installments || ''}
                          onChange={(e) => updateCardUsage(index, 'installments', parseInt(e.target.value) || 0)}
                          placeholder="จำนวนเดือน"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">ผ่อนเดือนละ (บาท)</Label>
                        <Input
                          type="number"
                          value={usage.monthlyPayment || ''}
                          disabled
                          className="bg-gray-100"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* ราคาขาย */}
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base">ราคาขาย</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sellingPrice">ราคาขายสินค้า (บาท) <span className="text-red-500">*</span></Label>
                  <Input
                    id="sellingPrice"
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="ราคาขายให้ลูกค้า"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerDown">ลูกค้าวางดาวน์ (บาท)</Label>
                  <Input
                    id="customerDown"
                    type="number"
                    value={customerDownPayment}
                    onChange={(e) => setCustomerDownPayment(e.target.value)}
                    placeholder="ยอดดาวน์จากลูกค้า"
                  />
                </div>
              </div>
              
              {parseFloat(customerDownPayment) > 0 && (
                <div className="space-y-2">
                  <Label>ตัวเลือกการจ่ายดาวน์</Label>
                  <RadioGroup
                    value={downPaymentOption}
                    onValueChange={(v) => setDownPaymentOption(v as 'full' | 'installment')}
                    className="flex flex-col sm:flex-row gap-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="full" id="full" />
                      <Label htmlFor="full" className="text-sm">จ่ายเต็ม</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="installment" id="installment" />
                      <Label htmlFor="installment" className="text-sm">ผ่อนดาวน์ (สูงสุด 3 งวด)</Label>
                    </div>
                  </RadioGroup>
                  
                  {downPaymentOption === 'installment' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="downPaymentMonths">จำนวนงวดผ่อนดาวน์</Label>
                          <Select
                            value={downPaymentMonths.toString()}
                            onValueChange={(v) => setDownPaymentMonths(parseInt(v))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 งวด</SelectItem>
                              <SelectItem value="2">2 งวด</SelectItem>
                              <SelectItem value="3">3 งวด</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>งวดละ (บาท)</Label>
                          <Input
                            type="number"
                            value={Math.ceil(parseFloat(customerDownPayment) / downPaymentMonths)}
                            disabled
                            className="bg-gray-100"
                          />
                        </div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700">
                          ผ่อนดาวน์ {downPaymentMonths} งวด
                          {' '}งวดละ {formatCurrency(Math.ceil(parseFloat(customerDownPayment) / downPaymentMonths))}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* การผ่อน */}
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base">การผ่อนสินค้า</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="installmentMonths">ผ่อนกี่เดือน <span className="text-red-500">*</span></Label>
                  <Input
                    id="installmentMonths"
                    type="number"
                    value={installmentMonths}
                    onChange={(e) => setInstallmentMonths(e.target.value)}
                    placeholder="จำนวนเดือน"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">นัดชำระวันที่ <span className="text-red-500">*</span></Label>
                  <Input
                    id="dueDate"
                    type="number"
                    min="1"
                    max="31"
                    value={paymentDueDate}
                    onChange={(e) => setPaymentDueDate(e.target.value)}
                    placeholder="วันที่ของทุกเดือน"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={calculateInstallments}
                    disabled={!sellingPrice || !installmentMonths}
                    className="w-full"
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    คำนวณงวด
                  </Button>
                </div>
              </div>
              
              {installments.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">งวดผ่อน ({installments.length} งวด)</Label>
                    <Badge variant="secondary">
                      เหลือชำระ {formatCurrency(installments.reduce((sum, i) => sum + i.amount, 0))}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {installments.map((inst, index) => (
                      <div key={inst.id} className="p-3 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">งวดที่ {inst.installmentNumber}</Badge>
                          <span className="font-semibold text-sm">{formatCurrency(inst.amount)}</span>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">วันครบกำหนด</Label>
                          <Input
                            type="date"
                            value={inst.dueDate}
                            onChange={(e) => updateInstallment(index, e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* สรุป */}
          {installments.length > 0 && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <h3 className="font-semibold text-green-800 mb-3">สรุปการขาย</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">ราคาขาย</p>
                    <p className="font-semibold text-lg">{formatCurrency(parseFloat(sellingPrice) || 0)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">ต้นทุนรวม</p>
                    <p className="font-semibold text-lg">
                      {formatCurrency((parseFloat(costPrice) || 0) + (parseFloat(costBonus) || 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">กำไรที่จะได้</p>
                    <p className="font-semibold text-lg text-green-700">
                      {formatCurrency(calculateProfit())}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">ผ่อนเดือนละ</p>
                    <p className="font-semibold text-lg">
                      {installments.length > 0 ? formatCurrency(installments[0].amount) : '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ปุ่มบันทึก */}
          <div className="flex gap-3 sticky bottom-0 bg-gray-50 p-4 -mx-4 border-t">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              <X className="w-4 h-4 mr-2" />
              ยกเลิก
            </Button>
            <Button onClick={handleSave} disabled={!isValid} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              {isEditing ? 'บันทึกการแก้ไข' : 'บันทึก'}
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
