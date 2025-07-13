import axios from 'axios';

// Smart API URL detection
const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_API_BASE_URL || 'https://projectsparkathon-backend.onrender.com/api';
  }
  return process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';
};

const API_BASE_URL = getApiBaseUrl();

console.log('🔗 API Base URL:', API_BASE_URL);

// Configure axios instance
const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
});

// Interceptors for logging and error handling (no changes needed here)
client.interceptors.request.use(/* ... */);
client.interceptors.response.use(/* ... */);

export const fetchStores = async () => {
  try {
    const response = await client.get('/stores');
    return { data: response.data || [] };
  } catch (error) {
    console.error('❌ Failed to fetch stores:', error);
    throw error;
  }
};

export const fetchDashboardStatus = async () => {
  try {
    console.log('📊 Fetching dashboard status...');
    const response = await client.get('/dashboard');
    return { data: response.data || {} };
  } catch (error) {
    console.error('❌ Failed to fetch dashboard status:', error);
    throw error;
  }
};

export const fetchProducts = async () => {
  try {
    const response = await client.get('/products');
    return { data: response.data || [] };
  } catch (error) {
    console.error('❌ Failed to fetch products:', error);
    throw error;
  }
};

export const analyzeProduct = async (productId, storeId, customInputs = {}) => {
  // This function is now the only one needed for detailed view.
  try {
    const requestData = { productId, storeId, ...customInputs };
    const response = await client.post('/analyze', requestData);
    if (!response.data || !response.data.recommendation) {
      throw new Error('Invalid analysis response from server');
    }
    return { data: response.data };
  } catch (error) {
    console.error('❌ Failed to analyze product:', error);
    throw error;
  }
};

export const healthCheck = async () => {
  try {
    const response = await client.get('/health');
    return response.data;
  } catch (error) {
    console.error('❌ Health check failed:', error);
    throw error;
  }
};