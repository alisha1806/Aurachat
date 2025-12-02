import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [isChanging, setIsChanging] = useState(false);

  // Load theme from localStorage or system preference
  useEffect(() => {
    const loadTheme = () => {
      // Use localStorage or system preference
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        setTheme(savedTheme);
      } else {
        // Check system preference
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(systemPrefersDark ? 'dark' : 'light');
      }
    };

    loadTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const savedTheme = localStorage.getItem('theme');
      if (!savedTheme) {
        setTheme(mediaQuery.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Also set CSS variables
    if (theme === 'dark') {
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.remove('light-theme');
    } else {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
    }
  }, [theme]);

  const toggleTheme = async () => {
    if (isChanging) return;
    
    setIsChanging(true);
    const newTheme = theme === 'light' ? 'dark' : 'light';
    
    try {
      setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Failed to update theme:', error);
    } finally {
      setIsChanging(false);
    }
  };

  const setThemePreference = async (newTheme) => {
    if (isChanging || theme === newTheme) return;
    
    setIsChanging(true);
    
    try {
      setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Failed to update theme preference:', error);
    } finally {
      setIsChanging(false);
    }
  };

  const value = {
    theme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    toggleTheme,
    setTheme: setThemePreference,
    isChanging
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};