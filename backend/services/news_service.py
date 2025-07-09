import os
import requests
from textblob import TextBlob # Import TextBlob

# Retrieve the API key from environment variables
NEWS_API_KEY = os.getenv('NEWS_API_KEY')
NEWS_API_URL = 'https://newsapi.org/v2/everything'

def get_news_for_product(product_name):
    """
    Fetches news articles related to a specific product name.
    """
    if not NEWS_API_KEY:
        print("New API key missing. Skipping news fetch.")
        return {"error": "News API key is not configured."}

    params = {
        'q': product_name,
        'apiKey': NEWS_API_KEY,
        'pageSize': 20,
        'sortBy': 'relevancy',
        'language': 'en'
    }

    try:
        response = requests.get(NEWS_API_URL, params=params)
        response.raise_for_status()
        print(f"✓ News articles fetched for '{product_name}'")
        return response.json()
    except requests.exceptions.HTTPError as http_err:
        print(f"✗ News HTTP error: {http_err}")
        return {"error": f"HTTP error occurred: {http_err}", "details": response.text}
    except requests.exceptions.RequestException as err:
        print(f"✗ News request failed: {err}")
        return {"error": f"An error occurred: {err}"}

def get_demand_signal(product_name):
    """
    Calculates a demand signal based on the sentiment of recent news.
    Returns a score between -1.0 (negative) and 1.0 (positive).
    """
    news_data = get_news_for_product(product_name)
    
    if 'error' in news_data or not news_data.get('articles'):
        print(f"⚠️ No news data for '{product_name}'. Defaulting to neutral signal.")
        return 0.0 # Return neutral if no news or an error occurred

    polarities = []
    for article in news_data['articles']:
        title = article.get('title', '') or ''
        description = article.get('description', '') or ''
        
        # Combine title and description for a more comprehensive analysis
        content_to_analyze = f"{title}. {description}"
        
        # Create a TextBlob object and get the sentiment polarity
        analysis = TextBlob(content_to_analyze)
        polarities.append(analysis.sentiment.polarity)

    if not polarities:
        print(f"⚠️ No valid sentiment for '{product_name}' news.")
        return 0.0 # Return neutral if no valid articles were processed

    # Return the average polarity
    average_polarity = sum(polarities) / len(polarities)
    print(f"📈 Demand signal for '{product_name}': {average_polarity:.2f}")
    return average_polarity