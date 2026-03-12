import { useState } from 'react';
import WeatherDisplay from './components/WeatherDisplay';
import ZipCodeInput from './components/ZipCodeInput';
import NearbyList from './components/NearbyList';

const API_KEY = 'a60f66bf893ff1d959e7c11fadc5facd';

function App() {
  const [currentWeather, setCurrentWeather] = useState(null);
  const [nearbyCities, setNearbyCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleZipSubmit = async (zipCode) => {
    setLoading(true);
    setError('');
    try {
      // Get weather for entered ZIP code
      const locationRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?zip=${zipCode},us&appid=${API_KEY}&units=imperial`
      );
      
      if (!locationRes.ok) throw new Error('Invalid ZIP code');
      const locationData = await locationRes.json();
      setCurrentWeather(locationData);

      // Get nearby cities
      const { lat, lon } = locationData.coord;
      const nearbyRes = await fetch(
        `https://api.openweathermap.org/data/2.5/find?lat=${lat}&lon=${lon}&cnt=50&appid=${API_KEY}&units=imperial`
      );
      
      if (!nearbyRes.ok) throw new Error('Error fetching nearby cities');
      const nearbyData = await nearbyRes.json();
      
      // Filter warm cities and ensure minimum distance
      const filteredCities = nearbyData.list.reduce((acc, city) => {
        const isFarEnough = acc.every(existingCity => {
          const distance = calculateDistance(
            city.coord.lat, city.coord.lon,
            existingCity.coord.lat, existingCity.coord.lon
          );
          return distance > 600;
        });
        
        if (isFarEnough && city.main.temp >= 70) {
          acc.push(city);
        }
        return acc;
      }, []).slice(0, 10);

      setNearbyCities(filteredCities);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const toRad = (value) => value * Math.PI / 180;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white text-center mb-8">
          Weather Finder
        </h1>
        
        <ZipCodeInput onSubmit={handleZipSubmit} loading={loading} />
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {currentWeather && (
          <WeatherDisplay weather={currentWeather} />
        )}

        {nearbyCities.length > 0 && (
          <NearbyList cities={nearbyCities} />
        )}
      </div>
    </div>
  );
}

export default App;