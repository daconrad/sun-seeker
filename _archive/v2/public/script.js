const form = document.getElementById('weather-form');
const zipInput = document.getElementById('zip');
const tempInput = document.getElementById('temp');
const resultsDiv = document.getElementById('results');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const zip = zipInput.value;
    const temp = tempInput.value;

    const response = await fetch('/api/weather', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ zip, temp })
    });

    const cities = await response.json();

    if (cities.error) {
        resultsDiv.innerHTML = `<p>${cities.error}</p>`;
        return;
    }

    if (cities.length === 0) {
        resultsDiv.innerHTML = '<p>No cities found with the desired temperature.</p>';
        return;
    }

    resultsDiv.innerHTML = cities.map(city => `
        <div>
            <h3>${city.name}</h3>
            <p>Temperature: ${city.temp}°F</p>
        </div>
    `).join('');
});