document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    const originZipInput = document.getElementById('originZip');
    const useLocationBtn = document.getElementById('useLocationBtn');
    const locationStatus = document.getElementById('locationStatus');
    const targetTempInput = document.getElementById('targetTemp');
    const tempDisplay = document.getElementById('tempDisplay');
    const searchBtn = document.getElementById('searchBtn');
    
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const errorMessage = document.getElementById('errorMessage');
    const resultsContainer = document.getElementById('results-container');
    const destinationsList = document.getElementById('destinationsList');
    const template = document.getElementById('destination-card-template');

    let currentLat = null;
    let currentLon = null;

    // Update temperature badge and thumb color on slider move
    targetTempInput.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        tempDisplay.innerHTML = `${val}&deg;F`;
        
        // Update the CSS variable for the thumb color so it matches the thermometer gradient
        let color = '#f59e0b'; // default amber
        if (val < 70) color = '#3b82f6'; // blue
        else if (val < 80) color = '#10b981'; // green
        else if (val < 90) color = '#f59e0b'; // amber
        else color = '#ef4444'; // red
        
        document.documentElement.style.setProperty('--thumb-color', color);
    });

    // Handle "Use Location" button
    useLocationBtn.addEventListener('click', () => {
        if (!navigator.geolocation) {
            showInlineError("Geolocation is not supported by your browser.");
            return;
        }

        useLocationBtn.disabled = true;
        locationStatus.textContent = "Detecting location...";
        locationStatus.className = "status-msg";

        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentLat = position.coords.latitude;
                currentLon = position.coords.longitude;
                originZipInput.value = ''; // Clear zip if we have exact location
                originZipInput.placeholder = 'Using Current Location';
                locationStatus.textContent = "Location detected successfully!";
                locationStatus.className = "status-msg";
                useLocationBtn.disabled = false;
            },
            (err) => {
                console.warn(err);
                showInlineError("Unable to retrieve your location. Please enter a Zip code.");
                useLocationBtn.disabled = false;
            }
        );
    });

    // Clear exact location if user starts typing a zip code
    originZipInput.addEventListener('input', () => {
        if (originZipInput.value.length > 0) {
            currentLat = null;
            currentLon = null;
            originZipInput.placeholder = 'e.g. 98101';
            locationStatus.textContent = '';
        }
    });

    function showInlineError(msg) {
        locationStatus.textContent = msg;
        locationStatus.className = "status-msg text-error";
    }

    function showError(msg) {
        hideAllStates();
        errorMessage.textContent = msg;
        errorState.classList.remove('hidden');
    }

    function hideAllStates() {
        loadingState.classList.add('hidden');
        errorState.classList.add('hidden');
        resultsContainer.classList.add('hidden');
    }

    // Resolve zip to coordinates using our backend proxy
    async function getCoordinatesFromZip(zip) {
        try {
            const response = await fetch(`/api/geocode?zip=${zip}`);
            if (!response.ok) {
                throw new Error('Invalid Zip Code or not found');
            }
            const data = await response.json();
            return { lat: data.lat, lon: data.lon };
        } catch (error) {
            throw error;
        }
    }

    // Fetch destinations from backend given coords and target temp
    async function fetchDestinations(lat, lon, targetTemp) {
        try {
            const response = await fetch('/api/destinations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    originLat: lat,
                    originLon: lon,
                    targetTemp: parseFloat(targetTemp)
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to fetch destinations');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    // Render results
    function renderResults(results) {
        destinationsList.innerHTML = '';
        
        if (results.length === 0) {
            showError(`No destinations found west of the Mississippi with a temperature of at least ${targetTempInput.value}°F right now. Try lowering the temperature.`);
            return;
        }

        results.forEach(dest => {
            const clone = template.content.cloneNode(true);
            
            clone.querySelector('.dest-name').textContent = `${dest.name}, ${dest.state}`;
            
            clone.querySelector('.dest-temp').textContent = dest.temperature;
            clone.querySelector('.condition').textContent = dest.condition;
            clone.querySelector('.dest-dist').textContent = `${dest.distance.toLocaleString()} miles away`;
            
            // Set Weather Icon
            if (dest.icon) {
                clone.querySelector('.weather-icon').src = `https://openweathermap.org/img/wn/${dest.icon}@2x.png`;
            }

            // Google Maps Link
            const mapsLink = clone.querySelector('.maps-link');
            // Format: https://www.google.com/maps/search/?api=1&query=lat,lon
            mapsLink.href = `https://www.google.com/maps/search/?api=1&query=${dest.lat},${dest.lon}`;

            destinationsList.appendChild(clone);
        });

        hideAllStates();
        resultsContainer.classList.remove('hidden');
        
        // Scroll to results
        setTimeout(() => {
            resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    // Main form submission
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const zip = originZipInput.value.trim();
        const targetTemp = targetTempInput.value;

        if (!currentLat && !zip) {
            showInlineError("Please enter a Zip Code or use Detect Location.");
            return;
        }

        // Validate zip if provided
        if (zip && !/^\d{5}$/.test(zip)) {
            showInlineError("Please enter a valid 5-digit US Zip Code.");
            return;
        }

        hideAllStates();
        loadingState.classList.remove('hidden');
        searchBtn.disabled = true;

        try {
            let lat = currentLat;
            let lon = currentLon;

            // If we don't have exact lat/lon but we have a zip, resolve it
            if (!lat || !lon) {
                const coords = await getCoordinatesFromZip(zip);
                lat = coords.lat;
                lon = coords.lon;
            }

            const data = await fetchDestinations(lat, lon, targetTemp);
            renderResults(data.results);

        } catch (error) {
            console.error(error);
            showError(error.message || "An unexpected error occurred. Please try again.");
        } finally {
            searchBtn.disabled = false;
        }
    });

});
