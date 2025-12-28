import React, { useState, useEffect } from 'react';
import {
  CloudRain, Sun, Wind, MapPin,
  Flame, Waves, AlertTriangle, CloudLightning, RefreshCw,
  X, Info, ShieldAlert, WifiOff, Volume2, VolumeX,
  Cloud, CloudLightning as RainIcon, CloudSun, Snowflake
} from 'lucide-react';
import { DisasterType } from '../types';
import { getDisasterInstructions } from '../services/geminiService';
import { fetchWeatherData, WeatherData } from '../services/weatherService';
import { getCurrentLocation, LocationData } from '../services/locationService';
import { SOSButton } from '../components/SOSButton';

const GH_API_KEY = import.meta.env.VITE_GH_API_KEY || '';

export const Home: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [locationName, setLocationName] = useState<string>('');
  const [loadingLoc, setLoadingLoc] = useState(true);
  const [locationSource, setLocationSource] = useState<'gps' | 'ip' | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  // Instructions Modal State
  const [selectedDisaster, setSelectedDisaster] = useState<DisasterType | null>(null);
  const [instructions, setInstructions] = useState<string>('');
  const [loadingInstructions, setLoadingInstructions] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  // Check if speech synthesis is supported
  useEffect(() => {
    setSpeechSupported('speechSynthesis' in window);
  }, []);

  useEffect(() => {
    // Online/Offline listeners
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Clock
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);

    // Initial fetch
    fetchLocation();

    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchLocation = async () => {
    setLoadingLoc(true);
    try {
      const locationData: LocationData = await getCurrentLocation();

      setLocationName(locationData.name || "Unknown Location");
      setLocationSource(locationData.source); // Track if GPS or IP
      localStorage.setItem('userLocation', JSON.stringify({ lat: locationData.lat, lng: locationData.lng, source: locationData.source }));

      // Pass coordinates to weather service
      getWeather(locationData.lat, locationData.lng);

    } catch (error: any) {
      console.error("Location error:", error);
      setLocationName("Location unavailable");
      setLocationSource(null);
    } finally {
      setLoadingLoc(false);
    }
  };

  const getWeather = async (lat: number, lng: number) => {
    setLoadingWeather(true);
    const data = await fetchWeatherData(lat, lng);
    setWeather(data);
    setLoadingWeather(false);
  };

  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun size={40} className="text-yellow-400" />;
    if (code >= 1 && code <= 3) return <CloudSun size={40} className="text-blue-200" />;
    if (code >= 45 && code <= 48) return <Cloud size={40} className="text-slate-400" />;
    if (code >= 51 && code <= 65) return <CloudRain size={40} className="text-blue-400" />;
    if (code >= 71 && code <= 77) return <Snowflake size={40} className="text-white" />;
    if (code >= 80 && code <= 82) return <RainIcon size={40} className="text-blue-500" />;
    if (code >= 95) return <CloudLightning size={40} className="text-amber-400" />;
    return <Sun size={40} className="text-yellow-300" />;
  };


  const handleDisasterClick = async (type: DisasterType) => {
    setSelectedDisaster(type);
    setLoadingInstructions(true);
    setInstructions('');
    stopSpeaking(); // Stop any ongoing speech

    const instr = await getDisasterInstructions(type);
    setInstructions(instr);
    setLoadingInstructions(false);
  };

  const speakInstructions = () => {
    if (!speechSupported || !instructions) return;

    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(instructions);
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (speechSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const Disasters = [
    { type: DisasterType.Earthquake, icon: <AlertTriangle size={32} />, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400' },
    { type: DisasterType.Flood, icon: <CloudRain size={32} />, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' },
    { type: DisasterType.Fire, icon: <Flame size={32} />, color: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400' },
    { type: DisasterType.Tsunami, icon: <Waves size={32} />, color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/50 dark:text-cyan-400' },
    { type: DisasterType.Hurricane, icon: <Wind size={32} />, color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' },
    { type: DisasterType.General, icon: <CloudLightning size={32} />, color: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-slate-800 dark:bg-slate-700 text-white p-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium animate-in slide-in-from-top-2">
          <WifiOff size={18} />
          Offline Mode Active - Using stored safety protocols.
        </div>
      )}

      {/* Header Widget */}
      <div className={`bg-gradient-to-r ${isOffline ? 'from-slate-600 to-slate-700' : 'from-blue-600 to-blue-800'} rounded-3xl p-6 md:p-10 text-white shadow-xl transition-colors duration-500`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex-1 w-full">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3 text-white mb-1">
                <MapPin size={32} />
                <span className="font-bold text-2xl md:text-3xl break-words">
                  {loadingLoc
                    ? "Locating..."
                    : locationName || "Location unavailable"}
                </span>
              </div>
              {!loadingLoc && locationName && (
                <div className="text-[10px] text-blue-200/80 font-medium pl-11 flex flex-col gap-0.5 animate-in fade-in duration-500">
                  <div className="flex items-center gap-1.5">
                    {locationSource === 'gps' ? (
                      <>
                        <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_5px_#4ade80]"></span>
                        Live GPS Verified at {currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </>
                    ) : locationSource === 'ip' ? (
                      <>
                        <span className="inline-block w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse shadow-[0_0_5px_#fbbf24]"></span>
                        <span className="text-amber-200">IP-Based Location (Grant GPS permission for accuracy)</span>
                      </>
                    ) : (
                      <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_5px_#4ade80]"></span>
                    )}
                  </div>
                  {localStorage.getItem('userLocation') && (
                    <div className="text-[8px] opacity-60 tracking-wider">
                      Coordinates: {JSON.parse(localStorage.getItem('userLocation') || '{}').lat.toFixed(6)}, {JSON.parse(localStorage.getItem('userLocation') || '{}').lng.toFixed(6)}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-4">
              <button
                onClick={fetchLocation}
                disabled={loadingLoc}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
                title="Refresh Location"
              >
                <RefreshCw size={20} className={loadingLoc ? "animate-spin" : ""} />
              </button>

              <button
                onClick={fetchLocation}
                disabled={loadingLoc}
                className="px-6 py-2 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-900/20"
                title="Detect My Location"
              >
                <MapPin size={18} />
                Access My Current Location
              </button>
            </div>

            <p className="text-blue-100 text-lg pl-1 mt-4">
              {currentDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              <span className="mx-2 opacity-70">|</span>
              {currentDate.toLocaleTimeString()}
            </p>
          </div>

          {/* Real-time Weather Widget */}
          {!isOffline && weather && (
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 animate-in fade-in duration-700">
              {getWeatherIcon(weather.conditionCode)}
              <div>
                <div className="text-2xl font-bold">{weather.temp}°C</div>
                <div className="text-sm text-blue-100 font-medium">
                  {weather.description} {locationName && !locationName.includes("GPS blocked") && `in ${locationName.split(',')[0].trim()}`}
                </div>
                <div className="text-xs text-blue-200 mt-1 flex flex-col gap-0.5">
                  <div className="flex items-center gap-1">
                    <Wind size={12} />
                    Wind: {weather.windSpeed} km/h
                  </div>
                  <div className="opacity-60 text-[10px] italic">
                    Updated {new Date(weather.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {loadingWeather && !weather && (
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 animate-pulse">
              <div className="w-10 h-10 bg-white/20 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-6 w-12 bg-white/20 rounded"></div>
                <div className="h-4 w-24 bg-white/20 rounded"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Responses */}
      <section>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <ShieldAlert className="text-blue-600 dark:text-blue-400" />
          Disaster Quick Response
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Disasters.map((d) => (
            <button
              key={d.type}
              onClick={() => handleDisasterClick(d.type)}
              className="group relative flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-200"
            >
              <div className={`p-4 rounded-full mb-3 transition-transform group-hover:scale-110 ${d.color}`}>
                {d.icon}
              </div>
              <span className="font-medium text-slate-700 dark:text-slate-200">{d.type}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">Tap for instructions</span>
            </button>
          ))}
        </div>
      </section>

      {/* Instructions Modal */}
      {selectedDisaster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200 border dark:border-slate-700">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Info className="text-blue-600 dark:text-blue-400" />
                {selectedDisaster} Response
              </h3>
              <div className="flex items-center gap-2">
                {/* Text-to-Speech Button */}
                {speechSupported && instructions && (
                  <button
                    onClick={isSpeaking ? stopSpeaking : speakInstructions}
                    className={`p-2 rounded-full transition-colors ${isSpeaking
                      ? 'bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50'
                      : 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50'
                      }`}
                    title={isSpeaking ? 'Stop reading' : 'Read instructions aloud'}
                  >
                    {isSpeaking ? (
                      <VolumeX size={20} className="text-red-600 dark:text-red-400" />
                    ) : (
                      <Volume2 size={20} className="text-blue-600 dark:text-blue-400" />
                    )}
                  </button>
                )}
                <button
                  onClick={() => { setSelectedDisaster(null); stopSpeaking(); }}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                >
                  <X size={20} className="text-slate-500 dark:text-slate-400" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto bg-white dark:bg-slate-800">
              {loadingInstructions ? (
                <div className="flex flex-col items-center py-8 space-y-4">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-slate-500 dark:text-slate-400">
                    {isOffline ? "Retrieving offline protocols..." : "AI is generating survival protocols..."}
                  </p>
                </div>
              ) : (
                <div className="prose prose-slate dark:prose-invert prose-sm max-w-none">
                  <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 mb-4 text-amber-800 dark:text-amber-200 text-sm">
                    <strong>Warning:</strong> Always follow orders from local authorities over this general guide.
                  </div>
                  <ol className="space-y-3 text-slate-700 dark:text-slate-300 list-decimal pl-5">
                    {instructions.split(/\d+\.\s+/).filter(Boolean).map((instruction, idx) => {
                      // Check if this instruction contains an emergency number and split it out
                      const hasEmergency = instruction.includes('Emergency:');
                      const text = hasEmergency ? instruction.split('Emergency:')[0] : instruction;
                      const emergencyText = hasEmergency ? instruction.split('Emergency:')[1] : null;

                      return (
                        <div key={idx}>
                          <li className="leading-relaxed">
                            {text.trim()}
                          </li>
                          {emergencyText && (
                            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                              <ShieldAlert className="text-red-600 dark:text-red-400" />
                              <span className="font-bold text-red-700 dark:text-red-300">
                                Emergency Contacts: {emergencyText.trim()}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </ol>
                  {isOffline && (
                    <div className="mt-4 text-xs text-slate-400 italic text-center">
                      Offline Mode: These are standard safety guidelines.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
              <button
                onClick={() => setSelectedDisaster(null)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slogan */}
      <div className="text-center py-8 border-t border-slate-200 dark:border-slate-700 space-y-1">
        <p className="text-xl font-semibold text-slate-700 dark:text-slate-200">Navigate emergency with confidence</p>
        <p className="text-lg font-serif italic text-slate-500 dark:text-slate-400">SafeEvac - Your guide to safety</p>
      </div>
      <SOSButton />
    </div>
  );
};