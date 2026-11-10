import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { WeatherDay, WeatherForecast, WeatherHour, WeatherLocation } from './weather.models';

interface GeocodingResponse {
  results?: WeatherLocation[];
}

interface ForecastResponse {
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    is_day: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    weather_code: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
  };
}

const weatherDescriptions: { [code: number]: string } = {
  0: 'Clear sky',
  1: 'Mostly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  56: 'Freezing drizzle',
  57: 'Heavy freezing drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Heavy freezing rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Light showers',
  81: 'Rain showers',
  82: 'Heavy showers',
  85: 'Snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Thunderstorm with heavy hail',
};

@Injectable({ providedIn: 'root' })
export class WeatherService {
  constructor(private readonly http: HttpClient) {}

  searchLocations(query: string): Observable<WeatherLocation[]> {
    const params = new HttpParams()
      .set('name', query)
      .set('count', '5')
      .set('language', 'en')
      .set('format', 'json');

    return this.http
      .get<GeocodingResponse>('https://geocoding-api.open-meteo.com/v1/search', { params })
      .pipe(map(response => response.results || []));
  }

  getForecast(location: WeatherLocation): Observable<WeatherForecast> {
    const params = new HttpParams()
      .set('latitude', String(location.latitude))
      .set('longitude', String(location.longitude))
      .set('current', 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m')
      .set('hourly', 'temperature_2m,precipitation_probability,weather_code')
      .set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max')
      .set('temperature_unit', 'celsius')
      .set('wind_speed_unit', 'kmh')
      .set('timezone', 'auto')
      .set('forecast_days', '7');

    return this.http
      .get<ForecastResponse>('https://api.open-meteo.com/v1/forecast', { params })
      .pipe(map(response => this.toForecast(response)));
  }

  private toForecast(response: ForecastResponse): WeatherForecast {
    const currentHour = response.current.time.slice(0, 13);
    const currentHourIndex = response.hourly.time.findIndex(time => time.slice(0, 13) === currentHour);
    const firstHour = currentHourIndex === -1
      ? response.hourly.time.findIndex(time => time > response.current.time)
      : currentHourIndex;
    const start = Math.max(0, firstHour);

    const hourly: WeatherHour[] = response.hourly.time
      .slice(start, start + 8)
      .map((time, index) => {
        const sourceIndex = start + index;
        return {
          time,
          temperature: response.hourly.temperature_2m[sourceIndex],
          precipitationProbability: response.hourly.precipitation_probability[sourceIndex],
          icon: this.getCondition(response.hourly.weather_code[sourceIndex], true).icon,
        };
      });

    const daily: WeatherDay[] = response.daily.time.map((date, index) => ({
      date,
      min: response.daily.temperature_2m_min[index],
      max: response.daily.temperature_2m_max[index],
      icon: this.getCondition(response.daily.weather_code[index], true).icon,
      description: this.getCondition(response.daily.weather_code[index], true).description,
    }));

    return {
      current: {
        time: response.current.time,
        temperature: response.current.temperature_2m,
        feelsLike: response.current.apparent_temperature,
        humidity: response.current.relative_humidity_2m,
        windSpeed: response.current.wind_speed_10m,
        precipitation: response.current.precipitation,
        isDay: response.current.is_day === 1,
        condition: this.getCondition(response.current.weather_code, response.current.is_day === 1),
      },
      hourly,
      daily,
      sunrise: response.daily.sunrise[0],
      sunset: response.daily.sunset[0],
      uvIndex: response.daily.uv_index_max[0],
    };
  }

  private getCondition(code: number, isDay: boolean): { description: string; icon: string } {
    const description = weatherDescriptions[code] || 'Conditions unavailable';
    let icon: string;

    if (code === 0 || code === 1) {
      icon = isDay ? 'wi-day-sunny' : 'wi-night-clear';
    } else if (code === 2) {
      icon = isDay ? 'wi-day-cloudy' : 'wi-night-alt-cloudy';
    } else if (code === 3) {
      icon = 'wi-cloudy';
    } else if (code === 45 || code === 48) {
      icon = 'wi-fog';
    } else if (code >= 71 && code <= 86) {
      icon = 'wi-snow';
    } else if (code >= 95) {
      icon = 'wi-thunderstorm';
    } else if (code >= 51 && code <= 67 || code >= 80 && code <= 82) {
      icon = 'wi-rain';
    } else {
      icon = 'wi-day-cloudy';
    }

    return { description, icon };
  }
}
