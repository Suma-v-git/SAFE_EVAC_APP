export enum DisasterType {
  Earthquake = 'Earthquake',
  Flood = 'Flood',
  Fire = 'Wildfire',
  Tsunami = 'Tsunami',
  Hurricane = 'Hurricane',
  General = 'General Emergency'
}

export interface Shelter {
  id: string;
  name: string;
  address: string;
  distance: string;
  status: 'Open' | 'Full' | 'Closed';
  capacity: string;
  location: {
    lat: number;
    lng: number;
  };
  notes: string;
}

export interface EmergencyContact {
  name: string;
  role: string;
  phone: string;
  email?: string;
}

export interface UserLocation {
  lat: number;
  lng: number;
  address?: string; // Optional reverse geocoded
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}
