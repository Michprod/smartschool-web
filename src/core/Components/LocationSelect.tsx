import React, { useEffect, useState } from 'react';
import api from '@/core/api/client';

export interface LocationValue {
  province_id: string;
  city_id: string;
  commune_id: string;
  quartier: string;
  address: string;
  province?: string;
  city?: string;
}

interface LocationSelectProps {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  disabled?: boolean;
}

interface GeoItem {
  id: number;
  name: string;
}

const LocationSelect: React.FC<LocationSelectProps> = ({ value, onChange, disabled }) => {
  const [provinces, setProvinces] = useState<GeoItem[]>([]);
  const [cities, setCities] = useState<GeoItem[]>([]);
  const [communes, setCommunes] = useState<GeoItem[]>([]);

  useEffect(() => {
    api.get('/api/locations/provinces').then((res) => {
      setProvinces(res.data || []);
    }).catch(() => setProvinces([]));
  }, []);

  useEffect(() => {
    if (!value.province_id) {
      setCities([]);
      setCommunes([]);
      return;
    }
    api.get('/api/locations/cities', { params: { province_id: value.province_id } })
      .then((res) => setCities(res.data || []))
      .catch(() => setCities([]));
  }, [value.province_id]);

  useEffect(() => {
    if (!value.city_id) {
      setCommunes([]);
      return;
    }
    api.get('/api/locations/communes', { params: { city_id: value.city_id } })
      .then((res) => setCommunes(res.data || []))
      .catch(() => setCommunes([]));
  }, [value.city_id]);

  const patch = (partial: Partial<LocationValue>) => {
    onChange({ ...value, ...partial });
  };

  return (
    <div className="location-select-grid">
      <div className="form-group">
        <label>Province</label>
        <select
          value={value.province_id}
          disabled={disabled}
          onChange={(e) => {
            const id = e.target.value;
            const name = provinces.find((p) => String(p.id) === id)?.name || '';
            patch({ province_id: id, province: name, city_id: '', commune_id: '', city: '' });
          }}
        >
          <option value="">Sélectionner</option>
          {provinces.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Ville</label>
        <select
          value={value.city_id}
          disabled={disabled || !value.province_id}
          onChange={(e) => {
            const id = e.target.value;
            const name = cities.find((c) => String(c.id) === id)?.name || '';
            patch({ city_id: id, city: name, commune_id: '' });
          }}
        >
          <option value="">Sélectionner</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Commune</label>
        <select
          value={value.commune_id}
          disabled={disabled || !value.city_id}
          onChange={(e) => patch({ commune_id: e.target.value })}
        >
          <option value="">Sélectionner</option>
          {communes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Quartier</label>
        <input
          type="text"
          value={value.quartier}
          disabled={disabled}
          placeholder="Saisie manuelle du quartier"
          onChange={(e) => patch({ quartier: e.target.value })}
        />
      </div>

      <div className="form-group full-width">
        <label>Adresse (N°, avenue)</label>
        <input
          type="text"
          value={value.address}
          disabled={disabled}
          placeholder="N°, Avenue, Référence"
          onChange={(e) => patch({ address: e.target.value })}
        />
      </div>
    </div>
  );
};

export default LocationSelect;
