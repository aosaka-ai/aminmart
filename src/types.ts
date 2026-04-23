export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  imageUrl?: string;
  order?: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  costPrice?: number;
  categoryId: string;
  stock: number;
  imageUrl?: string;
  isHotDeal?: boolean;
  unit?: string;
  isWeighted?: boolean;
  specification?: string;
  stockKg?: number;
  baseWeightGm?: number;
}

export interface Address {
  label: string;
  street: string;
  building: string;
  apartment?: string;
  floor?: string;
  city: string;
  state: string;
  country: string;
  latitude?: number;
  longitude?: number;
  formattedAddress: string;
}

export interface UserProfile {
  id?: string;
  uid: string;
  email?: string;
  phoneNumber?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  mobile?: string;
  gender?: 'male' | 'female';
  role: 'admin' | 'customer';
  isVerified?: boolean;
  addresses?: Address[];
  // HR Data
  position?: string;
  department?: string;
  employeeId?: string;
  joinDate?: string;
  isPreRegistered?: boolean;
  password?: string;
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
