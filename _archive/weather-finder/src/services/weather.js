import fetch from 'node-fetch';

export class WeatherService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
  }

  async getWeatherByZip(zipCode) {
    const response = await fetch(
      `${this.baseUrl}/weather?zip=${zipCode},us&appid=${this.apiKey}&units=imperial`
    );
    
    if (!response.ok) {
      throw new Error('Invalid ZIP code or API error');
    }
    
    return response.json();
  }

  async getNearbyWeather(lat, lon) {
    // Increased the radius by using a larger value for cnt (number of cities)
    // and adding a minimum distance between cities
    const response = await fetch(
      `${this.baseUrl}/find?lat=${lat}&lon=${lon}&cnt=50&appid=${this.apiKey}&units=imperial`
    );
    
    if (!response.ok) {
      throw new Error('Error fetching nearby cities');
    }
    
    const data = await response.json();
    
    // Filter cities to ensure they're not too close to each other (minimum 20km apart)
    return data.list.reduce((acc, city) => {
      const isFarEnough = acc.every(existingCity => {
        const distance = this.calculateDistance(
          city.coord.lat, city.coord.lon,
          existingCity.coord.lat, existingCity.coord.lon
        );
        return distance > 300;
      });
      
      if (isFarEnough) {
        acc.push(city);
      }
      return acc;
    }, []).slice(0, 10); // Keep top 10 cities
  }

  // Calculate distance between two points using Haversine formula
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRad(value) {
    return value * Math.PI / 180;
  }
}