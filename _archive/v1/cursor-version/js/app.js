const locationService = new LocationService();
const weatherService = new WeatherService();

let userLocation = null;

document.getElementById('detectLocation').addEventListener('click', async () => {
    try {
        userLocation = await locationService.getCurrentLocation();
        showTemperatureInput();
    } catch (error) {
        alert('Error detecting location: ' + error.message);
    }
});

document.getElementById('submitZip').addEventListener('click', async () => {
    const zipCode = document.getElementById('zipCode').value;
    try {
        userLocation = await locationService.getLocationFromZip(zipCode);
        showTemperatureInput();
    } catch (error) {
        alert('Error with ZIP code: ' + error.message);
    }
});

document.getElementById('findDestinations').addEventListener('click', async () => {
    const targetTemp = parseFloat(document.getElementById('targetTemp').value);
    
    if (!targetTemp) {
        alert('Please enter a valid temperature');
        return;
    }

    document.getElementById('loading').style.display = 'block';
    document.getElementById('destinationsList').innerHTML = '';

    try {
        const destinations = await weatherService.findWarmDestinations(
            userLocation.lat,
            userLocation.lon,
            targetTemp
        );

        displayDestinations(destinations);
    } catch (error) {
        alert('Error finding destinations: ' + error.message);
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
});

function showTemperatureInput() {
    document.getElementById('temperatureInput').style.display = 'block';
}

function displayDestinations(destinations) {
    const list = document.getElementById('destinationsList');
    
    destinations.forEach(dest => {
        const li = document.createElement('li');
        li.innerHTML = `
            <h3>${dest.name}</h3>
            <p>Temperature: ${Math.round(dest.temp)}°F</p>
            <p>Distance: ${Math.round(dest.distance)} miles</p>
            <a href="${locationService.getGoogleMapsUrl(dest.lat, dest.lon)}" 
               target="_blank">View on Google Maps</a>
        `;
        list.appendChild(li);
    });
}

// Initialize the weather service
weatherService.initialize().catch(error => {
    console.error('Error initializing weather service:', error);
});