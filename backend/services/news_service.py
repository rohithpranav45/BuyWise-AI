import os
import requests
from textblob import TextBlob
import json

NEWS_API_KEY = os.getenv('NEWS_API_KEY')
NEWS_API_URL = 'https://newsapi.org/v2/everything'

def get_live_news(product_name):
    """Fetches live news from the API."""
    if not NEWS_API_KEY:
        return None
    params = {'q': product_name, 'apiKey': NEWS_API_KEY, 'pageSize': 10, 'sortBy': 'relevancy', 'language': 'en'}
    try:
        response = requests.get(NEWS_API_URL, params=params, timeout=5)
        response.raise_for_status()
        print(f"✓ Live news articles fetched for '{product_name}'")
        return response.json()
    except requests.exceptions.RequestException:
        print(f"✗ Live news request failed for '{product_name}'.")
        return None

def get_dummy_news(product_name):
    """Loads dummy news from a local file."""
    try:
        base_dir = os.path.abspath(os.path.dirname(__file__))
        filepath = os.path.join(base_dir, '..', 'data', 'dummy_news.json')
        with open(filepath, 'r', encoding='utf-8') as f:
            print(f"✓ Using local dummy_news.json for '{product_name}'")
            return json.load(f)
    except Exception as e:
        print(f"✗ Fallback failed. Could not load dummy_news.json: {e}")
        return None

def get_demand_signal(product_name):
    """
    Calculates a demand signal and ALSO returns the articles used.
    """
    news_data = get_live_news(product_name) or get_dummy_news(product_name)
    
    if not news_data or not news_data.get('articles'):
        return {"score": 0.0, "articles": []}

    polarities = []
    top_articles = []
    
    # Analyze sentiment and collect top 3 articles
    for article in news_data['articles']:
        title = article.get('title', '') or ''
        # Exclude generic or irrelevant articles
        if "review" not in title.lower() and "deals" not in title.lower() and "best" not in title.lower():
            continue
            
        description = article.get('description', '') or ''
        analysis = TextBlob(f"{title}. {description}")
        polarities.append(analysis.sentiment.polarity)
        
        if len(top_articles) < 3:
            top_articles.append({
                "source": article.get("source", {}).get("name"),
                "title": title,
                "url": article.get("url")
            })

    if not polarities:
        return {"score": 0.0, "articles": []}

    average_polarity = sum(polarities) / len(polarities)
    print(f"📈 Demand signal for '{product_name}': {average_polarity:.2f}")
    
    # Return both the score and the top articles
    return {"score": average_polarity, "articles": top_articles}