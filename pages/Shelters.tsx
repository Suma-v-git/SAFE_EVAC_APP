import React, { useState, useEffect, useRef } from 'react';
import { Map, Navigation, Users, CheckCircle, XCircle, Search, ChevronDown, ChevronUp, Info, AlertCircle, Compass, RefreshCw } from 'lucide-react';
import { findNearbyShelters } from '../services/geminiService';
import { Shelter } from '../types';
import { ShelterMap } from '../components/ShelterMap';
import { getGHRoute, findGHPlaces, TransportMode, geocodeAddress } from '../services/graphhopperService';
import { API_ENDPOINTS } from '../src/config/api';

interface ShelterCardProps {
  shelter: Shelter;
  onNavigate: (shelter: Shelter, mode: TransportMode) => void;
  isNearest?: boolean;
}

const ShelterCard: React.FC<ShelterCardProps> = ({ shelter, onNavigate, isNearest }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mode, setMode] = useState<TransportMode>('car');

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full ${isNearest ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 dark:border-slate-700'}`}>
      <div className={`h-2 w-full ${shelter.status === 'Open' ? 'bg-green-500' :
        shelter.status === 'Full' ? 'bg-amber-500' : 'bg-red-500'
        }`} />

      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{shelter.name}</h3>
          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${shelter.status === 'Open' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
            shelter.status === 'Full' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
            {shelter.status}
          </span>
        </div>

        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 mb-4">
          <div className="flex items-start gap-2">
            <Map size={16} className="mt-1 flex-shrink-0 text-slate-400" />
            <span>{shelter.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <Navigation size={16} className="flex-shrink-0 text-slate-400" />
            <span className="font-semibold text-blue-600 dark:text-blue-400">{shelter.distance} away</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={16} className="flex-shrink-0 text-slate-400" />
            <span>Capacity: {shelter.capacity}</span>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group focus:outline-none"
          >
            <span className="flex items-center gap-2">
              <Info size={16} className="text-blue-500 dark:text-blue-400" />
              Safety Details
            </span>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {isExpanded && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 text-sm text-slate-800 dark:text-slate-200">
              <div className="flex gap-2">
                <AlertCircle size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <span>{shelter.notes || "No additional information available."}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-700/30 border-t border-slate-100 dark:border-slate-700 space-y-3">
        <div className="flex justify-center gap-2 bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
          {(['car', 'bike', 'walk'] as TransportMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors capitalized flex items-center gap-1 ${mode === m
                ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
            >
              {m === 'car' && '🚗'}
              {m === 'bike' && '🚲'}
              {m === 'walk' && '🚶'}
              <span className="capitalize">{m}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => onNavigate(shelter, mode)}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Compass size={18} />
          Navigate to Shelter
        </button>
      </div>
    </div>
  );
};

export const Shelters: React.FC = () => {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(true);

  const watchIdRef = useRef<number | null>(null);
  const hasFetchedRef = useRef(false);

  // Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const getLocation = () => {
    setIsLocating(true);
    setLocationError(null);

    // Initial check for stored location
    const stored = localStorage.getItem('userLocation');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUserLocation(parsed);
        setIsLocating(false);
      } catch (e) {
        console.error("Error parsing stored location", e);
      }
    }

    if (!navigator.geolocation) {
      if (!userLocation) setLocationError("GPS not supported. Set location on Home page.");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        localStorage.setItem('userLocation', JSON.stringify(coords));
        setIsLocating(false);
      },
      (err) => {
        console.error("GPS Error:", err);
        // Only show error if we don't even have a stored location
        if (!userLocation) {
          setLocationError("GPS blocked or unavailable. Set location on Home page.");
        }
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  useEffect(() => {
    getLocation();
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  useEffect(() => {
    const fetchAllSources = async () => {
      if (!userLocation) return;

      setLoading(true);
      let allResults: Shelter[] = [];

      try {
        // Source 1: GraphHopper (Real-time Places)
        console.log("[Shelters] Fetching from GraphHopper...");
        const ghResults = await findGHPlaces(userLocation.lat, userLocation.lng);
        if (ghResults && ghResults.length > 0) {
          allResults = [...ghResults];
        }

        // Source 2: Gemini AI (Safety Analysis)
        if (allResults.length < 5) {
          console.log("[Shelters] Fetching from Gemini AI...");
          const aiResults = await findNearbyShelters(userLocation.lat, userLocation.lng);
          if (aiResults && aiResults.length > 0) {
            // Merge results, avoiding duplicates by name
            const existingNames = new Set(allResults.map(r => r.name.toLowerCase()));
            aiResults.forEach(r => {
              if (!existingNames.has(r.name.toLowerCase())) {
                allResults.push(r);
              }
            });
          }
        }

        // Source 3: Internal Backend (Historical Data)
        try {
          const resp = await fetch(API_ENDPOINTS.shelters);
          if (resp.ok) {
            const dbResults = await resp.json();
            const existingNames = new Set(allResults.map(r => r.name.toLowerCase()));
            dbResults.forEach((r: Shelter) => {
              if (!existingNames.has(r.name.toLowerCase())) {
                allResults.push(r);
              }
            });
          }
        } catch (e) {
          console.warn("Backend shelters unavailable");
        }

        // Final formatting and sorting
        const formatted = allResults.map(s => ({
          ...s,
          distance: `${calculateDistance(userLocation.lat, userLocation.lng, s.location.lat, s.location.lng)} km`
        })).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

        setShelters(formatted);
      } catch (error) {
        console.error("Critical error fetching shelters:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userLocation) {
      fetchAllSources();
    }
  }, [userLocation]);

  const handleNavigate = (shelter: Shelter, mode: TransportMode) => {
    if (!userLocation) return;
    const travelMode = mode === 'walk' ? 'walking' : mode === 'bike' ? 'bicycling' : 'driving';
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${shelter.location.lat},${shelter.location.lng}&travelmode=${travelMode}`, '_blank');
  };

  const filteredShelters = shelters.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Map className="text-blue-600 dark:text-blue-400" size={32} />
            Emergency Shelters
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Real-time data from GraphHopper and Gemini AI Analysis.
          </p>
        </div>

        <button
          onClick={getLocation}
          disabled={isLocating}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 transition-colors font-medium border border-blue-200 dark:border-blue-800 disabled:opacity-50"
        >
          <RefreshCw size={18} className={isLocating ? "animate-spin" : ""} />
          Refresh My Location
        </button>
      </div>

      <div className="mb-8 max-w-lg">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search within found shelters..."
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {locationError && (
        <div className="mb-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center gap-3 text-amber-800 dark:text-amber-200">
          <AlertCircle size={20} className="flex-shrink-0" />
          <p className="text-sm">{locationError}</p>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Scanning area for real-time shelters...</p>
        </div>
      ) : (
        <>
          <div className="mb-8 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm h-[350px]">
            <ShelterMap shelters={filteredShelters} userLocation={userLocation} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShelters.map((shelter, idx) => (
              <ShelterCard
                key={shelter.id || idx}
                shelter={shelter}
                onNavigate={handleNavigate}
                isNearest={idx === 0}
              />
            ))}
          </div>

          {filteredShelters.length === 0 && (
            <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
              <Map size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">No shelters identified</h3>
              <p className="text-slate-500 dark:text-slate-400">Try zooming out on the map or refreshing your location.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};