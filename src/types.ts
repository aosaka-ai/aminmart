export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  imageUrl?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  stock: number;
  imageUrl?: string;
  isHotDeal?: boolean;
  unit?: string;
}

export interface UserProfile {
  uid: string;
  email?: string;
  phoneNumber?: string;
  displayName?: string;
  role: 'admin' | 'customer';
  addresses?: { label: string; address: string }[];
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'out-for-delivery' | 'delivered';
  paymentMethod: 'visa' | 'instapay' | 'cash';
  deliveryAddress: string;
  createdAt: any; // Firestore Timestamp
}
