import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

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
  const [token, setToken] = useState(localStorage.getItem('authToken'));

  useEffect(() => {
    // Check if user is logged in on app start
    const initAuth = async () => {
      const savedToken = localStorage.getItem('authToken');
      
      if (savedToken) {
        try {
          // Verify token by fetching user data
          const response = await api.get('/auth/me');
          setUser(response.data.user);
          setToken(savedToken);
        } catch (error) {
          console.log('Invalid token, logging out');
          // Clear invalid token
          localStorage.removeItem('authToken');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []); // Empty dependency array is correct here

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      const { token: authToken, user: userData } = response.data;
      
      setUser(userData);
      setToken(authToken);
      localStorage.setItem('authToken', authToken);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await api.post('/auth/register', { username, email, password });
      const { token: authToken, user } = response.data;
      
      setUser(user);
      setToken(authToken);
      localStorage.setItem('authToken', authToken);
      
      return { success: true, user };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    // Also call API logout if token exists
    if (token) {
      api.post('/auth/logout').catch(() => {
        // Ignore logout API errors
      });
    }
  };

  const updateUser = (updatedUserData) => {
    setUser(prevUser => ({ ...prevUser, ...updatedUserData }));
  };

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};