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
        return response.json()
    except requests.exceptions.RequestException as err:
        return {"error": f"An error occurred: {err}"}