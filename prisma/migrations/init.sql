-- สร้างตารางบัตรเครดิต
CREATE TABLE IF NOT EXISTS credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  "limit" FLOAT DEFAULT 0,
  due_date INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้างตารางลูกค้า
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address TEXT,
  product_type VARCHAR(50) NOT NULL,
  product_type_other VARCHAR(50),
  product_model VARCHAR(255) NOT NULL,
  serial_number VARCHAR(255),
  cost_price FLOAT DEFAULT 0,
  cost_bonus FLOAT DEFAULT 0,
  down_payment_for_purchase FLOAT DEFAULT 0,
  selling_price FLOAT DEFAULT 0,
  customer_down_payment FLOAT DEFAULT 0,
  down_payment_installment BOOLEAN DEFAULT false,
  down_payment_months INT,
  down_payment_monthly FLOAT,
  installment_months INT DEFAULT 0,
  monthly_payment FLOAT DEFAULT 0,
  payment_due_date INT DEFAULT 1,
  remaining_installment FLOAT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  total_profit FLOAT DEFAULT 0,
  current_profit FLOAT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- สร้างตารางการใช้บัตรเครดิต
CREATE TABLE IF NOT EXISTS credit_card_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_card_id UUID NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  amount FLOAT NOT NULL,
  installments INT NOT NULL,
  monthly_payment FLOAT NOT NULL,
  remaining_amount FLOAT NOT NULL
);

-- สร้างตารางการชำระบัตรเครดิต
CREATE TABLE IF NOT EXISTS card_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_card_usage_id UUID NOT NULL REFERENCES credit_card_usages(id) ON DELETE CASCADE,
  installment_number INT NOT NULL,
  due_date DATE NOT NULL,
  amount FLOAT NOT NULL,
  paid BOOLEAN DEFAULT false,
  paid_date DATE
);

-- สร้างตารางงวดผ่อนสินค้า
CREATE TABLE IF NOT EXISTS product_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  installment_number INT NOT NULL,
  due_date DATE NOT NULL,
  amount FLOAT NOT NULL,
  paid BOOLEAN DEFAULT false,
  paid_date DATE
);

-- สร้าง index เพื่อเพิ่มประสิทธิภาพ
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_credit_card_usages_customer ON credit_card_usages(customer_id);
CREATE INDEX IF NOT EXISTS idx_credit_card_usages_card ON credit_card_usages(credit_card_id);
CREATE INDEX IF NOT EXISTS idx_product_installments_customer ON product_installments(customer_id);
CREATE INDEX IF NOT EXISTS idx_card_payments_usage ON card_payments(credit_card_usage_id);
