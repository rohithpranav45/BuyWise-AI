import os
import requests

# Retrieve the API key from environment variables
OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY')
WEATHER_API_URL = 'http://api.openweathermap.org/data/2.5/weather'

def get_local_weather(lat, lon):
    """
    Fetches current weather for a fixed location.
    """
    if not OPENWEATHER_API_KEY:
        print("✗ OpenWeather API key is missing.")
        return {"error": "OpenWeather API key is not configured."}

    params = {'lat': lat, 'lon': lon, 'appid': OPENWEATHER_API_KEY, 'units': 'metric'}

    try:
        response = requests.get(WEATHER_API_URL, params=params, timeout=5)
        response.raise_for_status()
        weather_data = response.json()
        condition = weather_data['weather'][0]['main'].lower()
        print(f"🌦️ Weather for ({lat},{lon}): {condition}")
        bad_weather = ['rain', 'snow', 'storm', 'fog', 'thunderstorm', 'squall']
        factor = 1.0 if any(word in condition for word in bad_weather) else 0.0
        return {"weatherFactor": factor, "source": condition}
    except Exception as e:
        print(f"⚠️ Weather fetch failed: {e}")
        return {"weatherFactor": 0.0, "source": "error"}