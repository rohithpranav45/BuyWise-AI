import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 
  'http://localhost:5001/api';

// Configure axios instance with timeout and default headers
const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: false // Set to true if using cookies
});

// Request interceptor for logging and auth headers
client.interceptors.request.use(config => {
  console.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  
  // Add auth token if exists (example)
  // const token = localStorage.getItem('authToken');
  // if (token) config.headers.Authorization = `Bearer ${token}`;
  
  return config;
}, error => {
  console.error('[API] Request error:', error);
  return Promise.reject(error);
});

// Response interceptor for error handling
client.interceptors.response.use(
  response => {
    console.debug(`[API] Response ${response.status} from ${response.config.url}`);
    return response;
  },
  error => {
    const errorMessage = error.response 
      ? `Server responded with ${error.response.status}: ${error.response.data?.message || 'No error details'}`
      : `Network error: ${error.message}`;

    console.error('[API] Error:', {
      url: error.config?.url,
      method: error.config?.method,
      message: errorMessage,
      fullError: error
    });

    // Convert to standardized error format
    return Promise.reject({
      status: error.response?.status || 0,
      message: errorMessage,
      isNetworkError: !error.response,
      isTimeout: error.code === 'ECONNABORTED',
      data: error.response?.data
    });
  }
);

// API Methods with enhanced error handling
export const fetchProducts = async () => {
  try {
    const response = await client.get('/products');
    
    // Validate response structure
    if (!Array.isArray(response.data)) {
      throw new Error('Invalid products data format');
    }
    
    return response;
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw error; // Re-throw for component handling
  }
};

export const analyzeProduct = async (productId) => {
  try {
    const response = await client.post('/analyze', { productId });
    
    // Validate analysis response
    if (!response.data?.analysis) {
      throw new Error('Invalid analysis response structure');
    }
    
    return response;
  } catch (error) {
    console.error('Failed to analyze product:', error);
    throw error;
  }
};

export const fetchSubstitutes = async (productId) => {
  try {
    const response = await client.post('/substitute', { productId });
    
    // Validate substitutes response
    if (!Array.isArray(response.data)) {
      throw new Error('Invalid substitutes data format');
    }
    
    return response;
  } catch (error) {
    console.error('Failed to fetch substitutes:', error);
    throw error;
  }
};

export default client;