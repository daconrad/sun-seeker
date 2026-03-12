export default function NearbyList({ cities }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold mb-4">
        Nearby Cities (70°F or higher)
      </h2>
      <div className="space-y-4">
        {cities.map((city) => (
          <div
            key={city.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div>
              <p className="font-medium">{city.name}</p>
              <p className="text-sm text-gray-600">
                {Math.round(city.distance)} km away
              </p>
            </div>
            <div className="text-2xl font-bold">
              {Math.round(city.main.temp)}°F
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}