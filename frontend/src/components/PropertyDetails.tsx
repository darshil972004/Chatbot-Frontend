import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

// Mock API call (replace with real API)
async function fetchPropertyDetails(mls: string) {
  const response = await fetch(`/api/properties/${mls}`);
  if (!response.ok) throw new Error('Property not found');
  return await response.json();
}

export default function PropertyDetails() {
  const { mls } = useParams<{ mls: string }>();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (mls) {
      fetchPropertyDetails(mls).then((data) => {
        setProperty(data);
        setLoading(false);
      });
    }
  }, [mls]);

  if (loading) return <div style={{ padding: 32 }}>Loading property details...</div>;
  if (!property) return <div style={{ padding: 32 }}>Property not found.</div>;

  return (
    <div style={{ maxWidth: 600, margin: '32px auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #eee', padding: 24 }}>
      <h2 style={{ marginBottom: 16 }}>{property.title}</h2>
      <img src={property.image} alt={property.title} style={{ width: '100%', borderRadius: 8, marginBottom: 16 }} />
      <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>{property.currency} {property.price.toLocaleString()}</div>
      <div style={{ marginBottom: 8 }}><strong>MLS#:</strong> {property.mls}</div>
      <div style={{ marginBottom: 8 }}><strong>Beds:</strong> {property.beds} | <strong>Baths:</strong> {property.baths}</div>
      <div style={{ marginBottom: 8 }}><strong>Location:</strong> {property.location}</div>
      <div style={{ marginBottom: 16 }}><strong>Description:</strong> <span>{property.description}</span></div>
      <div style={{ marginBottom: 8 }}><strong>Features:</strong></div>
      <ul style={{ marginLeft: 20 }}>
        {property.features.map((f: string, idx: number) => <li key={idx}>{f}</li>)}
      </ul>
    </div>
  );
}
