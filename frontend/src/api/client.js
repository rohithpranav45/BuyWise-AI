import axios from 'axios';

// Smart API URL detection based on environment
const getApiBaseUrl = () => {
  // Production detection
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    // If your backend is deployed separately, update this URL
    return 'https://projectsparkathon-backend.onrender.com/api';
  }
  
  // Use environment variable if available
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  
  // Default to localhost for development
  return 'http://localhost:5001/api';
};

const API_BASE_URL = getApiBaseUrl();

// Log the API URL for debugging
console.log('🔗 API Base URL:', API_BASE_URL);

// Configure axios instance with enhanced settings
const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Increased timeout for serverless cold starts
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: false
});

// Request interceptor for logging and debugging
client.interceptors.request.use(
  config => {
    console.debug(`[API] 📤 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  error => {
    console.error('[API] ❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with better error handling
client.interceptors.response.use(
  response => {
    console.debug(`[API] ✅ ${response.status} from ${response.config.url}`);
    return response;
  },
  error => {
    let errorMessage = 'Unknown error occurred';
    let userFriendlyMessage = 'Something went wrong. Please try again.';
    
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 400:
          errorMessage = data?.error || 'Bad request';
          userFriendlyMessage = 'Invalid request. Please check your input.';
          break;
        case 404:
          errorMessage = data?.error || 'Resource not found';
          userFriendlyMessage = 'The requested item was not found.';
          break;
        case 500:
          errorMessage = data?.error || 'Internal server error';
          userFriendlyMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = data?.error || `Server error (${status})`;
          userFriendlyMessage = 'Server error. Please try again later.';
      }
    } else if (error.request) {
      // Network error - no response received
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout';
        userFriendlyMessage = 'The request timed out. The server might be starting up, please try again in a moment.';
      } else {
        errorMessage = 'Network error - cannot connect to server';
        userFriendlyMessage = 'Cannot connect to server. Please check your internet connection and try again.';
      }
    } else {
      // Something else happened
      errorMessage = error.message || 'Request setup failed';
      userFriendlyMessage = 'Request failed. Please try again.';
    }

    console.error('[API] ❌ Error Details:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: errorMessage,
      fullError: error
    });

    // Return standardized error format
    return Promise.reject({
      status: error.response?.status || 0,
      message: errorMessage,
      userMessage: userFriendlyMessage,
      isNetworkError: !error.response,
      isTimeout: error.code === 'ECONNABORTED',
      data: error.response?.data,
      originalError: error
    });
  }
);

// Enhanced API Methods with better error handling and validation
export const fetchProducts = async () => {
  try {
    console.log('📦 Fetching products...');
    const response = await client.get('/products');
    
    // Validate response structure
    if (!response.data) {
      throw new Error('No data received from server');
    }
    
    // Handle both array and object responses
    let products = response.data;
    if (!Array.isArray(products)) {
      // If server returns {data: [...]} format
      if (products.data && Array.isArray(products.data)) {
        products = products.data;
      } else {
        throw new Error('Invalid products data format - expected array');
      }
    }
    
    console.log(`📦 Successfully fetched ${products.length} products`);
    return { data: products };
    
  } catch (error) {
    console.error('❌ Failed to fetch products:', error);
    throw error;
  }
};

export const analyzeProduct = async (productId) => {
  try {
    console.log(`🔍 Analyzing product: ${productId}`);
    
    if (!productId) {
      throw new Error('Product ID is required');
    }
    
    const response = await client.post('/analyze', { productId });
    
    // Validate analysis response structure
    if (!response.data) {
      throw new Error('No analysis data received');
    }
    
    const analysis = response.data;
    
    // Ensure the main 'recommendation' key exists
    if (!analysis.recommendation) {
      throw new Error('Invalid analysis response - missing recommendation');
    }
    
    // --- THIS IS THE CORRECTED VALIDATION ---
    // We check for 'rulesTriggered' which is always present in a valid response,
    // instead of the non-existent 'summary' key.
    if (!analysis.analysis || !analysis.analysis.rulesTriggered) {
      throw new Error('Invalid analysis response - missing analysis details');
    }
    
    console.log(`✅ Analysis completed for product ${productId}`);
    return { data: analysis };
    
  } catch (error) {
    console.error('❌ Failed to analyze product:', error);
    // Re-throw the error so the calling component (App.js) can handle it
    throw error;
  }
};


export const fetchSubstitutes = async (productId) => {
  try {
    console.log(`🔄 Fetching substitutes for product: ${productId}`);
    
    if (!productId) {
      throw new Error('Product ID is required');
    }
    
    const response = await client.post('/substitute', { productId });
    
    // Validate substitutes response
    if (!response.data) {
      throw new Error('No substitutes data received');
    }
    
    let substitutes = response.data;
    if (!Array.isArray(substitutes)) {
      // Handle different response formats
      if (substitutes.data && Array.isArray(substitutes.data)) {
        substitutes = substitutes.data;
      } else {
        throw new Error('Invalid substitutes data format - expected array');
      }
    }
    
    console.log(`🔄 Found ${substitutes.length} substitutes for product ${productId}`);
    return { data: substitutes };
    
  } catch (error) {
    console.error('❌ Failed to fetch substitutes:', error);
    throw error;
  }
};

// Health check function for debugging
export const healthCheck = async () => {
  try {
    console.log('🏥 Performing health check...');
    const response = await client.get('/health');
    console.log('🏥 Health check passed:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Health check failed:', error);
    throw error;
  }
};

// Export the configured client for custom requests
export default client;