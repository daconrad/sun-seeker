class LocationService {
    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                position => {
                    resolve({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    });
                },
                error => {
                    reject(error);
                }
            );
        });
    }

    async getLocationFromZip(zipCode) {
        const response = await fetch(
            `https://api.openweathermap.org/geo/1.0/zip?zip=${zipCode},US&appid=${process.env.OPENWEATHER_API_KEY}`
        );
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error('Invalid ZIP code');
        }

        return {
            lat: data.lat,
            lon: data.lon
        };
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 3959; // Earth's radius in miles
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    toRad(degrees) {
        return degrees * (Math.PI/180);
    }

    getGoogleMapsUrl(lat, lon) {
        return `https://www.google.com/maps?q=${lat},${lon}`;
    }
}