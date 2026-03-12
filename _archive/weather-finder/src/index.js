import fetch from 'node-fetch';
import readlineSync from 'readline-sync';
import chalk from 'chalk';
import { WeatherService } from './services/weather.js';
import { formatTemperature, formatCity } from './utils/formatters.js';

const API_KEY = 'a60f66bf893ff1d959e7c11fadc5facd';
const weatherService = new WeatherService(API_KEY);

async function main() {
  try {
    const zipCode = readlineSync.question(chalk.cyan('Enter ZIP code: '));
    
    // Get weather for entered ZIP code
    const locationData = await weatherService.getWeatherByZip(zipCode);
    console.log(chalk.green('\nCurrent Location:'));
    console.log(formatCity(locationData));

    // Get nearby cities
    const { lat, lon } = locationData.coord;
    const nearbyCities = await weatherService.getNearbyWeather(lat, lon);
    
    // Filter cities with temperature >= 50°F
    const warmCities = nearbyCities.filter(city => city.main.temp >= 40);
    
    console.log(chalk.green('\nNearby Cities (50°F or higher):'));
    if (warmCities.length === 0) {
      console.log(chalk.yellow('No cities found with temperature of 50°F or higher'));
    } else {
      warmCities.forEach(city => {
        console.log(formatCity(city));
      });
    }

  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
  }
}

main();