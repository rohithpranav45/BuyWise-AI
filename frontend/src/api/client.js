import axios from 'axios';

// Use the production environment variable if it exists, otherwise default to localhost
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL ||
  'http://localhost:5001/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchProducts = () => client.get('/products');
export const analyzeProduct = (productId) => client.post('/analyze', { productId });
export const fetchSubstitutes = (productId) => client.post('/substitute', { productId });

export default client;