export interface WeatherLocation {
  id: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

export interface WeatherCondition {
  description: string;
  icon: string;
}

export interface WeatherHour {
  time: string;
  temperature: number;
  precipitationProbability: number;
  icon: string;
}

export interface WeatherDay {
  date: string;
  min: number;
  max: number;
  icon: string;
  description: string;
}

export interface WeatherForecast {
  current: {
    time: string;
    temperature: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    precipitation: number;
    isDay: boolean;
    condition: WeatherCondition;
  };
  hourly: WeatherHour[];
  daily: WeatherDay[];
  sunrise: string;
  sunset: string;
  uvIndex: number;
}
