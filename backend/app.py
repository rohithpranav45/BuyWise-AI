import os
import json
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from services.decision_service import get_procurement_recommendation, find_substitutes
from services.news_service import get_demand_signal
from services.weather_service import get_local_weather

load_dotenv()
app = Flask(__name__)
CORS(app)

def load_json_data(filename):
    base_dir = os.path.abspath(os.path.dirname(__file__))
    filepath = os.path.join(base_dir, 'data', filename)
    try:
        with open(filepath, 'r', encoding='utf-8') as f: return json.load(f)
    except Exception as e:
        print(f"✗ Error loading {filename}: {e}")
        return [] if 'products' in filename or 'stores' in filename else {}

@app.route('/api/health')
def health_check(): return jsonify({"status": "ok"})
@app.route('/api/stores')
def get_stores(): return jsonify(load_json_data('stores.json'))
@app.route('/api/products')
def get_products(): return jsonify(load_json_data('products.json'))
@app.route('/api/tariffs')
def get_tariffs(): return jsonify(load_json_data('tariffs.json'))

@app.route('/api/dashboard')
def get_dashboard_data():
    """Performs an instantaneous analysis on all products for the dashboard views."""
    all_products = load_json_data('products.json')
    all_tariffs = load_json_data('tariffs.json')
    dashboard_status = {}
    for product in all_products:
        tariff_rate = all_tariffs.get(product.get('countryOfOrigin'), {}).get(product.get('category'), 0.0)
        result = get_procurement_recommendation(product, tariff_rate, 0.0, 0.0)
        dashboard_status[product['id']] = result['recommendation']
    return jsonify(dashboard_status)

@app.route('/api/analyze', methods=['POST'])
def analyze_product():
    """Performs the full, in-depth analysis and enriches the response with narrative data."""
    try:
        data = request.get_json()
        product_id, store_id = data.get('productId'), data.get('storeId')
        
        all_products, all_stores, all_tariffs, all_countries = (
            load_json_data('products.json'), load_json_data('stores.json'),
            load_json_data('tariffs.json'), load_json_data('countries.json')
        )
        product = next((p for p in all_products if p['id'] == product_id), None)
        store = next((s for s in all_stores if s['id'] == store_id), None)
        if not product or not store: return jsonify({"error": "Product or Store not found"}), 404
        
        weather = get_local_weather(store['lat'], store['lon'])
        demand_data = get_demand_signal(product.get('name'))
        default_tariff = all_tariffs.get(product.get('countryOfOrigin'), {}).get(product.get('category'), 0.0)
        tariff_rate = data.get('customTariff', default_tariff)
        demand_signal = data.get('customDemand', demand_data.get("score", 0.0)) + store.get('local_event_modifier', 0.0)

        result = get_procurement_recommendation(product, tariff_rate, demand_signal, weather.get('weatherFactor', 0.0))
        
        # --- Enrichment for Narrative and Supply Chain ---
        def get_risk_info(country, category):
            rate = all_tariffs.get(country, {}).get(category, 0.0)
            if rate > 0.15: return {"level": "High", "reason": f"Subject to a high {rate:.1%} tariff."}
            if rate > 0.05: return {"level": "Medium", "reason": f"Faces a moderate {rate:.1%} tariff."}
            return {"level": "Low", "reason": "Low or zero tariffs apply."}
            
        supply_chain_data = []
        primary_country = product.get('countryOfOrigin')
        if primary_country in all_countries:
            supply_chain_data.append({"country": primary_country, "coordinates": all_countries[primary_country], "isPrimary": True, **get_risk_info(primary_country, product.get('category'))})

        substitutes = find_substitutes(product_id, all_products)
        for sub in substitutes:
            sub_product = next((p for p in all_products if p['id'] == sub['id']), None)
            if sub_product:
                sub_country = sub_product.get('countryOfOrigin')
                if sub_country in all_countries and not any(d['country'] == sub_country for d in supply_chain_data):
                    supply_chain_data.append({"country": sub_country, "coordinates": all_countries[sub_country], "isPrimary": False, **get_risk_info(sub_country, sub_product.get('category'))})
        
        if result and 'analysis' in result:
            result['analysis']['substitutes'] = substitutes
            result['analysis']['news_articles'] = demand_data.get("articles", [])
            result['analysis']['supplyChainMapData'] = supply_chain_data
            result['analysis']['decisionNarrative'] = next((rule for rule in reversed(result['analysis'].get('rulesTriggered', [])) if rule.startswith("RULE:")), "Standard operating procedure.")

        return jsonify(result)
    except Exception as e: return jsonify({"error": f"Analysis failed: {str(e)}"}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(debug=True, port=port, host='0.0.0.0')