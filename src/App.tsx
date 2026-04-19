import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  User, 
  LayoutDashboard, 
  Search, 
  Menu, 
  X, 
  Plus, 
  Trash2, 
  ChevronRight,
  TrendingDown,
  Package,
  Truck,
  CheckCircle,
  CreditCard,
  Phone,
  LogOut,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './AuthProvider';
import { useCart } from './CartProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { collection, onSnapshot, query, orderBy, Timestamp, where } from 'firebase/firestore';
import { db } from './firebase';
import { Category, Product, Order } from './types';
import { createDocument, updateDocument, removeDocument, uploadFile } from './lib/firebase-utils';
import { Camera, Edit2, Loader2, RefreshCw } from 'lucide-react';

const CURRENCY = 'EGP';

// --- Components ---

const Navbar = ({ setView, currentView }: { setView: (v: string) => void, currentView: string }) => {
  const { profile, login, logout } = useAuth();
  const { items } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-200">
              <ShoppingCart size={24} />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              AminMart
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => setView('home')} className={`text-sm font-medium transition-colors ${currentView === 'home' ? 'text-green-600' : 'text-gray-600 hover:text-green-600'}`}>Home</button>
            {profile?.role === 'admin' && (
              <button onClick={() => setView('admin')} className={`text-sm font-medium transition-colors ${currentView === 'admin' ? 'text-green-600' : 'text-gray-600 hover:text-green-600'}`}>Admin</button>
            )}
            {profile && (
              <button onClick={() => setView('orders')} className={`text-sm font-medium transition-colors ${currentView === 'orders' ? 'text-green-600' : 'text-gray-600 hover:text-green-600'}`}>My Orders</button>
            )}
            <button onClick={() => window.location.reload()} className="text-sm font-medium text-gray-400 hover:text-green-600 flex items-center gap-1">
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <Button variant="ghost" size="icon" onClick={() => setView('cart')} className="relative">
                <ShoppingCart size={20} />
                {items.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
                    {items.length}
                  </Badge>
                )}
              </Button>
            </div>

            {profile ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-semibold text-gray-900">{profile.displayName || 'User'}</p>
                  <p className="text-[10px] text-gray-500 capitalize">{profile.role}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={logout}>
                  <LogOut size={20} className="text-gray-500" />
                </Button>
              </div>
            ) : (
              <Button onClick={login} className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6">
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

interface CategoryCardProps {
  category: Category;
  isSelected: boolean;
  onClick: () => void;
  key?: React.Key;
}

const CategoryCard = ({ category, isSelected, onClick }: CategoryCardProps) => {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative group cursor-pointer overflow-hidden rounded-[2rem] aspect-[4/5] transition-all duration-500 ${
        isSelected ? 'ring-2 ring-green-600 ring-offset-4' : 'hover:shadow-2xl hover:shadow-gray-200'
      }`}
    >
      <img 
        src={category.imageUrl || `https://picsum.photos/seed/${category.name}/400/500`} 
        alt={category.name}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
      <div className="absolute bottom-6 left-6 right-6">
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-green-400 mb-1 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">Explore</p>
        <h3 className="text-xl font-bold text-white tracking-tight">{category.name}</h3>
      </div>
    </motion.div>
  );
};

const ProductCard = ({ product, categoryName }: { product: Product, categoryName?: string }) => {
  const { addItem } = useCart();
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onClick={() => {
        if (product.stock > 0) {
          addItem(product);
          toast.success(`${product.name} added to basket`);
        }
      }}
      className="group bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-xl hover:shadow-gray-100 transition-all duration-300 cursor-pointer"
    >
      <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 mb-4">
        <img 
          src={product.imageUrl || `https://picsum.photos/seed/${product.name}/400/400`} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        {product.isHotDeal && (
          <Badge className="absolute top-2 left-2 bg-orange-500 border-none px-2 py-0.5 text-[10px]">
            <TrendingDown size={10} className="mr-1" /> Hot Deal
          </Badge>
        )}
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
            <Badge variant="destructive" className="text-sm py-1 px-3">Out of Stock</Badge>
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <h3 className="text-[10px] uppercase tracking-wider font-bold text-green-600 mb-1">{categoryName || 'General'}</h3>
        <p className="font-semibold text-gray-900 line-clamp-1 text-sm">{product.name}</p>
        <p className="text-[11px] text-gray-500 line-clamp-2 h-8 leading-tight">{product.description}</p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <span className="text-base font-bold text-gray-900">{CURRENCY} {product.price.toFixed(2)}</span>
          {product.unit && <span className="text-[10px] text-gray-400 ml-1">/ {product.unit}</span>}
        </div>
      </div>
    </motion.div>
  );
};

// --- Views ---

const HomeView = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubCat = onSnapshot(query(collection(db, 'categories'), orderBy('name')), (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
    });
    const unsubProd = onSnapshot(collection(db, 'products'), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    });
    return () => { unsubCat(); unsubProd(); };
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesCategory = !selectedCategory || p.categoryId === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
      {/* Hero Section */}
      <div className="relative rounded-[2.5rem] overflow-hidden bg-green-600 h-[350px] flex items-center px-8 sm:px-16 shadow-2xl shadow-green-100">
        <div className="relative z-10 max-w-lg space-y-6">
          <Badge className="bg-white/20 text-white border-none backdrop-blur-md px-4 py-1.5 text-xs font-medium uppercase tracking-widest">
            Premium Selection
          </Badge>
          <h1 className="text-5xl sm:text-6xl font-bold text-white leading-[1.1] tracking-tight">
            Freshness <br /> redefined.
          </h1>
          <p className="text-green-50 text-xl font-light leading-relaxed opacity-90">Experience the finest local produce delivered directly to your doorstep with AminMart.</p>
        </div>
        <div className="absolute right-0 bottom-0 top-0 w-1/2 hidden lg:block">
          <img 
            src="https://picsum.photos/seed/groceries/1200/800" 
            className="w-full h-full object-cover opacity-60 mix-blend-soft-light"
            alt="Hero"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col items-center justify-center space-y-12">
        <div className="relative w-full max-w-xl group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors" size={22} />
          <Input 
            placeholder="Search our collection..." 
            className="pl-14 h-16 rounded-[1.25rem] border-none bg-white shadow-2xl shadow-gray-100 focus:ring-2 focus:ring-green-500/20 text-lg placeholder:text-gray-300 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Categories Visual Grid - Main Home Experience */}
        {!selectedCategory && !searchQuery && (
          <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight text-center">Homegrown Collections</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
              {categories.map(cat => (
                <CategoryCard 
                  key={cat.id} 
                  category={cat} 
                  isSelected={false}
                  onClick={() => setSelectedCategory(cat.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Product Results - Shown only when investigating a category or searching */}
      {(selectedCategory || searchQuery) && (
        <div className="space-y-8 pt-4">
          <div className="flex items-baseline justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-4">
              {selectedCategory && (
                <button 
                  onClick={() => setSelectedCategory(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              )}
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                {searchQuery ? `Search: ${searchQuery}` : categories.find(c => c.id === selectedCategory)?.name}
              </h2>
            </div>
            <p className="text-sm text-gray-400 font-medium">{filteredProducts.length} items</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map(product => (
                <motion.div 
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <ProductCard 
                    product={product} 
                    categoryName={categories.find(c => c.id === product.categoryId)?.name} 
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-20 px-4 bg-white rounded-[2rem] shadow-sm">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300 mb-4">
                <Search size={24} />
              </div>
              <h3 className="text-gray-900 font-semibold">No products found</h3>
              <p className="text-gray-400 text-sm mt-1">Try a different search term or category.</p>
              <Button 
                variant="outline" 
                className="mt-6 rounded-xl"
                onClick={() => { setSelectedCategory(null); setSearchQuery(''); }}
              >
                Return to Categories
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const CartView = ({ setView }: { setView: (v: string) => void }) => {
  const { items, total, updateQuantity, removeItem, clearCart } = useCart();
  const { profile, login } = useAuth();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'visa' | 'instapay' | 'cash'>('visa');
  const [address, setAddress] = useState('');

  const handleCheckout = async () => {
    if (!profile) {
      toast.error("Please login to checkout");
      login();
      return;
    }
    if (!address) {
      toast.error("Please enter a delivery address");
      return;
    }

    setIsCheckingOut(true);
    try {
      const orderData = {
        userId: profile.uid,
        items: items.map(i => ({ productId: i.id, name: i.name, quantity: i.quantity, price: i.price })),
        total,
        status: 'pending',
        paymentMethod,
        deliveryAddress: address,
        createdAt: Timestamp.now()
      };
      
      await createDocument('orders', orderData);
      
      // Update stock
      for (const item of items) {
        await updateDocument('products', item.id, { stock: item.stock - item.quantity });
      }

      clearCart();
      toast.success("Order placed successfully!");
      setView('orders');
    } catch (error) {
      toast.error("Checkout failed. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-600">
          <ShoppingCart size={48} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Your basket is empty</h2>
          <p className="text-gray-500">Looks like you haven't added anything to your basket yet.</p>
        </div>
        <Button onClick={() => setView('home')} className="bg-green-600 hover:bg-green-700 rounded-full px-8">
          Start Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Your Basket</h2>
          <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={clearCart}>
            Clear All
          </Button>
        </div>
        
        <div className="space-y-4">
          {items.map(item => (
            <Card key={item.id} className="border-gray-100 shadow-sm overflow-hidden">
              <CardContent className="p-4 flex gap-4">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                  <img src={item.imageUrl || `https://picsum.photos/seed/${item.name}/200/200`} className="w-full h-full object-cover" alt={item.name} referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.name}</h4>
                      <p className="text-xs text-gray-500">{CURRENCY} {item.price.toFixed(2)} / {item.unit || 'pc'}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500" onClick={() => removeItem(item.id)}>
                      <Trash2 size={18} />
                    </Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-gray-200 rounded-full px-2 py-1">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-green-600">-</button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-green-600">+</button>
                    </div>
                    <span className="font-bold text-gray-900">{CURRENCY} {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <Card className="border-gray-100 shadow-lg sticky top-24">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">{CURRENCY} {total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Delivery Fee</span>
              <span className="text-green-600 font-medium">FREE</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-green-600">{CURRENCY} {total.toFixed(2)}</span>
            </div>

            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <Input 
                    placeholder="e.g. +20123456789" 
                    value={profile?.phoneNumber || ''}
                    onChange={(e) => {
                      if (profile) {
                        updateDocument('users', profile.uid, { phoneNumber: e.target.value });
                      }
                    }}
                    className="pl-10 rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Delivery Address</label>
                <Input 
                  placeholder="Enter your full address" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Payment Method</label>
                <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                  <SelectTrigger className="rounded-xl h-12 border-gray-200 bg-white px-4 flex items-center justify-between">
                    <SelectValue className="text-sm text-gray-700" placeholder="Select payment" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-xl z-[100]">
                    <SelectItem value="visa" className="cursor-pointer hover:bg-green-50">Visa / Mastercard</SelectItem>
                    <SelectItem value="instapay" className="cursor-pointer hover:bg-green-50">InstaPay (Secure)</SelectItem>
                    <SelectItem value="cash" className="cursor-pointer hover:bg-green-50">Cash on Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-green-600 hover:bg-green-700 h-12 rounded-xl text-lg font-bold"
              disabled={isCheckingOut}
              onClick={handleCheckout}
            >
              {isCheckingOut ? "Processing..." : `Checkout ${CURRENCY} ${total.toFixed(2)}`}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

const AdminView = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Form states
  const [newCat, setNewCat] = useState<Partial<Category>>({ name: '', slug: '', icon: '', imageUrl: '' });
  const [newProd, setNewProd] = useState<Partial<Product>>({ name: '', price: 0, stock: 0, categoryId: '', unit: 'pc', imageUrl: '' });
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editingProd, setEditingProd] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const unsubCat = onSnapshot(collection(db, 'categories'), (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
      setLoadingData(false);
    }, (err) => {
      console.error("Categories snapshot error:", err);
      setLoadingData(false);
    });
    const unsubProd = onSnapshot(collection(db, 'products'), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    }, (err) => {
      console.error("Products snapshot error:", err);
    });
    const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    }, (err) => {
      console.error("Orders snapshot error:", err);
    });
    return () => { unsubCat(); unsubProd(); unsubOrders(); };
  }, []);

  const handleImageUpload = async (file: File, path: string) => {
    setUploading(true);
    try {
      const url = await uploadFile(file, path);
      return url;
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message || 'Unknown error'}`);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!newCat.name) return;
    const data = { 
      ...newCat, 
      slug: newCat.name.toLowerCase().replace(/ /g, '-') 
    };
    
    if (editingCat) {
      await updateDocument('categories', editingCat.id, data);
      toast.success("Category updated");
    } else {
      await createDocument('categories', data);
      toast.success("Category added");
    }
    
    setNewCat({ name: '', slug: '', icon: '', imageUrl: '' });
    setEditingCat(null);
  };

  const handleSaveProduct = async () => {
    if (!newProd.name || !newProd.categoryId) return;
    
    if (editingProd) {
      await updateDocument('products', editingProd.id, newProd);
      toast.success("Product updated");
    } else {
      await createDocument('products', newProd);
      toast.success("Product added");
    }
    
    setNewProd({ name: '', price: 0, stock: 0, categoryId: '', unit: 'pc', imageUrl: '' });
    setEditingProd(null);
  };

  const startEditCategory = (cat: Category) => {
    setEditingCat(cat);
    setNewCat({ name: cat.name, slug: cat.slug, icon: cat.icon, imageUrl: cat.imageUrl });
  };

  const startEditProduct = (prod: Product) => {
    setEditingProd(prod);
    setNewProd({ ...prod });
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    await updateDocument('orders', orderId, { status });
    toast.success("Order status updated");
  };

  const clearAllProducts = async () => {
    if (!confirm("Are you sure you want to delete ALL products? This cannot be undone.")) return;
    const toastId = toast.loading("Deleting products...");
    try {
      for (const p of products) {
        await removeDocument('products', p.id);
      }
      toast.success("All products deleted", { id: toastId });
    } catch (err) {
      toast.error("Failed to delete products", { id: toastId });
    }
  };

  const clearAllCategories = async () => {
    if (!confirm("Are you sure you want to delete ALL categories? This cannot be undone.")) return;
    const toastId = toast.loading("Deleting categories...");
    try {
      for (const c of categories) {
        await removeDocument('categories', c.id);
      }
      toast.success("All categories deleted", { id: toastId });
    } catch (err) {
      toast.error("Failed to delete categories", { id: toastId });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
        <div className="flex flex-wrap gap-4">
          <Badge variant="outline" className="px-4 py-1">Total Sales: {CURRENCY} {orders.reduce((s, o) => s + o.total, 0).toFixed(2)}</Badge>
          <Badge variant="outline" className="px-4 py-1">Orders: {orders.length}</Badge>
          <Badge variant="secondary" className="px-4 py-1 bg-blue-50 text-blue-700 border-blue-100">
            Storage: Free Tier (5GB)
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-4 rounded-xl p-1 bg-gray-100">
          <TabsTrigger value="products" className="rounded-lg">Inventory</TabsTrigger>
          <TabsTrigger value="categories" className="rounded-lg">Categories</TabsTrigger>
          <TabsTrigger value="orders" className="rounded-lg">Orders</TabsTrigger>
          <TabsTrigger value="maintenance" className="rounded-lg">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6 pt-6">
          <Card className="border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle>{editingProd ? 'Edit Product' : 'Add New Product'}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input placeholder="Product Name" value={newProd.name} onChange={e => setNewProd({...newProd, name: e.target.value})} />
              <Input type="number" placeholder="Price" value={newProd.price} onChange={e => setNewProd({...newProd, price: parseFloat(e.target.value)})} />
              <Input type="number" placeholder="Stock" value={newProd.stock} onChange={e => setNewProd({...newProd, stock: parseInt(e.target.value)})} />
              <Select value={newProd.categoryId || ""} onValueChange={v => setNewProd({...newProd, categoryId: v})}>
                <SelectTrigger className="w-full bg-white h-10 border-gray-200 rounded-lg px-3 flex items-center justify-between">
                  <SelectValue className="text-sm text-gray-700" placeholder={loadingData ? "Loading..." : "Select Category"} />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[100] bg-white border border-gray-200 shadow-lg rounded-lg">
                  {categories.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      No categories found.
                    </div>
                  ) : (
                    categories.map(c => (
                      <SelectItem key={c.id} value={c.id} className="cursor-pointer hover:bg-green-50">
                        {c.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Input placeholder="Unit (e.g. kg, pc)" value={newProd.unit} onChange={e => setNewProd({...newProd, unit: e.target.value})} />
              
              <div className="flex items-center gap-2">
                <Input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  id="prod-img" 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = await handleImageUpload(file, 'products');
                      if (url) setNewProd({...newProd, imageUrl: url});
                    }
                  }}
                />
                <label htmlFor="prod-img" className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors text-sm font-medium">
                  {uploading ? <Loader2 className="animate-spin" size={16} /> : <Camera size={16} />}
                  {newProd.imageUrl ? 'Change Image' : 'Upload Image'}
                </label>
                {newProd.imageUrl && <img src={newProd.imageUrl} className="w-10 h-10 rounded object-cover" alt="Preview" />}
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveProduct} className="bg-green-600 hover:bg-green-700 flex-1">
                  {editingProd ? 'Update Product' : 'Add Product'}
                </Button>
                {editingProd && (
                  <Button variant="outline" onClick={() => {
                    setEditingProd(null);
                    setNewProd({ name: '', price: 0, stock: 0, categoryId: '', unit: 'pc', imageUrl: '' });
                  }}>Cancel</Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(p => (
              <Card key={p.id} className="border-gray-100">
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {p.imageUrl && <img src={p.imageUrl} className="w-10 h-10 rounded object-cover" alt={p.name} />}
                    <div>
                      <h4 className="font-bold">{p.name}</h4>
                      <p className="text-xs text-gray-500">Stock: {p.stock} | {CURRENCY} {p.price}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => startEditProduct(p)}><Edit2 size={16} /></Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => removeDocument('products', p.id)}><Trash2 size={16} /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6 pt-6">
          <Card className="border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle>{editingCat ? 'Edit Category' : 'Add New Category'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Input placeholder="Category Name" value={newCat.name} onChange={e => setNewCat({...newCat, name: e.target.value})} />
                
                <div className="flex items-center gap-2">
                  <Input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    id="cat-img" 
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await handleImageUpload(file, 'categories');
                        if (url) setNewCat({...newCat, imageUrl: url});
                      }
                    }}
                  />
                  <label htmlFor="cat-img" className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors text-sm font-medium">
                    {uploading ? <Loader2 className="animate-spin" size={16} /> : <Camera size={16} />}
                    {newCat.imageUrl ? 'Change Image' : 'Upload Image'}
                  </label>
                  {newCat.imageUrl && <img src={newCat.imageUrl} className="w-10 h-10 rounded object-cover" alt="Preview" />}
                </div>

                <Button onClick={handleSaveCategory} className="bg-green-600 hover:bg-green-700">
                  {editingCat ? 'Update Category' : 'Add Category'}
                </Button>
                {editingCat && (
                  <Button variant="outline" onClick={() => {
                    setEditingCat(null);
                    setNewCat({ name: '', slug: '', icon: '', imageUrl: '' });
                  }}>Cancel</Button>
                )}
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map(c => (
              <Card key={c.id} className="border-gray-100">
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {c.imageUrl && <img src={c.imageUrl} className="w-8 h-8 rounded object-cover" alt={c.name} />}
                    <span className="font-medium">{c.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => startEditCategory(c)}><Edit2 size={16} /></Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => removeDocument('categories', c.id)}><Trash2 size={16} /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4 pt-6">
          {orders.map(order => (
            <Card key={order.id} className="border-gray-100">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-sm">Order #{order.id.slice(-6)}</CardTitle>
                    <CardDescription>{order.createdAt?.toDate().toLocaleString()}</CardDescription>
                  </div>
                  <Badge className={
                    order.status === 'delivered' ? 'bg-green-500' : 
                    order.status === 'out-for-delivery' ? 'bg-blue-500' : 
                    order.status === 'confirmed' ? 'bg-orange-500' : 'bg-gray-500'
                  }>
                    {order.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="text-sm space-y-1">
                  <p><strong>Customer ID:</strong> {order.userId}</p>
                  <p><strong>Address:</strong> {order.deliveryAddress}</p>
                  <p><strong>Total:</strong> {CURRENCY} {order.total.toFixed(2)} ({order.paymentMethod})</p>
                  <div className="pt-2">
                    <p className="font-semibold">Items:</p>
                    <ul className="list-disc list-inside text-xs text-gray-600">
                      {order.items.map((item, idx) => (
                        <li key={idx}>{item.name} x {item.quantity} ({CURRENCY} {item.price})</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => updateOrderStatus(order.id, 'confirmed')}>Confirm</Button>
                <Button size="sm" variant="outline" onClick={() => updateOrderStatus(order.id, 'out-for-delivery')}>Out for Delivery</Button>
                <Button size="sm" variant="outline" onClick={() => updateOrderStatus(order.id, 'delivered')}>Delivered</Button>
              </CardFooter>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="maintenance" className="pt-6">
          <Card className="border-red-100 bg-red-50/30">
            <CardHeader>
              <CardTitle className="text-red-800">System Maintenance</CardTitle>
              <CardDescription>Dangerous operations. Use with caution.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-red-100 shadow-sm">
                <div>
                  <h4 className="font-bold text-gray-900">Clear All Products</h4>
                  <p className="text-sm text-gray-500">Permanently delete all products from the database.</p>
                </div>
                <Button variant="destructive" onClick={clearAllProducts}>Delete All Products</Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-red-100 shadow-sm">
                <div>
                  <h4 className="font-bold text-gray-900">Clear All Categories</h4>
                  <p className="text-sm text-gray-500">Permanently delete all categories from the database.</p>
                </div>
                <Button variant="destructive" onClick={clearAllCategories}>Delete All Categories</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const OrdersView = () => {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!profile) return;
    const unsub = onSnapshot(
      query(collection(db, 'orders'), where('userId', '==', profile.uid), orderBy('createdAt', 'desc')),
      (snap) => setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)))
    );
    return () => unsub();
  }, [profile]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">My Orders</h2>
      {orders.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Card key={order.id} className="border-gray-100 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                      <Package size={20} />
                    </div>
                    <div>
                      <CardTitle className="text-sm">Order #{order.id.slice(-6)}</CardTitle>
                      <CardDescription>{order.createdAt?.toDate().toLocaleDateString()}</CardDescription>
                    </div>
                  </div>
                  <Badge className={
                    order.status === 'delivered' ? 'bg-green-500' : 
                    order.status === 'out-for-delivery' ? 'bg-blue-500' : 
                    order.status === 'confirmed' ? 'bg-orange-500' : 'bg-gray-500'
                  }>
                    {order.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-end">
                  <div className="text-sm text-gray-600">
                    {order.items.length} items • Total: <span className="font-bold text-gray-900">{CURRENCY} {order.total.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Truck size={14} />
                    <span>{order.status === 'delivered' ? 'Delivered' : 'In Progress'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Main App ---

export default function App() {
  console.log("App.tsx: Rendering App component, loading:", useAuth().loading);
  const [view, setView] = useState('home');
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-green-200"
        >
          <ShoppingCart size={32} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900">
      <Navbar setView={setView} currentView={view} />
      
      <main className="pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {view === 'home' && <HomeView />}
            {view === 'cart' && <CartView setView={setView} />}
            {view === 'admin' && <AdminView />}
            {view === 'orders' && <OrdersView />}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-8 border-t border-gray-100 mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>© 2026 AminMart. All rights reserved.</p>
          <button 
            onClick={() => { localStorage.clear(); sessionStorage.clear(); window.location.reload(); }} 
            className="hover:text-green-600 underline transition-colors"
          >
            Clear Cache & Force Refresh
          </button>
        </div>
      </footer>

      <Toaster position="bottom-right" />
    </div>
  );
}
