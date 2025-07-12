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
    base_dir = os.path.abspath(os.path.dirname(__file__))
    filepath = os.path.join(base_dir, 'data', filename)
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            print(f"✓ Successfully loaded {filename}")
            return data
    except Exception as e:
        print(f"✗ Error loading {filename}: {e}")
        return [] if 'products' in filename else {}

# --- API Routes ---
@app.route('/api/health')
def health_check():
    """Health check endpoint to verify server is running."""
    return jsonify({
        "status": "ok", 
        "message": "Server is running",
        "environment": "development"
    })

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

@app.route('/api/dashboard')
def get_dashboard_data():
    """
    Performs a lightweight analysis on all products for the dashboard view.
    This does NOT call external APIs to ensure it's fast.
    """
    try:
        all_products = load_json_data('products.json')
        all_tariffs = load_json_data('tariffs.json')
        dashboard_status = {}

        for product in all_products:
            origin_country = product.get('countryOfOrigin', 'Unknown')
            category = product.get('category', 'Unknown')
            tariff_rate = all_tariffs.get(origin_country, {}).get(category, 0.0)
            
            # Use neutral demand/weather for a fast, inventory-based summary
            result = get_procurement_recommendation(product, tariff_rate, 0.0, 0.0)
            dashboard_status[product['id']] = result['recommendation']

        print("✓ Dashboard summary generated for all products.")
        return jsonify(dashboard_status)

    except Exception as e:
        print(f"✗ Dashboard generation error: {e}")
        return jsonify({"error": f"Dashboard generation failed: {str(e)}"}), 500
# --- ^^^^^^ END OF NEW ENDPOINT ^^^^^^ ---

@app.route('/api/analyze', methods=['POST'])
def analyze_product():
    """
    Analyzes the product and returns a structured recommendation.
    Accepts 'productId' and optional 'customTariff' and 'customDemand' overrides.
    """
    try:
        data = request.get_json()
        if not data or 'productId' not in data:
            return jsonify({"error": "productId is required"}), 400

        product_id = data['productId']
        all_products = load_json_data('products.json')
        product = next((p for p in all_products if p['id'] == product_id), None)
        if not product:
            return jsonify({"error": "Product not found"}), 404

        # 1. Calculate the default, real-world values first
        all_tariffs = load_json_data('tariffs.json')
        origin_country = product.get('countryOfOrigin', 'Unknown')
        category = product.get('category', 'Unknown')
        default_tariff_rate = all_tariffs.get(origin_country, {}).get(category, 0.0)
        default_demand_signal = get_demand_signal(product.get('name')) if product.get('name') else 0.0

        # 2. Check for and apply user overrides from the request
        tariff_rate = data.get('customTariff', default_tariff_rate)
        demand_signal = data.get('customDemand', default_demand_signal)
        
        # 3. Get other factors as usual
        weather = get_local_weather()
        weather_factor = weather.get('weatherFactor', 0.0)

        # 4. Perform recommendation using the final values
        result = get_procurement_recommendation(product, tariff_rate, demand_signal, weather_factor)

        print(f"✓ Analysis completed for product {product_id} (Simulated: {'Yes' if 'customTariff' in data else 'No'})")
        return jsonify(result)

    except Exception as e:
        print(f"✗ Analysis error: {e}")
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500

@app.route('/api/substitute', methods=['POST'])
def get_substitutes():
    """
    Finds and returns similar substitute products using feature similarity.
    """
    try:
        data = request.get_json()
        if not data or 'productId' not in data:
            return jsonify({"error": "productId is required"}), 400

        product_id = data['productId']
        all_products = load_json_data('products.json')
        if not all_products:
            return jsonify([])

        substitutes = find_substitutes(product_id, all_products)
        return jsonify(substitutes or [])

    except Exception as e:
        print(f"✗ Substitute finding error: {e}")
        return jsonify({"error": "Failed to find substitutes"}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"🚀 Starting server on port {port}")
    app.run(debug=True, port=port, host='0.0.0.0')