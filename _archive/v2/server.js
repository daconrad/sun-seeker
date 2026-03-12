
const express = require('express');
const fetch = require('node-fetch');
const app = express();
require('dotenv').config();

app.use(express.static('public'));
app.use(express.json());

const ZIPCODE_API_KEY = process.env.ZIPCODE_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

console.log('ZIPCODE_API_KEY:', ZIPCODE_API_KEY);
console.log('WEATHER_API_KEY:', WEATHER_API_KEY);

app.post('/api/weather', async (req, res) => {
    const { zip, temp } = req.body;

    if (!zip || !temp) {
        return res.status(400).json({ error: 'Zip code and temperature are required.' });
    }

    try {
        // 1. Get lat/lon from zip code
        const zipUrl = `https://app.zipcodebase.com/api/v1/search?codes=${zip}&country=US&apikey=${ZIPCODE_API_KEY}`;
        const zipResponse = await fetch(zipUrl);
        const zipData = await zipResponse.json();
        console.log('zipData:', JSON.stringify(zipData, null, 2));
        const { latitude, longitude } = zipData.results[zip][0];

        // 2. Find nearby cities
        const citiesUrl = `https://api.openweathermap.org/data/2.5/find?lat=${latitude}&lon=${longitude}&cnt=50&units=imperial&appid=${WEATHER_API_KEY}`;
        const citiesResponse = await fetch(citiesUrl);
        const citiesData = await citiesResponse.json();
        console.log('citiesData:', JSON.stringify(citiesData, null, 2));

        // 3. Filter cities by temperature and sort by distance
        const qualifiedCities = citiesData.list
            .filter(city => city.main.temp >= temp)
            .map(city => ({
                name: city.name,
                temp: city.main.temp,
                lat: city.coord.lat,
                lon: city.coord.lon
            }))
            .sort((a, b) => {
                const distA = Math.sqrt(Math.pow(a.lat - latitude, 2) + Math.pow(a.lon - longitude, 2));
                const distB = Math.sqrt(Math.pow(b.lat - latitude, 2) + Math.pow(b.lon - longitude, 2));
                return distA - distB;
            })
            .slice(0, 10);

        res.json(qualifiedCities);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch weather data.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
