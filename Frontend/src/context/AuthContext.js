import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

// 🛠️ FIX: Added 'export' here so tests can access AuthContext.Provider
export const AuthContext = createContext(null); 

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    // Check if storedUser is not null AND not the broken "undefined" string
    if (storedUser && storedUser !== "undefined" && token) {
      setUser(JSON.parse(storedUser)); 
    } else {
      // If data is broken or missing, clear it out
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user: userData } = response.data.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const registerStudent = async (formData) => {
    const response = await api.post('/auth/register/student', formData);
    const { token, user: userData } = response.data.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const registerVendor = async (formData) => {
    const response = await api.post('/auth/register/vendor', formData);
    const { token, user: userData } = response.data.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // 🛠️ ADD THE REFRESH FUNCTION HERE
  const refreshUser = async () => {
    try {
        const response = await api.get('/auth/me'); // Get fresh user data from DB
        const userData = response.data.data.user; 
        
        localStorage.setItem('user', JSON.stringify(userData)); // Update local storage
        setUser(userData); // Update React state
        return userData;
    } catch (error) {
        // If refresh fails (token invalid/expired), force logout
        logout();
    }
  };
  // -----------------------------------------------------

  const value = {
    user,
    loading,
    login,
    registerStudent,
    registerVendor,
    logout,
    refreshUser, // 🔌 EXPOSE THE NEW FUNCTION HERE
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};