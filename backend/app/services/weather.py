import json
import urllib.request
from typing import Dict, Any

def fetch_open_meteo_live(lat: float, lon: float) -> Dict[str, Any]:
    """
    Fetches real-time weather and soil data from Open-Meteo free API.
    """
    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}"
        f"&current=rain,soil_moisture_0_to_7cm"
    )
    
    req = urllib.request.Request(url, headers={'User-Agent': 'HillShield/1.0'})
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            return data
    except Exception as e:
        print(f"Open-Meteo fetch failed: {e}")
        return None
