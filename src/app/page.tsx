'use client'

import { useState, useEffect, useCallback } from 'react'
import { Navigation } from '@/components/Navigation'
import { Dashboard } from '@/components/Dashboard'
import { CustomerList } from '@/components/CustomerList'
import { CustomerForm } from '@/components/CustomerForm'
import { CreditCardManager } from '@/components/CreditCardManager'
import { CompletedSales } from '@/components/CompletedSales'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import type { Customer, CreditCard, DashboardSummary } from '@/types'

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showCustomerForm, setShowCustomerForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  
  const [customers, setCustomers] = useState<Customer[]>([])
  const [creditCards, setCreditCards] = useState<CreditCard[]>([])
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)

  // ดึงข้อมูลลูกค้า
  const fetchCustomers = useCallback(async () => {
    try {
      const response = await fetch('/api/customers')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }, [])

  // ดึงข้อมูลบัตรเครดิต
  const fetchCreditCards = useCallback(async () => {
    try {
      const response = await fetch('/api/credit-cards')
      if (response.ok) {
        const data = await response.json()
        setCreditCards(data)
      }
    } catch (error) {
      console.error('Error fetching credit cards:', error)
    }
  }, [])

  // ดึงข้อมูล Dashboard
  const fetchDashboard = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard')
      if (response.ok) {
        const data = await response.json()
        setDashboardSummary(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    }
  }, [])

  // โหลดข้อมูลครั้งแรก
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchCustomers(), fetchCreditCards(), fetchDashboard()])
      setLoading(false)
    }
    loadData()
  }, [fetchCustomers, fetchCreditCards, fetchDashboard])

  // เพิ่มลูกค้า
  const handleAddCustomer = async (customerData: Partial<Customer>) => {
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      })
      
      if (response.ok) {
        toast.success('เพิ่มลูกค้าสำเร็จ')
        setShowCustomerForm(false)
        await fetchCustomers()
        await fetchDashboard()
        setActiveTab('customers')
      } else {
        toast.error('ไม่สามารถเพิ่มลูกค้าได้')
      }
    } catch (error) {
      console.error('Error adding customer:', error)
      toast.error('เกิดข้อผิดพลาด')
    }
  }

  // แก้ไขลูกค้า
  const handleEditCustomer = async (customerData: Partial<Customer>) => {
    if (!customerData.id) return
    
    try {
      const response = await fetch(`/api/customers/${customerData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      })
      
      if (response.ok) {
        toast.success('แก้ไขข้อมูลสำเร็จ')
        setShowCustomerForm(false)
        setEditingCustomer(null)
        await fetchCustomers()
        await fetchDashboard()
      } else {
        toast.error('ไม่สามารถแก้ไขข้อมูลได้')
      }
    } catch (error) {
      console.error('Error updating customer:', error)
      toast.error('เกิดข้อผิดพลาด')
    }
  }

  // ลบลูกค้า
  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบลูกค้ารายนี้?')) return
    
    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast.success('ลบลูกค้าสำเร็จ')
        await fetchCustomers()
        await fetchDashboard()
      } else {
        toast.error('ไม่สามารถลบลูกค้าได้')
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
      toast.error('เกิดข้อผิดพลาด')
    }
  }

  // ปิดการขาย
  const handleCompleteCustomer = async (id: string) => {
    try {
      const customer = customers.find(c => c.id === id)
      if (!customer) return
      
      const response = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...customer,
          status: 'completed',
          completedAt: new Date().toISOString()
        })
      })
      
      if (response.ok) {
        toast.success('ย้ายไปปิดการขายสำเร็จ')
        await fetchCustomers()
        await fetchDashboard()
      } else {
        toast.error('ไม่สามารถปิดการขายได้')
      }
    } catch (error) {
      console.error('Error completing customer:', error)
      toast.error('เกิดข้อผิดพลาด')
    }
  }

  // บันทึกการชำระ
  const handlePayInstallment = async (customerId: string, installmentId: string) => {
    try {
      const response = await fetch(`/api/customers/${customerId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ installmentId })
      })
      
      if (response.ok) {
        toast.success('บันทึกการชำระสำเร็จ')
        await fetchCustomers()
        await fetchDashboard()
      } else {
        toast.error('ไม่สามารถบันทึกการชำระได้')
      }
    } catch (error) {
      console.error('Error recording payment:', error)
      toast.error('เกิดข้อผิดพลาด')
    }
  }

  // เพิ่มบัตรเครดิต
  const handleAddCreditCard = async (cardData: Partial<CreditCard>) => {
    try {
      const response = await fetch('/api/credit-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData)
      })
      
      if (response.ok) {
        toast.success('เพิ่มบัตรเครดิตสำเร็จ')
        await fetchCreditCards()
      } else {
        toast.error('ไม่สามารถเพิ่มบัตรเครดิตได้')
      }
    } catch (error) {
      console.error('Error adding credit card:', error)
      toast.error('เกิดข้อผิดพลาด')
    }
  }

  // แก้ไขบัตรเครดิต
  const handleUpdateCreditCard = async (id: string, updates: Partial<CreditCard>) => {
    try {
      const response = await fetch(`/api/credit-cards/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      if (response.ok) {
        toast.success('แก้ไขบัตรเครดิตสำเร็จ')
        await fetchCreditCards()
      } else {
        toast.error('ไม่สามารถแก้ไขบัตรเครดิตได้')
      }
    } catch (error) {
      console.error('Error updating credit card:', error)
      toast.error('เกิดข้อผิดพลาด')
    }
  }

  // ลบบัตรเครดิต
  const handleDeleteCreditCard = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบบัตรเครดิตใบนี้?')) return
    
    try {
      const response = await fetch(`/api/credit-cards/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast.success('ลบบัตรเครดิตสำเร็จ')
        await fetchCreditCards()
      } else {
        toast.error('ไม่สามารถลบบัตรเครดิตได้')
      }
    } catch (error) {
      console.error('Error deleting credit card:', error)
      toast.error('เกิดข้อผิดพลาด')
    }
  }

  const renderContent = () => {
    if (showCustomerForm) {
      return (
        <CustomerForm
          creditCards={creditCards.map(c => ({ id: c.id, name: c.name }))}
          onSave={editingCustomer ? handleEditCustomer : handleAddCustomer}
          onCancel={() => {
            setShowCustomerForm(false)
            setEditingCustomer(null)
          }}
          editingCustomer={editingCustomer}
        />
      )
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            summary={dashboardSummary}
            onViewCustomer={() => setActiveTab('customers')}
            loading={loading}
          />
        )
      case 'customers':
        return (
          <CustomerList
            customers={customers}
            onAddNew={() => setShowCustomerForm(true)}
            onEdit={(customer) => {
              setEditingCustomer(customer)
              setShowCustomerForm(true)
            }}
            onDelete={handleDeleteCustomer}
            onComplete={handleCompleteCustomer}
            onPayInstallment={handlePayInstallment}
            loading={loading}
          />
        )
      case 'creditcards':
        return (
          <CreditCardManager
            creditCards={creditCards}
            onAdd={handleAddCreditCard}
            onUpdate={handleUpdateCreditCard}
            onDelete={handleDeleteCreditCard}
            loading={loading}
          />
        )
      case 'completed':
        return <CompletedSales customers={customers} loading={loading} />
      default:
        return <Dashboard summary={dashboardSummary} onViewCustomer={() => {}} loading={loading} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="flex-1 min-h-screen overflow-auto">
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
      
      <Toaster position="top-right" />
    </div>
  )
}
