// ประเภทสินค้า
export type ProductType = 'iPad' | 'iPhone' | 'MacBook' | 'Notebook' | 'อื่นๆ';

// สถานะการผ่อน
export type InstallmentStatus = 'active' | 'completed' | 'overdue';

// ข้อมูลลูกค้าที่ใช้บัตร (สำหรับแสดงในบัตรเครดิต)
export interface CreditCardCustomer {
  id: string;
  name: string;
  productType?: string;
  productModel?: string;
  status?: string;
}

// ข้อมูลบัตรเครดิตที่ใช้
export interface CreditCardUsage {
  id: string;
  creditCardId: string;
  customerId: string;
  amount: number;
  installments: number;
  monthlyPayment: number;
  remainingAmount: number;
  creditCard?: {
    id: string;
    name: string;
  };
  customer?: CreditCardCustomer;
  payments?: CardPayment[];
}

// การชำระบัตรเครดิตแต่ละงวด
export interface CardPayment {
  id: string;
  creditCardUsageId: string;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  paid: boolean;
  paidDate?: string;
}

// งวดผ่อนสินค้า
export interface ProductInstallment {
  id: string;
  customerId: string;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  paid: boolean;
  paidDate?: string;
}

// ข้อมูลบัตรเครดิต
export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  dueDate: number;
  usages?: CreditCardUsage[];
  totalUsed?: number;
  totalRemaining?: number;
  availableBalance?: number;
  utilizationRate?: number;
  monthlyDueThisMonth?: number;
  dueWithin7Days?: number;
  createdAt: string;
  updatedAt: string;
}

// ข้อมูลลูกค้าผ่อนสินค้า
export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  
  // ข้อมูลสินค้า
  productType: ProductType;
  productTypeOther?: string;
  productModel: string;
  serialNumber?: string;
  
  // ต้นทุน
  costPrice: number;
  costBonus: number;
  downPaymentForPurchase: number;
  
  // ราคาขาย
  sellingPrice: number;
  customerDownPayment: number;
  downPaymentInstallment: boolean;
  downPaymentMonths?: number;
  downPaymentMonthly?: number;
  
  // การผ่อน
  installmentMonths: number;
  monthlyPayment: number;
  paymentDueDate: number;
  remainingInstallment: number;
  
  // สถานะ
  status: InstallmentStatus;
  
  // กำไร
  totalProfit: number;
  currentProfit: number;
  
  // เวลา
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  
  // ความสัมพันธ์
  creditCards?: CreditCardUsage[];
  installments?: ProductInstallment[];
}

// ข้อมูลสรุปสำหรับ Dashboard
export interface DashboardSummary {
  totalSales: number;
  totalCost: number;
  totalCollected: number;
  totalRemaining: number;
  upcomingPayments: Customer[];
  activeCustomers: number;
  completedCustomers: number;
  overdueCustomers: number;
  totalProfit: number;
  currentProfit: number;
  creditCardRemaining: number;
  allCustomers?: Array<{
    id: string;
    name: string;
    status: string;
    productType: string;
    productModel: string;
    sellingPrice: number;
    costPrice: number;
    costBonus: number;
    customerDownPayment: number;
    remainingInstallment: number;
    currentProfit: number;
    installments: Array<{
      installmentNumber: number;
      dueDate: string;
      amount: number;
      paid: boolean;
      paidDate?: string;
    }>;
  }>;
}
