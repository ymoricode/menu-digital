import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [tableNumber, setTableNumber] = useState(() => {
    return localStorage.getItem('tableNumber') || null;
  });

  // Save to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (tableNumber) {
      localStorage.setItem('tableNumber', tableNumber);
    }
  }, [tableNumber]);

  // Add item to cart
  const addItem = (food) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === food.id);
      
      if (existingItem) {
        return prevItems.map((item) =>
          item.id === food.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      return [...prevItems, { ...food, quantity: 1 }];
    });
  };

  // Remove item from cart
  const removeItem = (foodId) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== foodId));
  };

  // Update quantity
  const updateQuantity = (foodId, quantity) => {
    if (quantity <= 0) {
      removeItem(foodId);
      return;
    }
    
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === foodId ? { ...item, quantity } : item
      )
    );
  };

  // Increment quantity
  const incrementQuantity = (foodId) => {
    const item = items.find((i) => i.id === foodId);
    if (item) {
      updateQuantity(foodId, item.quantity + 1);
    }
  };

  // Decrement quantity
  const decrementQuantity = (foodId) => {
    const item = items.find((i) => i.id === foodId);
    if (item) {
      updateQuantity(foodId, item.quantity - 1);
    }
  };

  // Clear cart
  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('cart');
  };

  // Get total items count
  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  // Get total price
  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  // Check if item is in cart
  const isInCart = (foodId) => {
    return items.some((item) => item.id === foodId);
  };

  // Get item quantity
  const getItemQuantity = (foodId) => {
    const item = items.find((i) => i.id === foodId);
    return item ? item.quantity : 0;
  };

  const value = {
    items,
    tableNumber,
    setTableNumber,
    addItem,
    removeItem,
    updateQuantity,
    incrementQuantity,
    decrementQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    isInCart,
    getItemQuantity,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;
