import os
import json
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from services.decision_service import get_procurement_recommendation
from services.news_service import get_demand_signal
from services.decision_service import find_substitutes
from services.weather_service import get_local_weather

# Load environment variables from .env file
load_dotenv()

# Initialize the Flask application
app = Flask(__name__)

# Simplified CORS configuration - allows all origins for now
CORS(app, 
     origins=["*"],  # Allow all origins - restrict in production
     methods=["GET", "POST", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"],
     supports_credentials=False)

# --- Helper Functions ---
def load_json_data(filename):
    """Loads JSON data from a file in the 'data' directory with enhanced error handling."""
    # Use absolute path to avoid deployment issues
    base_dir = os.path.abspath(os.path.dirname(__file__))
    filepath = os.path.join(base_dir, 'data', filename)
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            print(f"✓ Successfully loaded {filename}: {len(data) if isinstance(data, list) else 'object loaded'}")
            return data
    except FileNotFoundError:
        print(f"✗ File not found: {filepath}")
        if 'products' in filename:
            return []
        return {}
    except json.JSONDecodeError as e:
        print(f"✗ JSON decode error in {filename}: {e}")
        if 'products' in filename:
            return []
        return {}
    except Exception as e:
        print(f"✗ Unexpected error loading {filename}: {e}")
        if 'products' in filename:
            return []
        return {}

# --- API Routes ---
@app.route('/api/health')
def health_check():
    """Health check endpoint to verify server is running."""
    return jsonify({
        "status": "ok", 
        "message": "Server is running",
        "timestamp": str(os.environ.get('VERCEL_REGION', 'local')),
        "environment": "production" if os.environ.get('VERCEL') else "development"
    })

@app.route('/api/products')
def get_products():
    """Endpoint to get the list of all products."""
    try:
        products_data = load_json_data('products.json')
        
        if not products_data:
            return jsonify({
                "error": "No products data available",
                "data": []
            }), 500
            
        print(f"✓ Returning {len(products_data)} products")
        return jsonify(products_data)
        
    except Exception as e:
        print(f"✗ Error in get_products: {e}")
        return jsonify({
            "error": "Failed to load products",
            "data": []
        }), 500

@app.route('/api/tariffs')
def get_tariffs():
    """Endpoint to get the tariff data."""
    try:
        tariffs_data = load_json_data('tariffs.json')
        return jsonify(tariffs_data)
    except Exception as e:
        print(f"✗ Error in get_tariffs: {e}")
        return jsonify({"error": "Failed to load tariffs"}), 500

@app.route('/api/analyze', methods=['POST'])
def analyze_product():
    """
    Analyzes the product and returns a structured recommendation.
    Expects a JSON body with 'productId'.
    """
    try:
        data = request.get_json()
        if not data or 'productId' not in data:
            return jsonify({"error": "productId is required"}), 400

        product_id = data['productId']
        all_products = load_json_data('products.json')
        if not all_products:
            return jsonify({"error": "Products data not available"}), 500

        product = next((p for p in all_products if p['id'] == product_id), None)
        if not product:
            return jsonify({"error": "Product not found"}), 404

        # Ensure required fields
        if 'price' not in product:
            product['price'] = product.get('baseCost', 100.0) * 1.2
        if 'inventory' not in product:
            product['inventory'] = {
                'stock': 20,
                'salesVelocity': 3
            }

        # Load tariff rate
        all_tariffs = load_json_data('tariffs.json')
        origin_country = product.get('countryOfOrigin', 'Unknown')
        category = product.get('category', 'Unknown')
        tariff_rate = all_tariffs.get(origin_country, {}).get(category, 0.0)

        # Get demand signal
        demand_signal = get_demand_signal(product.get('name')) if product.get('name') else 0.0

        # Get weather factor
        weather = get_local_weather()
        weather_factor = weather.get('weatherFactor', 0.0)

        # Perform rule-based recommendation
        result = get_procurement_recommendation(product, tariff_rate, demand_signal, weather_factor)

        print(f"✓ Analysis completed for product {product_id}")
        return jsonify(result)

    except Exception as e:
        print(f"✗ Analysis error: {e}")
        return jsonify({
            "error": "Analysis failed",
            "recommendation": "Error",
            "analysis": {
                "rulesTriggered": [f"Error: {str(e)}"],
                "summary": "Could not complete analysis"
            }
        }), 500
@app.route('/api/substitute', methods=['POST'])
def get_substitutes():
    """
    Finds and returns similar substitute products using feature similarity.
    Expects { "productId": "prod_001" } in the request body.
    """
    try:
        data = request.get_json()
        if not data or 'productId' not in data:
            return jsonify({"error": "productId is required"}), 400

        product_id = data['productId']
        all_products = load_json_data('products.json')
        if not all_products:
            return jsonify([])

        # Use the actual similarity engine
        substitutes = find_substitutes(product_id, all_products)
        if not substitutes:
            print(f"⚠️ No substitutes found for product {product_id}")
            return jsonify([])

        print(f"✓ Found {len(substitutes)} substitutes for product {product_id}")
        return jsonify(substitutes)

    except Exception as e:
        print(f"✗ Substitute finding error: {e}")
        return jsonify({"error": "Failed to find substitutes"}), 500
    
# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

# --- Application Entry Point ---
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = not os.environ.get('VERCEL')  # Don't use debug in production
    
    print(f"🚀 Starting server on port {port}")
    print(f"🔧 Debug mode: {debug}")
    print(f"📁 Working directory: {os.getcwd()}")
    
    app.run(
        debug=debug,
        port=port,
        host='0.0.0.0',
        threaded=True
    )