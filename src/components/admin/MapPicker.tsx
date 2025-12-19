import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Locate } from 'lucide-react';
import { toast } from 'sonner';

export interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
  district: string;
  subdistrict: string;
  village: string;
  municipality: string;
  province: string;
  country: string;
  address: string;
}

interface MapPickerProps {
  onLocationSelect: (location: LocationData) => void;
  initialLocation?: { lat: number; lng: number };
  value?: LocationData;
}

export default function MapPicker({ onLocationSelect, initialLocation, value }: MapPickerProps) {
  const defaultPos = initialLocation || (value ? { lat: value.latitude, lng: value.longitude } : { lat: -6.2088, lng: 106.8456 });
  
  const [position, setPosition] = useState<{ lat: number; lng: number }>(defaultPos);
  const [locationData, setLocationData] = useState<LocationData>(
    value || {
      latitude: defaultPos.lat,
      longitude: defaultPos.lng,
      city: '',
      district: '',
      subdistrict: '',
      village: '',
      municipality: '',
      province: '',
      country: '',
      address: '',
    }
  );
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const fetchLocationDetails = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();

      if (data && data.address) {
        const addr = data.address;
        const newLocationData: LocationData = {
          latitude: lat,
          longitude: lng,
          city: addr.city || addr.town || addr.municipality || '',
          district: addr.city_district || addr.district || '',
          subdistrict: addr.suburb || addr.neighbourhood || '',
          village: addr.village || addr.hamlet || '',
          municipality: addr.municipality || addr.county || '',
          province: addr.state || addr.province || '',
          country: addr.country || '',
          address: data.display_name || '',
        };
        setLocationData(newLocationData);
        onLocationSelect(newLocationData);
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      toast.error('Failed to fetch location details');
    } finally {
      setLoading(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition({ lat: latitude, lng: longitude });
          fetchLocationDetails(latitude, longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Unable to get your location. Please enable location access.');
          setLoading(false);
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  };

  const handleFieldChange = (field: keyof LocationData, newValue: string) => {
    const updatedData = { ...locationData, [field]: newValue };
    setLocationData(updatedData);
    onLocationSelect(updatedData);
  };

  useEffect(() => {
    if (!value) {
      fetchLocationDetails(position.lat, position.lng);
    }
    setMapLoaded(true);
  }, []);

  useEffect(() => {
    if (!mapLoaded) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => {
      const L = (window as any).L;
      if (!L) return;

      // Fix Leaflet marker icon paths
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const mapElement = document.getElementById('map-container');
      if (!mapElement) return;

      const map = L.map('map-container', {
        scrollWheelZoom: false
      }).setView([position.lat, position.lng], 15);

      map.on('focus', () => { map.scrollWheelZoom.enable(); });
      map.on('blur', () => { map.scrollWheelZoom.disable(); });

      document.addEventListener('keydown', (e) => {
        if (e.ctrlKey) {
          map.scrollWheelZoom.enable();
        }
      });

      document.addEventListener('keyup', (e) => {
        if (!e.ctrlKey) {
          map.scrollWheelZoom.disable();
        }
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      const marker = L.marker([position.lat, position.lng]).addTo(map);

      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setPosition({ lat, lng });
        fetchLocationDetails(lat, lng);
      });

      return () => {
        map.remove();
      };
    };
    document.head.appendChild(script);
  }, [mapLoaded]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Select Location on Map</h3>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGetCurrentLocation}
              disabled={loading}
            >
              <Locate className="w-4 h-4 mr-2" />
              Use My Location
            </Button>
          </div>

          <div 
            id="map-container" 
            className="rounded-lg overflow-hidden border-2 border-border" 
            style={{ height: '400px', width: '100%' }}
          />

          {loading && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Loading location details...
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Location Details
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Latitude</Label>
              <Input value={locationData.latitude?.toFixed(6) || ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Longitude</Label>
              <Input value={locationData.longitude?.toFixed(6) || ''} readOnly className="bg-muted" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Village/Kelurahan</Label>
              <Input 
                value={locationData.village || ''} 
                onChange={(e) => handleFieldChange('village', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Subdistrict/Kecamatan</Label>
              <Input 
                value={locationData.subdistrict || ''} 
                onChange={(e) => handleFieldChange('subdistrict', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>District</Label>
              <Input 
                value={locationData.district || ''} 
                onChange={(e) => handleFieldChange('district', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>City/Municipality</Label>
              <Input 
                value={locationData.city || locationData.municipality || ''} 
                onChange={(e) => handleFieldChange('city', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Province</Label>
              <Input 
                value={locationData.province || ''} 
                onChange={(e) => handleFieldChange('province', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input 
                value={locationData.country || ''} 
                onChange={(e) => handleFieldChange('country', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Full Address</Label>
            <Input 
              value={locationData.address || ''} 
              onChange={(e) => handleFieldChange('address', e.target.value)}
              className="text-sm" 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
