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
  BookMarked
} from 'lucide-react';

function App() {
  // Catalog State
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cart State
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');

  // Add Book Form State
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

  // Fetch Books
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

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchBooks(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Add Item to Cart
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

  // Update Cart Quantity
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

  // Remove Item from Cart
  const removeFromCart = (bookId) => {
    setCart(cart.filter(item => item.book.id !== bookId));
  };

  // Calculate Cart Total
  const cartTotal = cart.reduce((total, item) => total + (item.book.price * item.quantity), 0);

  // Handle Checkout
  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setCheckoutError('Customer name is mandatory');
      return;
    }
    if (cart.length === 0) {
      setCheckoutError('Your cart is empty');
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError('');
    setCheckoutSuccess(null);

    const payload = {
      customerName: customerName.trim(),
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
      setCustomerName('');
      fetchBooks(); // Refresh catalog stock levels
    } catch (err) {
      setCheckoutError(err.message || 'Server error during checkout');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Handle Add Book
  const handleAddBook = async (e) => {
    e.preventDefault();
    setAddBookLoading(true);
    setAddBookError('');
    setAddBookSuccess(false);
    setValidationErrors({});

    // Client-side validations
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
        // Check for spring validation errors array
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

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 antialiased">
      {/* Header Banner */}
      <header className="sticky top-0 z-40 bg-[#111827]/80 backdrop-blur-md border-b border-gray-800 px-6 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BookMarked className="w-8 h-8 text-violet-500 animate-pulse" />
            <h1 className="text-2xl font-bold tracking-tight text-white m-0">
              PageTurn <span className="text-violet-500">Bookstore</span>
            </h1>
          </div>

          {/* Search Box */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              id="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search books by title, author, or category..."
              className="w-full bg-gray-900/60 border border-gray-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Catalog & Form Section */}
          <div className="lg:col-span-8 flex flex-col gap-10">
            
            {/* Catalog Grid */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
                  <BookOpen className="w-5 h-5 text-violet-500" />
                  Available Titles
                </h2>
                {search && (
                  <span className="text-xs text-violet-400 bg-violet-950/40 border border-violet-850 px-2 py-1 rounded">
                    Filtering search queries
                  </span>
                )}
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
                  <p className="text-gray-400 text-sm">Querying database catalog...</p>
                </div>
              ) : error ? (
                <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-6 text-center">
                  <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                  <h3 className="text-red-400 font-medium mb-1">Catalog Connection Lost</h3>
                  <p className="text-gray-400 text-sm">{error}</p>
                  <button 
                    onClick={() => fetchBooks(search)}
                    className="mt-4 px-4 py-2 bg-red-900/50 hover:bg-red-800 text-white rounded-md text-xs transition-colors"
                  >
                    Retry Connection
                  </button>
                </div>
              ) : books.length === 0 ? (
                <div className="text-center py-16 bg-gray-900/30 border border-gray-800 rounded-lg">
                  <ShoppingBag className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No books found in the catalog.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {books.map((book) => {
                    const isOutOfStock = book.stockQuantity === 0;
                    const isLowStock = book.stockQuantity > 0 && book.stockQuantity < 5;
                    return (
                      <div 
                        key={book.id}
                        className="bg-gray-900/40 border border-gray-800 rounded-xl p-5 flex flex-col justify-between hover:border-gray-700 hover:shadow-xl transition-all duration-300"
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-violet-400 bg-violet-950/40 border border-violet-850 px-2 py-0.5 rounded">
                              {book.category?.name || 'Uncategorized'}
                            </span>
                            
                            {/* Stock badges */}
                            {isOutOfStock ? (
                              <span className="text-[10px] uppercase font-bold text-red-400 bg-red-950/40 border border-red-900/50 px-2 py-0.5 rounded">
                                Out of Stock
                              </span>
                            ) : isLowStock ? (
                              <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-950/40 border border-amber-900/50 px-2 py-0.5 rounded">
                                Low Stock ({book.stockQuantity})
                              </span>
                            ) : (
                              <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2 py-0.5 rounded">
                                In Stock ({book.stockQuantity})
                              </span>
                            )}
                          </div>

                          <h3 className="text-lg font-bold text-white mb-1 leading-snug">{book.title}</h3>
                          <p className="text-sm text-gray-400 mb-2">by {book.author}</p>
                          <p className="text-xs text-gray-500 font-mono mb-4">ISBN: {book.isbn}</p>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                          <span className="text-xl font-extrabold text-white">${book.price.toFixed(2)}</span>
                          <button
                            id={`add-to-cart-${book.id}`}
                            onClick={() => addToCart(book)}
                            disabled={isOutOfStock}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold shadow-md transition-all duration-300 ${
                              isOutOfStock 
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed shadow-none' 
                                : 'bg-violet-600 hover:bg-violet-500 text-white cursor-pointer active:scale-95'
                            }`}
                          >
                            <ShoppingCart className="w-4 h-4" />
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Add Book Form Section */}
            <section className="bg-gray-900/30 border border-gray-850 rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-5 flex items-center gap-2 text-white">
                <Plus className="w-5 h-5 text-violet-500" />
                Add Book to Catalog
              </h2>

              {addBookSuccess && (
                <div className="bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 rounded-lg p-4 mb-5 flex items-center gap-2 text-sm">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  Book created successfully and catalog updated.
                </div>
              )}

              {addBookError && (
                <div className="bg-red-950/30 border border-red-900/50 text-red-400 rounded-lg p-4 mb-5 flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  {addBookError}
                </div>
              )}

              <form onSubmit={handleAddBook} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Book Title</label>
                  <input
                    type="text"
                    value={newBook.title}
                    onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                    placeholder="e.g. The Hobbit"
                    className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  {validationErrors.title && <p className="text-red-400 text-xs mt-1">{validationErrors.title}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Author</label>
                  <input
                    type="text"
                    value={newBook.author}
                    onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                    placeholder="e.g. J.R.R. Tolkien"
                    className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  {validationErrors.author && <p className="text-red-400 text-xs mt-1">{validationErrors.author}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">ISBN Number</label>
                  <input
                    type="text"
                    value={newBook.isbn}
                    onChange={(e) => setNewBook({...newBook, isbn: e.target.value})}
                    placeholder="e.g. 9780007488308"
                    className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  {validationErrors.isbn && <p className="text-red-400 text-xs mt-1">{validationErrors.isbn}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Category Name</label>
                  <input
                    type="text"
                    value={newBook.categoryName}
                    onChange={(e) => setNewBook({...newBook, categoryName: e.target.value})}
                    placeholder="e.g. Fantasy"
                    className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  {validationErrors.categoryName && <p className="text-red-400 text-xs mt-1">{validationErrors.categoryName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Retail Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newBook.price}
                    onChange={(e) => setNewBook({...newBook, price: e.target.value})}
                    placeholder="0.00"
                    className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  {validationErrors.price && <p className="text-red-400 text-xs mt-1">{validationErrors.price}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Stock Quantity</label>
                  <input
                    type="number"
                    value={newBook.stockQuantity}
                    onChange={(e) => setNewBook({...newBook, stockQuantity: e.target.value})}
                    placeholder="0"
                    className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  {validationErrors.stockQuantity && <p className="text-red-400 text-xs mt-1">{validationErrors.stockQuantity}</p>}
                </div>

                <div className="sm:col-span-2 pt-2">
                  <button
                    type="submit"
                    disabled={addBookLoading}
                    className="w-full bg-gray-850 hover:bg-gray-800 border border-gray-700 text-white py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:border-gray-600 transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    {addBookLoading && <Loader2 className="w-4 h-4 animate-spin text-violet-500" />}
                    Add Book to Catalog
                  </button>
                </div>
              </form>
            </section>

          </div>

          {/* Checkout & Cart Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Cart Section */}
            <section className="sticky top-24 bg-gray-900/40 border border-gray-850 rounded-2xl p-6 flex flex-col">
              <h2 className="text-xl font-semibold mb-5 flex items-center gap-2 text-white">
                <ShoppingCart className="w-5 h-5 text-violet-500" />
                Shopping Cart
              </h2>

              {checkoutSuccess && (
                <div className="bg-emerald-950/30 border border-emerald-900/50 text-emerald-450 rounded-xl p-5 mb-5">
                  <div className="flex items-center gap-2 mb-2 font-bold text-sm">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    Checkout Completed!
                  </div>
                  <p className="text-xs text-gray-300 leading-normal">
                    Order ID: <strong>#{checkoutSuccess.id}</strong><br />
                    Customer: <strong>{checkoutSuccess.customerName}</strong><br />
                    Total Paid: <strong>${checkoutSuccess.totalPrice.toFixed(2)}</strong>
                  </p>
                </div>
              )}

              {checkoutError && (
                <div className="bg-red-950/30 border border-red-900/50 text-red-400 rounded-lg p-4 mb-5 flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500" />
                  {checkoutError}
                </div>
              )}

              {cart.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-gray-800 rounded-xl">
                  <ShoppingCart className="w-8 h-8 text-gray-700 mx-auto mb-2 animate-bounce" />
                  <p className="text-gray-400 text-sm">Your shopping cart is empty.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  
                  {/* Cart Items List */}
                  <div className="max-h-[300px] overflow-y-auto pr-1 flex flex-col gap-3">
                    {cart.map((item) => (
                      <div 
                        key={item.book.id}
                        className="bg-gray-950/60 border border-gray-850 p-3 rounded-lg flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <h4 className="font-semibold text-white text-xs truncate leading-snug">{item.book.title}</h4>
                          <p className="text-[10px] text-gray-500 font-mono">${item.book.price.toFixed(2)} each</p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.book.id, parseInt(e.target.value))}
                            className="w-12 bg-gray-900 border border-gray-800 rounded px-1.5 py-0.5 text-center text-xs focus:ring-1 focus:ring-violet-500"
                          />
                          <button
                            onClick={() => removeFromCart(item.book.id)}
                            className="p-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary & Form */}
                  <div className="pt-4 border-t border-gray-800">
                    <div className="flex justify-between items-center mb-4 text-sm">
                      <span className="text-gray-400 font-medium">Subtotal:</span>
                      <span className="text-lg font-bold text-white">${cartTotal.toFixed(2)}</span>
                    </div>

                    <form onSubmit={handleCheckout} className="flex flex-col gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-450 uppercase tracking-wider mb-1">
                          Customer Name
                        </label>
                        <input
                          type="text"
                          id="customer-name"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="e.g. Jane Doe"
                          className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                      </div>

                      <button
                        type="submit"
                        id="checkout-btn"
                        disabled={checkoutLoading}
                        className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-2.5 rounded-lg text-xs shadow-lg hover:shadow-violet-500/10 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                      >
                        {checkoutLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Place Order
                      </button>
                    </form>
                  </div>

                </div>
              )}
            </section>

          </div>

        </div>
      </main>
    </div>
  );
}

export default App;
