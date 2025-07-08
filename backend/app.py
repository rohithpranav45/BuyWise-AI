import os
import json
from flask import Flask, jsonify
from flask_cors import CORS # Import CORS
from dotenv import load_dotenv # Import load_dotenv
from flask import request # Import request
from services import news_service, weather_service, decision_service # Import services

# Load environment variables from.env file
load_dotenv()

# Initialize the Flask application
app = Flask(__name__)

# --- CORS Configuration ---
# This will allow the React app running on localhost:3000 to make requests
# to this Flask server running on localhost:5001.
CORS(app, resources={r"/api/*": {"origins": "https://projectsparkathon-i8u3xygly-rohithpranav45s-projects.vercel.app"}})

# Function to load JSON data from a file
def load_json_data(filename):
    """Loads JSON data from a file in the 'data' directory."""
    filepath = os.path.join(os.path.dirname(__file__), 'data', filename)
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        if 'products' in filename:
            return []
        else:
            return {}
    except json.JSONDecodeError:
        return {"error": f"Invalid JSON in {filename}"}

@app.route('/api/health')
def health_check():
    return {"status": "ok"}

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

    # 1. Find the product from our data
    all_products = load_json_data('products.json')
    product = next((p for p in all_products if p['id'] == product_id), None)
    
    if not product:
        return jsonify({"error": "Product not found"}), 404

    # 2. Get the applicable tariff rate
    all_tariffs = load_json_data('tariffs.json')
    origin_country = product.get('originCountry')
    category = product.get('category')
    tariff_rate = all_tariffs.get(origin_country, {}).get(category, 0.0)

    # 3. Get the demand signal from the news service
    demand_signal = news_service.get_demand_signal(product.get('name'))

    # 4. Pass all data to the decision service
    result = decision_service.get_procurement_recommendation(
        product=product,
        tariff_rate=tariff_rate,
        demand_signal=demand_signal
    )

    return jsonify(result)

@app.route('/api/substitute', methods=['POST'])
def get_substitutes():
    """
    Endpoint to find substitutes for a given product.
    Expects a JSON body with 'productId'.
    """
    data = request.get_json()
    if not data or 'productId' not in data:
        return jsonify({"error": "productId is required"}), 400

    product_id = data['productId']
    all_products = load_json_data('products.json')

    substitutes = decision_service.find_substitutes(product_id, all_products)
    
    return jsonify(substitutes)

# Main entry point for the application
if __name__ == '__main__':
    app.run(debug=True, port=5001)