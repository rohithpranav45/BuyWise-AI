import os
import requests
from textblob import TextBlob
import json

# Retrieve the API key from environment variables
NEWS_API_KEY = os.getenv('NEWS_API_KEY')
NEWS_API_URL = 'https://newsapi.org/v2/everything'

def get_news_for_product(product_name):
    """
    Fetches news articles related to a product name.
    Includes a timeout and a local file fallback for network errors.
    """
    # First, try the live API if the key exists
    if NEWS_API_KEY:
        params = { 'q': product_name, 'apiKey': NEWS_API_KEY, 'pageSize': 20, 'sortBy': 'relevancy', 'language': 'en' }
        try:
            response = requests.get(NEWS_API_URL, params=params, timeout=5)
            response.raise_for_status()
            print(f"✓ Live news articles fetched for '{product_name}'")
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"✗ Live news request failed: {e}. Attempting to use local fallback.")
    
    # --- FALLBACK LOGIC ---
    # If the API key is missing or the request failed, use the dummy data.
    try:
        base_dir = os.path.abspath(os.path.dirname(__file__))
        filepath = os.path.join(base_dir, '..', 'data', 'dummy_news.json')
        with open(filepath, 'r', encoding='utf-8') as f:
            print(f"✓ Using local dummy_news.json for '{product_name}'")
            return json.load(f)
    except Exception as e:
        print(f"✗ Fallback failed. Could not load dummy_news.json: {e}")
        return {"error": "Live API and local fallback both failed."}

def get_demand_signal(product_name):
    """
    Calculates a demand signal based on the sentiment of recent news.
    Returns a score between -1.0 (negative) and 1.0 (positive).
    """
    news_data = get_news_for_product(product_name)
    
    if 'error' in news_data or not news_data.get('articles'):
        print(f"⚠️ No news data for '{product_name}'. Defaulting to neutral signal.")
        return 0.0

    polarities = []
    for article in news_data['articles']:
        title = article.get('title', '') or ''
        description = article.get('description', '') or ''
        analysis = TextBlob(f"{title}. {description}")
        polarities.append(analysis.sentiment.polarity)

    if not polarities:
        return 0.0

    average_polarity = sum(polarities) / len(polarities)
    print(f"📈 Demand signal for '{product_name}': {average_polarity:.2f}")
    return average_polarity