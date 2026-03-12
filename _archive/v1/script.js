// Function to load environment variables from .env file
async function loadEnv() {
    const response = await fetch('.env');
    const text = await response.text();
    const env = {};
    text.split('
').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            env[key.trim()] = value.trim();
        }
    });
    return env;
}

let API_KEY;

// Load the environment variables and then initialize the app
loadEnv().then(env => {
    API_KEY = env.OPENWEATHER_API_KEY;
    if (!API_KEY) {
        console.error("API key not found. Make sure you have a .env file with OPENWEATHER_API_KEY set.");
        alert("API key not found. Please contact the developer.");
    }
});

let originLocation = null; // Store the user's origin location (lat, lon)

// Function to get the user's current location
function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    originLocation = {
                        lat: position.coords.latitude,
                        lon: position.coords.longitude,
                    };
                    resolve(originLocation);
                },
                (error) => {
                    reject(error);
                }
            );
        } else {
            reject(new Error("Geolocation is not supported by this browser."));
        }
    });
}

// Function to get location from zip code
async function getLocationFromZip(zipCode) {
    const geocodingUrl = `https://api.openweathermap.org/geo/1.0/zip?zip=${zipCode}&appid=${API_KEY}`;
    try {
        const response = await fetch(geocodingUrl);
        const data = await response.json();
        if (data.cod && data.cod !== 200) {
            throw new Error(data.message || "Error getting location from zip code.");
        }
        originLocation = {
            lat: data.lat,
            lon: data.lon,
        };
        return originLocation;
    } catch (error) {
        console.error("Error getting location from zip code:", error);
        throw error;
    }
}

// Function to get weather data for a location
async function getWeatherData(lat, lon) {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=imperial`;
    try {
        const response = await fetch(weatherUrl);
        const data = await response.json();
        if (data.cod && data.cod !== 200) {
            throw new Error(data.message || "Error getting weather data.");
        }
        return data;
    } catch (error) {
        console.error("Error getting weather data:", error);
        throw error;
    }
}

// Function to calculate distance between two locations (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3958.8; // Radius of the Earth in miles
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

// Function to find destinations
async function findDestinations(targetTemp) {
    const destinations = [];
    const cities = [
        { name: "Los Angeles", lat: 34.0522, lon: -118.2437 },
        { name: "Miami", lat: 25.7617, lon: -80.1918 },
        { name: "Phoenix", lat: 33.4484, lon: -112.0740 },
        { name: "Las Vegas", lat: 36.1699, lon: -115.1398 },
        { name: "San Diego", lat: 32.7157, lon: -117.1611 },
        { name: "Orlando", lat: 28.5383, lon: -81.3792 },
        { name: "Honolulu", lat: 21.3069, lon: -157.8583 },
        { name: "New Orleans", lat: 29.9511, lon: -90.0715 },
        { name: "Tampa", lat: 27.9506, lon: -82.4572 },
        { name: "Austin", lat: 30.2672, lon: -97.7431 },
        { name: "Dallas", lat: 32.7767, lon: -96.7970 },
        { name: "Houston", lat: 29.7604, lon: -95.3698 },
        { name: "Atlanta", lat: 33.7490, lon: -84.3880 },
        { name: "Charlotte", lat: 35.2271, lon: -80.8431 },
        { name: "Jacksonville", lat: 30.3322, lon: -81.6557 },
        { name: "Nashville", lat: 36.1627, lon: -86.7816 },
        { name: "San Antonio", lat: 29.4241, lon: -98.4936 },
        { name: "Denver", lat: 39.7392, lon: -104.9903 },
        { name: "Salt Lake City", lat: 40.7608, lon: -111.8910 },
        { name: "Tucson", lat: 32.2226, lon: -110.9747 },
    ];

    for (const city of cities) {
        try {
            const weatherData = await getWeatherData(city.lat, city.lon);
            const temperature = weatherData.main.temp;
            if (temperature >= targetTemp) {
                const distance = calculateDistance(
                    originLocation.lat,
                    originLocation.lon,
                    city.lat,
                    city.lon
                );
                destinations.push({
                    name: city.name,
                    lat: city.lat,
                    lon: city.lon,
                    temperature,
                    distance,
                });
            }
        } catch (error) {
            console.error(`Error getting weather for ${city.name}:`, error);
        }
    }
    destinations.sort((a, b) => a.distance - b.distance);
    return destinations.slice(0, 10);
}

// Function to display destinations
function displayDestinations(destinations) {
    const destinationsList = document.getElementById("destinations-list");
    destinationsList.innerHTML = ""; // Clear previous results

    if (destinations.length === 0) {
        const li = document.createElement("li");
        li.textContent = "No destinations found matching your criteria.";
        destinationsList.appendChild(li);
        return;
    }

    destinations.forEach((destination) => {
        const li = document.createElement("li");
        const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${destination.lat},${destination.lon}`;
        li.innerHTML = `
            <strong>${destination.name}</strong><br>
            <a href="${googleMapsLink}" target="_blank">View on Google Maps</a><br>
            Distance: ${destination.distance.toFixed(2)} miles<br>
            Temperature: ${destination.temperature.toFixed(1)}°F
        `;
        destinationsList.appendChild(li);
    });
}

function displayError(message) {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = `<p class="error">${message}</p>`;
}

// Event listeners
document.getElementById("detect-location").addEventListener("click", async () => {
    try {
        await getCurrentLocation();
        alert("Location detected successfully!");
    } catch (error) {
        console.error("Error getting current location:", error);
        displayError("Error getting current location. Please enter your zip code.");
    }
});

document.getElementById("submit-zip").addEventListener("click", async () => {
    const zipCode = document.getElementById("zip-code").value.trim();
    if (/^\d{5}$/.test(zipCode)) {
        try {
            await getLocationFromZip(zipCode);
            alert("Location from zip code detected successfully!");
        } catch (error) {
            displayError("Error getting location from zip code. Please check the zip code and try again.");
        }
    } else {
        displayError("Please enter a valid 5-digit zip code.");
    }
});

const findDestinationsButton = document.getElementById("find-destinations");
findDestinationsButton.addEventListener("click", async () => {
    const targetTemp = parseFloat(document.getElementById("target-temp").value);
    if (isNaN(targetTemp)) {
        displayError("Please enter a valid target temperature.");
        return;
    }
    if (!originLocation) {
        displayError("Please provide your origin location first.");
        return;
    }
    try {
        findDestinationsButton.textContent = "Finding...";
        findDestinationsButton.disabled = true;
        const destinations = await findDestinations(targetTemp);
        displayDestinations(destinations);
    } catch (error) {
        console.error("Error finding destinations:", error);
        displayError("Error finding destinations. Please try again.");
    } finally {
        findDestinationsButton.textContent = "Find Destinations";
        findDestinationsButton.disabled = false;
    }
});
