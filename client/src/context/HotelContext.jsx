import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = 'https://hotel-web-with-ai-api-server.onrender.com/api';
const SOCKET_URL = 'https://hotel-web-with-ai-api-server.onrender.com';

const HotelContext = createContext();

export const useHotel = () => useContext(HotelContext);

export const HotelProvider = ({ children }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [tableNumber, setTableNumber] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Initialize Socket.IO
  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('menu_updated', (updatedItem) => {
      setMenuItems(prev => {
        const index = prev.findIndex(item => item._id === updatedItem._id);
        if (index > -1) {
          return prev.map(item => item._id === updatedItem._id ? updatedItem : item);
        } else if (updatedItem.isAvailable) {
          return [...prev, updatedItem];
        }
        return prev;
      });
    });


    return () => newSocket.close();
  }, []);


  // Fetch Menu
  const fetchMenu = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/menu`);
      setMenuItems(res.data);
    } catch (error) {
      console.error('Error fetching menu:', error);
    } finally {
      setLoading(false);
    }
  };


  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/categories`);
      setCategories(res.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchMenu();
    fetchCategories();

    const adminToken = localStorage.getItem('admin_token');
    if (adminToken) setIsAdmin(true);
  }, []);

  // Set table from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const table = params.get('table');
    if (table) {
      setTableNumber(table);
      localStorage.setItem('quickserve_table', table);
      if (socket) {
        socket.emit('join_table', table);
      }
    } else {
      const saved = localStorage.getItem('quickserve_table');
      if (saved) {
        setTableNumber(saved);
        if (socket) socket.emit('join_table', saved);
      }
    }
  }, [socket]);

  // Cart Functions
  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItem === item._id);
      if (existing) {
        return prev.map((i) =>
          i.menuItem === item._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { menuItem: item._id, name: item.name, price: item.price, quantity: 1, image: item.imageUrl }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((i) => i.menuItem !== itemId));
  };

  const updateQuantity = (itemId, delta) => {
    setCart((prev) => {
      return prev.map((i) => {
        if (i.menuItem === itemId) {
          const newQ = i.quantity + delta;
          return { ...i, quantity: newQ > 0 ? newQ : 1 };
        }
        return i;
      });
    });
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const clearCart = () => setCart([]);

  return (
    <HotelContext.Provider value={{
      menuItems,
      categories,
      cart,
      setCart,
      addToCart,
      removeFromCart,
      updateQuantity,
      getCartTotal,
      clearCart,
      tableNumber,
      setTableNumber,
      currentOrder,
      setCurrentOrder,
      socket,
      loading,
      isAdmin,
      setIsAdmin,
      API_URL,
      fetchMenu,
      fetchCategories
    }}>
      {children}
    </HotelContext.Provider>
  );
};
