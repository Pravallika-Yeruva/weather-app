import { Component, ChangeDetectionStrategy } from '@angular/core';
import { WeatherDay, WeatherForecast, WeatherHour, WeatherLocation } from './weather.models';
import { WeatherService } from './weather.service';

@Component({
    selector: 'app-weather',
    templateUrl: './weather.component.html',
    styleUrls: ['./weather.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class WeatherComponent {
  query = '';
  locations: WeatherLocation[] = [];
  selectedLocation: WeatherLocation | null = null;
  forecast: WeatherForecast | null = null;
  isSearching = false;
  isLoadingWeather = false;
  errorMessage = '';
  searchMessage = '';
  unit: 'C' | 'F' = 'C';

  readonly suggestedCities = ['London', 'Tokyo', 'New York', 'Sydney'];

  constructor(private readonly weatherService: WeatherService) {}

  searchCity(query: string = this.query): void {
    const normalizedQuery = query.trim();
    if (!normalizedQuery || this.isSearching || this.isLoadingWeather) {
      return;
    }

    this.query = normalizedQuery;
    this.searchMessage = '';
    this.errorMessage = '';
    this.locations = [];
    this.isSearching = true;

    this.weatherService.searchLocations(normalizedQuery).subscribe(
      locations => {
        this.isSearching = false;
        this.locations = locations;
        if (locations.length === 0) {
          this.searchMessage = 'No places found. Try a nearby city or check the spelling.';
        }
      },
      () => {
        this.isSearching = false;
        this.searchMessage = 'We couldn’t search for that place. Check your connection and try again.';
      },
    );
  }

  chooseLocation(location: WeatherLocation): void {
    if (this.isLoadingWeather) {
      return;
    }

    this.locations = [];
    this.searchMessage = '';
    this.errorMessage = '';
    this.isLoadingWeather = true;
    this.selectedLocation = location;

    this.weatherService.getForecast(location).subscribe(
      forecast => {
        this.forecast = forecast;
        this.isLoadingWeather = false;
      },
      () => {
        this.forecast = null;
        this.isLoadingWeather = false;
        this.errorMessage = 'Weather couldn’t be loaded. Please check your connection and try again.';
      },
    );
  }

  useMyLocation(): void {
    if (!navigator.geolocation) {
      this.errorMessage = 'Location sharing isn’t available in this browser. Search for a city instead.';
      return;
    }

    this.errorMessage = '';
    this.searchMessage = '';
    this.isLoadingWeather = true;
    this.locations = [];

    navigator.geolocation.getCurrentPosition(
      position => {
        this.isLoadingWeather = false;
        const location: WeatherLocation = {
          id: 0,
          name: 'Your location',
          country: '',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        this.chooseLocation(location);
      },
      () => {
        this.isLoadingWeather = false;
        this.errorMessage = 'We couldn’t access your location. Allow location access or search for a city.';
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  refresh(): void {
    if (this.selectedLocation && !this.isLoadingWeather) {
      this.chooseLocation(this.selectedLocation);
    }
  }

  setUnit(unit: 'C' | 'F'): void {
    this.unit = unit;
  }

  formatTemperature(temperature: number): number {
    return Math.round(this.unit === 'F' ? temperature * 9 / 5 + 32 : temperature);
  }

  formatWind(speed: number): number {
    return Math.round(this.unit === 'F' ? speed * 0.621371 : speed);
  }

  windUnit(): string {
    return this.unit === 'F' ? 'mph' : 'km/h';
  }

  locationName(location: WeatherLocation): string {
    return location.admin1 ? location.name + ', ' + location.admin1 : location.name;
  }

  trackByTime(_index: number, hour: WeatherHour): string {
    return hour.time;
  }

  trackByDate(_index: number, day: WeatherDay): string {
    return day.date;
  }

  trackByLocation(_index: number, location: WeatherLocation): number {
    return location.id;
  }

  formatHour(time: string): string {
    const hour = Number(time.slice(11, 13));
    const displayHour = hour % 12 || 12;
    return displayHour + (hour >= 12 ? ' PM' : ' AM');
  }

  formatDay(date: string, index: number): string {
    if (index === 0) {
      return 'Today';
    }
    if (index === 1) {
      return 'Tomorrow';
    }
    return new Date(date + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' });
  }

  formatDate(date: string): string {
    return new Date(date + 'T12:00:00').toLocaleDateString('en', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }

  formatTime(time: string): string {
    return time.slice(11, 16);
  }
}
