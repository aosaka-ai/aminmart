import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  User, 
  LayoutDashboard, 
  Search, 
  Menu, 
  X, 
  Plus, 
  Minus,
  Trash2, 
  ChevronRight,
  TrendingDown,
  Package,
  Truck,
  CheckCircle,
  CreditCard,
  Phone,
  LogOut,
  Calendar,
  Lock,
  MapPin,
  Navigation,
  Globe,
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
import { db, auth } from './firebase';
import { Category, Product, Order, Address, UserProfile } from './types';
import { createDocument, updateDocument, removeDocument, uploadFile } from './lib/firebase-utils';
import { Camera, Edit2, Loader2, RefreshCw } from 'lucide-react';

const CURRENCY = 'EGP';

// --- Components ---

const Navbar = ({ setView, currentView }: { setView: (v: string) => void, currentView: string }) => {
  const { profile, logout, refreshUser } = useAuth();
  const { items } = useCart();
  const [logoTaps, setLogoTaps] = useState(0);

  const handleLogoClick = () => {
    const newTaps = logoTaps + 1;
    if (newTaps >= 5) {
      setLogoTaps(0);
      setView('staff-login');
      toast.info("Staff Portal Unlocked");
    } else {
      setLogoTaps(newTaps);
      // Reset taps after 2 seconds of inactivity
      setTimeout(() => setLogoTaps(0), 2000);
      if (currentView !== 'home') setView('home');
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleLogoClick}>
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
                  <p className="text-xs font-semibold text-gray-900">{profile.firstName ? `${profile.firstName} ${profile.lastName}` : profile.displayName || 'User'}</p>
                  <p className="text-[10px] text-gray-500 capitalize">{profile.role}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => refreshUser()} title="Refresh Profile">
                    <RefreshCw size={18} className="text-gray-400 hover:text-green-600 transition-colors" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={async () => { await logout(); setView('home'); }} title="Sign Out">
                    <LogOut size={20} className="text-gray-500" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setView('login')} className="text-gray-600 hidden sm:flex">
                  Login
                </Button>
                <Button onClick={() => setView('register')} className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6">
                  Register
                </Button>
              </div>
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
  const { addItem, items, updateQuantity, removeItem } = useCart();
  const cartItem = items.find(i => i.id === product.id);
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-xl hover:shadow-gray-100 transition-all duration-300 relative"
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

        {cartItem ? (
          <div className="flex items-center bg-green-50 rounded-full px-2 py-1 gap-2 border border-green-100">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (cartItem.quantity > 1) updateQuantity(cartItem.id, cartItem.quantity - 1);
                else removeItem(cartItem.id);
              }}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-white text-green-600 shadow-sm"
            >
              <Minus size={12} />
            </button>
            <span className="text-sm font-bold text-green-700 min-w-[12px] text-center">{cartItem.quantity}</span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                updateQuantity(cartItem.id, cartItem.quantity + 1);
              }}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-white text-green-600 shadow-sm"
            >
              <Plus size={12} />
            </button>
          </div>
        ) : (
          <button 
            disabled={product.stock <= 0}
            onClick={(e) => {
              e.stopPropagation();
              addItem(product);
              toast.success(`${product.name} added to basket`);
            }}
            className="w-10 h-10 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-green-100 transition-all active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={20} />
          </button>
        )}
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
  const [locating, setLocating] = useState(false);
  const [addressMode, setAddressMode] = useState<'saved' | 'new'>(profile?.addresses?.length ? 'saved' : 'new');
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [newAddress, setNewAddress] = useState<Address>({
    label: 'Other',
    street: '',
    building: '',
    apartment: '',
    floor: '',
    city: '',
    state: '',
    country: 'Egypt',
    formattedAddress: ''
  });
  const [paymentMethod, setPaymentMethod] = useState<'visa' | 'instapay' | 'cash'>('cash');

  useEffect(() => {
    if (profile?.addresses?.length) {
      setAddressMode('saved');
    }
  }, [profile]);

  const getGeoLocation = () => {
    setLocating(true);
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setNewAddress(prev => ({ 
          ...prev, 
          latitude, 
          longitude,
          street: prev.street || 'Located via GPS'
        }));
        toast.success("Location pinned successfully!");
        setLocating(false);
      },
      () => {
        toast.error("Unable to retrieve your location.");
        setLocating(false);
      }
    );
  };

  const handleCheckout = async () => {
    if (!profile) {
      toast.error("Please login to checkout");
      login();
      return;
    }

    const deliveryAddress = addressMode === 'saved' && profile.addresses && profile.addresses.length > 0
      ? profile.addresses[selectedAddressIndex]
      : { ...newAddress, formattedAddress: `${newAddress.building}, ${newAddress.street}, ${newAddress.city}, ${newAddress.country}` };

    if (!deliveryAddress || (addressMode === 'new' && (!newAddress.street || !newAddress.building || !newAddress.city))) {
      toast.error("Please provide a valid delivery address");
      return;
    }

    setIsCheckingOut(true);
    try {
      const orderData = {
        userId: profile.uid,
        userName: `${profile.firstName} ${profile.lastName}`,
        items: items.map(i => ({ productId: i.id, name: i.name, quantity: i.quantity, price: i.price })),
        total,
        status: 'pending',
        paymentMethod,
        deliveryAddress: deliveryAddress.formattedAddress,
        addressData: deliveryAddress,
        createdAt: Timestamp.now()
      };
      
      console.log("Creating order:", orderData);
      await createDocument('orders', orderData);
      
      // Update stock
      for (const item of items) {
        if (typeof item.stock === 'number') {
          await updateDocument('products', item.id, { stock: item.stock - item.quantity });
        }
      }

      clearCart();
      toast.success("Order placed successfully!");
      setView('orders');
    } catch (error: any) {
      console.error("Checkout detail error:", error);
      let errorMessage = "Checkout failed. Please try again.";
      
      try {
        // Try to parse our internal FirestoreErrorInfo if it's there
        const errInfo = JSON.parse(error.message);
        if (errInfo.error?.includes('permission-denied')) {
          errorMessage = "Permission denied. Please ensure your account is verified.";
        } else {
          errorMessage = `Error: ${errInfo.error || error.message}`;
        }
      } catch (e) {
        errorMessage = error.message || errorMessage;
      }
      
      toast.error(errorMessage);
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
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <MapPin className="text-green-600" size={16} />
                    Delivery Location
                  </label>
                  
                  <div className="flex gap-2 p-1 bg-gray-50 rounded-xl">
                    <button 
                      onClick={() => setAddressMode('saved')}
                      disabled={!profile?.addresses?.length}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                        addressMode === 'saved' 
                        ? 'bg-white text-green-600 shadow-sm' 
                        : 'text-gray-400 hover:text-gray-600'
                      } ${!profile?.addresses?.length && 'opacity-30 cursor-not-allowed'}`}
                    >
                      Saved Addresses
                    </button>
                    <button 
                      onClick={() => setAddressMode('new')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                        addressMode === 'new' 
                        ? 'bg-white text-green-600 shadow-sm' 
                        : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      New Address
                    </button>
                  </div>

                  {addressMode === 'saved' && profile?.addresses && (
                    <div className="space-y-2">
                      {profile.addresses.map((addr, idx) => (
                        <div 
                          key={idx}
                          onClick={() => setSelectedAddressIndex(idx)}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedAddressIndex === idx ? 'border-green-500 bg-green-50/50' : 'border-gray-50 bg-white hover:border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black uppercase text-green-600 tracking-tighter">{addr.label}</span>
                            {selectedAddressIndex === idx && <CheckCircle size={14} className="text-green-600" />}
                          </div>
                          <p className="text-xs text-gray-700 leading-tight">{addr.formattedAddress}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {addressMode === 'new' && (
                    <div className="space-y-4">
                      <Button 
                        type="button"
                        variant="ghost"
                        onClick={getGeoLocation}
                        disabled={locating}
                        className="w-full h-10 border-2 border-dashed border-gray-200 text-gray-500 hover:border-green-500 hover:text-green-600 rounded-xl text-xs gap-2"
                      >
                        {locating ? <Loader2 className="animate-spin" size={14} /> : <Navigation size={14} />}
                        Pin Current Location
                      </Button>
                      <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Street</label>
                            <Input className="h-9 text-xs rounded-lg border-white bg-white/50" value={newAddress.street} onChange={e => setNewAddress({...newAddress, street: e.target.value})} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Building</label>
                            <Input className="h-9 text-xs rounded-lg border-white bg-white/50" value={newAddress.building} onChange={e => setNewAddress({...newAddress, building: e.target.value})} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">City</label>
                            <Input className="h-9 text-xs rounded-lg border-white bg-white/50" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">State</label>
                            <Input className="h-9 text-xs rounded-lg border-white bg-white/50" value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <CreditCard className="text-green-600" size={16} />
                    Payment Method
                  </label>
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
  const [users, setUsers] = useState<UserProfile[]>([]);
  
  // Form states
  const [newCat, setNewCat] = useState<Partial<Category>>({ name: '', slug: '', icon: '', imageUrl: '' });
  const [newProd, setNewProd] = useState<Partial<Product>>({ name: '', price: 0, stock: 0, categoryId: '', unit: 'pc', imageUrl: '' });
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editingProd, setEditingProd] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editUserData, setEditUserData] = useState<Partial<UserProfile>>({});
  const [newAdmin, setNewAdmin] = useState<Partial<UserProfile>>({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    position: '',
    employeeId: '',
    department: '',
    birthDate: '',
    role: 'admin',
    isPreRegistered: true,
    password: '',
    addresses: []
  });

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
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ ...d.data(), uid: d.id } as UserProfile)));
    }, (err) => {
      console.error("Users snapshot error:", err);
    });
    return () => { unsubCat(); unsubProd(); unsubOrders(); unsubUsers(); };
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

  const toggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'customer' : 'admin';
    try {
      await updateDocument('users', userId, { role: newRole });
      toast.success(`User role updated to ${newRole}`);
    } catch (err) {
      toast.error("Failed to update user role");
    }
  };

  const startEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setEditUserData({ ...user });
    setIsEditUserDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    const toastId = toast.loading("Updating user...");
    try {
      // Ensure basic fields for legacy data resilience
      const finalData = {
        ...editUserData,
        uid: editUserData.uid || editingUser.uid || editingUser.id,
        role: editUserData.role || editingUser.role || 'customer'
      };

      const normalizedNewId = finalData.employeeId?.trim().toUpperCase();
      const normalizedOldId = editingUser.employeeId?.trim().toUpperCase();

      // 1. Update main user profile
      const isSuperAdmin = auth.currentUser?.email === 'a.osaka@gmail.com';
      
      // Safety: Only super admin can change roles
      const updateData = { ...finalData, employeeId: normalizedNewId };
      if (!isSuperAdmin && finalData.role !== editingUser.role) {
         updateData.role = editingUser.role;
         console.warn("[SECURITY] Role change attempted by non-super admin. Ignored.");
      }

      const targetId = editingUser.uid || editingUser.id;
      if (!targetId) throw new Error("Missing User ID for update");

      await updateDocument('users', targetId, updateData);

      // 2. Sync credentials if it's an admin and something changed
      if (editUserData.role === 'admin') {
        // If ID changed, we must move the document (Delete old, Create new)
        if (normalizedNewId && normalizedNewId !== normalizedOldId) {
           console.log(`[SYNC] Employee ID changed from ${normalizedOldId} to ${normalizedNewId}. Migrating credentials...`);
           
           // Delete old if it existed
           if (normalizedOldId) {
             try { await removeDocument('staffCredentials', normalizedOldId); } catch (e) { console.warn("Could not delete old credential", e); }
           }

           // Create new
           await createDocument('staffCredentials', {
             uid: editingUser.uid,
             password: editUserData.password || '123456', // Fallback
             employeeId: normalizedNewId
           }, normalizedNewId);
        } else if (normalizedNewId && editUserData.password) {
           // Just update existing
           await updateDocument('staffCredentials', normalizedNewId, {
             password: editUserData.password
           });
        }
      }

      toast.success("User profile and credentials updated", { id: toastId });
      setIsEditUserDialogOpen(false);
      setEditingUser(null);
    } catch (error: any) {
      toast.error(`Update failed: ${error.message}`, { id: toastId });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    try {
      await removeDocument('users', userId);
      toast.success("User deleted successfully");
    } catch (error: any) {
      toast.error(`Delete failed: ${error.message}`);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to delete this order?")) return;
    try {
      await removeDocument('orders', orderId);
      toast.success("Order deleted successfully");
    } catch (error: any) {
      toast.error(`Delete failed: ${error.message}`);
    }
  };

  const handleAddLocalAdmin = async () => {
    if (!newAdmin.email || !newAdmin.firstName || !newAdmin.lastName || !newAdmin.password || !newAdmin.employeeId) {
      toast.error("Required: Name, Email, Employee ID, and Password");
      return;
    }
    
    try {
      const uid = `staff_${Date.now()}`;
      const normalizedEmployeeId = newAdmin.employeeId.trim().toUpperCase();

      // 1. Create the user profile
      await createDocument('users', {
        ...newAdmin,
        employeeId: normalizedEmployeeId,
        joinDate: new Date().toISOString().split('T')[0],
        uid: uid,
        isPreRegistered: true
      }, uid);

      // 2. Create the login credential link
      await createDocument('staffCredentials', {
        uid: uid,
        password: newAdmin.password,
        employeeId: normalizedEmployeeId
      }, normalizedEmployeeId);

      toast.success("Staff profile and credentials created successfully.");
      setIsAdminDialogOpen(false);
      setNewAdmin({
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
        position: '',
        employeeId: '',
        department: '',
        birthDate: '',
        role: 'admin',
        isPreRegistered: true,
        addresses: []
      });
    } catch (err) {
      toast.error("Failed to create local admin profile");
    }
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

  const repairStaffCredentials = async () => {
    const toastId = toast.loading("Repairing staff logins...");
    let repaired = 0;
    try {
      const admins = users.filter(u => u.role === 'admin');
      for (const admin of admins) {
        if (admin.employeeId) {
          const normalized = admin.employeeId.trim().toUpperCase();
          const targetUid = admin.uid || admin.id || (admin as any).id;
          if (!targetUid) {
            console.warn(`[REPAIR] Skipping ${admin.email}: Missing UID or ID`, admin);
            continue;
          }
          
          console.log(`[REPAIR] Processing admin: ${admin.email} -> ${normalized}`);
          
          await createDocument('staffCredentials', {
            uid: targetUid,
            password: admin.password || '123456',
            employeeId: normalized
          }, normalized);
          repaired++;
        }
      }
      toast.success(`Repaired ${repaired} staff credential records.`, { id: toastId });
    } catch (err: any) {
      console.error("[REPAIR] Critical failure:", err);
      toast.error(`Repair failed: ${err.message}`, { id: toastId });
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
        <TabsList className="grid w-full grid-cols-6 rounded-xl p-1 bg-gray-100">
          <TabsTrigger value="products" className="rounded-lg">Inventory</TabsTrigger>
          <TabsTrigger value="categories" className="rounded-lg">Categories</TabsTrigger>
          <TabsTrigger value="orders" className="rounded-lg">Orders</TabsTrigger>
          <TabsTrigger value="admins" className="rounded-lg">Admins</TabsTrigger>
          <TabsTrigger value="customers" className="rounded-lg">Customers</TabsTrigger>
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
                  <div className="flex items-center gap-2">
                    <Badge className={
                      order.status === 'delivered' ? 'bg-green-500' : 
                      order.status === 'out-for-delivery' ? 'bg-blue-500' : 
                      order.status === 'confirmed' ? 'bg-orange-500' : 'bg-gray-500'
                    }>
                      {order.status}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteOrder(order.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
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

        <TabsContent value="admins" className="space-y-4 pt-6">
          <Card className="border-gray-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Administrator Accounts</CardTitle>
                <CardDescription>Management and privileged access control.</CardDescription>
              </div>
              <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="mr-2 h-4 w-4" /> Add Local Admin
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-white">
                  <DialogHeader>
                    <DialogTitle>Add Local Admin (HR Record)</DialogTitle>
                    <DialogDescription>
                      Create a profile for a new administrator. They can link their account by registering with this email.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-gray-400">First Name</label>
                        <Input 
                          placeholder="First Name" 
                          value={newAdmin.firstName} 
                          onChange={e => setNewAdmin({...newAdmin, firstName: e.target.value})} 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-gray-400">Last Name</label>
                        <Input 
                          placeholder="Last Name" 
                          value={newAdmin.lastName} 
                          onChange={e => setNewAdmin({...newAdmin, lastName: e.target.value})} 
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-gray-400">Email Address</label>
                      <Input 
                        placeholder="email@example.com" 
                        value={newAdmin.email} 
                        onChange={e => setNewAdmin({...newAdmin, email: e.target.value})} 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-gray-400">Position</label>
                        <Input 
                          placeholder="e.g. Operations Mgr" 
                          value={newAdmin.position} 
                          onChange={e => setNewAdmin({...newAdmin, position: e.target.value})} 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-gray-400">Dept.</label>
                        <Input 
                          placeholder="e.g. Finance" 
                          value={newAdmin.department} 
                          onChange={e => setNewAdmin({...newAdmin, department: e.target.value})} 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-gray-400">Employee ID</label>
                        <Input 
                          placeholder="EP-001" 
                          value={newAdmin.employeeId} 
                          onChange={e => setNewAdmin({...newAdmin, employeeId: e.target.value})} 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-gray-400">Mobile</label>
                        <Input 
                          placeholder="+20..." 
                          value={newAdmin.mobile} 
                          onChange={e => setNewAdmin({...newAdmin, mobile: e.target.value})} 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-gray-400">Birth Date</label>
                        <Input 
                          type="date" 
                          value={newAdmin.birthDate} 
                          onChange={e => setNewAdmin({...newAdmin, birthDate: e.target.value})} 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-gray-400">Login Password</label>
                        <Input 
                          type="password"
                          placeholder="••••••••" 
                          value={newAdmin.password} 
                          onChange={e => setNewAdmin({...newAdmin, password: e.target.value})} 
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center gap-2 mb-2">
                       <MapPin size={14} className="text-purple-600" />
                       <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Staff Address</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-400">Street</label>
                        <Input 
                          placeholder="Street" 
                          value={(newAdmin.addresses?.[0] as any)?.street || ''} 
                          onChange={e => {
                            const addrs = [...(newAdmin.addresses || [])];
                            if (!addrs[0]) addrs[0] = {} as any;
                            (addrs[0] as any).street = e.target.value;
                            setNewAdmin({...newAdmin, addresses: addrs});
                          }} 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-400">Building</label>
                        <Input 
                          placeholder="Bldg" 
                          value={(newAdmin.addresses?.[0] as any)?.building || ''} 
                          onChange={e => {
                            const addrs = [...(newAdmin.addresses || [])];
                            if (!addrs[0]) addrs[0] = {} as any;
                            (addrs[0] as any).building = e.target.value;
                            setNewAdmin({...newAdmin, addresses: addrs});
                          }} 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-400">City</label>
                        <Input 
                          placeholder="City" 
                          value={(newAdmin.addresses?.[0] as any)?.city || ''} 
                          onChange={e => {
                            const addrs = [...(newAdmin.addresses || [])];
                            if (!addrs[0]) addrs[0] = {} as any;
                            (addrs[0] as any).city = e.target.value;
                            setNewAdmin({...newAdmin, addresses: addrs});
                          }} 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-400">State/Area</label>
                        <Input 
                          placeholder="Area" 
                          value={(newAdmin.addresses?.[0] as any)?.state || ''} 
                          onChange={e => {
                            const addrs = [...(newAdmin.addresses || [])];
                            if (!addrs[0]) addrs[0] = {} as any;
                            (addrs[0] as any).state = e.target.value;
                            setNewAdmin({...newAdmin, addresses: addrs});
                          }} 
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddLocalAdmin} className="w-full bg-purple-600 hover:bg-purple-700 font-bold">
                      Create Admin Profile
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
                <DialogContent className="sm:max-w-[425px] bg-white">
                  <DialogHeader>
                    <DialogTitle>Edit User Profile</DialogTitle>
                    <DialogDescription>
                      Modify account details for {editUserData.firstName} {editUserData.lastName}.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-gray-400">First Name</label>
                        <Input 
                          value={editUserData.firstName || ''} 
                          onChange={e => setEditUserData({...editUserData, firstName: e.target.value})} 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-gray-400">Last Name</label>
                        <Input 
                          value={editUserData.lastName || ''} 
                          onChange={e => setEditUserData({...editUserData, lastName: e.target.value})} 
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-gray-400">Email Address</label>
                      <Input 
                        value={editUserData.email || ''} 
                        onChange={e => setEditUserData({...editUserData, email: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-gray-400">Mobile</label>
                      <Input 
                        value={editUserData.mobile || ''} 
                        onChange={e => setEditUserData({...editUserData, mobile: e.target.value})} 
                      />
                    </div>
                    {editUserData.role === 'admin' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-gray-400">Position</label>
                            <Input 
                              value={editUserData.position || ''} 
                              onChange={e => setEditUserData({...editUserData, position: e.target.value})} 
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-gray-400">Dept.</label>
                            <Input 
                              value={editUserData.department || ''} 
                              onChange={e => setEditUserData({...editUserData, department: e.target.value})} 
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase text-gray-400">Employee ID</label>
                          <Input 
                            value={editUserData.employeeId || ''} 
                            onChange={e => setEditUserData({...editUserData, employeeId: e.target.value})} 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-purple-400">Security Password (Optional Update)</label>
                          <Input 
                            type="password"
                            placeholder="Type new password or leave blank"
                            value={editUserData.password || ''} 
                            onChange={e => setEditUserData({...editUserData, password: e.target.value})} 
                            className="bg-purple-50/30 border-purple-100"
                          />
                        </div>
                      </>
                    )}
                  </div>
                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setIsEditUserDialogOpen(false)} className="flex-1">Cancel</Button>
                    <Button onClick={handleUpdateUser} className="flex-1 bg-green-600 hover:bg-green-700 font-bold text-white">
                      Save Changes
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.filter(u => u.role === 'admin').map(u => (
                  <div key={u.uid} className="flex flex-col p-4 bg-purple-50/30 rounded-xl border border-purple-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold bg-purple-100 text-purple-600 text-lg">
                          {u.firstName?.[0] || u.email?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-900 text-lg">{u.firstName} {u.lastName}</p>
                            {u.isPreRegistered && (
                              <Badge variant="outline" className="text-[10px] py-0 border-purple-200 text-purple-600 bg-white">
                                PRE-REGISTERED
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 italic">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => startEditUser(u)}
                          className="text-gray-500 hover:text-gray-900 border-gray-100 h-8 w-8"
                          title="Edit Profile"
                        >
                          <Edit2 size={14} />
                        </Button>
                        {u.email !== 'a.osaka@gmail.com' && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => toggleUserRole(u.uid, u.role)}
                              className="text-orange-500 hover:text-orange-700 hover:bg-orange-50 h-8 w-8"
                              title="Revoke Admin Permissions"
                            >
                              <TrendingDown size={14} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeleteUser(u.uid || u.id || '')}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                              title="Delete Account Permanently"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {(u.position || u.employeeId || u.department || u.joinDate) && (
                      <div className="mt-4 pt-4 border-t border-purple-100 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Position</p>
                          <p className="text-xs font-medium text-gray-700">{u.position || '-'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Department</p>
                          <p className="text-xs font-medium text-gray-700">{u.department || '-'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Employee ID</p>
                          <p className="text-xs font-medium text-gray-700 font-mono tracking-tighter text-purple-600 bg-purple-100/50 px-1 rounded inline-block">{u.employeeId || '-'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Joined</p>
                          <p className="text-xs font-medium text-gray-700">{u.joinDate || '-'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4 pt-6">
          <Card className="border-gray-100">
            <CardHeader>
              <CardTitle>Customer Accounts</CardTitle>
              <CardDescription>Registered shoppers and account management.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.filter(u => u.role === 'customer').map(u => (
                  <div key={u.uid} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold bg-green-100 text-green-600">
                        {u.firstName?.[0] || u.email?.[0]?.toUpperCase() || 'C'}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{u.firstName} {u.lastName} <span className="text-xs font-normal text-gray-500 italic">({u.email})</span></p>
                        <Badge variant="secondary" className="bg-green-50 text-green-600 uppercase">
                          {u.role}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => startEditUser(u)}
                        className="text-gray-500 hover:text-gray-900 border-gray-100 h-8 w-8"
                      >
                        <Edit2 size={14} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteUser(u.uid)}
                        className="text-red-500 hover:text-red-700 border-red-100 h-8 w-8"
                      >
                        <Trash2 size={14} />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => toggleUserRole(u.uid, u.role)}
                        className="text-purple-600 hover:text-purple-700 border-purple-100 h-8"
                      >
                        Make Admin
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
                  <h4 className="font-bold text-gray-900">Repair Staff Logins</h4>
                  <p className="text-sm text-gray-500">Regenerate missing credentials for all existing administrators.</p>
                </div>
                <Button variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50" onClick={repairStaffCredentials}>Repair Credentials</Button>
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

const StaffLoginView = ({ setView }: { setView: (v: string) => void }) => {
  const { loginWithEmployeeId } = useAuth();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !password) {
      toast.error("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      await loginWithEmployeeId(employeeId, password);
      setView('home');
    } catch (err: any) {
      console.error("Staff login error:", err);
      // Detailed error is already toasted in AuthProvider
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <Card className="border-none shadow-2xl shadow-purple-100 rounded-[2.5rem] overflow-hidden">
        <CardHeader className="bg-purple-600 text-white p-10 text-center space-y-2">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
            <Lock size={32} />
          </div>
          <CardTitle className="text-3xl font-bold">Staff Portal</CardTitle>
          <CardDescription className="text-purple-100 italic">
            Enter your employee credentials to access the admin dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-10">
          <form onSubmit={handleStaffSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Employee ID</label>
              <Input 
                placeholder="EP-001" 
                value={employeeId}
                onChange={e => setEmployeeId(e.target.value)}
                className="rounded-xl border-gray-100 bg-gray-50/50 h-12"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Security Password</label>
              <Input 
                type="password"
                placeholder="••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="rounded-xl border-gray-100 bg-gray-50/50 h-12"
              />
            </div>
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 bg-purple-600 hover:bg-purple-700 rounded-2xl text-white text-lg font-bold shadow-xl shadow-purple-100 mt-4 transition-transform active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Verify Identity"}
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setView('login')}
              className="w-full text-xs font-bold uppercase tracking-widest text-gray-400"
            >
              Return to Customer Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

const RegisterView = ({ setView, mode: initialMode = 'login' }: { setView: (v: string) => void, mode?: 'register' | 'login' }) => {
  const { register, loginWithEmail, login: loginWithGoogle } = useAuth();
  const [mode, setMode] = useState<'register' | 'login'>(initialMode);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    birthDate: '',
    gender: 'male' as 'male' | 'female',
    password: '',
    employeeId: '',
    // Detailed Address Fields
    street: '',
    building: '',
    apartment: '',
    floor: '',
    city: '',
    state: '',
    country: 'Egypt',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined
  });
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const getGeoLocation = () => {
    setLocating(true);
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({ 
          ...prev, 
          latitude, 
          longitude,
          street: prev.street || 'Located via GPS'
        }));
        toast.success("Location pinned successfully!");
        setLocating(false);
      },
      () => {
        toast.error("Unable to retrieve your location. Please enter manually.");
        setLocating(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submission started", { mode, email: formData.email });
    
    if (mode === 'register') {
      // Manual validation to provide better feedback
      const requiredFields = ['firstName', 'lastName', 'email', 'mobile', 'birthDate', 'password', 'street', 'building', 'city', 'state'];
      for (const field of requiredFields) {
        if (!formData[field as keyof typeof formData]) {
          toast.error(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field.`);
          return;
        }
      }
    } else {
      if (!formData.email || !formData.password) {
        toast.error("Please fill in both email and password.");
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        const addressData: Address = {
          label: 'Primary',
          street: formData.street || '',
          building: formData.building || '',
          apartment: formData.apartment || '',
          floor: formData.floor || '',
          city: formData.city || '',
          state: formData.state || '',
          country: formData.country || 'Egypt',
          latitude: formData.latitude ?? null,
          longitude: formData.longitude ?? null,
          formattedAddress: `${formData.building || ''}, ${formData.street || ''}, ${formData.city || ''}, ${formData.country || 'Egypt'}`
        } as any;
        console.log("Registering with address:", addressData);
        await register(formData.email, formData.password, { ...formData, addressData });
        setView('verification');
      } else {
        await loginWithEmail(formData.email, formData.password);
        setView('home');
      }
    } catch (err: any) {
      console.error("Form submission error:", err);
      toast.error(err.message || "An unexpected error occurred during submission");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <Card className="border-none shadow-2xl shadow-gray-100 rounded-[2.5rem] overflow-hidden">
        <CardHeader className="bg-green-600 text-white p-10 text-center space-y-2">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
            <User size={32} />
          </div>
          <CardTitle className="text-3xl font-bold">
            {mode === 'register' ? 'Create Account' : 'Welcome Back'}
          </CardTitle>
          <CardDescription className="text-green-100 italic">
            {mode === 'register' ? 'Join AminMart for the freshest groceries' : 'Login to your boutique grocery store'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-10">
          <Tabs value={mode} onValueChange={(v: any) => setMode(v)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100 p-1 rounded-2xl h-12">
              <TabsTrigger value="login" className="rounded-xl font-bold">Sign In</TabsTrigger>
              <TabsTrigger value="register" className="rounded-xl font-bold">Register</TabsTrigger>
            </TabsList>
            
            <form onSubmit={handleSubmit} noValidate className="space-y-4 text-left">
              {mode === 'register' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">First Name</label>
                  <Input 
                    id="firstName"
                    required 
                    placeholder="John" 
                    className="rounded-xl border-gray-100 bg-gray-50/50"
                    value={formData.firstName}
                    onChange={e => setFormData({...formData, firstName: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Last Name</label>
                  <Input 
                    id="lastName"
                    required 
                    placeholder="Doe" 
                    className="rounded-xl border-gray-100 bg-gray-50/50"
                    value={formData.lastName}
                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Email Address</label>
              <Input 
                id="email"
                type="email" 
                required 
                placeholder="john@example.com" 
                className="rounded-xl border-gray-100 bg-gray-50/50"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            {mode === 'register' && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Mobile Number</label>
                  <Input 
                    id="mobile"
                    required 
                    placeholder="+20 123 456 7890" 
                    className="rounded-xl border-gray-100 bg-gray-50/50"
                    value={formData.mobile}
                    onChange={e => setFormData({...formData, mobile: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Birth Date</label>
                    <Input 
                      id="birthDate"
                      type="date" 
                      required 
                      className="rounded-xl border-gray-100 bg-gray-50/50"
                      value={formData.birthDate}
                      onChange={e => setFormData({...formData, birthDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Gender</label>
                    <Select 
                      defaultValue="male" 
                      onValueChange={(v: any) => setFormData({...formData, gender: v})}
                    >
                      <SelectTrigger className="rounded-xl border-gray-100 bg-gray-50/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Password</label>
                  <Input 
                    id="password"
                    type="password" 
                    required 
                    placeholder="••••••••" 
                    className="rounded-xl border-gray-100 bg-gray-50/50"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>

                {mode === 'register' && (
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="text-green-600" size={18} />
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-700">Delivery Information</label>
                      </div>
                      <button 
                        type="button"
                        onClick={getGeoLocation}
                        disabled={locating}
                        className="text-[10px] font-bold text-green-600 flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-full hover:bg-green-100 transition-colors"
                      >
                        {locating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
                        Pin current location
                      </button>
                    </div>

                    {formData.latitude && formData.longitude && (
                      <div className="rounded-2xl overflow-hidden border border-gray-100 h-40 relative shadow-inner">
                        <iframe 
                          width="100%" 
                          height="100%" 
                          frameBorder="0" 
                          scrolling="no" 
                          marginHeight={0} 
                          marginWidth={0} 
                          src={`https://maps.google.com/maps?q=${formData.latitude},${formData.longitude}&z=15&output=embed`}
                        />
                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-[8px] font-bold border border-gray-100 shadow-sm uppercase tracking-tighter">Verified Location</div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Street Name</label>
                        <Input 
                          id="street"
                          required 
                          placeholder="El-Nasr St." 
                          className="rounded-xl border-gray-100 bg-gray-50/50"
                          value={formData.street}
                          onChange={e => setFormData({...formData, street: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Building / Villa</label>
                        <Input 
                          id="building"
                          required 
                          placeholder="No. 42" 
                          className="rounded-xl border-gray-100 bg-gray-50/50"
                          value={formData.building}
                          onChange={e => setFormData({...formData, building: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Apt. Number</label>
                        <Input 
                          placeholder="Unit 10" 
                          className="rounded-xl border-gray-100 bg-gray-50/50"
                          value={formData.apartment}
                          onChange={e => setFormData({...formData, apartment: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Floor</label>
                        <Input 
                          placeholder="3rd Floor" 
                          className="rounded-xl border-gray-100 bg-gray-50/50"
                          value={formData.floor}
                          onChange={e => setFormData({...formData, floor: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">City</label>
                        <Input 
                          id="city"
                          required 
                          placeholder="Cairo" 
                          className="rounded-xl border-gray-100 bg-gray-50/50"
                          value={formData.city}
                          onChange={e => setFormData({...formData, city: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">State / Area</label>
                        <Input 
                          id="state"
                          required 
                          placeholder="Maadi" 
                          className="rounded-xl border-gray-100 bg-gray-50/50"
                          value={formData.state}
                          onChange={e => setFormData({...formData, state: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Country</label>
                      <Input 
                        required 
                        readOnly
                        className="rounded-xl border-gray-100 bg-gray-100 text-gray-400 cursor-not-allowed"
                        value={formData.country}
                      />
                    </div>
                  </div>
              )}

              <Button 
                type="submit"
                disabled={loading} 
                className="w-full h-14 bg-green-600 hover:bg-green-700 rounded-2xl text-white text-lg font-bold shadow-xl shadow-green-100 mt-4 transition-transform active:scale-95"
              >
                {loading ? "Loading..." : mode === 'register' ? 'Join AminMart' : 'Sign In'}
              </Button>
            
            {mode === 'login' && (
              <div className="pt-8 space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-100"></span></div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-tighter"><span className="bg-white px-2 text-gray-400 font-bold">Or continue with</span></div>
                </div>
                <Button type="button" variant="outline" className="w-full h-12 rounded-2xl border-gray-100 font-semibold" onClick={loginWithGoogle}>
                  <img 
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                    className="w-5 h-5 mr-2" 
                    alt="Google"
                  />
                  Google Account
                </Button>
              </div>
            )}
          </form>
        </Tabs>

          <p className="text-center text-sm text-gray-500 mt-6 pb-4">
            {mode === 'register' ? 'Already have an account?' : "Don't have an account?"}
            <button 
              type="button"
              onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
              className="ml-1 text-green-600 font-bold hover:underline"
            >
              {mode === 'register' ? 'Login' : 'Register'}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

const VerificationView = ({ setView }: { setView: (v: string) => void }) => {
  const { profile, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleCheckStatus = async () => {
    setLoading(true);
    try {
      await refreshUser();
      // AuthProvider's refreshUser will update profile.isVerified automatically if email is verified
      toast.success('Checking status...');
    } catch (err) {
      toast.error('Failed to refresh status');
    } finally {
      setLoading(false);
    }
  };

  // Auto-redirect if verified
  useEffect(() => {
    if (profile?.isVerified) {
      toast.success('Account verified!');
      setView('home');
    }
  }, [profile?.isVerified, setView]);

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <Card className="border-none shadow-2xl shadow-gray-100 rounded-[2.5rem] overflow-hidden text-center">
        <CardHeader className="p-10 space-y-4">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <Lock size={32} />
          </div>
          <CardTitle className="text-3xl font-bold">Verify Your Email</CardTitle>
          <CardDescription className="text-gray-500">
            A real verification link has been sent to:<br />
            <b className="text-green-600">{profile?.email}</b><br /><br />
            Please check your inbox (and spam folder) and click the link to verify your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-10 space-y-8">
          <div className="bg-gray-50 p-6 rounded-2xl text-xs text-gray-500 leading-relaxed text-left space-y-2 border border-gray-100">
            <div className="flex gap-2">
              <CheckCircle size={14} className="text-green-600 shrink-0" />
              <span>Identity verification link sent via Firebase.</span>
            </div>
            <div className="flex gap-2">
              <CheckCircle size={14} className="text-green-600 shrink-0" />
              <span>PIN codes via SMS/Mobile (Twilio/Resend) require an API key to be configured.</span>
            </div>
          </div>

          <Button 
            disabled={loading} 
            onClick={handleCheckStatus}
            className="w-full h-12 bg-green-600 hover:bg-green-700 rounded-full text-white font-bold shadow-xl shadow-green-100"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'I have verified my email'}
          </Button>
          
          <p className="text-sm text-gray-400">
            Didn't receive the email? <button 
              onClick={() => toast.info("Firebase allows resending after a short delay.")}
              className="text-green-600 font-bold hover:underline"
            >Resend Link</button>
          </p>
        </CardContent>
      </Card>
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
  const { profile, loading } = useAuth();

  // Redirect to verification if not verified
  useEffect(() => {
    if (profile && !profile.isVerified && view !== 'verification') {
      setView('verification');
    }
  }, [profile, view]);

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
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {view === 'home' && <HomeView />}
            {view === 'cart' && <CartView setView={setView} />}
            {view === 'admin' && <AdminView />}
            {view === 'orders' && <OrdersView />}
            {view === 'register' && <RegisterView setView={setView} mode="register" />}
            {view === 'login' && <RegisterView setView={setView} mode="login" />}
            {view === 'staff-login' && <StaffLoginView setView={setView} />}
            {view === 'verification' && <VerificationView setView={setView} />}
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
