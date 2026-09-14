# ☀️ Sun Seeker

**Find your closest warm-weather escape.**

Sun Seeker is a web application that helps you discover the nearest warm-weather destinations based on your current location and desired temperature. Whether you're looking to escape a chilly rainy day or planning a quick road trip to the sun, Sun Seeker calculates the closest cities currently meeting or exceeding your target temperature.

---

## ✨ Features

- **Flexible Origin Input**: Use browser geolocation to automatically detect your coordinates, or enter any 5-digit US Zip Code.
- **Interactive Temperature Slider**: Choose your ideal target temperature (between **60°F and 100°F**) with a dynamic, color-coded range slider.
- **Smart Proximity Search**:
  - Calculates the great-circle distance (via the Haversine formula) from your origin to ~100 curated destinations across the Western United States.
  - Sorts destinations by distance and queries real-time weather conditions sequentially to find your **top 10 closest warm escapes** while respecting API rate limits.
- **Live Weather Details**: Displays current temperature, weather conditions, weather icons, and distance in miles for every matching destination.
- **One-Click Navigation**: Jump straight to any recommended destination on Google Maps.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3 (custom glassmorphism design & responsive grid), Vanilla JavaScript
- **Backend**: Node.js, Express (`^5.2.1`)
- **External APIs**:
  - [OpenWeatherMap Current Weather API](https://openweathermap.org/current)
  - [OpenWeatherMap Geocoding API](https://openweathermap.org/api/geocoding-api)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- An API key from [OpenWeatherMap](https://openweathermap.org/api)

### 1. Clone the Repository

```bash
git clone https://github.com/daconrad/sun-seeker.git
cd sun-seeker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory and add your OpenWeatherMap API key:

```env
OPENWEATHER_API_KEY=your_openweathermap_api_key_here
PORT=3000
```

### 4. Start the Application

```bash
npm start
```

The server will start at **http://localhost:3000**. Open this URL in your browser to start searching for warm destinations!

---

## 📂 Project Structure

```text
sun-seeker/
├── destinations.json    # Curated list of ~100 Western US destinations with coordinates
├── package.json         # Project metadata, scripts, and dependencies
├── server.js            # Express server, distance calculator, and OpenWeather API proxy
└── public/              # Static frontend assets
    ├── index.html       # Main application layout and destination card template
    ├── main.js          # Frontend state, geolocation handling, and API integration
    └── style.css        # Custom styling, animations, and responsive layout
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/geocode?zip={zip}` | Resolves a 5-digit US Zip Code into latitude and longitude coordinates. |
| `POST` | `/api/destinations` | Accepts `{ originLat, originLon, targetTemp }` and returns up to 10 closest destinations meeting the target temperature. |
