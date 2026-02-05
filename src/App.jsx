import React, { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { MapPin, Search, Droplets, Wind, Eye, Gauge, Sunrise, Sunset, CloudRain, Thermometer, ArrowUp, ArrowDown, Compass, X } from 'lucide-react';

const API_KEY = import.meta.env.VITE_API_KEY;

export default function WeatherApp() {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchCity, setSearchCity] = useState('');
  const [locationName, setLocationName] = useState('');
  const [isCelsius, setIsCelsius] = useState(true);
  const [askedForLocation, setAskedForLocation] = useState(false);
  const [expandedPanel, setExpandedPanel] = useState(null);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    document.title = 'AETHER';
    if (!askedForLocation) {
      getUserLocation();
      setAskedForLocation(true);
    }
  }, [askedForLocation]);

  useEffect(() => {
    if (expandedPanel) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [expandedPanel]);

  const getUserLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          setError('Location access denied. Please search for a city.');
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation not supported. Please search for a city.');
      setLoading(false);
    }
  };

  const fetchWeatherByCoords = async (lat, lon) => {
    try {
      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
      );
      const weatherData = await weatherRes.json();
      
      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
      );
      const forecastData = await forecastRes.json();

      setWeather(weatherData);
      setForecast(forecastData);
      setLocationName(weatherData.name);
      setError(null);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch weather data');
      setLoading(false);
    }
  };

  const fetchWeatherByCity = async (city) => {
    if (!city.trim()) return;
    
    setLoading(true);
    try {
      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
      );
      const weatherData = await weatherRes.json();
      
      if (weatherData.cod === '404') {
        setError('City not found');
        setLoading(false);
        return;
      }

      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`
      );
      const forecastData = await forecastRes.json();

      setWeather(weatherData);
      setForecast(forecastData);
      setLocationName(weatherData.name);
      setError(null);
      setLoading(false);
      setSearchCity('');
    } catch (err) {
      setError('Failed to fetch weather data');
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchWeatherByCity(searchCity);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getDailyForecast = () => {
    if (!forecast) return [];
    
    const daily = {};
    forecast.list.forEach(item => {
      const date = new Date(item.dt * 1000).toLocaleDateString();
      if (!daily[date]) {
        daily[date] = item;
      }
    });
    
    return Object.values(daily).slice(0, 5);
  };

  const getHourlyForecast = () => {
    if (!forecast) return [];
    return forecast.list.slice(0, 8);
  };

  const convertTemp = (temp) => {
    if (isCelsius) return Math.round(temp);
    return Math.round((temp * 9/5) + 32);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const getWindDirection = (deg) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(deg / 45) % 8];
  };

  const DetailPanel = ({ type, onClose, dayData }) => {
    if (!weather) return null;

    // If it's a forecast day detail
    if (type === 'forecast-day' && dayData) {
      return (
        <div className={`fixed inset-0 ${isDark ? 'bg-black' : 'bg-white'} z-50 flex flex-col overflow-y-auto`}>
          <div className={`border-b-2 ${isDark ? 'border-white' : 'border-black'} p-6 flex items-center justify-between sticky top-0 ${isDark ? 'bg-black' : 'bg-white'}`}>
            <div className="flex items-center gap-4">
              <div className="text-2xl font-extralight tracking-[0.5em]">AETHER</div>
              <div className={`w-px h-8 ${isDark ? 'bg-white' : 'bg-black'}`}></div>
              <div className={`text-sm tracking-[0.3em] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {new Date(dayData.dt * 1000).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>
            </div>
            <button 
              onClick={onClose}
              className={`border-2 ${isDark ? 'border-white hover:bg-white hover:text-black' : 'border-black hover:bg-black hover:text-white'} p-3 transition-all duration-300`}
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-12">
            <div className="max-w-4xl w-full">
              <div className="text-center mb-16">
                <div className="text-9xl md:text-[12rem] font-extralight mb-4">
                  {convertTemp(dayData.main.temp)}°
                </div>
                <div className={`text-3xl tracking-[0.3em] ${isDark ? 'text-gray-400' : 'text-gray-600'} uppercase mb-2`}>
                  {dayData.weather[0].description}
                </div>
                <div className={`text-lg ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  {new Date(dayData.dt * 1000).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className={`border-2 ${isDark ? 'border-white hover:bg-white hover:text-black' : 'border-black hover:bg-black hover:text-white'} p-8 transition-all duration-300`}>
                  <div className={`text-xs tracking-[0.3em] ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>FEELS LIKE</div>
                  <div className="text-4xl font-extralight">{convertTemp(dayData.main.feels_like)}°</div>
                </div>

                <div className={`border-2 ${isDark ? 'border-white hover:bg-white hover:text-black' : 'border-black hover:bg-black hover:text-white'} p-8 transition-all duration-300`}>
                  <div className={`text-xs tracking-[0.3em] ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>HUMIDITY</div>
                  <div className="text-4xl font-extralight">{dayData.main.humidity}%</div>
                </div>

                <div className={`border-2 ${isDark ? 'border-white hover:bg-white hover:text-black' : 'border-black hover:bg-black hover:text-white'} p-8 transition-all duration-300`}>
                  <div className={`text-xs tracking-[0.3em] ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>WIND SPEED</div>
                  <div className="text-4xl font-extralight">{Math.round(dayData.wind.speed)} m/s</div>
                </div>

                <div className={`border-2 ${isDark ? 'border-white hover:bg-white hover:text-black' : 'border-black hover:bg-black hover:text-white'} p-8 transition-all duration-300`}>
                  <div className={`text-xs tracking-[0.3em] ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>WIND DIRECTION</div>
                  <div className="text-4xl font-extralight">{getWindDirection(dayData.wind.deg)}</div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-2`}>{dayData.wind.deg}°</div>
                </div>

                <div className={`border-2 ${isDark ? 'border-white hover:bg-white hover:text-black' : 'border-black hover:bg-black hover:text-white'} p-8 transition-all duration-300`}>
                  <div className={`text-xs tracking-[0.3em] ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>PRESSURE</div>
                  <div className="text-4xl font-extralight">{dayData.main.pressure}</div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-2`}>hPa</div>
                </div>

                <div className={`border-2 ${isDark ? 'border-white hover:bg-white hover:text-black' : 'border-black hover:bg-black hover:text-white'} p-8 transition-all duration-300`}>
                  <div className={`text-xs tracking-[0.3em] ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>CLOUDS</div>
                  <div className="text-4xl font-extralight">{dayData.clouds.all}%</div>
                </div>

                <div className={`border-2 ${isDark ? 'border-white hover:bg-white hover:text-black' : 'border-black hover:bg-black hover:text-white'} p-8 transition-all duration-300`}>
                  <div className={`text-xs tracking-[0.3em] ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>MIN TEMP</div>
                  <div className="text-4xl font-extralight">{convertTemp(dayData.main.temp_min)}°</div>
                </div>

                <div className={`border-2 ${isDark ? 'border-white hover:bg-white hover:text-black' : 'border-black hover:bg-black hover:text-white'} p-8 transition-all duration-300`}>
                  <div className={`text-xs tracking-[0.3em] ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>MAX TEMP</div>
                  <div className="text-4xl font-extralight">{convertTemp(dayData.main.temp_max)}°</div>
                </div>

                {dayData.wind.gust && (
                  <div className={`border-2 ${isDark ? 'border-white hover:bg-white hover:text-black' : 'border-black hover:bg-black hover:text-white'} p-8 transition-all duration-300`}>
                    <div className={`text-xs tracking-[0.3em] ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>WIND GUST</div>
                    <div className="text-4xl font-extralight">{Math.round(dayData.wind.gust)} m/s</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    const panels = {
      humidity: {
        title: 'HUMIDITY',
        icon: <Droplets size={32} />,
        mainValue: `${weather.main.humidity}%`,
        details: [
          { label: 'Current Level', value: `${weather.main.humidity}%` },
          { label: 'Dew Point', value: `${convertTemp(weather.main.temp - ((100 - weather.main.humidity) / 5))}°` },
          { label: 'Comfort Level', value: weather.main.humidity > 60 ? 'High' : weather.main.humidity > 30 ? 'Normal' : 'Low' }
        ]
      },
      wind: {
        title: 'WIND',
        icon: <Wind size={32} />,
        mainValue: `${Math.round(weather.wind.speed)} m/s`,
        details: [
          { label: 'Speed', value: `${Math.round(weather.wind.speed)} m/s` },
          { label: 'Direction', value: `${getWindDirection(weather.wind.deg)} (${weather.wind.deg}°)` },
          { label: 'Gust', value: weather.wind.gust ? `${Math.round(weather.wind.gust)} m/s` : 'N/A' }
        ]
      },
      pressure: {
        title: 'PRESSURE',
        icon: <Gauge size={32} />,
        mainValue: `${weather.main.pressure} hPa`,
        details: [
          { label: 'Atmospheric Pressure', value: `${weather.main.pressure} hPa` },
          { label: 'Sea Level', value: weather.main.sea_level ? `${weather.main.sea_level} hPa` : 'N/A' },
          { label: 'Ground Level', value: weather.main.grnd_level ? `${weather.main.grnd_level} hPa` : 'N/A' }
        ]
      },
      visibility: {
        title: 'VISIBILITY',
        icon: <Eye size={32} />,
        mainValue: `${(weather.visibility / 1000).toFixed(1)} km`,
        details: [
          { label: 'Distance', value: `${(weather.visibility / 1000).toFixed(1)} km` },
          { label: 'Clarity', value: weather.visibility > 8000 ? 'Excellent' : weather.visibility > 5000 ? 'Good' : 'Moderate' }
        ]
      },
      clouds: {
        title: 'CLOUD COVERAGE',
        icon: <CloudRain size={32} />,
        mainValue: `${weather.clouds.all}%`,
        details: [
          { label: 'Coverage', value: `${weather.clouds.all}%` },
          { label: 'Type', value: weather.weather[0].main },
          { label: 'Description', value: weather.weather[0].description }
        ]
      },
      sunrise: {
        title: 'SUNRISE',
        icon: <Sunrise size={32} />,
        mainValue: formatTime(weather.sys.sunrise),
        details: [
          { label: 'Time', value: formatTime(weather.sys.sunrise) },
          { label: 'Day Length', value: `${Math.round((weather.sys.sunset - weather.sys.sunrise) / 3600)} hours` }
        ]
      },
      sunset: {
        title: 'SUNSET',
        icon: <Sunset size={32} />,
        mainValue: formatTime(weather.sys.sunset),
        details: [
          { label: 'Time', value: formatTime(weather.sys.sunset) },
          { label: 'Day Length', value: `${Math.round((weather.sys.sunset - weather.sys.sunrise) / 3600)} hours` }
        ]
      }
    };

    const panel = panels[type];
    if (!panel) return null;

    return (
      <div className={`fixed inset-0 ${isDark ? 'bg-black' : 'bg-white'} z-50 flex flex-col overflow-y-auto`}>
        <div className={`border-b-2 ${isDark ? 'border-white' : 'border-black'} p-6 flex items-center justify-between sticky top-0 ${isDark ? 'bg-black' : 'bg-white'}`}>
          <div className="flex items-center gap-4">
            <div className="text-2xl font-extralight tracking-[0.5em]">AETHER</div>
            <div className={`w-px h-8 ${isDark ? 'bg-white' : 'bg-black'}`}></div>
            <div className={`text-sm tracking-[0.3em] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{panel.title}</div>
          </div>
          <button 
            onClick={onClose}
            className={`border-2 ${isDark ? 'border-white hover:bg-white hover:text-black' : 'border-black hover:bg-black hover:text-white'} p-3 transition-all duration-300`}
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-12">
          <div className="max-w-2xl w-full">
            <div className="text-center mb-16">
              <div className="mb-8 flex justify-center">
                {panel.icon}
              </div>
              <div className="text-8xl md:text-9xl font-extralight mb-4">
                {panel.mainValue}
              </div>
              <div className={`text-xl tracking-[0.3em] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {panel.title}
              </div>
            </div>

            <div className="grid gap-6">
              {panel.details.map((detail, i) => (
                <div key={i} className={`border-2 ${isDark ? 'border-white hover:bg-white hover:text-black' : 'border-black hover:bg-black hover:text-white'} p-8 transition-all duration-300`}>
                  <div className={`text-xs tracking-[0.3em] ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                    {detail.label}
                  </div>
                  <div className="text-3xl font-extralight">
                    {detail.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-black text-white' : 'bg-white text-black'} flex items-center justify-center`}>
        <div className={`text-3xl font-light tracking-[0.5em] animate-pulse`}>LOADING</div>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-black text-white' : 'bg-white text-black'} flex flex-col items-center justify-center p-4`}>
        <div className="text-2xl mb-12 tracking-[0.3em]">{error}</div>
        <div className="w-full max-w-md">
          <div className="relative group">
            <input
              type="text"
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="ENTER CITY NAME"
              className={`w-full ${isDark ? 'bg-black text-white border-white focus:bg-white focus:text-black' : 'bg-white text-black border-black focus:bg-black focus:text-white'} px-8 py-6 pr-16 border-2 focus:outline-none transition-all duration-300 placeholder-gray-500 uppercase tracking-[0.3em] text-sm`}
            />
            <button onClick={handleSearch} className="absolute right-4 top-1/2 -translate-y-1/2">
              <Search className={isDark ? 'text-white' : 'text-black'} size={24} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black text-white' : 'bg-white text-black'} transition-colors duration-300`}>
      {expandedPanel && expandedPanel.type && (
        <DetailPanel 
          type={expandedPanel.type} 
          onClose={() => setExpandedPanel(null)} 
          dayData={expandedPanel.dayData}
        />
      )}
      
      <div className="max-w-7xl mx-auto p-6 md:p-16">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-extralight tracking-[0.5em]">AETHER</h1>
          <div className={`h-px w-32 mx-auto mt-4 bg-gradient-to-r from-transparent ${isDark ? 'via-white' : 'via-black'} to-transparent`}></div>
        </div>

        <div className="mb-16 flex gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="SEARCH CITY"
              className={`w-full ${isDark ? 'bg-black text-white border-white focus:bg-white focus:text-black placeholder-gray-600' : 'bg-white text-black border-black focus:bg-black focus:text-white placeholder-gray-400'} px-8 py-6 pr-16 border-2 focus:outline-none transition-all duration-300 uppercase tracking-[0.3em] text-sm font-light`}
            />
            <button onClick={handleSearch} className="absolute right-4 top-1/2 -translate-y-1/2">
              <Search className={`${isDark ? 'text-white' : 'text-black'} hover:scale-110 transition-transform`} size={24} />
            </button>
          </div>
          
          <button
            onClick={() => setIsCelsius(!isCelsius)}
            className={`border-2 ${isDark ? 'border-white hover:bg-white hover:text-black' : 'border-black hover:bg-black hover:text-white'} px-8 py-6 transition-all duration-300 uppercase tracking-[0.3em] text-sm font-light min-w-[100px]`}
          >
            °{isCelsius ? 'C' : 'F'}
          </button>

          <button
            onClick={() => setIsDark(!isDark)}
            className={`border-2 ${isDark ? 'border-white hover:bg-white hover:text-black' : 'border-black hover:bg-black hover:text-white'} px-8 py-6 transition-all duration-300 uppercase tracking-[0.3em] text-sm font-light`}
          >
            {isDark ? '☀' : '☾'}
          </button>
        </div>

        {weather && (
          <div className="mb-20">
            <div className={`flex items-center gap-3 mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <MapPin size={18} />
              <span className="text-sm uppercase tracking-[0.3em] font-light">{locationName}</span>
              <div className={`h-px flex-1 bg-gradient-to-r ${isDark ? 'from-gray-400' : 'from-gray-600'} to-transparent`}></div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              <div className={`lg:col-span-2 border-2 ${isDark ? 'border-white' : 'border-black'} p-12`}>
                <div className={`text-xs tracking-[0.3em] ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>CURRENT</div>
                <div className="text-[10rem] md:text-[14rem] font-extralight leading-none mb-4">
                  {convertTemp(weather.main.temp)}°
                </div>
                <div className={`text-2xl md:text-3xl ${isDark ? 'text-gray-400' : 'text-gray-600'} font-extralight uppercase tracking-[0.2em] mb-6`}>
                  {weather.weather[0].description}
                </div>
                <div className="flex gap-8 text-sm tracking-[0.2em]">
                  <div className="flex items-center gap-2">
                    <ArrowUp size={16} />
                    <span>HIGH {convertTemp(weather.main.temp_max)}°</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowDown size={16} />
                    <span>LOW {convertTemp(weather.main.temp_min)}°</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Thermometer size={16} />
                    <span>FEELS {convertTemp(weather.main.feels_like)}°</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => setExpandedPanel({ type: 'humidity' })}
                  className={`w-full border-2 ${isDark ? 'border-white hover:bg-white hover:text-black' : 'border-black hover:bg-black hover:text-white'} p-6 transition-all duration-300 text-left`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs tracking-[0.2em]">HUMIDITY</span>
                    <Droplets size={16} />
                  </div>
                  <div className="text-4xl font-extralight">{weather.main.humidity}%</div>
                </button>

                <button 
                  onClick={() => setExpandedPanel({ type: 'wind' })}
                  className={`w-full border-2 ${isDark ? 'border-white hover:bg-white hover:text-black' : 'border-black hover:bg-black hover:text-white'} p-6 transition-all duration-300 text-left`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs tracking-[0.2em]">WIND</span>
                    <Wind size={16} />
                  </div>
                  <div className="text-4xl font-extralight">{Math.round(weather.wind.speed)} m/s</div>
                </button>

                <button 
                  onClick={() => setExpandedPanel({ type: 'pressure' })}
                  className={`w-full border-2 ${isDark ? 'border-white hover:bg-white hover:text-black' : 'border-black hover:bg-black hover:text-white'} p-6 transition-all duration-300 text-left`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs tracking-[0.2em]">PRESSURE</span>
                    <Gauge size={16} />
                  </div>
                  <div className="text-4xl font-extralight">{weather.main.pressure}</div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              <button 
                onClick={() => setExpandedPanel({ type: 'visibility' })}
                className={`border-2 ${isDark ? 'border-white hover:bg-white hover:text-black' : 'border-black hover:bg-black hover:text-white'} p-6 transition-all duration-300 text-left`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Eye size={16} />
                  <span className="text-xs uppercase tracking-[0.2em]">Visibility</span>
                </div>
                <div className="text-3xl font-extralight">{(weather.visibility / 1000).toFixed(1)} km</div>
              </button>

              <button 
                onClick={() => setExpandedPanel({ type: 'clouds' })}
                className={`border-2 ${isDark ? 'border-white hover:bg-white hover:text-black' : 'border-black hover:bg-black hover:text-white'} p-6 transition-all duration-300 text-left`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <CloudRain size={16} />
                  <span className="text-xs uppercase tracking-[0.2em]">Clouds</span>
                </div>
                <div className="text-3xl font-extralight">{weather.clouds.all}%</div>
              </button>

              <button 
                onClick={() => setExpandedPanel({ type: 'sunrise' })}
                className={`border-2 ${isDark ? 'border-white hover:bg-white hover:text-black' : 'border-black hover:bg-black hover:text-white'} p-6 transition-all duration-300 text-left`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sunrise size={16} />
                  <span className="text-xs uppercase tracking-[0.2em]">Sunrise</span>
                </div>
                <div className="text-3xl font-extralight">{formatTime(weather.sys.sunrise)}</div>
              </button>

              <button 
                onClick={() => setExpandedPanel({ type: 'sunset' })}
                className={`border-2 ${isDark ? 'border-white hover:bg-white hover:text-black' : 'border-black hover:bg-black hover:text-white'} p-6 transition-all duration-300 text-left`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sunset size={16} />
                  <span className="text-xs uppercase tracking-[0.2em]">Sunset</span>
                </div>
                <div className="text-3xl font-extralight">{formatTime(weather.sys.sunset)}</div>
              </button>
            </div>
          </div>
        )}

        {forecast && (
          <div className="mb-20">
            <h2 className={`text-sm uppercase tracking-[0.3em] ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-8`}>Hourly Forecast</h2>
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-max">
                {getHourlyForecast().map((hour, index) => (
                  <div key={index} className={`border-2 ${isDark ? 'border-white hover:bg-white hover:text-black' : 'border-black hover:bg-black hover:text-white'} p-6 min-w-[140px] transition-all duration-300`}>
                    <div className={`text-xs uppercase tracking-[0.2em] ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                      {new Date(hour.dt * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </div>
                    <div className="text-4xl font-extralight mb-2">
                      {convertTemp(hour.main.temp)}°
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} capitalize mb-3`}>
                      {hour.weather[0].description}
                    </div>
                    <div className={`pt-3 border-t ${isDark ? 'border-gray-800' : 'border-gray-300'} text-xs space-y-1`}>
                      <div className="flex items-center gap-2">
                        <Droplets size={12} />
                        <span>{hour.main.humidity}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wind size={12} />
                        <span>{Math.round(hour.wind.speed)} m/s</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {forecast && (
          <div className="mb-20">
            <h2 className={`text-sm uppercase tracking-[0.3em] ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-8`}>5-Day Forecast</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {getDailyForecast().map((day, index) => (
                <button
                  key={index}
                  onClick={() => setExpandedPanel({ type: 'forecast-day', dayData: day })}
                  className={`border-2 ${isDark ? 'border-white hover:bg-white hover:text-black' : 'border-black hover:bg-black hover:text-white'} p-8 transition-all duration-300 text-left`}
                >
                  <div className={`text-xs uppercase tracking-[0.2em] ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
                    {new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-5xl font-extralight mb-3">
                    {convertTemp(day.main.temp)}°
                  </div>
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wider mb-4`}>
                    {day.weather[0].description}
                  </div>
                  <div className={`pt-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-300'} text-xs space-y-2`}>
                    <div className="flex items-center gap-2">
                      <Droplets size={12} />
                      <span>{day.main.humidity}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wind size={12} />
                      <span>{Math.round(day.wind.speed)} m/s</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={`border-t-2 ${isDark ? 'border-white' : 'border-black'} pt-8 mt-16`}>
          <div className="text-center">
            <p className={`text-sm tracking-[0.2em] uppercase font-light ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Made with ❤️ in Toronto, Canada 🇨🇦 by Alexander Wondwossen{' '}
              <a 
                href="https://github.com/thealxlabs" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`${isDark ? 'hover:text-white' : 'hover:text-black'} transition-colors duration-300 underline decoration-1 underline-offset-4`}
              >
                @thealxlabs
              </a>
            </p>
          </div>
        </div>
      </div>
      <Analytics />
    </div>
  );
}
