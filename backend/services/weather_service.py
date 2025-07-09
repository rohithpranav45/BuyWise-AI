import os
import requests

# Retrieve the API key from environment variables
OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY')
WEATHER_API_URL = 'http://api.openweathermap.org/data/2.5/weather'

# For this project, we'll use a fixed location (e.g., Walmart HQ in Bentonville, AR)
# In a real-world app, this would be dynamic based on the store's location.
BENTONVILLE_LAT = 36.3729
BENTONVILLE_LON = -94.2088

def get_local_weather():
    """
    Fetches current weather for a fixed location.
    """
    if not OPENWEATHER_API_KEY:
        print("✗ OpenWeather API key is missing.")
        return {"error": "OpenWeather API key is not configured."}

    params = {
        'lat': BENTONVILLE_LAT,
        'lon': BENTONVILLE_LON,
        'appid': OPENWEATHER_API_KEY,
        'units': 'metric' # Use Celsius
    }

    try:
        response = requests.get(WEATHER_API_URL, params=params)
        response.raise_for_status()
        weather_data = response.json()

        condition = weather_data['weather'][0]['main'].lower()
        print(f"🌦️ Weather condition: {condition}")

        # Basic mapping to "weatherFactor"
        bad_weather = ['rain', 'snow', 'storm', 'fog']
        factor = 1.0 if any(word in condition for word in bad_weather) else 0.0

        return {
            "weatherFactor": factor,
            "source": condition
        }

    except Exception as e:
        print(f"⚠️ Weather fetch failed: {e}")
        return {"weatherFactor": 0.0, "source": "error"}