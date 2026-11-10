import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { FormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { WeatherLocation } from './weather.models';
import { WeatherComponent } from './weather.component';
import { WeatherService } from './weather.service';

describe('WeatherComponent', () => {
    let component: WeatherComponent;
    let weatherService: {
        searchLocations: Mock<WeatherService['searchLocations']>;
        getForecast: Mock<WeatherService['getForecast']>;
    };
    const paris: WeatherLocation = {
        id: 1,
        name: 'Paris',
        country: 'France',
        latitude: 48.8566,
        longitude: 2.3522,
    };

    beforeEach(async () => {
        weatherService = {
            searchLocations: vi.fn<WeatherService['searchLocations']>(),
            getForecast: vi.fn<WeatherService['getForecast']>(),
        };
        await TestBed.configureTestingModule({
            imports: [FormsModule],
            declarations: [WeatherComponent],
            providers: [{ provide: WeatherService, useValue: weatherService }],
        }).compileComponents();

        component = TestBed.createComponent(WeatherComponent).componentInstance;
    });

    it('searches for places and shows matching results', () => {
        weatherService.searchLocations.mockReturnValue(of([paris]));

        component.searchCity(' Paris ');

        expect(weatherService.searchLocations).toHaveBeenCalledWith('Paris');
        expect(component.locations).toEqual([paris]);
        expect(component.isSearching).toBe(false);
    });

    it('shows a helpful message when a search has no matches', () => {
        weatherService.searchLocations.mockReturnValue(of([]));

        component.searchCity('Somewhere');

        expect(component.searchMessage).toContain('No places found');
    });

    it('converts temperatures and wind speed when Fahrenheit is selected', () => {
        component.setUnit('F');

        expect(component.formatTemperature(20)).toBe(68);
        expect(component.formatWind(16)).toBe(10);
        expect(component.windUnit()).toBe('mph');
    });

    it('shows the chosen location while its forecast loads', () => {
        weatherService.getForecast.mockReturnValue(of({
            current: {
                time: '2026-11-10T12:00',
                temperature: 18,
                feelsLike: 17,
                humidity: 55,
                windSpeed: 12,
                precipitation: 0,
                isDay: true,
                condition: { description: 'Partly cloudy', icon: 'wi-day-cloudy' },
            },
            hourly: [],
            daily: [],
            sunrise: '2026-11-10T06:30',
            sunset: '2026-11-10T17:15',
            uvIndex: 2,
        }));

        component.chooseLocation(paris);

        expect(weatherService.getForecast).toHaveBeenCalledWith(paris);
        expect(component.selectedLocation).toBe(paris);
        expect(component.forecast?.current.temperature).toBe(18);
        expect(component.isLoadingWeather).toBe(false);
    });
});
