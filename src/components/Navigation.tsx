'use client'

import { useState } from 'react'
import { LayoutDashboard, Users, CreditCard, CheckCircle, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

interface NavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

interface SidebarContentProps {
  isMobile?: boolean
  isCollapsed: boolean
  activeTab: string
  onTabClick: (tabId: string) => void
  onCollapse: () => void
  onCloseMobile: () => void
}

const menuItems = [
  { id: 'dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
  { id: 'customers', label: 'ลูกค้าซื้อผ่อน', icon: Users },
  { id: 'creditcards', label: 'บัตรเครดิต', icon: CreditCard },
  { id: 'completed', label: 'ปิดการขายแล้ว', icon: CheckCircle },
]

function SidebarContent({ isMobile = false, isCollapsed, activeTab, onTabClick, onCollapse, onCloseMobile }: SidebarContentProps) {
  return (
    <div className={`flex flex-col h-full ${isCollapsed && !isMobile ? 'w-16' : 'w-full'} transition-all duration-300`}>
      {/* Logo */}
      <div className={`flex items-center ${isCollapsed && !isMobile ? 'justify-center' : 'justify-between'} p-4 border-b`}>
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg flex-shrink-0">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          {(!isCollapsed || isMobile) && (
            <div>
              <h1 className="font-bold text-gray-800 text-lg leading-tight">ระบบผ่อน</h1>
              <p className="text-xs text-gray-500">มือถือ</p>
            </div>
          )}
        </div>
        {!isMobile && (
          <button
            onClick={onCollapse}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors hidden lg:block"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            )}
          </button>
        )}
        {isMobile && (
          <button onClick={onCloseMobile} className="lg:hidden">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          
          return (
            <button
              key={item.id}
              onClick={() => onTabClick(item.id)}
              className={`w-full flex items-center ${isCollapsed && !isMobile ? 'justify-center' : 'gap-3'} px-3 py-3 rounded-xl transition-all duration-200 group relative ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`} />
              {(!isCollapsed || isMobile) && (
                <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>
              )}
              
              {/* Tooltip for collapsed state */}
              {isCollapsed && !isMobile && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                  {item.label}
                  <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-gray-800" />
                </div>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      {(!isCollapsed || isMobile) && (
        <div className="p-4 border-t">
          <p className="text-xs text-gray-400 text-center">© 2024 ระบบผ่อนมือถือ</p>
        </div>
      )}
    </div>
  )
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId)
    setMobileOpen(false)
  }

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white shadow-md z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-gray-800">ระบบผ่อนมือถือ</h1>
          </div>
        </div>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <SidebarContent
              isMobile
              isCollapsed={isCollapsed}
              activeTab={activeTab}
              onTabClick={handleTabClick}
              onCollapse={() => setIsCollapsed(!isCollapsed)}
              onCloseMobile={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className={`hidden lg:block fixed left-0 top-0 h-screen bg-white shadow-lg z-40 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
        <SidebarContent
          isCollapsed={isCollapsed}
          activeTab={activeTab}
          onTabClick={handleTabClick}
          onCollapse={() => setIsCollapsed(!isCollapsed)}
          onCloseMobile={() => setMobileOpen(false)}
        />
      </aside>

      {/* Spacer for mobile */}
      <div className="lg:hidden h-16" />
      
      {/* Spacer for desktop */}
      <div className={`hidden lg:block transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`} />
    </>
  )
}
