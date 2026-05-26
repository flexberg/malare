import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

interface Customer {
  id: string
  phone_number: string
  name: string | null
  address: string | null
  updated_at: string
}

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const urgencyColor: Record<string, string> = {
  nu: '#ef4444',
  idag: '#f97316',
  veckan: '#eab308',
  ingen_brads: '#6b7280',
}

export default function Dashboard() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/customers`)
      .then((r) => r.json())
      .then((data) => { setCustomers(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: '#FF6B35' }}>
        MålarSaaS
      </h1>
      <p style={{ color: '#888', marginBottom: 32 }}>Alla kunder</p>

      {loading && <p style={{ color: '#888' }}>Laddar...</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {customers.map((c) => (
          <Link
            key={c.id}
            to={`/kund/${c.id}`}
            style={{ textDecoration: 'none' }}
          >
            <div style={{
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: 12,
              padding: '16px 20px',
              transition: 'border-color 0.15s',
            }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#FF6B35')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#2a2a2a')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 17, color: '#f0f0f0' }}>
                    {c.name ?? c.phone_number}
                  </p>
                  {c.name && (
                    <p style={{ color: '#888', fontSize: 14, marginTop: 2 }}>{c.phone_number}</p>
                  )}
                  {c.address && (
                    <p style={{ color: '#888', fontSize: 14, marginTop: 2 }}>{c.address}</p>
                  )}
                </div>
                <p style={{ color: '#555', fontSize: 12, whiteSpace: 'nowrap', marginLeft: 12 }}>
                  {new Date(c.updated_at).toLocaleDateString('sv-SE')}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {!loading && customers.length === 0 && (
        <p style={{ color: '#555', textAlign: 'center', marginTop: 48 }}>
          Inga kunder ännu. Samtal registreras automatiskt via Twilio.
        </p>
      )}
    </div>
  )
}
