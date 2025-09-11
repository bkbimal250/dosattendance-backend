import axios from 'axios';

// JWT Authentication Service
class JWTAuthService {
  constructor() {
    this.baseURL = 'http://localhost:8000/api';
    // this.baseURL = 'https://company.d0s369.co.in/api';
    this.accessTokenKey = 'access_token';
    this.refreshTokenKey = 'refresh_token';
    this.userKey = 'user_data';
    
    // Create axios instance for JWT requests
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add JWT token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Try to refresh the token
            const refreshed = await this.refreshToken();
            if (refreshed) {
              // Retry the original request with new token
              const newToken = this.getAccessToken();
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            this.logout();
            throw refreshError;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Get access token from localStorage
  getAccessToken() {
    return localStorage.getItem(this.accessTokenKey);
  }

  // Get refresh token from localStorage
  getRefreshToken() {
    return localStorage.getItem(this.refreshTokenKey);
  }

  // Get user data from localStorage
  getUser() {
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  // Set tokens and user data in localStorage
  setTokens(accessToken, refreshToken, user = null) {
    localStorage.setItem(this.accessTokenKey, accessToken);
    localStorage.setItem(this.refreshTokenKey, refreshToken);
    if (user) {
      localStorage.setItem(this.userKey, JSON.stringify(user));
    }
  }

  // Clear all authentication data
  clearTokens() {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getAccessToken();
    return !!token;
  }

  // Check if token is expired
  isTokenExpired(token) {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  // Login with username/password
  async login(credentials) {
    try {
      console.log('🔐 JWT Service: Attempting login with credentials:', credentials);
      
      // Add dashboard_type parameter that backend expects
      const loginData = {
        ...credentials,
        dashboard_type: 'admin' // Default to admin since this is admin dashboard
      };
      
      // Use the custom login endpoint instead of JWT endpoint
      const response = await this.api.post('/auth/login/', loginData);
      console.log('🔐 JWT Service: Login response received:', response.data);
      
      const { access, refresh, user } = response.data;
      
      if (!access || !refresh) {
        console.error('❌ JWT Service: Missing tokens in response');
        return {
          success: false,
          error: 'Invalid response from server'
        };
      }
      
      // Store tokens first
      this.setTokens(access, refresh);
      
      // Store user data
      if (user) {
        localStorage.setItem(this.userKey, JSON.stringify(user));
      }
      
      console.log('✅ JWT Service: Login successful, tokens stored');
      
      return {
        success: true,
        user,
        access,
        refresh
      };
    } catch (error) {
      console.error('❌ JWT Service: Login failed:', error);
      console.error('❌ JWT Service: Error response:', error.response?.data);
      
      return {
        success: false,
        error: error.response?.data || 'Login failed'
      };
    }
  }

  // Register new user
  async register(userData) {
    try {
      const response = await this.api.post('/auth/register/', userData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Registration failed'
      };
    }
  }

  // Refresh access token
  async refreshToken() {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await this.api.post('/token/refresh/', {
        refresh: refreshToken
      });

      const { access } = response.data;
      // Update tokens
      this.setTokens(access, refreshToken);
      
      // Refresh profile for completeness
      let user = this.decodeToken(access);
      try {
        const profileRes = await this.api.get('/auth/profile/');
        if (profileRes?.data) {
          user = { ...user, ...profileRes.data };
        }
      } catch (_) {}
      localStorage.setItem(this.userKey, JSON.stringify(user));
      
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  // Verify token
  async verifyToken() {
    try {
      const token = this.getAccessToken();
      if (!token) {
        return false;
      }

      // Try to get user profile to verify token is valid
      const profile = await this.getProfile();
      return profile.success;
    } catch (error) {
      console.error('JWT Auth: Token verification failed:', error);
      return false;
    }
  }

  // Logout
  logout() {
    this.clearTokens();
    // Redirect to login page
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  // Decode JWT token
  decodeToken(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.user_id,
        username: payload.username,
        email: payload.email,
        is_superuser: payload.is_superuser,
        role: payload.role,
        permissions: payload.permissions,
        exp: payload.exp,
        iat: payload.iat
      };
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  // Get user profile
  async getProfile() {
    try {
      const response = await this.api.get('/auth/profile/');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('JWT Auth: Profile fetch failed:', error);
      return {
        success: false,
        error: error.response?.data || 'Failed to get profile'
      };
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await this.api.put('/auth/profile/update/', profileData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to update profile'
      };
    }
  }

  // Change password
  async changePassword(passwordData) {
    try {
      const response = await this.api.post('/users/change_password/', passwordData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Failed to change password'
      };
    }
  }

  // Generic API request with JWT authentication
  async request(config) {
    try {
      const response = await this.api(config);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // Get API instance for direct use
  getApi() {
    return this.api;
  }
}

// Create singleton instance
const jwtAuthService = new JWTAuthService();

// Export the service instance
export default jwtAuthService;

// Export individual methods for convenience
export const {
  login,
  register,
  logout,
  isAuthenticated,
  getAccessToken,
  getRefreshToken,
  getUser,
  getProfile,
  updateProfile,
  changePassword,
  request,
  getApi
} = jwtAuthService;

// Export the class for testing or custom instances
export { JWTAuthService };
