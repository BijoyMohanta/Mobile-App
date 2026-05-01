export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  purchase_price: number;
  selling_price: number;
  stock: number;
  low_stock_threshold: number;
  woo_id?: string;
  category: string;
}

export interface Sale {
  id: string;
  invoice_no: string;
  total_amount: number;
  discount: number;
  tax: number;
  payment_method: string;
  user_id: string;
  created_at: any;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  price: number;
  cost: number;
  subtotal: number;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  note: string;
  expense_date: string;
  created_at: any;
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  role: string;
  salary_type: 'Monthly' | 'Daily' | 'Commission';
  base_salary: number;
  commission_rate: number;
}

export interface Payroll {
  id: string;
  employee_id: string;
  month: string;
  year: number;
  base_paid: number;
  bonus: number;
  deductions: number;
  net_payable: number;
  status: 'Unpaid' | 'Paid';
  paid_at?: any;
}

export interface MfsTransaction {
  id: string;
  provider: 'bKash' | 'Nagad' | 'Rocket';
  type: 'Cash Out' | 'Send Money' | 'Cash In';
  amount: number;
  commission: number;
  transaction_id: string;
  customer_phone?: string;
  user_id: string;
  created_at: any;
}

export interface Setting {
  key: string;
  value: any;
}
