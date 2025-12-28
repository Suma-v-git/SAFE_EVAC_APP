import React, { useState } from 'react';
import { BellRing, AlertTriangle, CheckCircle } from 'lucide-react';
import { API_ENDPOINTS } from '../src/config/api';

export const SOSButton: React.FC = () => {
  const [active, setActive] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSOS = () => {
    setActive(true);
    setShowSuccess(false);

    // Check geolocation support
    if (!navigator.geolocation) {
      constructAndSendEmail(null);
      return;
    }

    // Use lower accuracy for better compatibility
    navigator.geolocation.getCurrentPosition(
      (position) => {
        constructAndSendEmail(position.coords);
      },
      async (error) => {
        console.error("SOS Geo Error:", error);

        // Fallback: Try IP-based geolocation
        try {
          const response = await fetch('https://ipapi.co/json/');
          const data = await response.json();

          if (data.latitude && data.longitude) {
            // Create a coords-like object with IP-based location
            const ipCoords = {
              latitude: data.latitude,
              longitude: data.longitude,
              accuracy: 1000, // Approximate
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null
            } as GeolocationCoordinates;

            constructAndSendEmail(ipCoords);
          } else {
            // If IP geolocation also fails, send without location
            constructAndSendEmail(null);
          }
        } catch (ipError) {
          console.error("IP Geolocation Error:", ipError);
          // Send SOS without location as last resort
          constructAndSendEmail(null);
        }
      },
      {
        enableHighAccuracy: false, // Use network-based location
        timeout: 10000,
        maximumAge: 60000 // Cache for 1 minute
      }
    );
  };

  const constructAndSendEmail = async (coords: GeolocationCoordinates | null) => {
    const email = localStorage.getItem('safeevac_current_user_email');
    if (!email) {
      alert("Please login to use SOS.");
      setActive(false);
      return;
    }

    let locationStr = "Location unavailable";
    if (coords) {
      locationStr = `Lat: ${coords.latitude}, Lng: ${coords.longitude}. Link: https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`;
    }

    try {
      const response = await fetch(API_ENDPOINTS.sos, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, location: locationStr })
      });

      const data = await response.json();

      if (response.ok) {
        setShowSuccess(true);
        // Show success popup with the message from backend
        alert(`✅ SOS Alert Sent!\n\n${data.message}\n\nYour emergency contact has been notified with your location.`);
        setTimeout(() => setShowSuccess(false), 5000);
      } else {
        alert(`❌ Failed to send SOS Alert\n\n${data.message}\n\nPlease make sure you have set an emergency email in your Profile page.`);
      }
    } catch (error) {
      console.error("SOS API Error", error);
      alert("❌ Network Error\n\nCould not reach SOS server. Please check your connection and try again.");
    } finally {
      setActive(false);
    }
  };

  return (
    <>
      {showSuccess && (
        <div className="fixed bottom-48 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-2xl font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <CheckCircle size={20} />
          <span>SOS Alert Sent to Emergency Contact!</span>
        </div>
      )}

      <button
        onClick={handleSOS}
        className={`fixed bottom-24 right-6 z-50 rounded-full p-6 shadow-2xl transition-all duration-300 ${active
          ? 'bg-red-700 scale-110 animate-pulse'
          : 'bg-red-600 hover:bg-red-700 hover:scale-105'
          } text-white flex flex-col items-center justify-center border-4 border-red-400`}
        aria-label="SOS Button"
      >
        {active ? <AlertTriangle size={32} /> : <BellRing size={32} />}
        <span className="text-xs font-bold mt-1">SOS</span>
      </button>
    </>
  );
};
