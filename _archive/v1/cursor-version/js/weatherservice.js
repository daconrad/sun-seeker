class WeatherService {
    constructor() {
        this.apiKey = process.env.OPENWEATHER_API_KEY;
        this.cityList = [];
    }

    async initialize() {
        // Load city list from a JSON file containing major cities
        const response = await fetch('path/to/city.list.json');
        this.cityList = await response.json();
    }

    async getWeatherByCoords(lat, lon) {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${this.apiKey}`
        );
        return await response.json();
    }

    async findWarmDestinations(originLat, originLon, targetTemp) {
        const promises = this.cityList.map(city => 
            this.getWeatherByCoords(city.lat, city.lon)
        );

        const results = await Promise.all(promises);
        
        return results
            .filter(weather => weather.main.temp >= targetTemp)
            .map(weather => ({
                name: weather.name,
                temp: weather.main.temp,
                lat: weather.coord.lat,
                lon: weather.coord.lon,
                distance: locationService.calculateDistance(
                    originLat,
                    originLon,
                    weather.coord.lat,
                    weather.coord.lon
                )
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 10);
    }
}