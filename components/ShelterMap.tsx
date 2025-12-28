import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Shelter } from '../types';

// Fix for default Leaflet icons
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom icon for user location
const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Green icon for open shelters
const openIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Component to handle map resize and recenter
const MapController = ({ lat, lng }: { lat: number, lng: number }) => {
    const map = useMap();

    useEffect(() => {
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 100);

        map.setView([lat, lng], 13);

        return () => clearTimeout(timer);
    }, [lat, lng, map]);

    return null;
};

// Component to fit bounds to a route
const RouteController = ({ route }: { route: Number[][] }) => {
    const map = useMap();
    useEffect(() => {
        if (route && route.length > 0) {
            const bounds = L.latLngBounds(route.map(p => [p[0] as number, p[1] as number]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [route, map]);
    return null;
};

interface ShelterMapProps {
    shelters: Shelter[];
    userLocation: { lat: number; lng: number } | null;
    route?: Number[][] | null;
}

export const ShelterMap: React.FC<ShelterMapProps> = ({ shelters, userLocation, route }) => {
    // Default center if no user location
    const center = userLocation ? [userLocation.lat, userLocation.lng] : [12.9716, 77.5946];

    return (
        <div className="h-[400px] w-full rounded-xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-700 relative z-0">
            <MapContainer
                center={center as L.LatLngExpression}
                zoom={13}
                scrollWheelZoom={true}
                zoomControl={true}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {userLocation && (
                    <>
                        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                            <Popup>
                                <div className="font-bold">Your Location</div>
                            </Popup>
                        </Marker>
                        <MapController lat={userLocation.lat} lng={userLocation.lng} />
                    </>
                )}

                {route && (
                    <>
                        <Polyline
                            positions={route.map(p => [p[0] as number, p[1] as number])}
                            color="#2563eb"
                            weight={6}
                            opacity={0.9}
                        />
                        <RouteController route={route} />
                    </>
                )}

                {shelters.map((shelter, idx) => (
                    <Marker
                        key={shelter.id || idx}
                        position={[shelter.location.lat, shelter.location.lng]}
                        icon={openIcon}
                    >
                        <Popup>
                            <div className="p-1">
                                <h3 className="font-bold text-sm mb-1">{shelter.name}</h3>
                                <p className="text-xs text-gray-600 mb-1">{shelter.address}</p>
                                <div className="text-xs font-semibold text-green-600 mb-1">
                                    Status: {shelter.status}
                                </div>
                                {shelter.capacity && (
                                    <p className="text-xs">Capacity: {shelter.capacity}</p>
                                )}
                                {shelter.distance && (
                                    <p className="text-xs">Distance: {shelter.distance}</p>
                                )}
                                {(shelter as any).resources && (
                                    <p className="text-xs mt-1">Resources: {(shelter as any).resources}</p>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};
