import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FiMapPin, FiPlus, FiX, FiTrash2, FiEdit2, FiInfo, FiDroplet, FiSun, FiWind, FiCheck, FiLayers, FiCornerDownLeft } from 'react-icons/fi';
import { GiWheat, GiPlantRoots } from 'react-icons/gi';
import { Card } from '../../components/ui/Card/Card';
import { Badge } from '../../components/ui/Badge/Badge';
import { dataApi } from '../../lib/api';
import { madagascarRegions } from '../../data/madagascarRegions';
import { madagascarRegionsGeoJSON } from '../../data/madagascarRegionsGeoJSON';
import styles from './ParcelMap.module.css';

function createParcelIcon(isSelected) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: ${isSelected ? 24 : 18}px; height: ${isSelected ? 24 : 18}px;
      background: ${isSelected ? 'var(--primary, #22c55e)' : 'var(--primary, #22c55e)'};
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ${isSelected ? 'animation: pulse 1.5s ease infinite;' : ''}
    "></div>`,
    iconSize: [isSelected ? 24 : 18, isSelected ? 24 : 18],
    iconAnchor: [isSelected ? 12 : 9, isSelected ? 12 : 9],
  });
}

function matchRegionName(geoName) {
  if (!geoName) return null;
  const normalized = geoName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const map = {
    'analamanga': 'Analamanga',
    'atsinanana': 'Atsinanana',
    'analanjirofo': 'Analanjirofo',
    'betsiboka': 'Betsiboka',
    'boeny': 'Boeny',
    'melaky': 'Melaky',
    'sofia': 'Sofia',
    'diana': 'Diana',
    'sava': 'Sava',
    'alaotra-mangoro': 'Alaotra-Mangoro',
    'alaotra mangoro': 'Alaotra-Mangoro',
    'vakinankaratra': 'Vakinankaratra',
    'amoron\'i mania': 'Amoron\'i Mania',
    'amoron i mania': 'Amoron\'i Mania',
    'haute matsiatra': 'Haute Matsiatra',
    'ihorombe': 'Ihorombe',
    'atsimo-atsinanana': 'Atsimo-Atsinanana',
    'atsimo atsinanana': 'Atsimo-Atsinanana',
    'vatovavy-fitovinany': 'Vatovavy',
    'vatovavy fitovinany': 'Vatovavy',
    'atsimo-andrefana': 'Atsimo-Andrefana',
    'atsimo andrefana': 'Atsimo-Andrefana',
    'androy': 'Androy',
    'anosy': 'Anosy',
    'menabe': 'Menabe',
    'bongolava': 'Bongolava',
    'itasy': 'Itasy',
  };
  return map[normalized] || null;
}

function latLngToGeoJSON(lat, lng) {
  return [parseFloat(lng.toFixed(6)), parseFloat(lat.toFixed(6))];
}

function buildGeoJSONPolygon(vertices) {
  if (vertices.length < 3) return null;
  const coords = vertices.map((v) => latLngToGeoJSON(v.lat, v.lng));
  coords.push(coords[0]);
  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [coords],
    },
  };
}

function parseParcelPolygon(polygonData) {
  if (!polygonData) return null;
  try {
    const parsed = typeof polygonData === 'string' ? JSON.parse(polygonData) : polygonData;

    if (parsed.type === 'Feature' && parsed.geometry) {
      return parsed;
    }

    if (parsed.coordinates) {
      return {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: parsed.coordinates },
      };
    }

    if (Array.isArray(parsed) && parsed.length > 0) {
      if (Array.isArray(parsed[0]) && typeof parsed[0][0] === 'number') {
        return {
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [parsed] },
        };
      }
      return {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: parsed },
      };
    }

    return null;
  } catch {
    return null;
  }
}

export default function ParcelMap({ region }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const regionLayersRef = useRef([]);
  const polygonLayerRef = useRef(null);
  const previewLineRef = useRef(null);
  const vertexMarkersRef = useRef([]);
  const [parcels, setParcels] = useState([]);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [creating, setCreating] = useState(false);
  const [clickCoords, setClickCoords] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', size_ha: '' });
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [regionData, setRegionData] = useState(null);
  const [polygonVertices, setPolygonVertices] = useState([]);
  const [polygonMode, setPolygonMode] = useState(true);

  const loadParcels = useCallback(async () => {
    try {
      const data = await dataApi.fetchParcels();
      setParcels(data);
    } catch (err) {
      console.error('[ParcelMap] Failed to load:', err);
      setParcels([]);
    }
  }, []);

  const creatingRef = useRef(false);
  const polygonModeRef = useRef(false);
  const clickMarkerRef = useRef(null);

  useEffect(() => {
    creatingRef.current = creating;
  }, [creating]);

  useEffect(() => {
    if (!mapRef.current) return;

    const mapEl = mapRef.current.getContainer();
    if (creating) {
      mapEl.style.cursor = 'crosshair';
      regionLayersRef.current.forEach((l) => {
        l.setStyle({ weight: 0.5, fillOpacity: 0.02, color: '#000000', opacity: 0.3 });
      });
    } else {
      mapEl.style.cursor = '';
      regionLayersRef.current.forEach((l) => {
        l.setStyle({ weight: 1, fillOpacity: 0.04, color: '#000000', opacity: 0.6 });
      });
    }
  }, [creating]);

  useEffect(() => {
    polygonModeRef.current = polygonMode;
  }, [polygonMode]);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const lat = region?.latitude ? parseFloat(region.latitude) : -18.8792;
    const lng = region?.longitude ? parseFloat(region.longitude) : 47.5079;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([lat, lng], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    setTimeout(() => map.invalidateSize(), 100);

    const layers = [];
    L.geoJSON(madagascarRegionsGeoJSON, {
      style: {
        color: '#2b2b2b',
        weight: 1,
        opacity: 0.6,
        fillColor: '#22c55e',
        fillOpacity: 0.04,
      },
      onEachFeature: (feature, layer) => {
        const geoName = feature.properties.name || '';
        const matchedName = matchRegionName(geoName);
        const info = matchedName ? madagascarRegions[matchedName] : null;

        layer.on('mouseover', function () {
          if (creatingRef.current) return;
          if (selectedRegion !== this) {
            this.setStyle({ weight: 1.5, fillOpacity: 0.1, color: '#000000' });
          }
        });
        layer.on('mouseout', function () {
          if (creatingRef.current) return;
          if (selectedRegion !== this) {
            this.setStyle({ weight: 1, fillOpacity: 0.04, color: '#000000' });
          }
        });
        layer.on('click', function (e) {
          if (creatingRef.current) return;
          L.DomEvent.stopPropagation(e);
          regionLayersRef.current.forEach((l) => {
            l.setStyle({ weight: 1, fillOpacity: 0.04, color: '#000000' });
          });
          this.setStyle({ weight: 1.5, fillOpacity: 0.12, color: '#000000' });
          setSelectedRegion(this);
          setRegionData({
            name: matchedName || geoName || 'Région inconnue',
            info: info || {
              capital: 'N/A',
              soil: 'N/A',
              climate: 'N/A',
              temperature: 'N/A',
              rainfall: 'N/A',
              altitude: 'N/A',
              mainCrops: 'N/A',
              description: 'Données non disponibles pour cette région.',
            },
          });
          map.fitBounds(this.getBounds());
        });

        layers.push(layer);
      },
    }).addTo(map);
    regionLayersRef.current = layers;

    map.on('click', (e) => {
      if (!creatingRef.current) return;
      const { lat, lng } = e.latlng;

      if (polygonModeRef.current) {
        const newVertices = [...polygonVertices, { lat, lng }];
        setPolygonVertices(newVertices);

        const vertexMarker = L.circleMarker([lat, lng], {
          radius: 4,
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 1,
          weight: 2,
        }).addTo(map);
        vertexMarkersRef.current.push(vertexMarker);

        if (previewLineRef.current) {
          map.removeLayer(previewLineRef.current);
        }
        if (newVertices.length >= 2) {
          const lineCoords = newVertices.map((v) => [v.lat, v.lng]);
          previewLineRef.current = L.polyline(lineCoords, {
            color: '#3b82f6',
            weight: 2,
            dashArray: '6, 6',
            opacity: 0.8,
          }).addTo(map);
        }

        if (polygonLayerRef.current) {
          map.removeLayer(polygonLayerRef.current);
        }
        if (newVertices.length >= 3) {
          const geojson = buildGeoJSONPolygon(newVertices);
          if (geojson) {
            polygonLayerRef.current = L.geoJSON(geojson, {
              style: {
                color: '#3b82f6',
                weight: 2,
                opacity: 0.8,
                fillColor: '#3b82f6',
                fillOpacity: 0.15,
              },
            }).addTo(map);
          }
        }

        setClickCoords({ lat, lng });
      } else {
        setClickCoords({ lat, lng });

        if (clickMarkerRef.current) {
          map.removeLayer(clickMarkerRef.current);
        }
        const marker = L.marker([lat, lng], {
          icon: L.divIcon({
            className: '',
            html: '<div style="width:22px;height:22px;background:#3b82f6;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>',
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          }),
        }).addTo(map);
        clickMarkerRef.current = marker;
      }
    });

    mapRef.current = map;
    loadParcels();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current = [];
      regionLayersRef.current = [];
    };
  }, [region, loadParcels]);

  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((m) => mapRef.current.removeLayer(m));
    markersRef.current = [];

    parcels.forEach((parcel) => {
      if (parcel.polygon_coordinates) {
        try {
          const geojson = parseParcelPolygon(parcel.polygon_coordinates);
          if (geojson) {
            L.geoJSON(geojson, {
              style: {
                color: selectedParcel?.id === parcel.id ? '#3b82f6' : '#8b5cf6',
                weight: selectedParcel?.id === parcel.id ? 3 : 2,
                opacity: 1,
                fillColor: selectedParcel?.id === parcel.id ? '#3b82f6' : '#8b5cf6',
                fillOpacity: selectedParcel?.id === parcel.id ? 0.25 : 0.1,
              },
              onEachFeature: (feature, layer) => {
                layer.on('click', () => {
                  setSelectedParcel(parcel);
                  setCreating(false);
                  setClickCoords(null);
                });
              },
            }).addTo(mapRef.current);
          }
        } catch (err) {
          console.error('[ParcelMap] Invalid polygon:', err);
        }
      }

      const marker = L.marker([parseFloat(parcel.latitude), parseFloat(parcel.longitude)], {
        icon: createParcelIcon(selectedParcel?.id === parcel.id),
      })
        .addTo(mapRef.current)
        .bindTooltip(parcel.name, { direction: 'top', offset: [0, -10] })
        .on('click', () => {
          setSelectedParcel(parcel);
          setCreating(false);
          setClickCoords(null);
          if (clickMarkerRef.current && mapRef.current) {
            mapRef.current.removeLayer(clickMarkerRef.current);
            clickMarkerRef.current = null;
          }
        });
      markersRef.current.push(marker);
    });

    if (selectedParcel) {
      mapRef.current.setView([parseFloat(selectedParcel.latitude), parseFloat(selectedParcel.longitude)], 14);
    }
  }, [parcels, selectedParcel]);

  const handleCreateParcel = async () => {
    if (!form.name.trim()) {
      setFormError('Le nom est requis');
      return;
    }
    if (!clickCoords) {
      setFormError('Veuillez cliquer sur la carte pour placer la parcelle');
      return;
    }

    setFormError(null);
    setSaving(true);
    try {
      const geoJSONPolygon = polygonVertices.length >= 3 ? buildGeoJSONPolygon(polygonVertices) : null;

      const result = await dataApi.createParcel({
        name: form.name.trim(),
        description: form.description.trim() || null,
        latitude: clickCoords.lat,
        longitude: clickCoords.lng,
        size_ha: form.size_ha ? parseFloat(form.size_ha) : null,
        polygon_coordinates: geoJSONPolygon ? JSON.stringify(geoJSONPolygon) : null,
      });

      setParcels((prev) => [...prev, result.parcel]);
      setForm({ name: '', description: '', size_ha: '' });
      setClickCoords(null);
      setPolygonVertices([]);
      setPolygonMode(true);
      setCreating(false);
      if (clickMarkerRef.current && mapRef.current) {
        mapRef.current.removeLayer(clickMarkerRef.current);
        clickMarkerRef.current = null;
      }
      if (polygonLayerRef.current && mapRef.current) {
        mapRef.current.removeLayer(polygonLayerRef.current);
        polygonLayerRef.current = null;
      }
      if (previewLineRef.current && mapRef.current) {
        mapRef.current.removeLayer(previewLineRef.current);
        previewLineRef.current = null;
      }
      vertexMarkersRef.current.forEach((m) => mapRef.current.removeLayer(m));
      vertexMarkersRef.current = [];
    } catch (err) {
      setFormError(err.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteParcel = async (parcelId) => {
    if (!window.confirm('Supprimer cette parcelle ?')) return;
    try {
      await dataApi.deleteParcel(parcelId);
      setParcels((prev) => prev.filter((p) => p.id !== parcelId));
      if (selectedParcel?.id === parcelId) setSelectedParcel(null);
    } catch (err) {
      console.error('[ParcelMap] Delete failed:', err);
    }
  };

  const cancelCreation = () => {
    setCreating(false);
    setClickCoords(null);
    setForm({ name: '', description: '', size_ha: '' });
    setFormError(null);
    setPolygonVertices([]);
    setPolygonMode(true);
    if (clickMarkerRef.current && mapRef.current) {
      mapRef.current.removeLayer(clickMarkerRef.current);
      clickMarkerRef.current = null;
    }
    if (polygonLayerRef.current && mapRef.current) {
      mapRef.current.removeLayer(polygonLayerRef.current);
      polygonLayerRef.current = null;
    }
    if (previewLineRef.current && mapRef.current) {
      mapRef.current.removeLayer(previewLineRef.current);
      previewLineRef.current = null;
    }
    vertexMarkersRef.current.forEach((m) => mapRef.current.removeLayer(m));
    vertexMarkersRef.current = [];
  };

  const closeRegionPanel = () => {
    setSelectedRegion(null);
    setRegionData(null);
    regionLayersRef.current.forEach((l) => {
      l.setStyle({ weight: 2, fillOpacity: 0.05, color: '#2b2b2b' });
    });
  };

  const togglePolygonMode = () => {
    setPolygonMode((prev) => {
      const next = !prev;
      if (!next) {
        if (polygonLayerRef.current && mapRef.current) {
          mapRef.current.removeLayer(polygonLayerRef.current);
          polygonLayerRef.current = null;
        }
        if (previewLineRef.current && mapRef.current) {
          mapRef.current.removeLayer(previewLineRef.current);
          previewLineRef.current = null;
        }
        vertexMarkersRef.current.forEach((m) => mapRef.current.removeLayer(m));
        vertexMarkersRef.current = [];
        setPolygonVertices([]);
      }
      return next;
    });
  };

  const finishPolygon = () => {
    if (polygonVertices.length < 3) return;
    const lastVertex = polygonVertices[polygonVertices.length - 1];
    setClickCoords({ lat: lastVertex.lat, lng: lastVertex.lng });
  };

  const undoLastVertex = () => {
    if (polygonVertices.length === 0) return;
    const newVertices = polygonVertices.slice(0, -1);
    setPolygonVertices(newVertices);

    const lastMarker = vertexMarkersRef.current.pop();
    if (lastMarker && mapRef.current) {
      mapRef.current.removeLayer(lastMarker);
    }

    if (previewLineRef.current && mapRef.current) {
      mapRef.current.removeLayer(previewLineRef.current);
    }
    if (newVertices.length >= 2) {
      const lineCoords = newVertices.map((v) => [v.lat, v.lng]);
      previewLineRef.current = L.polyline(lineCoords, {
        color: '#3b82f6',
        weight: 2,
        dashArray: '6, 6',
        opacity: 0.8,
      }).addTo(mapRef.current);
    }

    if (polygonLayerRef.current && mapRef.current) {
      mapRef.current.removeLayer(polygonLayerRef.current);
    }
    if (newVertices.length >= 3) {
      const geojson = buildGeoJSONPolygon(newVertices);
      if (geojson) {
        polygonLayerRef.current = L.geoJSON(geojson, {
          style: {
            color: '#3b82f6',
            weight: 2,
            opacity: 0.8,
            fillColor: '#3b82f6',
            fillOpacity: 0.15,
          },
        }).addTo(mapRef.current);
      }
    }

    if (newVertices.length > 0) {
      setClickCoords({ lat: newVertices[newVertices.length - 1].lat, lng: newVertices[newVertices.length - 1].lng });
    } else {
      setClickCoords(null);
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.mapCard}>
        <div className={styles.mapHeader}>
          <div className={styles.headerLeft}>
            <h3 className={styles.mapTitle}>
              <FiMapPin /> Mes Parcelles
            </h3>
            <span className={styles.parcelCount}>{parcels.length} parcelle{parcels.length !== 1 ? 's' : ''}</span>
          </div>
          <div className={styles.headerActions}>
            <button
              className={`${styles.createBtn} ${creating ? styles.createBtnActive : ''}`}
              onClick={() => { setCreating(true); setSelectedParcel(null); closeRegionPanel(); }}
            >
              <FiPlus /> Ajouter une parcelle
            </button>
          </div>
        </div>

        <div className={styles.mapWrapper}>
          <div ref={mapContainerRef} className={styles.mapContainer} />

          {creating && (
            <div className={styles.createPanel}>
              <div className={styles.panelHeader}>
                <h4>Nouvelle Parcelle</h4>
                <button className={styles.closeBtn} onClick={cancelCreation}>
                  <FiX />
                </button>
              </div>

              <div className={styles.modeToggle}>
                <button
                  className={`${styles.modeBtn} ${polygonMode ? styles.modeBtnActive : ''}`}
                  onClick={togglePolygonMode}
                >
                  <FiLayers /> Tracer un contour
                </button>
                <button
                  className={`${styles.modeBtn} ${!polygonMode ? styles.modeBtnActive : ''}`}
                  onClick={togglePolygonMode}
                >
                  <FiMapPin /> Point unique
                </button>
              </div>

              {polygonMode && (
                <div className={styles.creationHint}>
                  <FiMapPin />
                  <span>Cliquez pour ajouter des sommets au contour de la parcelle</span>
                </div>
              )}

              {!polygonMode && (
                <div className={styles.creationHint}>
                  <FiMapPin />
                  <span>Cliquez sur la carte pour placer la parcelle</span>
                </div>
              )}

              {polygonMode && polygonVertices.length > 0 && (
                <div className={styles.polygonInfo}>
                  <span>{polygonVertices.length} sommet{polygonVertices.length > 1 ? 's' : ''} défini{polygonVertices.length > 1 ? 's' : ''}</span>
                  <div className={styles.polygonActions}>
                    <button className={styles.polygonActionBtn} onClick={undoLastVertex} disabled={polygonVertices.length === 0}>
                      <FiCornerDownLeft /> Annuler
                    </button>
                    <button className={styles.polygonActionBtn} onClick={finishPolygon} disabled={polygonVertices.length < 3}>
                      <FiCheck /> Terminer
                    </button>
                  </div>
                </div>
              )}

              {clickCoords && (
                <div className={styles.coordsInfo}>
                  <FiMapPin />
                  <span>{clickCoords.lat.toFixed(6)}, {clickCoords.lng.toFixed(6)}</span>
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nom de la parcelle *</label>
                <input
                  className={styles.formInput}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Parcelle Nord"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Taille (hectares)</label>
                <input
                  className={styles.formInput}
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.size_ha}
                  onChange={(e) => setForm({ ...form, size_ha: e.target.value })}
                  placeholder="2.5"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description</label>
                <textarea
                  className={styles.formTextarea}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Description optionnelle..."
                  rows={2}
                />
              </div>

              {formError && <div className={styles.formError}>{formError}</div>}

              <button
                className={styles.saveBtn}
                onClick={handleCreateParcel}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className={styles.saveSpinner} />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <FiCheck /> Créer et analyser
                  </>
                )}
              </button>
            </div>
          )}

          {!creating && selectedRegion && regionData && (
            <div className={styles.regionPanel}>
              <div className={styles.panelHeader}>
                <h4>{regionData.name}</h4>
                <button className={styles.closeBtn} onClick={closeRegionPanel}>
                  <FiX />
                </button>
              </div>

              <p className={styles.regionDescription}>{regionData.info.description}</p>

              <div className={styles.regionGrid}>
                <div className={styles.regionInfo}>
                  <FiMapPin className={styles.infoIcon} />
                  <div>
                    <span className={styles.infoLabel}>Chef-lieu</span>
                    <span className={styles.infoValue}>{regionData.info.capital}</span>
                  </div>
                </div>
                <div className={styles.regionInfo}>
                  <GiPlantRoots className={styles.infoIcon} />
                  <div>
                    <span className={styles.infoLabel}>Type de sol</span>
                    <span className={styles.infoValue}>{regionData.info.soil}</span>
                  </div>
                </div>
                <div className={styles.regionInfo}>
                  <FiSun className={styles.infoIcon} />
                  <div>
                    <span className={styles.infoLabel}>Climat</span>
                    <span className={styles.infoValue}>{regionData.info.climate}</span>
                  </div>
                </div>
                <div className={styles.regionInfo}>
                  <FiDroplet className={styles.infoIcon} />
                  <div>
                    <span className={styles.infoLabel}>Pluviométrie</span>
                    <span className={styles.infoValue}>{regionData.info.rainfall}</span>
                  </div>
                </div>
                <div className={styles.regionInfo}>
                  <FiWind className={styles.infoIcon} />
                  <div>
                    <span className={styles.infoLabel}>Température</span>
                    <span className={styles.infoValue}>{regionData.info.temperature}</span>
                  </div>
                </div>
                <div className={styles.regionInfo}>
                  <FiLayers className={styles.infoIcon} />
                  <div>
                    <span className={styles.infoLabel}>Altitude</span>
                    <span className={styles.infoValue}>{regionData.info.altitude}</span>
                  </div>
                </div>
              </div>

              <div className={styles.cropsSection}>
                <h5 className={styles.recTitle}>Cultures principales</h5>
                <div className={styles.cropList}>
                  {regionData.info.mainCrops.split(',').map((crop, i) => (
                    <Badge key={i} variant="success" dot>
                      {crop.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!creating && !selectedRegion && selectedParcel && (
            <div className={styles.parcelPanel}>
              <div className={styles.panelHeader}>
                <h4>{selectedParcel.name}</h4>
                <div className={styles.panelActions}>
                  <button className={styles.iconBtn} onClick={() => handleDeleteParcel(selectedParcel.id)} title="Supprimer">
                    <FiTrash2 />
                  </button>
                  <button className={styles.closeBtn} onClick={() => setSelectedParcel(null)}>
                    <FiX />
                  </button>
                </div>
              </div>

              {selectedParcel.size_ha && (
                <div className={styles.sizeBadge}>
                  {selectedParcel.size_ha} hectares
                </div>
              )}

              <div className={styles.parcelGrid}>
                <div className={styles.parcelInfo}>
                  <FiDroplet className={styles.infoIcon} />
                  <div>
                    <span className={styles.infoLabel}>Humidité</span>
                    <span className={styles.infoValue}>{selectedParcel.annual_rainfall_mm || 'N/A'} mm/an</span>
                  </div>
                </div>
                <div className={styles.parcelInfo}>
                  <FiSun className={styles.infoIcon} />
                  <div>
                    <span className={styles.infoLabel}>Température</span>
                    <span className={styles.infoValue}>{selectedParcel.avg_temperature || 'N/A'}°C moy.</span>
                  </div>
                </div>
                <div className={styles.parcelInfo}>
                  <FiWind className={styles.infoIcon} />
                  <div>
                    <span className={styles.infoLabel}>Climat</span>
                    <span className={styles.infoValue}>{selectedParcel.climate_type || 'N/A'}</span>
                  </div>
                </div>
                <div className={styles.parcelInfo}>
                  <GiWheat className={styles.infoIcon} />
                  <div>
                    <span className={styles.infoLabel}>Type de sol</span>
                    <span className={styles.infoValue}>{selectedParcel.soil_type || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {selectedParcel.suitability_score && (
                <div className={styles.suitabilitySection}>
                  <div className={styles.suitabilityHeader}>
                    <span className={styles.suitabilityLabel}>Score de fertilité</span>
                    <span className={styles.suitabilityValue}>{Math.round(selectedParcel.suitability_score)}%</span>
                  </div>
                  <div className={styles.suitabilityBar}>
                    <div
                      className={styles.suitabilityFill}
                      style={{ width: `${selectedParcel.suitability_score}%` }}
                    />
                  </div>
                </div>
              )}

              {selectedParcel.recommended_crops && selectedParcel.recommended_crops.length > 0 && (
                <div className={styles.recommendationsSection}>
                  <h5 className={styles.recTitle}>Cultures recommandées</h5>
                  <div className={styles.cropList}>
                    {selectedParcel.recommended_crops.slice(0, 4).map((crop, i) => (
                      <div key={i} className={styles.cropItem}>
                        <Badge variant={crop.suitability_score >= 70 ? 'success' : crop.suitability_score >= 50 ? 'warning' : 'default'} dot>
                          {crop.name}
                        </Badge>
                        <span className={styles.cropScore}>{crop.suitability_score}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedParcel.region && (
                <div className={styles.locationInfo}>
                  <FiInfo />
                  <span>{[selectedParcel.commune, selectedParcel.district, selectedParcel.region].filter(Boolean).join(', ')}</span>
                </div>
              )}
            </div>
          )}

          {!creating && !selectedRegion && !selectedParcel && parcels.length === 0 && (
            <div className={styles.emptyOverlay}>
              <div className={styles.emptyContent}>
                <FiMapPin className={styles.emptyIcon} />
                <h4>Aucune parcelle enregistrée</h4>
                <p>Cliquez sur "Ajouter une parcelle" pour commencer à cartographier vos terres agricoles</p>
                <button className={styles.emptyActionBtn} onClick={() => setCreating(true)}>
                  <FiPlus /> Ajouter ma première parcelle
                </button>
              </div>
            </div>
          )}

          {!creating && !selectedRegion && !selectedParcel && parcels.length > 0 && (
            <div className={styles.mapHint}>
              <FiLayers /> Cliquez sur une région pour voir ses informations
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
