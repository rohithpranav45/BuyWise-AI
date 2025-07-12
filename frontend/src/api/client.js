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
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
});

// Interceptors for logging and error handling (no changes needed here)
client.interceptors.request.use(/* ... */);
client.interceptors.response.use(/* ... */);

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

export const analyzeProduct = async (productId, customInputs = {}) => {
  try {
    console.log(`🔍 Analyzing product: ${productId} with overrides:`, customInputs);
    
    if (!productId) {
      throw new Error('Product ID is required');
    }
    
    // Combine the product ID with any custom inputs for the request body
    const requestData = { productId, ...customInputs };
    
    const response = await client.post('/analyze', requestData);
    
    if (!response.data || !response.data.recommendation) {
        throw new Error('Invalid analysis response from server');
    }

    console.log(`✅ Analysis completed for product ${productId}`);
    return { data: response.data };

  } catch (error) {
    console.error('❌ Failed to analyze product:', error);
    throw error;
  }
};

export const fetchSubstitutes = async (productId) => {
  try {
    const response = await client.post('/substitute', { productId });
    return { data: response.data || [] };
  } catch (error) {
    console.error('❌ Failed to fetch substitutes:', error);
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