import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  ShoppingCart, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  ShoppingBag, 
  BookMarked,
  LogOut,
  Users,
  ClipboardList,
  Shield,
  User,
  PlusCircle,
  TrendingUp,
  X
} from 'lucide-react';

function App() {
  // Session State
  const [currentUser, setCurrentUser] = useState(null);
  const [sessionChecking, setSessionChecking] = useState(true);

  // Authentication Forms State
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Navigation Tab
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'my-orders' (for User) OR 'books' | 'orders' | 'users' (for Admin)

  // Catalog / Books State
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cart State (User)
  const [cart, setCart] = useState([]);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');

  // Add Book Form State (Admin)
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    isbn: '',
    price: '',
    stockQuantity: '',
    categoryName: ''
  });
  const [addBookLoading, setAddBookLoading] = useState(false);
  const [addBookError, setAddBookError] = useState('');
  const [addBookSuccess, setAddBookSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Inline Stock Editing (Admin)
  const [editingStockId, setEditingStockId] = useState(null);
  const [editingStockValue, setEditingStockValue] = useState('');

  // Admin Data lists
  const [allOrders, setAllOrders] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);

  // User Data lists
  const [myOrders, setMyOrders] = useState([]);
  const [myOrdersLoading, setMyOrdersLoading] = useState(false);

  // Check current session
  const checkSession = async () => {
    try {
      const response = await fetch('/api/users/me');
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data);
        // Default tabs based on role
        if (data.role === 'ADMIN') {
          setActiveTab('books');
        } else {
          setActiveTab('catalog');
        }
      }
    } catch (err) {
      console.log('No active session.');
    } finally {
      setSessionChecking(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  // Fetch Catalog Books
  const fetchBooks = async (query = '') => {
    setLoading(true);
    setError('');
    try {
      const url = query ? `/api/books?search=${encodeURIComponent(query)}` : '/api/books';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch books');
      const data = await response.json();
      setBooks(data);
    } catch (err) {
      setError(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data depending on user role and active tab
  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.role === 'ADMIN') {
      if (activeTab === 'books') {
        fetchBooks(search);
      } else if (activeTab === 'orders') {
        fetchAdminOrders();
      } else if (activeTab === 'users') {
        fetchAdminUsers();
      }
    } else {
      if (activeTab === 'catalog') {
        fetchBooks(search);
      } else if (activeTab === 'my-orders') {
        fetchMyOrders();
      }
    }
  }, [currentUser, activeTab]);

  // Debounced search for catalog/books
  useEffect(() => {
    if (!currentUser) return;
    if (activeTab === 'catalog' || activeTab === 'books') {
      const handler = setTimeout(() => {
        fetchBooks(search);
      }, 300);
      return () => clearTimeout(handler);
    }
  }, [search]);

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!authUsername.trim() || !authPassword.trim()) {
      setAuthError('All fields are mandatory');
      return;
    }

    setAuthLoading(true);
    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authUsername.trim(), password: authPassword.trim() })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Login failed');
      }

      const userData = await response.json();
      setCurrentUser(userData);
      setAuthUsername('');
      setAuthPassword('');
      if (userData.role === 'ADMIN') {
        setActiveTab('books');
      } else {
        setActiveTab('catalog');
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Signup (creates standard User role accounts)
  const handleSignup = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!authUsername.trim() || !authPassword.trim()) {
      setAuthError('All fields are mandatory');
      return;
    }
    if (authUsername.trim().length < 3) {
      setAuthError('Username must be at least 3 characters');
      return;
    }
    if (authPassword.trim().length < 5) {
      setAuthError('Password must be at least 5 characters');
      return;
    }

    setAuthLoading(true);
    try {
      const response = await fetch('/api/users/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authUsername.trim(), password: authPassword.trim() })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Signup failed');
      }

      const userData = await response.json();
      setCurrentUser(userData);
      setAuthUsername('');
      setAuthPassword('');
      setActiveTab('catalog');
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/users/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error');
    }
    setCurrentUser(null);
    setCart([]);
    setMyOrders([]);
    setAllOrders([]);
    setAllUsers([]);
  };

  /* ================== USER FUNCTIONALITY ================== */

  const fetchMyOrders = async () => {
    setMyOrdersLoading(true);
    try {
      const response = await fetch('/api/orders/my');
      if (response.ok) {
        const data = await response.json();
        setMyOrders(data);
      }
    } catch (err) {
      console.error('Failed to load personal orders.');
    } finally {
      setMyOrdersLoading(false);
    }
  };

  const addToCart = (book) => {
    const existingIndex = cart.findIndex(item => item.book.id === book.id);
    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty >= book.stockQuantity) {
        alert(`Cannot add more. Only ${book.stockQuantity} items in stock.`);
        return;
      }
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([...cart, { book, quantity: 1 }]);
    }
  };

  const updateQuantity = (bookId, qty) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    if (qty > book.stockQuantity) {
      alert(`Only ${book.stockQuantity} items available in stock.`);
      return;
    }
    if (qty < 1) return;

    const updated = cart.map(item => {
      if (item.book.id === bookId) {
        return { ...item, quantity: qty };
      }
      return item;
    });
    setCart(updated);
  };

  const removeFromCart = (bookId) => {
    setCart(cart.filter(item => item.book.id !== bookId));
  };

  const cartTotal = cart.reduce((total, item) => total + (item.book.price * item.quantity), 0);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      setCheckoutError('Your cart is empty');
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError('');
    setCheckoutSuccess(null);

    const payload = {
      customerName: currentUser.username, // Auto-bind authenticated username
      items: cart.map(item => ({
        bookId: item.book.id,
        quantity: item.quantity
      }))
    };

    try {
      const response = await fetch('/api/books/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Checkout failed');
      }

      const orderResult = await response.json();
      setCheckoutSuccess(orderResult);
      setCart([]);
      fetchBooks(); // Refresh catalog stock levels
    } catch (err) {
      setCheckoutError(err.message || 'Server error during checkout');
    } finally {
      setCheckoutLoading(false);
    }
  };

  /* ================== ADMIN FUNCTIONALITY ================== */

  const fetchAdminOrders = async () => {
    setOrdersLoading(true);
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        setAllOrders(data);
      }
    } catch (err) {
      console.error('Failed to load admin orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchAdminUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data);
      }
    } catch (err) {
      console.error('Failed to load users list');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    setAddBookLoading(true);
    setAddBookError('');
    setAddBookSuccess(false);
    setValidationErrors({});

    const errors = {};
    if (!newBook.title.trim()) errors.title = 'Title is mandatory';
    if (!newBook.author.trim()) errors.author = 'Author is mandatory';
    if (!newBook.isbn.trim()) errors.isbn = 'ISBN is mandatory';
    if (!newBook.price || parseFloat(newBook.price) <= 0) errors.price = 'Price must be greater than zero';
    if (!newBook.stockQuantity || parseInt(newBook.stockQuantity) < 0) errors.stockQuantity = 'Stock cannot be negative';
    if (!newBook.categoryName.trim()) errors.categoryName = 'Category assignment is mandatory';

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setAddBookLoading(false);
      return;
    }

    const payload = {
      title: newBook.title.trim(),
      author: newBook.author.trim(),
      isbn: newBook.isbn.trim(),
      price: parseFloat(newBook.price),
      stockQuantity: parseInt(newBook.stockQuantity),
      category: {
        name: newBook.categoryName.trim()
      }
    };

    try {
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const apiErrors = {};
          errorData.errors.forEach(err => {
            apiErrors[err.field || 'general'] = err.defaultMessage;
          });
          setValidationErrors(apiErrors);
          throw new Error('Validation failed');
        }
        throw new Error(errorData.message || 'Failed to create book');
      }

      setAddBookSuccess(true);
      setNewBook({
        title: '',
        author: '',
        isbn: '',
        price: '',
        stockQuantity: '',
        categoryName: ''
      });
      fetchBooks();
    } catch (err) {
      if (err.message !== 'Validation failed') {
        setAddBookError(err.message || 'Server error during creation');
      }
    } finally {
      setAddBookLoading(false);
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;
    try {
      const response = await fetch(`/api/books/${bookId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchBooks();
      } else {
        const errData = await response.json();
        alert(errData.message || 'Failed to delete book');
      }
    } catch (err) {
      alert('Error connecting to the server');
    }
  };

  const handleUpdateStock = async (bookId) => {
    const qty = parseInt(editingStockValue);
    if (isNaN(qty) || qty < 0) {
      alert('Please enter a valid non-negative number for stock.');
      return;
    }

    try {
      const response = await fetch(`/api/books/${bookId}/stock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockQuantity: qty })
      });
      if (response.ok) {
        setEditingStockId(null);
        setEditingStockValue('');
        fetchBooks();
      } else {
        const errData = await response.json();
        alert(errData.message || 'Failed to update stock');
      }
    } catch (err) {
      alert('Error updating stock');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        fetchAdminOrders();
      } else {
        const errData = await response.json();
        alert(errData.message || 'Failed to update order status');
      }
    } catch (err) {
      alert('Error updating order');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user account?')) return;
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchAdminUsers();
      } else {
        const errData = await response.json();
        alert(errData.message || 'Failed to delete user');
      }
    } catch (err) {
      alert('Error deleting user');
    }
  };

  // Rendering Loader on Initial Session Check
  if (sessionChecking) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center flex-col gap-4">
        <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
        <p className="text-gray-400 text-sm">Authenticating session state...</p>
      </div>
    );
  }

  // Auth Screen (Login / Sign Up)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center px-6 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-650/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-900/10 rounded-full blur-3xl" />

        <div className="w-full max-w-md bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl relative z-10">
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="p-3 bg-violet-950/50 border border-violet-850 rounded-xl">
              <BookMarked className="w-8 h-8 text-violet-500" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white m-0">
              PageTurn <span className="text-violet-500">Bookstore</span>
            </h1>
            <p className="text-xs text-gray-450 uppercase tracking-wider font-semibold">
              {authMode === 'login' ? 'Sign in to your account' : 'Register a new account'}
            </p>
          </div>

          {authError && (
            <div className="bg-red-950/30 border border-red-900/50 text-red-400 rounded-lg p-3 text-xs mb-5 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {authError}
            </div>
          )}

          <form onSubmit={authMode === 'login' ? handleLogin : handleSignup} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs text-gray-400 font-medium mb-1.5">Username</label>
              <input
                type="text"
                id="username-input"
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full bg-gray-950/70 border border-gray-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 font-medium mb-1.5">Password</label>
              <input
                type="password"
                id="password-input"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-gray-950/70 border border-gray-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              id="submit-auth-btn"
              disabled={authLoading}
              className="w-full bg-violet-650 hover:bg-violet-600 text-white font-bold py-2.5 rounded-lg text-sm shadow-lg hover:shadow-violet-500/10 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed mt-2"
            >
              {authLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {authMode === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          {/* Toggle login/signup */}
          <div className="mt-6 pt-6 border-t border-gray-850 text-center text-xs text-gray-400">
            {authMode === 'login' ? (
              <p>
                New reader here?{' '}
                <button 
                  type="button"
                  onClick={() => { setAuthMode('signup'); setAuthError(''); }}
                  className="text-violet-400 font-bold hover:underline cursor-pointer bg-transparent border-0"
                >
                  Create an account
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button 
                  type="button"
                  onClick={() => { setAuthMode('login'); setAuthError(''); }}
                  className="text-violet-400 font-bold hover:underline cursor-pointer bg-transparent border-0"
                >
                  Sign in instead
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Auth is loaded: Render Dashboard based on Roles
  const isAdmin = currentUser.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 antialiased flex flex-col">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#111827]/80 backdrop-blur-md border-b border-gray-800 px-6 py-4 shadow-lg flex-shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BookMarked className="w-7 h-7 text-violet-500" />
            <h1 className="text-xl font-bold tracking-tight text-white m-0">
              PageTurn <span className="text-violet-500">Bookstore</span>
            </h1>
          </div>

          {/* Role Navigation Links */}
          <div className="flex items-center gap-2">
            {!isAdmin ? (
              <>
                <button
                  onClick={() => setActiveTab('catalog')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'catalog' 
                      ? 'bg-violet-650 text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-850'
                  }`}
                >
                  Book Catalog
                </button>
                <button
                  onClick={() => setActiveTab('my-orders')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'my-orders' 
                      ? 'bg-violet-650 text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-850'
                  }`}
                >
                  My Orders
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('books')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'books' 
                      ? 'bg-violet-650 text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-850'
                  }`}
                >
                  Manage Books
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'orders' 
                      ? 'bg-violet-650 text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-850'
                  }`}
                >
                  Manage Orders
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'users' 
                      ? 'bg-violet-650 text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-850'
                  }`}
                >
                  Manage Users
                </button>
              </>
            )}
          </div>

          {/* User profile & Logout */}
          <div className="flex items-center gap-3 bg-gray-950/60 border border-gray-855 px-3.5 py-1.5 rounded-xl">
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <Shield className="w-4 h-4 text-violet-400" />
              ) : (
                <User className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-xs font-bold text-white leading-none">
                {currentUser.username}
              </span>
              <span className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider">
                ({currentUser.role})
              </span>
            </div>
            <div className="w-px h-4 bg-gray-800" />
            <button
              onClick={handleLogout}
              className="p-1 hover:bg-gray-900 rounded-lg text-gray-400 hover:text-red-400 transition-colors cursor-pointer border-0 bg-transparent"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main View Area */}
      <main className="max-w-7xl mx-auto px-6 py-8 w-full flex-grow flex flex-col gap-6">
        
        {/* ================== TAB: USER CATALOG ================== */}
        {activeTab === 'catalog' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
            {/* Catalog Grid */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-lg font-bold flex items-center gap-2 text-white m-0">
                  <BookOpen className="w-5 h-5 text-violet-500" />
                  Available Books
                </h2>

                {/* Catalog Search */}
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search title, author, category..."
                    className="w-full bg-gray-955/60 border border-gray-850 rounded-lg py-1.5 pl-9 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 bg-gray-900/10 border border-gray-900 rounded-xl">
                  <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
                  <p className="text-gray-400 text-sm">Querying database catalog...</p>
                </div>
              ) : error ? (
                <div className="bg-red-955/30 border border-red-900/50 rounded-lg p-6 text-center">
                  <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                  <h3 className="text-red-400 font-medium mb-1">Catalog Connection Lost</h3>
                  <p className="text-gray-400 text-sm">{error}</p>
                </div>
              ) : books.length === 0 ? (
                <div className="text-center py-16 bg-gray-900/20 border border-gray-850 border-dashed rounded-xl">
                  <ShoppingBag className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-455 text-sm m-0">No books found in the catalog.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {books.map((book) => {
                    const isOutOfStock = book.stockQuantity === 0;
                    const isLowStock = book.stockQuantity > 0 && book.stockQuantity < 5;
                    return (
                      <div 
                        key={book.id}
                        className="bg-gray-900/35 border border-gray-850 rounded-xl p-5 flex flex-col justify-between hover:border-gray-700 hover:shadow-xl transition-all duration-300"
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400 bg-violet-955/40 border border-violet-850 px-2.5 py-0.5 rounded">
                              {book.category?.name || 'Uncategorized'}
                            </span>
                            
                            {isOutOfStock ? (
                              <span className="text-[9px] uppercase font-extrabold text-red-400 bg-red-955/40 border border-red-900/40 px-2 py-0.5 rounded">
                                Out of Stock
                              </span>
                            ) : isLowStock ? (
                              <span className="text-[9px] uppercase font-extrabold text-amber-400 bg-amber-955/40 border border-amber-900/40 px-2 py-0.5 rounded">
                                Low Stock ({book.stockQuantity})
                              </span>
                            ) : (
                              <span className="text-[9px] uppercase font-extrabold text-emerald-400 bg-emerald-955/40 border border-emerald-900/40 px-2 py-0.5 rounded">
                                In Stock ({book.stockQuantity})
                              </span>
                            )}
                          </div>

                          <h3 className="text-base font-bold text-white mb-1 leading-snug">{book.title}</h3>
                          <p className="text-xs text-gray-400 mb-2">by {book.author}</p>
                          <p className="text-[10px] text-gray-500 font-mono mb-4">ISBN: {book.isbn}</p>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-850">
                          <span className="text-lg font-extrabold text-white">${book.price.toFixed(2)}</span>
                          <button
                            id={`add-to-cart-${book.id}`}
                            onClick={() => addToCart(book)}
                            disabled={isOutOfStock}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase transition-all duration-300 ${
                              isOutOfStock 
                                ? 'bg-gray-850 text-gray-500 cursor-not-allowed shadow-none' 
                                : 'bg-violet-650 hover:bg-violet-600 text-white cursor-pointer active:scale-95'
                            }`}
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sidebar Shopping Cart */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <section className="bg-gray-900/35 border border-gray-850 rounded-xl p-5 flex flex-col">
                <h2 className="text-base font-bold mb-4 flex items-center gap-2 text-white">
                  <ShoppingCart className="w-4.5 h-4.5 text-violet-500" />
                  Your Cart
                </h2>

                {checkoutSuccess && (
                  <div className="bg-emerald-955/30 border border-emerald-900/40 text-emerald-400 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2 font-bold text-xs">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      Order Placed!
                    </div>
                    <p className="text-[10px] text-gray-300 leading-normal m-0">
                      Order ID: <strong>#{checkoutSuccess.id}</strong><br />
                      Total Price: <strong>${checkoutSuccess.totalPrice.toFixed(2)}</strong><br />
                      Status: <span className="font-bold text-emerald-400">{checkoutSuccess.orderStatus}</span>
                    </p>
                  </div>
                )}

                {checkoutError && (
                  <div className="bg-red-955/30 border border-red-900/50 text-red-400 rounded-lg p-3 text-xs mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {checkoutError}
                  </div>
                )}

                {cart.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-gray-850 rounded-lg">
                    <ShoppingCart className="w-8 h-8 text-gray-800 mx-auto mb-2" />
                    <p className="text-gray-500 text-xs m-0">Your shopping cart is empty.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="max-h-[260px] overflow-y-auto pr-1 flex flex-col gap-2">
                      {cart.map((item) => (
                        <div 
                          key={item.book.id}
                          className="bg-gray-955/60 border border-gray-850 p-2.5 rounded-lg flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <h4 className="font-semibold text-white text-[11px] truncate leading-tight m-0">{item.book.title}</h4>
                            <p className="text-[9px] text-gray-500 font-mono m-0">${item.book.price.toFixed(2)} each</p>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.book.id, parseInt(e.target.value))}
                              className="w-10 bg-gray-900 border border-gray-800 rounded px-1.5 py-0.5 text-center text-xs focus:ring-1 focus:ring-violet-500 text-white"
                            />
                            <button
                              onClick={() => removeFromCart(item.book.id)}
                              className="p-1 hover:bg-gray-900 border border-transparent rounded text-gray-400 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-gray-850">
                      <div className="flex justify-between items-center mb-3 text-xs">
                        <span className="text-gray-400">Total Price:</span>
                        <span className="text-base font-bold text-white">${cartTotal.toFixed(2)}</span>
                      </div>

                      <form onSubmit={handleCheckout}>
                        <button
                          type="submit"
                          id="checkout-btn"
                          disabled={checkoutLoading}
                          className="w-full bg-violet-650 hover:bg-violet-600 text-white font-bold py-2 rounded-lg text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {checkoutLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          Submit Checkout
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        )}

        {/* ================== TAB: USER MY ORDERS ================== */}
        {activeTab === 'my-orders' && (
          <div className="flex flex-col gap-5 w-full">
            <h2 className="text-lg font-bold flex items-center gap-2 text-white m-0">
              <ClipboardList className="w-5 h-5 text-violet-500" />
              Your Order History
            </h2>

            {myOrdersLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
              </div>
            ) : myOrders.length === 0 ? (
              <div className="text-center py-16 bg-gray-900/20 border border-gray-850 border-dashed rounded-xl">
                <ClipboardList className="w-12 h-12 text-gray-800 mx-auto mb-3" />
                <p className="text-gray-400 text-sm m-0">You have not placed any orders yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {myOrders.map((order) => {
                  const statusColors = {
                    PENDING: 'bg-amber-955/30 border-amber-905 text-amber-400',
                    COMPLETED: 'bg-emerald-955/30 border-emerald-905 text-emerald-400',
                    CANCELLED: 'bg-red-955/30 border-red-905 text-red-400'
                  };
                  const statusClass = statusColors[order.orderStatus] || 'bg-gray-800 text-gray-450';

                  return (
                    <div 
                      key={order.id}
                      className="bg-gray-900/35 border border-gray-850 rounded-xl p-5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-850 pb-3 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-white">Order #{order.id}</span>
                          <span className={`text-[10px] uppercase font-bold border px-2 py-0.5 rounded ${statusClass}`}>
                            {order.orderStatus}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-550">
                          {new Date(order.orderDate).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex flex-col gap-2">
                        {order.orderItems.map((item) => (
                          <div key={item.id} className="flex justify-between items-center text-xs">
                            <span className="text-gray-300">
                              {item.book?.title || 'Unknown Title'} <span className="text-gray-500 font-medium">x{item.quantity}</span>
                            </span>
                            <span className="text-gray-400">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-gray-850 pt-3 mt-3 flex justify-between items-center text-xs">
                        <span className="text-gray-400">Total Price:</span>
                        <span className="text-sm font-extrabold text-white">${order.totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================== TAB: ADMIN MANAGE BOOKS ================== */}
        {activeTab === 'books' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
            {/* Books Inventory Table */}
            <div className="lg:col-span-8 flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-lg font-bold flex items-center gap-2 text-white m-0">
                  <TrendingUp className="w-5 h-5 text-violet-500" />
                  Inventory Catalog ({books.length})
                </h2>

                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search books..."
                    className="w-full bg-gray-950/60 border border-gray-850 rounded-lg py-1.5 pl-9 pr-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
                </div>
              ) : books.length === 0 ? (
                <div className="text-center py-16 bg-gray-900/20 border border-gray-850 border-dashed rounded-xl">
                  <BookOpen className="w-12 h-12 text-gray-800 mx-auto mb-3" />
                  <p className="text-gray-450 text-sm m-0">No books found in database catalog.</p>
                </div>
              ) : (
                <div className="overflow-x-auto bg-gray-900/35 border border-gray-850 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-850 text-gray-450 font-bold uppercase tracking-wider bg-gray-950/30">
                        <th className="p-4">Title / Author</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Price</th>
                        <th className="p-4">Stock</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {books.map((book) => (
                        <tr key={book.id} className="border-b border-gray-850 hover:bg-gray-900/20">
                          <td className="p-4">
                            <div className="font-bold text-white text-xs">{book.title}</div>
                            <div className="text-gray-500 text-[10px]">by {book.author} | ISBN: {book.isbn}</div>
                          </td>
                          <td className="p-4">
                            <span className="bg-violet-955/30 text-violet-400 border border-violet-900 px-2 py-0.5 rounded text-[10px]">
                              {book.category?.name || 'Uncategorized'}
                            </span>
                          </td>
                          <td className="p-4 text-white font-semibold">${book.price.toFixed(2)}</td>
                          <td className="p-4">
                            {editingStockId === book.id ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  value={editingStockValue}
                                  onChange={(e) => setEditingStockValue(e.target.value)}
                                  className="w-14 bg-gray-950 border border-gray-800 rounded px-1.5 py-0.5 text-center text-xs text-white"
                                />
                                <button
                                  onClick={() => handleUpdateStock(book.id)}
                                  className="px-2 py-0.5 bg-emerald-650 hover:bg-emerald-600 text-white rounded text-[10px] cursor-pointer"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => { setEditingStockId(null); setEditingStockValue(''); }}
                                  className="px-2 py-0.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-[10px] cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className={book.stockQuantity === 0 ? 'text-red-405 font-bold' : book.stockQuantity < 5 ? 'text-amber-405 font-bold' : 'text-emerald-450 font-bold'}>
                                  {book.stockQuantity}
                                </span>
                                <button
                                  onClick={() => { setEditingStockId(book.id); setEditingStockValue(book.stockQuantity.toString()); }}
                                  className="text-[10px] text-violet-450 hover:underline bg-transparent border-0 cursor-pointer p-0"
                                >
                                  Adjust
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleDeleteBook(book.id)}
                              className="p-1.5 hover:bg-gray-900 rounded text-gray-400 hover:text-red-405 transition-colors border-0 bg-transparent"
                              title="Delete Book"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Add Book Drawer Sidebar */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <section className="bg-gray-900/35 border border-gray-850 rounded-xl p-5">
                <h2 className="text-base font-bold mb-4 flex items-center gap-2 text-white">
                  <PlusCircle className="w-4.5 h-4.5 text-violet-500" />
                  Add Book
                </h2>

                {addBookSuccess && (
                  <div className="bg-emerald-955/30 border border-emerald-900/50 text-emerald-400 rounded-lg p-3 text-xs mb-4 flex items-center gap-2">
                    <CheckCircle className="w-4.5 h-4.5 flex-shrink-0" />
                    Book added successfully!
                  </div>
                )}

                {addBookError && (
                  <div className="bg-red-955/30 border border-red-900/50 text-red-400 rounded-lg p-3 text-xs mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0" />
                    {addBookError}
                  </div>
                )}

                <form onSubmit={handleAddBook} className="flex flex-col gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Title</label>
                    <input
                      type="text"
                      value={newBook.title}
                      onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                      placeholder="Book title"
                      className="w-full bg-gray-955/60 border border-gray-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-violet-500"
                    />
                    {validationErrors.title && <p className="text-red-404 text-[10px] mt-1 m-0">{validationErrors.title}</p>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Author</label>
                    <input
                      type="text"
                      value={newBook.author}
                      onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                      placeholder="Author name"
                      className="w-full bg-gray-955/60 border border-gray-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-violet-500"
                    />
                    {validationErrors.author && <p className="text-red-404 text-[10px] mt-1 m-0">{validationErrors.author}</p>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">ISBN</label>
                    <input
                      type="text"
                      value={newBook.isbn}
                      onChange={(e) => setNewBook({...newBook, isbn: e.target.value})}
                      placeholder="ISBN number"
                      className="w-full bg-gray-955/60 border border-gray-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-violet-500"
                    />
                    {validationErrors.isbn && <p className="text-red-404 text-[10px] mt-1 m-0">{validationErrors.isbn}</p>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Category</label>
                    <input
                      type="text"
                      value={newBook.categoryName}
                      onChange={(e) => setNewBook({...newBook, categoryName: e.target.value})}
                      placeholder="Category assignment"
                      className="w-full bg-gray-955/60 border border-gray-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-violet-500"
                    />
                    {validationErrors.categoryName && <p className="text-red-404 text-[10px] mt-1 m-0">{validationErrors.categoryName}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newBook.price}
                        onChange={(e) => setNewBook({...newBook, price: e.target.value})}
                        placeholder="0.00"
                        className="w-full bg-gray-955/60 border border-gray-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-violet-500"
                      />
                      {validationErrors.price && <p className="text-red-404 text-[10px] mt-1 m-0">{validationErrors.price}</p>}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Stock</label>
                      <input
                        type="number"
                        value={newBook.stockQuantity}
                        onChange={(e) => setNewBook({...newBook, stockQuantity: e.target.value})}
                        placeholder="0"
                        className="w-full bg-gray-955/60 border border-gray-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-violet-500"
                      />
                      {validationErrors.stockQuantity && <p className="text-red-404 text-[10px] mt-1 m-0">{validationErrors.stockQuantity}</p>}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={addBookLoading}
                    className="w-full bg-violet-650 hover:bg-violet-600 text-white font-bold py-2 rounded-lg text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed mt-2"
                  >
                    {addBookLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Add Title
                  </button>
                </form>
              </section>
            </div>
          </div>
        )}

        {/* ================== TAB: ADMIN MANAGE ORDERS ================== */}
        {activeTab === 'orders' && (
          <div className="flex flex-col gap-5 w-full">
            <h2 className="text-lg font-bold flex items-center gap-2 text-white m-0">
              <ClipboardList className="w-5 h-5 text-violet-500" />
              Customer Orders Control ({allOrders.length})
            </h2>

            {ordersLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
              </div>
            ) : allOrders.length === 0 ? (
              <div className="text-center py-16 bg-gray-900/20 border border-gray-850 border-dashed rounded-xl">
                <ClipboardList className="w-12 h-12 text-gray-800 mx-auto mb-3" />
                <p className="text-gray-450 text-sm m-0">No customer orders have been placed yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {allOrders.map((order) => {
                  const statusColors = {
                    PENDING: 'bg-amber-955/30 border-amber-900 text-amber-400',
                    COMPLETED: 'bg-emerald-955/30 border-emerald-900 text-emerald-450',
                    CANCELLED: 'bg-red-955/30 border-red-900 text-red-400'
                  };
                  const statusClass = statusColors[order.orderStatus] || 'bg-gray-800 text-gray-455';

                  return (
                    <div 
                      key={order.id}
                      className="bg-gray-900/35 border border-gray-850 rounded-xl p-5 flex flex-col gap-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-850 pb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-white">Order #{order.id}</span>
                          <span className={`text-[10px] uppercase font-bold border px-2 py-0.5 rounded ${statusClass}`}>
                            {order.orderStatus}
                          </span>
                        </div>
                        <span className="text-xs text-gray-550">
                          Placed: {new Date(order.orderDate).toLocaleString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-450 mb-1">Customer Account</div>
                          <div className="text-sm font-semibold text-white mb-3">
                            {order.user?.username || order.customerName}
                          </div>
                          
                          <div className="text-xs text-gray-450 mb-1">Order Items</div>
                          <div className="flex flex-col gap-1.5">
                            {order.orderItems.map((item) => (
                              <div key={item.id} className="text-xs text-gray-300">
                                {item.book?.title || 'Unknown Title'} <span className="text-gray-500 font-medium">x{item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col justify-between items-start sm:items-end gap-3">
                          <div>
                            <div className="text-xs text-gray-450 mb-1 text-left sm:text-right">Total Price</div>
                            <div className="text-base font-extrabold text-white">
                              ${order.totalPrice.toFixed(2)}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {order.orderStatus === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, 'COMPLETED')}
                                  className="px-3 py-1.5 bg-emerald-650 hover:bg-emerald-600 text-white rounded text-[10px] font-bold uppercase transition-colors cursor-pointer"
                                >
                                  Complete Order
                                </button>
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, 'CANCELLED')}
                                  className="px-3 py-1.5 bg-red-955 hover:bg-red-900 border border-red-900 text-red-400 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer"
                                >
                                  Cancel Order
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================== TAB: ADMIN MANAGE USERS ================== */}
        {activeTab === 'users' && (
          <div className="flex flex-col gap-5 w-full">
            <h2 className="text-lg font-bold flex items-center gap-2 text-white m-0">
              <Users className="w-5 h-5 text-violet-500" />
              Registered Accounts Controller
            </h2>

            {usersLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
              </div>
            ) : allUsers.length === 0 ? (
              <div className="text-center py-16 bg-gray-900/20 border border-gray-850 border-dashed rounded-xl">
                <Users className="w-12 h-12 text-gray-800 mx-auto mb-3" />
                <p className="text-gray-450 text-sm m-0">No registered users in the database.</p>
              </div>
            ) : (
              <div className="overflow-x-auto bg-gray-900/35 border border-gray-850 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-850 text-gray-455 font-bold uppercase tracking-wider bg-gray-950/30">
                      <th className="p-4">ID</th>
                      <th className="p-4">Username</th>
                      <th className="p-4">Account Type / Privilege</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map((u) => {
                      const isSelf = u.id === currentUser.id;
                      const isUserAdmin = u.role === 'ADMIN';

                      return (
                        <tr key={u.id} className="border-b border-gray-850 hover:bg-gray-900/20">
                          <td className="p-4 text-gray-550 font-mono">#{u.id}</td>
                          <td className="p-4 font-semibold text-white">{u.username} {isSelf && <span className="text-[10px] font-bold text-violet-400 bg-violet-955/40 border border-violet-850 px-1.5 py-0.2 rounded ml-1">You</span>}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${isUserAdmin ? 'bg-violet-955/35 text-violet-400 border border-violet-900' : 'bg-gray-955/35 text-gray-400 border border-gray-800'}`}>
                              {isUserAdmin ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                              {u.role}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {!isUserAdmin && (
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-1.5 hover:bg-gray-900 rounded text-gray-400 hover:text-red-400 transition-colors border-0 bg-transparent cursor-pointer"
                                title="Delete Account"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
