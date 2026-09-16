const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Load destinations
let destinations = [];
try {
  const data = fs.readFileSync(path.join(__dirname, 'destinations.json'), 'utf8');
  destinations = JSON.parse(data);
} catch (err) {
  console.error("Could not load destinations.json", err);
}

// Haversine formula to calculate distance between two coordinates in miles
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    0.5 - Math.cos(dLat)/2 + 
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    (1 - Math.cos(dLon))/2;

  return R * 2 * Math.asin(Math.sqrt(a));
}

// API endpoint to find warm destinations
app.post('/api/destinations', async (req, res) => {
  const { originLat, originLon, targetTemp } = req.body;

  if (originLat === undefined || originLon === undefined || targetTemp === undefined) {
    return res.status(400).json({ error: 'Missing required parameters: originLat, originLon, targetTemp' });
  }

  try {
    const results = [];
    
    // We fetch weather for all destinations. 
    // Optimization: we could pre-filter by some bounding box, but 100 requests to OpenWeather with a free tier might be slow or hit rate limits if done synchronously.
    // Instead of making 100 requests per user query, we should ideally use OpenWeather's "Call 16 day / Daily forecast data" or group calls if possible.
    // Wait, OpenWeather has a finding cities in circle API, but it's deprecated or limited.
    // Let's use the onecall API or standard current weather. Free tier allows 60 calls/minute. Making 100 calls instantly might hit limits.
    // Let's sort destinations by distance FIRST. Then check weather for the closest ones until we find 10 that meet the criteria.
    
    // 1. Calculate distance for all destinations from origin
    const destinationsWithDistance = destinations.map(dest => {
      return {
        ...dest,
        distance: calculateDistance(originLat, originLon, dest.lat, dest.lon)
      };
    });

    // 2. Sort by distance
    destinationsWithDistance.sort((a, b) => a.distance - b.distance);

    const validDestinations = [];
    
    // 3. Fetch weather sequentially (or in small batches) starting from closest, until we have 10 valid ones.
    // This avoids fetching weather for all 100 cities if the expected temperature is found in closer cities.
    // If target is high (e.g. 90F), it might have to search many.
    
    for (const dest of destinationsWithDistance) {
      if (validDestinations.length >= 10) break;

      try {
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${dest.lat}&lon=${dest.lon}&units=imperial&appid=${OPENWEATHER_API_KEY}`);
        const temp = response.data.main.temp;
        const weatherCondition = response.data.weather[0].description;
        const icon = response.data.weather[0].icon;

        if (temp >= targetTemp) {
          validDestinations.push({
            name: dest.name,
            state: dest.state,
            lat: dest.lat,
            lon: dest.lon,
            distance: Math.round(dest.distance),
            temperature: Math.round(temp),
            condition: weatherCondition,
            icon: icon
          });
        }
      } catch (err) {
        console.error(`Error fetching weather for ${dest.name}:`, err.message);
      }
      
      // Small artificial delay to respect rate limit (60 calls/min = 1 call/sec roughly, but bursts are usually okay. Let's do 50ms)
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    res.json({ results: validDestinations });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error processing destinations' });
  }
});

// Geocoding proxy endpoint (so frontend doesn't need API key)
app.get('/api/geocode', async (req, res) => {
    const { zip } = req.query;
    if (!zip) return res.status(400).json({ error: 'Zip code required' });
    
    if (!OPENWEATHER_API_KEY) {
        console.error("OPENWEATHER_API_KEY is not set");
        return res.status(500).json({ error: 'Server misconfiguration: weather API key is not set' });
    }

    try {
        const response = await axios.get(`https://api.openweathermap.org/geo/1.0/zip?zip=${zip},US&appid=${OPENWEATHER_API_KEY}`);
        res.json(response.data);
    } catch (err) {
        const status = err?.response?.status;
        console.error("Geocoding error", err?.response?.data || err.message);

        // A 401 means the API key is missing or invalid — don't mask it as a bad zip.
        if (status === 401) {
            return res.status(500).json({ error: 'Weather API rejected the request (invalid API key)' });
        }
        // A 404 from OpenWeather genuinely means the zip wasn't found.
        if (status === 404) {
            return res.status(404).json({ error: 'Zip code not found' });
        }
        return res.status(502).json({ error: 'Failed to look up zip code' });
    }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
