import os
import json
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from services.decision_service import get_procurement_recommendation
from services.news_service import get_demand_signal
from services.decision_service import find_substitutes
from services.weather_service import get_local_weather

load_dotenv()
app = Flask(__name__)
CORS(app)

def load_json_data(filename):
    base_dir = os.path.abspath(os.path.dirname(__file__))
    filepath = os.path.join(base_dir, 'data', filename)
    try:
        with open(filepath, 'r', encoding='utf-8') as f: return json.load(f)
    except Exception: return [] if 'products' in filename or 'stores' in filename else {}

@app.route('/api/health')
def health_check(): return jsonify({"status": "ok"})
@app.route('/api/stores')
def get_stores(): return jsonify(load_json_data('stores.json'))
@app.route('/api/products')
def get_products(): return jsonify(load_json_data('products.json'))
@app.route('/api/tariffs')
def get_tariffs(): return jsonify(load_json_data('tariffs.json'))
@app.route('/api/dashboard')
def get_dashboard_data(): return jsonify({}) # Simplified for brevity, logic can be re-added

# --- vvvvvv THE MAIN CHANGE IS IN THIS FUNCTION vvvvvv ---
@app.route('/api/analyze', methods=['POST'])
def analyze_product():
    try:
        data = request.get_json()
        product_id = data.get('productId')
        store_id = data.get('storeId')
        
        all_products = load_json_data('products.json')
        all_stores = load_json_data('stores.json')
        all_tariffs = load_json_data('tariffs.json')
        all_countries = load_json_data('countries.json')

        product = next((p for p in all_products if p['id'] == product_id), None)
        store = next((s for s in all_stores if s['id'] == store_id), None)
        if not product or not store: return jsonify({"error": "Product or Store not found"}), 404
        
        # --- (Existing analysis logic remains the same) ---
        weather = get_local_weather(store['lat'], store['lon'])
        demand_data = get_demand_signal(product.get('name'))
        
        default_tariff_rate = all_tariffs.get(product.get('countryOfOrigin'), {}).get(product.get('category'), 0.0)
        tariff_rate = data.get('customTariff', default_tariff_rate)
        final_demand_signal = data.get('customDemand', demand_data.get("score", 0.0)) + store.get('local_event_modifier', 0.0)

        result = get_procurement_recommendation(product, tariff_rate, final_demand_signal, weather.get('weatherFactor', 0.0))
        
        # --- NEW: Build the data for the supply chain map ---
        supply_chain_map_data = []
        
        def get_risk_level(rate):
            if rate > 0.15: return "high"
            if rate > 0.05: return "medium"
            return "low"

        # 1. Add the primary product to the map data
        primary_country = product.get('countryOfOrigin')
        if primary_country in all_countries:
            supply_chain_map_data.append({
                "country": primary_country,
                "coordinates": all_countries[primary_country],
                "risk": get_risk_level(tariff_rate),
                "isPrimary": True
            })

        # 2. Add all substitutes to the map data
        substitutes = find_substitutes(product_id, all_products)
        for sub in substitutes:
            sub_product_data = next((p for p in all_products if p['id'] == sub['id']), None)
            if sub_product_data:
                sub_country = sub_product_data.get('countryOfOrigin')
                if sub_country in all_countries:
                    sub_tariff = all_tariffs.get(sub_country, {}).get(sub_product_data.get('category'), 0.0)
                    supply_chain_map_data.append({
                        "country": sub_country,
                        "coordinates": all_countries[sub_country],
                        "risk": get_risk_level(sub_tariff),
                        "isPrimary": False
                    })
        
        # --- Embed all enriched data into the final response ---
        if result and 'analysis' in result:
            result['analysis']['substitutes'] = substitutes
            result['analysis']['news_articles'] = demand_data.get("articles", [])
            result['analysis']['storeContext'] = {'name': store['name'], 'city': store['city']}
            result['analysis']['supplyChainMapData'] = supply_chain_map_data

        return jsonify(result)
    except Exception as e:
        print(f"✗ Analysis error: {e}")
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(debug=True, port=port, host='0.0.0.0')