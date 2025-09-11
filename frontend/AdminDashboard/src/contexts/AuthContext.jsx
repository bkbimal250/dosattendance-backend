import React, { createContext, useContext, useState, useEffect } from 'react';
import jwtAuthService from '../services/jwtAuth';

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
  const [error, setError] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('🔐 AuthContext: Checking authentication...');
      
      // Check if user is authenticated using JWT service
      if (jwtAuthService.isAuthenticated()) {
        let userData = jwtAuthService.getUser();
        const token = jwtAuthService.getAccessToken();
        
        console.log('🔐 AuthContext: Token exists:', !!token);
        console.log('🔐 AuthContext: User data exists:', !!userData);
        console.log('🔐 AuthContext: User data:', userData);
        
        if (userData && token) {
          // First, verify token is not expired
          if (!jwtAuthService.isTokenExpired(token)) {
            // Then verify token is valid with backend
            try {
              const profile = await jwtAuthService.getProfile();
              if (profile.success && profile.data) {
                userData = { ...userData, ...profile.data };
                localStorage.setItem('user_data', JSON.stringify(userData));
                console.log('✅ AuthContext: Token validated with backend, setting user:', userData);
                setUser(userData);
                setAuthenticated(true);
              } else {
                console.log('❌ AuthContext: Token validation failed with backend');
                setUser(null);
                setAuthenticated(false);
                jwtAuthService.clearTokens();
              }
            } catch (error) {
              console.log('❌ AuthContext: Token validation error:', error);
              // Token is invalid, try to refresh
              console.log('⚠️ AuthContext: Attempting token refresh...');
              const refreshed = await jwtAuthService.refreshToken();
              if (refreshed) {
                const refreshedUser = jwtAuthService.getUser();
                console.log('✅ AuthContext: Token refresh successful, setting user:', refreshedUser);
                setUser(refreshedUser);
                setAuthenticated(true);
              } else {
                console.log('❌ AuthContext: Token refresh failed, logging out');
                setUser(null);
                setAuthenticated(false);
                jwtAuthService.clearTokens();
              }
            }
          } else {
            console.log('⚠️ AuthContext: Token expired, attempting refresh...');
            const refreshed = await jwtAuthService.refreshToken();
            if (refreshed) {
              const refreshedUser = jwtAuthService.getUser();
              console.log('✅ AuthContext: Token refresh successful, setting user:', refreshedUser);
              setUser(refreshedUser);
              setAuthenticated(true);
            } else {
              console.log('❌ AuthContext: Token refresh failed, logging out');
              setUser(null);
              setAuthenticated(false);
              jwtAuthService.clearTokens();
            }
          }
        } else {
          console.log('❌ AuthContext: Missing user data or token, logging out');
          setUser(null);
          setAuthenticated(false);
          jwtAuthService.clearTokens();
        }
      } else {
        console.log('❌ AuthContext: Not authenticated, user not logged in');
        setUser(null);
        setAuthenticated(false);
      }
    } catch (error) {
      console.error('❌ AuthContext: Error checking authentication:', error);
      setUser(null);
      setAuthenticated(false);
      jwtAuthService.clearTokens();
    } finally {
      setLoading(false);
      console.log('🏁 AuthContext: Authentication check completed');
    }
  };

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('AuthContext: Starting JWT login process...');
      
      const result = await jwtAuthService.login(credentials);
      console.log('AuthContext: JWT login result:', result);
      
      if (result.success) {
        console.log('AuthContext: JWT login successful, setting user:', result.user);
        setUser(result.user);
        setAuthenticated(true);
        return { success: true };
      } else {
        const errorMessage = result.error?.detail || result.error || 'Login failed';
        console.error('AuthContext: JWT login failed:', errorMessage);
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('AuthContext: JWT login error:', error);
      const errorMessage = error.response?.data?.detail || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      const result = await jwtAuthService.register(userData);
      return result;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log('AuthContext: Logging out...');
    setUser(null);
    setAuthenticated(false);
    setError(null);
    jwtAuthService.clearTokens();
    // Don't redirect here, let the router handle it
  };

  const updateProfile = async (data) => {
    try {
      setError(null);
      const result = await jwtAuthService.updateProfile(data);
      if (result.success) {
        // Update local user state with new profile data
        setUser(prevUser => ({ ...prevUser, ...result.data }));
        return { success: true };
      } else {
        setError(result.error);
        return result;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Profile update failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const changePassword = async (passwordData) => {
    try {
      setError(null);
      const result = await jwtAuthService.changePassword(passwordData);
      return result;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Password change failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const refreshToken = async () => {
    try {
      const refreshed = await jwtAuthService.refreshToken();
      if (refreshed) {
        const refreshedUser = jwtAuthService.getUser();
        setUser(refreshedUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error('AuthContext: Token refresh failed:', error);
      logout();
      return false;
    }
  };

  const isAdmin = () => {
    return user?.is_superuser || user?.role === 'admin';
  };

  const isManager = () => {
    return user?.role === 'manager' || isAdmin();
  };

  const hasPermission = (permission) => {
    if (isAdmin()) return true;
    return user?.permissions?.includes(permission) || false;
  };

  const getAccessToken = () => {
    return jwtAuthService.getAccessToken();
  };

  const getApi = () => {
    return jwtAuthService.getApi();
  };

  const value = {
    user,
    loading,
    error,
    authenticated,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshToken,
    isAdmin,
    isManager,
    hasPermission,
    checkAuth,
    getAccessToken,
    getApi,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
