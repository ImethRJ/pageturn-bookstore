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

  // Custom Toast State
  const [toasts, setToasts] = useState([]);
  
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Custom Modal Confirmation State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  const showConfirm = (title, message, onConfirm) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

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
        showToast(`Cannot add more. Only ${book.stockQuantity} items in stock.`, 'warning');
        return;
      }
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
      showToast(`Updated "${book.title}" quantity in cart.`, 'success');
    } else {
      setCart([...cart, { book, quantity: 1 }]);
      showToast(`Added "${book.title}" to cart.`, 'success');
    }
  };

  const updateQuantity = (bookId, qty) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    if (qty > book.stockQuantity) {
      showToast(`Only ${book.stockQuantity} items available in stock.`, 'warning');
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
    const item = cart.find(i => i.book.id === bookId);
    setCart(cart.filter(item => item.book.id !== bookId));
    if (item) {
      showToast(`Removed "${item.book.title}" from cart.`, 'info');
    }
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
      showToast('Order placed successfully!', 'success');
    } catch (err) {
      setCheckoutError(err.message || 'Server error during checkout');
      showToast(err.message || 'Server error during checkout', 'error');
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
      showToast(`Book "${payload.title}" added successfully!`, 'success');
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
        showToast(err.message || 'Server error during creation', 'error');
      }
    } finally {
      setAddBookLoading(false);
    }
  };

  const handleDeleteBook = async (bookId) => {
    const book = books.find(b => b.id === bookId);
    showConfirm(
      'Delete Book Title',
      `Are you sure you want to delete "${book?.title || 'this book'}" from the store catalog?`,
      async () => {
        try {
          const response = await fetch(`/api/books/${bookId}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            fetchBooks();
            showToast('Book deleted successfully.', 'success');
          } else {
            const errData = await response.json();
            showToast(errData.message || 'Failed to delete book', 'error');
          }
        } catch (err) {
          showToast('Error connecting to the server', 'error');
        }
      }
    );
  };

  const handleUpdateStock = async (bookId) => {
    const qty = parseInt(editingStockValue);
    if (isNaN(qty) || qty < 0) {
      showToast('Please enter a valid non-negative number for stock.', 'warning');
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
        showToast('Stock quantity adjusted.', 'success');
      } else {
        const errData = await response.json();
        showToast(errData.message || 'Failed to update stock', 'error');
      }
    } catch (err) {
      showToast('Error updating stock', 'error');
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
        showToast(`Order status updated to ${newStatus}.`, 'success');
      } else {
        const errData = await response.json();
        showToast(errData.message || 'Failed to update order status', 'error');
      }
    } catch (err) {
      showToast('Error updating order status', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    const u = allUsers.find(usr => usr.id === userId);
    showConfirm(
      'Delete User Account',
      `Are you sure you want to permanently delete the account for "${u?.username || 'this user'}"?`,
      async () => {
        try {
          const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            fetchAdminUsers();
            showToast('User account deleted.', 'success');
          } else {
            const errData = await response.json();
            showToast(errData.message || 'Failed to delete user', 'error');
          }
        } catch (err) {
          showToast('Error deleting user account', 'error');
        }
      }
    );
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
      <div className="min-h-screen bg-[#05070c] flex items-center justify-center px-4 relative overflow-hidden font-['Outfit']">
        {/* Glowing Decorative Radial Gradients */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-violet-500/5 rounded-full blur-[80px]" />

        <div className="w-full max-w-md bg-gray-900/40 backdrop-blur-xl border border-gray-800/80 rounded-3xl p-8 shadow-2xl relative z-10 animate-fade-in flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="p-3 bg-gradient-to-tr from-violet-600/20 to-indigo-600/20 border border-violet-500/30 rounded-2xl shadow-inner shadow-violet-500/10 mb-2">
              <BookMarked className="w-9 h-9 text-violet-450" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white m-0">
              PageTurn <span className="bg-gradient-to-r from-violet-450 to-indigo-400 bg-clip-text text-transparent">Bookstore</span>
            </h1>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mt-1">
              {authMode === 'login' ? 'Welcome back, Reader' : 'Begin your literary journey'}
            </p>
          </div>

          {authError && (
            <div className="bg-red-950/20 border border-red-900/30 text-red-405 rounded-xl p-3.5 text-xs flex items-center gap-2.5 animate-fade-in">
              <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0 text-red-400" />
              <span className="font-medium leading-normal">{authError}</span>
            </div>
          )}

          <form onSubmit={authMode === 'login' ? handleLogin : handleSignup} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase tracking-wider text-gray-450 font-bold">Username</label>
              <input
                type="text"
                id="username-input"
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full bg-gray-950/40 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/80 transition-all shadow-inner"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase tracking-wider text-gray-455 font-bold">Password</label>
              <input
                type="password"
                id="password-input"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-gray-955/40 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/80 transition-all shadow-inner"
              />
            </div>

            <button
              type="submit"
              id="submit-auth-btn"
              disabled={authLoading}
              className="w-full bg-gradient-to-r from-violet-650 to-indigo-650 hover:from-violet-600 hover:to-indigo-600 text-white font-bold py-3 rounded-xl text-sm shadow-xl hover:shadow-violet-500/10 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed mt-2 border-0"
            >
              {authLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Seed Credentials Guide Box */}
          {authMode === 'login' && (
            <div className="bg-violet-955/20 border border-violet-850/30 rounded-xl p-3.5 text-[10px] text-gray-400 flex flex-col gap-1 leading-relaxed">
              <span className="font-bold text-violet-400 uppercase tracking-wider text-[9px] mb-0.5">Test Admin Credentials:</span>
              <div>Username: <code className="text-white font-mono bg-gray-950/40 px-1 py-0.5 rounded">admin</code></div>
              <div>Password: <code className="text-white font-mono bg-gray-950/40 px-1 py-0.5 rounded">adminpassword</code></div>
            </div>
          )}

          {/* Toggle login/signup */}
          <div className="pt-4 border-t border-gray-850 text-center text-xs text-gray-400">
            {authMode === 'login' ? (
              <p className="m-0">
                New reader here?{' '}
                <button 
                  type="button"
                  onClick={() => { setAuthMode('signup'); setAuthError(''); }}
                  className="text-violet-400 font-bold hover:text-violet-300 hover:underline cursor-pointer bg-transparent border-0 p-0 ml-0.5"
                >
                  Create an account
                </button>
              </p>
            ) : (
              <p className="m-0">
                Already have an account?{' '}
                <button 
                  type="button"
                  onClick={() => { setAuthMode('login'); setAuthError(''); }}
                  className="text-violet-400 font-bold hover:text-violet-300 hover:underline cursor-pointer bg-transparent border-0 p-0 ml-0.5"
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
    <div className="min-h-screen bg-[#05070c] text-gray-100 antialiased flex flex-col font-['Outfit']">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#080b11]/70 backdrop-blur-xl border-b border-gray-800/60 px-6 py-4 shadow-xl flex-shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-violet-600/10 to-indigo-600/10 border border-violet-500/20 rounded-xl">
              <BookMarked className="w-6 h-6 text-violet-400" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-white m-0">
              PageTurn <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Bookstore</span>
            </h1>
          </div>

          {/* Role Navigation Links */}
          <div className="flex items-center gap-1.5 bg-gray-950/60 border border-gray-800/80 p-1 rounded-xl">
            {!isAdmin ? (
              <>
                <button
                  onClick={() => setActiveTab('catalog')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border-0 ${
                    activeTab === 'catalog' 
                      ? 'bg-gradient-to-r from-violet-650 to-indigo-650 text-white shadow-md shadow-violet-500/5' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-900/50'
                  }`}
                >
                  Book Catalog
                </button>
                <button
                  onClick={() => setActiveTab('my-orders')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border-0 ${
                    activeTab === 'my-orders' 
                      ? 'bg-gradient-to-r from-violet-650 to-indigo-650 text-white shadow-md shadow-violet-500/5' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-900/50'
                  }`}
                >
                  My Orders
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('books')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border-0 ${
                    activeTab === 'books' 
                      ? 'bg-gradient-to-r from-violet-650 to-indigo-650 text-white shadow-md shadow-violet-500/5' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-900/50'
                  }`}
                >
                  Manage Books
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border-0 ${
                    activeTab === 'orders' 
                      ? 'bg-gradient-to-r from-violet-650 to-indigo-650 text-white shadow-md shadow-violet-500/5' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-900/50'
                  }`}
                >
                  Manage Orders
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border-0 ${
                    activeTab === 'users' 
                      ? 'bg-gradient-to-r from-violet-650 to-indigo-650 text-white shadow-md shadow-violet-500/5' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-900/50'
                  }`}
                >
                  Manage Users
                </button>
              </>
            )}
          </div>

          {/* User profile & Logout */}
          <div className="flex items-center gap-3 bg-gray-900/40 border border-gray-800/80 pl-2.5 pr-2 py-1.5 rounded-xl">
            <div className="flex items-center gap-2.5">
              <div className="w-6.5 h-6.5 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-[11px] font-black text-white shadow-md shadow-violet-500/10">
                {currentUser.username[0].toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white leading-none mb-0.5">
                  {currentUser.username}
                </span>
                <span className="text-[9px] uppercase font-bold text-violet-405 tracking-widest leading-none">
                  {currentUser.role}
                </span>
              </div>
            </div>
            <div className="w-px h-5.5 bg-gray-800/80" />
            <button
              onClick={handleLogout}
              className="p-1.5 hover:bg-red-950/20 rounded-lg text-gray-400 hover:text-red-400 transition-all cursor-pointer border-0 bg-transparent flex items-center justify-center"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main View Area */}
      <main className="max-w-7xl mx-auto px-6 py-8 w-full flex-grow flex flex-col gap-6">
        
        {/* User Hero Welcome Section */}
        {!isAdmin && activeTab === 'catalog' && (
          <div className="relative overflow-hidden bg-gradient-to-r from-violet-900/30 via-indigo-950/20 to-gray-950/10 border border-violet-500/10 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-xl shadow-violet-950/5">
            {/* Decorative gradient sphere */}
            <div className="absolute right-0 top-0 w-80 h-80 bg-violet-650/10 rounded-full blur-[60px] pointer-events-none" />
            
            <div className="flex flex-col gap-2 relative z-10 max-w-xl">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full w-fit">
                Reader Portal
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white m-0 leading-tight">
                Welcome back, <span className="bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">{currentUser.username}</span>!
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed m-0 mt-1 max-w-md">
                Explore our handpicked curation of titles. Search by title, author, or click a category below to filter your shelf.
              </p>
            </div>

            <div className="flex items-center gap-4 relative z-10 w-full sm:w-auto">
              <div className="bg-gray-900/60 backdrop-blur border border-gray-800 p-4 rounded-2xl flex flex-col gap-0.5 min-w-[120px] shadow-lg">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Your Cart</span>
                <span className="text-lg font-black text-white">{cart.reduce((total, item) => total + item.quantity, 0)} items</span>
              </div>
              <div className="bg-gray-900/60 backdrop-blur border border-gray-800 p-4 rounded-2xl flex flex-col gap-0.5 min-w-[120px] shadow-lg">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">My Orders</span>
                <span className="text-lg font-black text-white">{myOrders.length} placed</span>
              </div>
            </div>
          </div>
        )}

        {/* Admin Live Metrics Dashboard */}
        {isAdmin && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
            {/* Card 1: Total Titles */}
            <div className="bg-gradient-to-br from-violet-900/25 to-violet-955/15 border border-violet-550/15 rounded-2xl p-4.5 shadow-lg relative overflow-hidden">
              <div className="absolute right-[-8px] bottom-[-8px] opacity-10">
                <BookMarked className="w-20 h-20 text-white" />
              </div>
              <span className="text-[10px] text-violet-400 font-bold uppercase tracking-wider">Total Titles</span>
              <h3 className="text-2xl font-black text-white m-0 mt-1">{books.length}</h3>
              <p className="text-[9px] text-gray-500 m-0 mt-1">Unique catalog entries</p>
            </div>

            {/* Card 2: Out of Stock Alerts */}
            <div className="bg-gradient-to-br from-amber-900/25 to-amber-955/15 border border-amber-550/15 rounded-2xl p-4.5 shadow-lg relative overflow-hidden">
              <div className="absolute right-[-8px] bottom-[-8px] opacity-10">
                <AlertTriangle className="w-20 h-20 text-white" />
              </div>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Stock Alerts</span>
              <h3 className="text-2xl font-black text-white m-0 mt-1">
                {books.filter(b => b.stockQuantity < 5).length}
              </h3>
              <p className="text-[9px] text-gray-550 m-0 mt-1">
                {books.filter(b => b.stockQuantity === 0).length} out of stock titles
              </p>
            </div>

            {/* Card 3: Total Orders */}
            <div className="bg-gradient-to-br from-indigo-900/25 to-indigo-955/15 border border-indigo-550/15 rounded-2xl p-4.5 shadow-lg relative overflow-hidden">
              <div className="absolute right-[-8px] bottom-[-8px] opacity-10">
                <ClipboardList className="w-20 h-20 text-white" />
              </div>
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Total Orders</span>
              <h3 className="text-2xl font-black text-white m-0 mt-1">{allOrders.length}</h3>
              <p className="text-[9px] text-gray-500 m-0 mt-1">
                {allOrders.filter(o => o.orderStatus === 'PENDING').length} pending processing
              </p>
            </div>

            {/* Card 4: Total Revenue */}
            <div className="bg-gradient-to-br from-emerald-900/25 to-emerald-955/15 border border-emerald-555/15 rounded-2xl p-4.5 shadow-lg relative overflow-hidden">
              <div className="absolute right-[-8px] bottom-[-8px] opacity-10">
                <TrendingUp className="w-20 h-20 text-white" />
              </div>
              <span className="text-[10px] text-emerald-450 font-bold uppercase tracking-wider">Total Revenue</span>
              <h3 className="text-2xl font-black text-white m-0 mt-1">
                ${allOrders.reduce((sum, o) => o.orderStatus !== 'CANCELLED' ? sum + o.totalPrice : sum, 0).toFixed(2)}
              </h3>
              <p className="text-[9px] text-gray-550 m-0 mt-1">Excludes cancelled orders</p>
            </div>
          </div>
        )}

        {/* ================== TAB: USER CATALOG ================== */}
        {activeTab === 'catalog' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
            {/* Catalog Grid */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              <div className="flex flex-col gap-4">
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
                      className="w-full bg-gray-950/40 border border-gray-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Category Quick Filter pills */}
                {books.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar scrollbar-none">
                    {['All', ...new Set(books.map(b => b.category?.name).filter(Boolean))].map((cat) => {
                      const isSelected = cat === 'All' ? !search : search.toLowerCase() === cat.toLowerCase();
                      return (
                        <button
                          key={cat}
                          onClick={() => setSearch(cat === 'All' ? '' : cat)}
                          className={`px-3.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition-all border flex-shrink-0 ${
                            isSelected
                              ? 'bg-gradient-to-r from-violet-650 to-indigo-650 text-white border-violet-550 shadow-md shadow-violet-500/10 scale-95'
                              : 'bg-gray-900/40 text-gray-400 border-gray-800/80 hover:text-white hover:border-gray-700'
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                )}
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
                        className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-4 flex flex-col justify-between hover:border-violet-500/30 hover:shadow-xl hover:shadow-violet-950/5 transition-all duration-300 transform hover:-translate-y-1.5 group"
                      >
                        <div>
                          {/* Dynamic Book Spine/Cover gradient wrapper */}
                          <div className="relative h-44 w-full rounded-xl mb-4.5 overflow-hidden bg-gradient-to-br from-violet-950/70 to-indigo-950 flex items-center justify-center border border-gray-800 shadow-inner group">
                            {/* Abstract geometric backgrounds */}
                            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-400 via-pink-500 to-violet-850" />
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
                            
                            {/* Stylized vertical book spine design on the left */}
                            <div className="absolute left-0 top-0 bottom-0 w-3.5 bg-white/5 border-r border-white/10 shadow-lg shadow-black/40 backdrop-blur-sm" />
                            <div className="absolute left-3.5 top-0 bottom-0 w-[1px] bg-black/40" />

                            {/* Book Cover content */}
                            <div className="px-5 py-4.5 text-center flex flex-col items-center justify-between h-full w-full relative z-10">
                              <span className="text-[8px] font-black uppercase tracking-widest text-violet-305 bg-violet-955/65 border border-violet-550/20 px-2 py-0.5 rounded shadow-sm">
                                {book.category?.name || 'Catalog'}
                              </span>
                              
                              <div className="flex flex-col gap-1 px-1">
                                <h4 className="text-xs sm:text-sm font-extrabold text-white line-clamp-2 tracking-tight leading-snug drop-shadow-md group-hover:scale-105 transition-transform duration-305">
                                  {book.title}
                                </h4>
                                <p className="text-[10px] text-gray-350 font-bold opacity-80 truncate m-0">
                                  by {book.author}
                                </p>
                              </div>

                              <div className="text-[8px] font-mono text-gray-500 bg-black/40 px-2 py-0.5 rounded">
                                ISBN: {book.isbn}
                              </div>
                            </div>
                          </div>

                          {/* Metadata info */}
                          <div className="flex justify-between items-center gap-2 mb-2">
                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-violet-400 bg-violet-955/40 border border-violet-900/30 px-2.5 py-0.5 rounded-lg">
                              {book.category?.name || 'Uncategorized'}
                            </span>
                            
                            {isOutOfStock ? (
                              <span className="text-[9px] uppercase font-black text-red-405 bg-red-955/30 border border-red-900/30 px-2 py-0.5 rounded-lg">
                                Out of Stock
                              </span>
                            ) : isLowStock ? (
                              <span className="text-[9px] uppercase font-black text-amber-405 bg-amber-955/30 border border-amber-900/30 px-2 py-0.5 rounded-lg">
                                Low Stock ({book.stockQuantity})
                              </span>
                            ) : (
                              <span className="text-[9px] uppercase font-black text-emerald-450 bg-emerald-955/30 border border-emerald-900/30 px-2 py-0.5 rounded-lg">
                                In Stock ({book.stockQuantity})
                              </span>
                            )}
                          </div>

                          {/* Title and author are styled inside the book cover above */}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-800/80">
                          <span className="text-base font-black text-white">${book.price.toFixed(2)}</span>
                          <button
                            id={`add-to-cart-${book.id}`}
                            onClick={() => addToCart(book)}
                            disabled={isOutOfStock}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black tracking-wide uppercase transition-all duration-300 border-0 ${
                              isOutOfStock 
                                ? 'bg-gray-850 text-gray-500 cursor-not-allowed shadow-none' 
                                : 'bg-gradient-to-r from-violet-650 to-indigo-650 hover:from-violet-600 hover:to-indigo-600 text-white cursor-pointer active:scale-95 shadow-md shadow-violet-500/5'
                            }`}
                          >
                            <ShoppingCart className="w-3 h-3" />
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
              <section className="glass-card border border-gray-800/80 rounded-2xl p-5 flex flex-col shadow-xl">
                <h2 className="text-base font-bold mb-4.5 flex items-center gap-2 text-white m-0">
                  <div className="p-1.5 bg-violet-600/10 border border-violet-500/20 rounded-lg text-violet-400">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  Your Cart
                </h2>

                {checkoutSuccess && (
                  <div className="bg-emerald-950/25 border border-emerald-900/45 text-emerald-450 rounded-xl p-4 mb-4.5 animate-fade-in relative overflow-hidden">
                    <div className="absolute right-[-10px] top-[-10px] w-20 h-20 bg-emerald-500/5 rounded-full blur-xl" />
                    <div className="flex items-center gap-2 mb-2 font-black text-xs">
                      <CheckCircle className="w-4.5 h-4.5 text-emerald-450" />
                      Order Placed!
                    </div>
                    <div className="text-[10px] text-gray-300 leading-relaxed font-medium">
                      <div className="flex justify-between border-b border-emerald-900/20 pb-1 mb-1">
                        <span className="text-gray-400">Order ID:</span>
                        <strong className="text-white">#{checkoutSuccess.id}</strong>
                      </div>
                      <div className="flex justify-between border-b border-emerald-900/20 pb-1 mb-1">
                        <span className="text-gray-400">Amount Paid:</span>
                        <strong className="text-white">${checkoutSuccess.totalPrice.toFixed(2)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className="font-extrabold text-emerald-455 uppercase tracking-wider text-[9px]">{checkoutSuccess.orderStatus}</span>
                      </div>
                    </div>
                  </div>
                )}

                {checkoutError && (
                  <div className="bg-red-955/20 border border-red-900/40 text-red-405 rounded-xl p-3.5 text-xs mb-4.5 flex items-center gap-2 animate-fade-in">
                    <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0 text-red-400" />
                    <span className="font-medium leading-normal">{checkoutError}</span>
                  </div>
                )}

                {cart.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-gray-800 rounded-xl bg-gray-950/15 flex flex-col items-center justify-center gap-2">
                    <div className="p-3 bg-gray-900/40 rounded-full border border-gray-850">
                      <ShoppingCart className="w-6 h-6 text-gray-600" />
                    </div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider m-0">Your cart is empty</p>
                    <p className="text-[10px] text-gray-600 max-w-[180px] m-0">Add books from the catalog to get started.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="max-h-[280px] overflow-y-auto pr-1 flex flex-col gap-2 custom-scrollbar">
                      {cart.map((item) => (
                        <div 
                          key={item.book.id}
                          className="bg-gray-950/40 border border-gray-850/80 p-3 rounded-xl flex items-center justify-between gap-3 shadow-inner hover:border-gray-800 transition-colors"
                        >
                          <div className="min-w-0 flex-grow">
                            <h4 className="font-bold text-white text-xs truncate leading-snug m-0">{item.book.title}</h4>
                            <p className="text-[9px] text-gray-500 font-mono m-0 mt-0.5">${item.book.price.toFixed(2)} each</p>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="flex items-center bg-gray-950 border border-gray-800 rounded-lg p-0.5">
                              <input
                                type="number"
                                value={item.quantity}
                                min="1"
                                onChange={(e) => updateQuantity(item.book.id, parseInt(e.target.value))}
                                className="w-9 bg-transparent border-0 text-center text-xs font-bold focus:outline-none text-white p-0.5"
                              />
                            </div>
                            <button
                              onClick={() => removeFromCart(item.book.id)}
                              className="p-1.5 hover:bg-red-950/20 border border-transparent rounded-lg text-gray-500 hover:text-red-405 transition-colors cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4.5 border-t border-gray-800/80 flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5 text-[11px] text-gray-400">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span className="font-bold text-gray-300">${cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Shipping:</span>
                          <span className="font-black text-emerald-450 uppercase tracking-widest text-[9px]">Free</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Est. Tax:</span>
                          <span className="font-bold text-gray-300">$0.00</span>
                        </div>
                        <div className="h-px bg-gray-800/80 my-1" />
                        <div className="flex justify-between items-center text-xs text-white">
                          <span className="font-bold">Total Price:</span>
                          <span className="text-base font-extrabold text-white bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">${cartTotal.toFixed(2)}</span>
                        </div>
                      </div>

                      <form onSubmit={handleCheckout}>
                        <button
                          type="submit"
                          id="checkout-btn"
                          disabled={checkoutLoading}
                          className="w-full bg-gradient-to-r from-violet-650 to-indigo-650 hover:from-violet-600 hover:to-indigo-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed border-0"
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
                    PENDING: 'bg-amber-955/20 border-amber-900/30 text-amber-400',
                    COMPLETED: 'bg-emerald-955/20 border-emerald-900/30 text-emerald-450',
                    CANCELLED: 'bg-red-955/20 border-red-900/30 text-red-400'
                  };
                  const statusClass = statusColors[order.orderStatus] || 'bg-gray-800 text-gray-450';

                  return (
                    <div 
                      key={order.id}
                      className="glass-card border border-gray-800/70 rounded-2xl p-5 hover:border-gray-800 transition-colors shadow-lg animate-fade-in"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800/80 pb-3.5 mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-white">Order #{order.id}</span>
                          <span className={`text-[9px] uppercase font-black border px-2.5 py-0.5 rounded-lg ${statusClass}`}>
                            {order.orderStatus}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500 font-medium">
                          {new Date(order.orderDate).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex flex-col gap-2 bg-gray-950/20 border border-gray-850/50 p-4 rounded-xl shadow-inner">
                        <div className="text-[10px] text-gray-550 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <ShoppingBag className="w-3.5 h-3.5 text-violet-400" />
                          Order Items
                        </div>
                        {order.orderItems.map((item) => (
                          <div key={item.id} className="flex justify-between items-center text-xs">
                            <span className="text-gray-300 font-medium">
                              {item.book?.title || 'Unknown Title'} <span className="text-gray-500 font-bold">x{item.quantity}</span>
                            </span>
                            <span className="text-gray-400 font-mono">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4.5 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[11px] text-gray-400 font-semibold">Total Price:</span>
                          <span className="text-lg font-black text-white bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">${order.totalPrice.toFixed(2)}</span>
                        </div>

                        {/* Visual Stepper Timeline */}
                        <div className="flex items-center gap-1 flex-grow max-w-xs justify-between sm:justify-end relative">
                          <div className="flex flex-col items-center gap-1 flex-1 relative min-w-[50px]">
                            <div className="w-4.5 h-4.5 rounded-full bg-violet-650 flex items-center justify-center text-[9px] text-white font-bold z-10 shadow-lg shadow-violet-500/20">1</div>
                            <span className="text-[9px] font-bold text-violet-400 uppercase tracking-wide">Placed</span>
                          </div>

                          <div className={`h-[2px] flex-grow mx-1 rounded-full ${order.orderStatus !== 'PENDING' ? 'bg-violet-600' : 'bg-gray-800/80'}`} />

                          {order.orderStatus === 'CANCELLED' ? (
                            <div className="flex flex-col items-center gap-1 flex-1 relative min-w-[50px]">
                              <div className="w-4.5 h-4.5 rounded-full bg-red-950/40 border border-red-900/40 text-red-400 flex items-center justify-center text-[9px] font-bold z-10">✕</div>
                              <span className="text-[9px] font-bold text-red-400 uppercase tracking-wide">Cancelled</span>
                            </div>
                          ) : (
                            <>
                              <div className="flex flex-col items-center gap-1 flex-1 relative min-w-[50px]">
                                <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px] font-bold z-10 transition-colors ${order.orderStatus !== 'PENDING' ? 'bg-violet-650 text-white shadow-lg' : 'bg-gray-900 border border-gray-800 text-gray-500'}`}>2</div>
                                <span className={`text-[9px] font-bold uppercase tracking-wide ${order.orderStatus !== 'PENDING' ? 'text-violet-400' : 'text-gray-550'}`}>Process</span>
                              </div>

                              <div className={`h-[2px] flex-grow mx-1 rounded-full ${order.orderStatus === 'COMPLETED' ? 'bg-emerald-600' : 'bg-gray-800/80'}`} />

                              <div className="flex flex-col items-center gap-1 flex-1 relative min-w-[50px]">
                                <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px] font-bold z-10 transition-colors ${order.orderStatus === 'COMPLETED' ? 'bg-emerald-650 text-white shadow-lg shadow-emerald-500/10' : 'bg-gray-900 border border-gray-800 text-gray-500'}`}>3</div>
                                <span className={`text-[9px] font-bold uppercase tracking-wide ${order.orderStatus === 'COMPLETED' ? 'text-emerald-450' : 'text-gray-555'}`}>Ready</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}        {/* ================== TAB: ADMIN MANAGE BOOKS ================== */}
        {activeTab === 'books' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
            {/* Books Inventory Table */}
            <div className="lg:col-span-8 flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-lg font-bold flex items-center gap-2 text-white m-0">
                  <div className="p-1.5 bg-violet-600/10 border border-violet-500/20 rounded-lg text-violet-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  Inventory Catalog ({books.length})
                </h2>

                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search books..."
                    className="w-full bg-gray-950/40 border border-gray-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-20 bg-gray-900/10 border border-gray-900/50 rounded-2xl">
                  <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
                </div>
              ) : books.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-gray-800 rounded-2xl bg-gray-900/10 flex flex-col items-center justify-center gap-2">
                  <BookOpen className="w-10 h-10 text-gray-700" />
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider m-0">Empty Inventory</p>
                  <p className="text-[10px] text-gray-605 m-0">No books found in the database catalog.</p>
                </div>
              ) : (
                <div className="overflow-x-auto glass-card border border-gray-800/80 rounded-2xl shadow-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-800/80 text-gray-400 font-bold uppercase tracking-wider bg-gray-950/40">
                        <th className="p-4">Title / Author</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Price</th>
                        <th className="p-4">Stock</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {books.map((book) => (
                        <tr key={book.id} className="border-b border-gray-850/65 hover:bg-gray-900/15 transition-colors">
                          <td className="p-4">
                            <div className="font-extrabold text-white text-xs leading-snug">{book.title}</div>
                            <div className="text-gray-500 text-[10px] mt-0.5 font-medium">by {book.author} <span className="text-gray-600 mx-1">|</span> ISBN: {book.isbn}</div>
                          </td>
                          <td className="p-4">
                            <span className="bg-violet-955/20 text-violet-400 border border-violet-900/40 px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wide">
                              {book.category?.name || 'Uncategorized'}
                            </span>
                          </td>
                          <td className="p-4 text-white font-bold font-mono">${book.price.toFixed(2)}</td>
                          <td className="p-4">
                            {editingStockId === book.id ? (
                              <div className="flex items-center gap-1.5 animate-fade-in">
                                <input
                                  type="number"
                                  value={editingStockValue}
                                  onChange={(e) => setEditingStockValue(e.target.value)}
                                  className="w-14 bg-gray-950 border border-gray-800 rounded-lg px-2 py-0.5 text-center text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-violet-550"
                                />
                                <button
                                  onClick={() => handleUpdateStock(book.id)}
                                  className="px-2.5 py-1 bg-emerald-650 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors border-0"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => { setEditingStockId(null); setEditingStockValue(''); }}
                                  className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-[10px] font-bold cursor-pointer transition-colors border-0"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-extrabold ${book.stockQuantity === 0 ? 'text-red-405' : book.stockQuantity < 5 ? 'text-amber-405' : 'text-emerald-450'}`}>
                                  {book.stockQuantity}
                                </span>
                                <button
                                  onClick={() => { setEditingStockId(book.id); setEditingStockValue(book.stockQuantity.toString()); }}
                                  className="text-[10px] text-violet-400 hover:text-violet-300 font-bold bg-transparent border-0 cursor-pointer p-0 hover:underline"
                                >
                                  Adjust
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleDeleteBook(book.id)}
                              className="p-1.5 hover:bg-red-950/20 rounded-lg text-gray-500 hover:text-red-400 transition-colors border-0 bg-transparent cursor-pointer"
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
              <section className="glass-card border border-gray-800/80 rounded-2xl p-5 shadow-xl">
                <h2 className="text-base font-bold mb-4.5 flex items-center gap-2 text-white m-0">
                  <div className="p-1.5 bg-violet-600/10 border border-violet-500/20 rounded-lg text-violet-400">
                    <PlusCircle className="w-4 h-4" />
                  </div>
                  Add Book
                </h2>

                {addBookSuccess && (
                  <div className="bg-emerald-950/25 border border-emerald-900/40 text-emerald-450 rounded-xl p-3.5 text-xs mb-4 flex items-center gap-2 animate-fade-in">
                    <CheckCircle className="w-4.5 h-4.5 flex-shrink-0" />
                    <span className="font-semibold">Book added successfully!</span>
                  </div>
                )}

                {addBookError && (
                  <div className="bg-red-950/25 border border-red-900/40 text-red-405 rounded-xl p-3.5 text-xs mb-4 flex items-center gap-2 animate-fade-in">
                    <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0" />
                    <span className="font-semibold">{addBookError}</span>
                  </div>
                )}

                <form onSubmit={handleAddBook} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-450">Title</label>
                    <input
                      type="text"
                      value={newBook.title}
                      onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                      placeholder="Book title"
                      className="w-full bg-gray-950/40 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/80 transition-all"
                    />
                    {validationErrors.title && <p className="text-red-400 text-[10px] mt-1 m-0 font-semibold">{validationErrors.title}</p>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-455">Author</label>
                    <input
                      type="text"
                      value={newBook.author}
                      onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                      placeholder="Author name"
                      className="w-full bg-gray-955/40 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/80 transition-all"
                    />
                    {validationErrors.author && <p className="text-red-400 text-[10px] mt-1 m-0 font-semibold">{validationErrors.author}</p>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-455">ISBN</label>
                    <input
                      type="text"
                      value={newBook.isbn}
                      onChange={(e) => setNewBook({...newBook, isbn: e.target.value})}
                      placeholder="ISBN number"
                      className="w-full bg-gray-955/40 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/80 transition-all"
                    />
                    {validationErrors.isbn && <p className="text-red-400 text-[10px] mt-1 m-0 font-semibold">{validationErrors.isbn}</p>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-455">Category</label>
                    <input
                      type="text"
                      value={newBook.categoryName}
                      onChange={(e) => setNewBook({...newBook, categoryName: e.target.value})}
                      placeholder="Category assignment"
                      className="w-full bg-gray-955/40 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/80 transition-all"
                    />
                    {validationErrors.categoryName && <p className="text-red-400 text-[10px] mt-1 m-0 font-semibold">{validationErrors.categoryName}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-455">Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newBook.price}
                        onChange={(e) => setNewBook({...newBook, price: e.target.value})}
                        placeholder="0.00"
                        className="w-full bg-gray-955/40 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/80 transition-all"
                      />
                      {validationErrors.price && <p className="text-red-400 text-[10px] mt-1 m-0 font-semibold">{validationErrors.price}</p>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-455">Stock</label>
                      <input
                        type="number"
                        value={newBook.stockQuantity}
                        onChange={(e) => setNewBook({...newBook, stockQuantity: e.target.value})}
                        placeholder="0"
                        className="w-full bg-gray-955/40 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/80 transition-all"
                      />
                      {validationErrors.stockQuantity && <p className="text-red-400 text-[10px] mt-1 m-0 font-semibold">{validationErrors.stockQuantity}</p>}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={addBookLoading}
                    className="w-full bg-gradient-to-r from-violet-650 to-indigo-650 hover:from-violet-600 hover:to-indigo-600 text-white font-bold py-3 rounded-xl text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed mt-2 border-0"
                  >
                    {addBookLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Add Title
                  </button>
                </form>
              </section>
            </div>
          </div>
        )}        {/* ================== TAB: ADMIN MANAGE ORDERS ================== */}
        {activeTab === 'orders' && (
          <div className="flex flex-col gap-5 w-full">
            <h2 className="text-lg font-bold flex items-center gap-2 text-white m-0">
              <div className="p-1.5 bg-violet-600/10 border border-violet-500/20 rounded-lg text-violet-400">
                <ClipboardList className="w-4 h-4" />
              </div>
              Customer Orders Control ({allOrders.length})
            </h2>

            {ordersLoading ? (
              <div className="flex justify-center py-20 bg-gray-900/10 border border-gray-900/50 rounded-2xl">
                <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
              </div>
            ) : allOrders.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-gray-800 rounded-2xl bg-gray-900/10 flex flex-col items-center justify-center gap-2">
                <ClipboardList className="w-10 h-10 text-gray-700" />
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider m-0">No Orders</p>
                <p className="text-[10px] text-gray-605 m-0">No customer orders have been placed yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {allOrders.map((order) => {
                  const statusColors = {
                    PENDING: 'bg-amber-955/20 border-amber-900/30 text-amber-400',
                    COMPLETED: 'bg-emerald-955/20 border-emerald-900/30 text-emerald-450',
                    CANCELLED: 'bg-red-955/20 border-red-900/30 text-red-400'
                  };
                  const statusClass = statusColors[order.orderStatus] || 'bg-gray-800 text-gray-455';
                  const customerName = order.user?.username || order.customerName || 'Guest';
                  const initial = customerName[0].toUpperCase();

                  return (
                    <div 
                      key={order.id}
                      className="glass-card border border-gray-800/80 rounded-2xl p-5 flex flex-col gap-4 shadow-lg hover:border-gray-800 transition-colors animate-fade-in"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800/80 pb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-white">Order #{order.id}</span>
                          <span className={`text-[9px] uppercase font-black border px-2.5 py-0.5 rounded-lg ${statusClass}`}>
                            {order.orderStatus}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 font-medium">
                          Placed: {new Date(order.orderDate).toLocaleString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-4">
                          <div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Customer Account</div>
                            <div className="flex items-center gap-2.5 bg-gray-950/20 border border-gray-850/60 p-2.5 rounded-xl w-fit pr-4">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-black text-white text-xs shadow-md shadow-violet-500/10">
                                {initial}
                              </div>
                              <div className="text-sm font-extrabold text-white">
                                {customerName}
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Order Items</div>
                            <div className="flex flex-col gap-2 bg-gray-950/20 border border-gray-850/60 p-3 rounded-xl shadow-inner">
                              {order.orderItems.map((item) => (
                                <div key={item.id} className="text-xs text-gray-300 font-semibold flex justify-between gap-4">
                                  <span>{item.book?.title || 'Unknown Title'} <span className="text-gray-550 font-bold ml-1">x{item.quantity}</span></span>
                                  <span className="text-gray-500 font-mono">${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col justify-between items-start sm:items-end gap-4.5">
                          <div className="sm:text-right">
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Total Price</div>
                            <div className="text-xl font-black text-white bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">
                              ${order.totalPrice.toFixed(2)}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {order.orderStatus === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, 'COMPLETED')}
                                  className="px-4 py-2 bg-gradient-to-r from-emerald-650 to-teal-650 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer border-0 shadow-md shadow-emerald-950/20"
                                >
                                  Complete Order
                                </button>
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, 'CANCELLED')}
                                  className="px-4 py-2 bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-900 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
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
        )}        {/* ================== TAB: ADMIN MANAGE USERS ================== */}
        {activeTab === 'users' && (
          <div className="flex flex-col gap-5 w-full">
            <h2 className="text-lg font-bold flex items-center gap-2 text-white m-0">
              <div className="p-1.5 bg-violet-600/10 border border-violet-500/20 rounded-lg text-violet-400">
                <Users className="w-4 h-4" />
              </div>
              Registered Accounts Controller
            </h2>

            {usersLoading ? (
              <div className="flex justify-center py-20 bg-gray-900/10 border border-gray-900/50 rounded-2xl">
                <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
              </div>
            ) : allUsers.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-gray-800 rounded-2xl bg-gray-900/10 flex flex-col items-center justify-center gap-2">
                <Users className="w-10 h-10 text-gray-700" />
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider m-0">No Accounts</p>
                <p className="text-[10px] text-gray-605 m-0">No registered users in the database.</p>
              </div>
            ) : (
              <div className="overflow-x-auto glass-card border border-gray-800/80 rounded-2xl shadow-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-800/80 text-gray-400 font-bold uppercase tracking-wider bg-gray-950/40">
                      <th className="p-4 w-20">ID</th>
                      <th className="p-4">Username</th>
                      <th className="p-4">Account Type / Privilege</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map((u) => {
                      const isSelf = u.id === currentUser.id;
                      const isUserAdmin = u.role === 'ADMIN';
                      const userInitial = u.username[0].toUpperCase();

                      return (
                        <tr key={u.id} className="border-b border-gray-850/65 hover:bg-gray-900/15 transition-colors">
                          <td className="p-4 text-gray-500 font-mono">#{u.id}</td>
                          <td className="p-4 font-semibold text-white">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-black text-white text-xs shadow-md shadow-violet-500/10">
                                {userInitial}
                              </div>
                              <span className="font-extrabold text-white">
                                {u.username}
                                {isSelf && (
                                  <span className="text-[9px] font-black text-violet-405 bg-violet-955/35 border border-violet-900/30 px-2 py-0.5 rounded ml-1.5 uppercase tracking-wider">
                                    You
                                  </span>
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${isUserAdmin ? 'bg-violet-955/20 text-violet-400 border-violet-900/40' : 'bg-gray-950/20 text-gray-400 border-gray-800'}`}>
                              {isUserAdmin ? <Shield className="w-3 h-3 text-violet-400" /> : <User className="w-3 h-3 text-gray-450" />}
                              {u.role}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {!isUserAdmin && (
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-1.5 hover:bg-red-950/20 rounded-lg text-gray-500 hover:text-red-400 transition-colors border-0 bg-transparent cursor-pointer"
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

      {/* Custom Toast Container */}
      <div className="fixed bottom-5 right-5 z-55 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => {
          const typeStyles = {
            success: 'bg-emerald-950/90 border-emerald-500/30 text-emerald-400',
            error: 'bg-red-950/90 border-red-500/30 text-red-400',
            info: 'bg-violet-950/90 border-violet-500/30 text-violet-400',
            warning: 'bg-amber-955/90 border-amber-500/30 text-amber-400'
          };
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl animate-slide-in-right ${typeStyles[toast.type] || typeStyles.info}`}
            >
              <div className="flex items-center gap-2">
                {toast.type === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-450" />}
                {toast.type === 'error' && <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />}
                {toast.type === 'info' && <BookOpen className="w-4 h-4 flex-shrink-0 text-violet-400" />}
                {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />}
                <span className="text-xs font-semibold leading-normal">{toast.message}</span>
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer border-0 bg-transparent p-0 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Custom Confirm Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-red-950/30 border border-red-900/40 rounded-xl text-red-400 flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white leading-snug">{confirmModal.title}</h3>
                <p className="text-xs text-gray-400 mt-1 leading-normal">{confirmModal.message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-bold transition-all cursor-pointer border-0"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-red-650 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-lg shadow-red-900/10 border-0"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
