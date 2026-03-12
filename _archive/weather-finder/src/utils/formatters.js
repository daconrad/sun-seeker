import chalk from 'chalk';

export function formatTemperature(temp) {
  return chalk.yellow(`${Math.round(temp)}°F`);
}

export function formatCity(cityData) {
  const distance = cityData.distance ? ` (${Math.round(cityData.distance)} km away)` : '';
  return `${chalk.blue(cityData.name.padEnd(50))} Temperature: ${formatTemperature(cityData.main.temp)}${chalk.gray(distance)}`;
}