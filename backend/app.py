import os
import json
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from services import news_service, weather_service, decision_service

# Load environment variables from .env file
load_dotenv()

# Initialize the Flask application
app = Flask(__name__)

# --- CORS Configuration ---
# List of allowed origins (add all your frontend URLs)
allowed_origins = [
    "https://projectsparkathon.vercel.app",          # Production frontend
    "https://projectsparkathon-*.vercel.app",        # Vercel preview deployments
    "http://localhost:3000",                         # Local development
    "http://127.0.0.1:3000"                          # Alternative localhost
]

# Configure CORS with explicit settings
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": allowed_origins,
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": False,
            "max_age": 86400  # Cache preflight requests for 24 hours
        }
    }
)

# Handle OPTIONS requests globally
@app.after_request
def after_request(response):
    """Add CORS headers to all responses"""
    origin = request.headers.get('Origin')
    if origin and any(
        origin.startswith(allowed.replace('*', '')) 
        for allowed in allowed_origins
    ):
        response.headers.add('Access-Control-Allow-Origin', origin)
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    return response

# --- Helper Functions ---
def load_json_data(filename):
    """Loads JSON data from a file in the 'data' directory."""
    filepath = os.path.join(os.path.dirname(__file__), 'data', filename)
    try:
        with open(filepath, 'r', encoding='utf-8') as f:  # Explicit encoding for Windows
            return json.load(f)
    except FileNotFoundError:
        if 'products' in filename:
            return []
        return {}
    except json.JSONDecodeError:
        return {"error": f"Invalid JSON in {filename}"}

# --- API Routes ---
@app.route('/api/health')
def health_check():
    return jsonify({"status": "ok", "message": "Server is running"})

@app.route('/api/products')
def get_products():
    """Endpoint to get the list of all products."""
    products_data = load_json_data('products.json')
    return jsonify(products_data)

@app.route('/api/tariffs')
def get_tariffs():
    """Endpoint to get the tariff data."""
    tariffs_data = load_json_data('tariffs.json')
    return jsonify(tariffs_data)

@app.route('/api/analyze', methods=['POST'])
def analyze_product():
    """
    Endpoint to run the full analysis for a single product.
    Expects a JSON body with 'productId'.
    """
    data = request.get_json()
    if not data or 'productId' not in data:
        return jsonify({"error": "productId is required"}), 400

    product_id = data['productId']
    all_products = load_json_data('products.json')
    product = next((p for p in all_products if p['id'] == product_id), None)
    
    if not product:
        return jsonify({"error": "Product not found"}), 404

    all_tariffs = load_json_data('tariffs.json')
    origin_country = product.get('originCountry')
    category = product.get('category')
    tariff_rate = all_tariffs.get(origin_country, {}).get(category, 0.0)

    demand_signal = news_service.get_demand_signal(product.get('name'))

    result = decision_service.get_procurement_recommendation(
        product=product,
        tariff_rate=tariff_rate,
        demand_signal=demand_signal
    )

    return jsonify(result)

@app.route('/api/substitute', methods=['POST'])
def get_substitutes():
    """Endpoint to find substitutes for a given product."""
    data = request.get_json()
    if not data or 'productId' not in data:
        return jsonify({"error": "productId is required"}), 400

    product_id = data['productId']
    all_products = load_json_data('products.json')
    substitutes = decision_service.find_substitutes(product_id, all_products)
    
    return jsonify(substitutes)

# --- Windows-Specific Configuration ---
if __name__ == '__main__':
    # Windows-specific settings
    app.run(
        debug=True,
        port=int(os.getenv('PORT', 5001)),  # Use PORT from environment or default to 5001
        host='0.0.0.0',                     # Allow connections from all network interfaces
        threaded=True                       # Better performance for Windows
    )