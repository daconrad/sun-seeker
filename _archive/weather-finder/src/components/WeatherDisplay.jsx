export default function WeatherDisplay({ weather }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-semibold mb-4">Current Location Weather</h2>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg">
            <span className="font-medium">{weather.name}</span>
          </p>
          <p className="text-gray-600">
            {weather.weather[0].description}
          </p>
        </div>
        <div className="text-4xl font-bold">
          {Math.round(weather.main.temp)}°F
        </div>
      </div>
    </div>
  );
}