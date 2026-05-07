export type TransportType = 'airplane' | 'shinkansen' | 'train' | 'bus' | 'car' | 'ferry' | 'other';
export type AccommodationType = 'hotel' | 'ryokan' | 'pension' | 'hostel' | 'airbnb' | 'other';
export type SpotCategory = 'sightseeing' | 'food' | 'shopping' | 'activity' | 'nature' | 'culture' | 'other';

export interface BasicInfo {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  numberOfPeople: number;
  budget: string;
  themes: string[];
  notes: string;
}

export interface Transportation {
  id: string;
  type: TransportType;
  date: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  company: string;
  reservationNo: string;
  notes: string;
}

export interface Accommodation {
  id: string;
  name: string;
  type: AccommodationType;
  checkInDate: string;
  checkOutDate: string;
  address: string;
  phone: string;
  reservationNo: string;
  notes: string;
}

export interface TouristSpot {
  id: string;
  name: string;
  category: SpotCategory;
  date: string;
  time: string;
  address: string;
  notes: string;
}

export interface TravelItinerary {
  basicInfo: BasicInfo;
  transportations: Transportation[];
  accommodations: Accommodation[];
  spots: TouristSpot[];
}

export const TRANSPORT_LABELS: Record<TransportType, string> = {
  airplane: '✈️ 飛行機',
  shinkansen: '🚄 新幹線',
  train: '🚃 電車',
  bus: '🚌 バス',
  car: '🚗 車',
  ferry: '⛴️ フェリー',
  other: '🚐 その他',
};

export const ACCOMMODATION_LABELS: Record<AccommodationType, string> = {
  hotel: '🏨 ホテル',
  ryokan: '🏯 旅館',
  pension: '🏡 ペンション',
  hostel: '🏠 ゲストハウス',
  airbnb: '🏠 民泊',
  other: '🛏️ その他',
};

export const SPOT_LABELS: Record<SpotCategory, string> = {
  sightseeing: '🏛️ 観光スポット',
  food: '🍜 グルメ',
  shopping: '🛍️ ショッピング',
  activity: '🎿 アクティビティ',
  nature: '🌸 自然',
  culture: '🎭 文化・歴史',
  other: '📍 その他',
};

export const THEMES = [
  { value: 'onsen', label: '♨️ 温泉' },
  { value: 'sightseeing', label: '🏛️ 観光' },
  { value: 'gourmet', label: '🍜 グルメ' },
  { value: 'outdoor', label: '🏕️ アウトドア' },
  { value: 'culture', label: '🎭 文化・歴史' },
  { value: 'shopping', label: '🛍️ ショッピング' },
  { value: 'nature', label: '🌸 自然' },
  { value: 'beach', label: '🏖️ ビーチ' },
];

export const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
