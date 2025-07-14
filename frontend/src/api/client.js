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

// Request interceptor
client.interceptors.request.use(
  (config) => {
    console.log(`📤 Making ${config.method?.toUpperCase()} request to: ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
client.interceptors.response.use(
  (response) => {
    console.log(`✅ Response received from ${response.config.url}:`, response.data);
    return response;
  },
  (error) => {
    console.error('❌ Response error:', error);
    return Promise.reject(error);
  }
);

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
  try {
    console.log('🔍 Starting analysis for product:', productId, 'store:', storeId);
    console.log('📝 Custom inputs:', customInputs);
    
    const requestData = { productId, storeId, ...customInputs };
    const response = await client.post('/analyze', requestData);
    
    console.log('🎯 Raw API response:', response.data);
    
    // More flexible response validation
    if (!response.data) {
      throw new Error('No data received from analysis API');
    }
    
    // Handle different response formats
    let analysisData;
    if (response.data.recommendation) {
      // Direct format
      analysisData = response.data;
    } else if (response.data.data && response.data.data.recommendation) {
      // Wrapped format
      analysisData = response.data.data;
    } else {
      // Fallback - create a basic structure
      analysisData = {
        recommendation: response.data.recommendation || 'Unknown',
        analysis: response.data.analysis || { 
          decisionNarrative: 'Analysis completed but format may be unexpected.' 
        }
      };
    }
    
    console.log('✅ Processed analysis data:', analysisData);
    return { data: analysisData };
    
  } catch (error) {
    console.error('❌ Failed to analyze product:', error);
    console.error('❌ Error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
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