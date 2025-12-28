import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, MapPin, Loader2, Bot, Navigation, ExternalLink, Map as MapIcon } from 'lucide-react';
import { chatWithAssistant } from '../services/geminiService';
import { findGHPlaces } from '../services/graphhopperService';

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
    shelters?: Array<{
        name: string;
        address: string;
        distance: string;
        lat: number;
        lng: number;
    }>;
}

interface MapViewState {
    show: boolean;
    shelterName: string;
    destLat: number;
    destLng: number;
    userLat: number;
    userLng: number;
}

export const ChatBot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', text: 'Hello! I am your SafeEvac Assistant. I can help with survival steps, emergency contacts, or finding nearby shelters with navigation. Click the 📍 button to share your location and find shelters!' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [mapView, setMapView] = useState<MapViewState>({ show: false, shelterName: '', destLat: 0, destLng: 0, userLat: 0, userLng: 0 });
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsLoading(true);

        try {
            const validHistory = messages[0].role === 'model' ? messages.slice(1) : messages;
            const historyForApi = validHistory.map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));

            const locationContext = userLocation
                ? `User Location: Lat ${userLocation.lat}, Lng ${userLocation.lng}`
                : 'No location available';

            const stream = await chatWithAssistant(historyForApi, userMsg, locationContext);

            let fullResponse = "";
            setMessages(prev => [...prev, { role: 'model', text: "" }]);

            for await (const chunk of stream) {
                const chunkText = chunk.text();
                fullResponse += chunkText;

                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMsg = newMessages[newMessages.length - 1];
                    if (lastMsg.role === 'model') {
                        lastMsg.text = fullResponse;
                    }
                    return newMessages;
                });
            }
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, { role: 'model', text: `Connection issue (v3.1). Error: ${error instanceof Error ? error.message : String(error)}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFindShelters = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }

        setIsLoading(true);
        setMessages(prev => [...prev, { role: 'user', text: '📍 Finding nearby shelters with navigation routes...' }]);

        // Use lower accuracy for better compatibility (works on desktop)
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation({ lat: latitude, lng: longitude });

                try {
                    const shelters = await findGHPlaces(latitude, longitude);

                    if (shelters && shelters.length > 0) {
                        const topShelters = shelters.slice(0, 5).map((s: any) => ({
                            name: s.name,
                            address: s.address,
                            distance: s.distance,
                            lat: s.location.lat,
                            lng: s.location.lng
                        }));

                        setMessages(prev => [...prev, {
                            role: 'model',
                            text: `Found ${topShelters.length} nearby shelters! Click "Navigate" to see the route:`,
                            shelters: topShelters
                        }]);
                    } else {
                        setMessages(prev => [...prev, {
                            role: 'model',
                            text: 'No shelters found nearby. Please try the Shelters page for more options or contact emergency services: 911'
                        }]);
                    }
                } catch (error) {
                    console.error("Shelter search error:", error);
                    setMessages(prev => [...prev, {
                        role: 'model',
                        text: 'Could not search for shelters. Please check your connection and try again.'
                    }]);
                } finally {
                    setIsLoading(false);
                }
            },
            async (error) => {
                console.error("Geo Error:", error);

                if (error.code === error.PERMISSION_DENIED) {
                    setIsLoading(false);
                    alert("📍 Location Access Denied\n\nTo use navigation features:\n1. Click the 🔒 lock icon in your browser's address bar\n2. Change Location permission to 'Allow'\n3. Refresh the page and try again");
                } else {
                    // Fallback: Try IP-based geolocation
                    try {
                        const response = await fetch('https://ipapi.co/json/');
                        const data = await response.json();

                        if (data.latitude && data.longitude) {
                            const latitude = data.latitude;
                            const longitude = data.longitude;
                            setUserLocation({ lat: latitude, lng: longitude });

                            setMessages(prev => [...prev, {
                                role: 'model',
                                text: `📍 Using approximate location (${data.city}, ${data.region}). Searching for shelters...`
                            }]);

                            const shelters = await findGHPlaces(latitude, longitude);

                            if (shelters && shelters.length > 0) {
                                const topShelters = shelters.slice(0, 5).map((s: any) => ({
                                    name: s.name,
                                    address: s.address,
                                    distance: s.distance,
                                    lat: s.location.lat,
                                    lng: s.location.lng
                                }));

                                setMessages(prev => [...prev, {
                                    role: 'model',
                                    text: `Found ${topShelters.length} nearby shelters! Click "Navigate" to see the route:`,
                                    shelters: topShelters
                                }]);
                            } else {
                                setMessages(prev => [...prev, {
                                    role: 'model',
                                    text: 'No shelters found nearby. Please try the Shelters page for more options.'
                                }]);
                            }
                        } else {
                            throw new Error("IP geolocation failed");
                        }
                    } catch (ipError) {
                        console.error("IP Geolocation Error:", ipError);
                        alert("📍 Location Unavailable\n\nCouldn't determine your location. Please:\n1. Enable GPS/Location services\n2. Check your internet connection\n3. Try again");
                    } finally {
                        setIsLoading(false);
                    }
                }
            },
            {
                enableHighAccuracy: false, // Use network-based location (works on desktop)
                timeout: 10000,
                maximumAge: 300000 // Cache location for 5 minutes
            }
        );
    };

    const openMapView = (destLat: number, destLng: number, shelterName: string) => {
        if (!userLocation) {
            alert("❌ User location not available\n\nPlease click 'Find Nearby Shelters' first to get your location, then try navigating.");
            return;
        }

        console.log("Opening navigation:");
        console.log("From (Your Location):", userLocation.lat, userLocation.lng);
        console.log("To (Shelter):", destLat, destLng);

        // Open Google Maps directly with turn-by-turn directions
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${destLat},${destLng}&travelmode=driving`;

        console.log("Maps URL:", mapsUrl);
        window.open(mapsUrl, '_blank');
    };

    const closeMapView = () => {
        setMapView({ show: false, shelterName: '', destLat: 0, destLng: 0, userLat: 0, userLng: 0 });
    };

    return (
        <>
            {/* Map View Modal */}
            {mapView.show && (
                <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
                        {/* Map Header */}
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-blue-600 text-white rounded-t-2xl">
                            <div className="flex items-center gap-3">
                                <MapIcon size={24} />
                                <div>
                                    <h3 className="font-bold text-lg">Navigation to {mapView.shelterName}</h3>
                                    <p className="text-xs text-blue-100">Route from your location</p>
                                </div>
                            </div>
                            <button
                                onClick={closeMapView}
                                className="p-2 hover:bg-blue-700 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Embedded Google Maps */}
                        <div className="flex-1 relative">
                            <iframe
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                loading="lazy"
                                allowFullScreen
                                referrerPolicy="no-referrer-when-downgrade"
                                src={`https://www.google.com/maps/embed/v1/directions?key=AIzaSyDXYwSKBW_mT5M3zp7-DaiWkEiS5UkIsec&origin=${mapView.userLat},${mapView.userLng}&destination=${mapView.destLat},${mapView.destLng}&mode=driving`}
                            />
                        </div>

                        {/* Map Footer */}
                        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900 rounded-b-2xl">
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                                <p className="font-medium">Destination: {mapView.shelterName}</p>
                            </div>
                            <button
                                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&origin=${mapView.userLat},${mapView.userLng}&destination=${mapView.destLat},${mapView.destLng}&travelmode=driving`, '_blank')}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
                            >
                                <ExternalLink size={16} />
                                Open in Google Maps
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-all duration-300 ${isOpen ? 'bg-slate-800 rotate-90 scale-0 opacity-0' : 'bg-blue-600 hover:bg-blue-700 scale-100 opacity-100'} text-white`}
            >
                <MessageSquare size={28} />
            </button>

            {/* Chat Window */}
            <div className={`fixed bottom-0 right-0 md:bottom-24 md:right-6 z-[60] w-full md:w-96 h-full md:h-[550px] md:max-h-[75vh] bg-white dark:bg-slate-800 md:rounded-3xl shadow-2xl flex flex-col transition-all duration-500 ease-out origin-bottom-right ${isOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-full md:translate-y-10 opacity-0 scale-95 pointer-events-none'}`}>

                {/* Header */}
                <div className="p-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white md:rounded-t-3xl flex justify-between items-center shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-white/10 skew-x-[-20deg] translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                            <Bot size={24} />
                        </div>
                        <div>
                            <h3 className="font-black text-lg tracking-tight">SafeEvac AI</h3>
                            <p className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full inline-block font-bold uppercase tracking-wider">
                                System Online
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors relative z-10">
                        <X size={24} />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50 dark:bg-slate-900/50 scrollbar-hide">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                            <div className={`max-w-[85%] sm:max-w-[80%] ${msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-3xl rounded-br-none shadow-blue-500/20'
                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-3xl rounded-bl-none border border-slate-100 dark:border-slate-700 shadow-slate-200/50 dark:shadow-none'
                                } p-4 text-sm leading-relaxed shadow-xl`}>
                                <p className="font-medium whitespace-pre-wrap">{msg.text}</p>

                                {/* Shelter Cards with Navigation */}
                                {msg.shelters && msg.shelters.length > 0 && (
                                    <div className="mt-4 space-y-3">
                                        {msg.shelters.map((shelter, sIdx) => (
                                            <div key={sIdx} className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-600 group hover:border-blue-500 transition-colors">
                                                <div className="flex flex-col gap-3">
                                                    <div>
                                                        <p className="font-black text-slate-900 dark:text-white text-base">{shelter.name}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{shelter.address}</p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black uppercase">{shelter.distance}</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => openMapView(shelter.lat, shelter.lng, shelter.name)}
                                                        className="w-full bg-green-500 hover:bg-green-600 text-white h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all shadow-lg shadow-green-500/20 active:scale-95"
                                                    >
                                                        <Navigation size={16} />
                                                        Start Navigation
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl rounded-bl-none shadow-xl border border-slate-100 dark:border-slate-700">
                                <Loader2 size={24} className="animate-spin text-blue-600" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 md:rounded-b-3xl">
                    <div className="flex gap-2 mb-3">
                        <button
                            onClick={handleFindShelters}
                            disabled={isLoading}
                            className="flex-1 bg-slate-100 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-200 h-10 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-95 border border-slate-200 dark:border-slate-600"
                        >
                            <MapPin size={14} className="text-blue-500" />
                            Scan Near Me
                        </button>
                    </div>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Help me navigate..."
                            className="flex-1 bg-slate-100 dark:bg-slate-900/50 border border-transparent focus:bg-white dark:focus:bg-slate-900 px-5 h-12 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white text-sm transition-all"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className="w-12 h-12 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center active:scale-90"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
