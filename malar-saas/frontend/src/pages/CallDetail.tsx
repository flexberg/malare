import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'

interface Call { id: string; duration_seconds: number | null; direction: string; called_at: string; transcript: string | null; recording_url: string | null }
interface ExtractedData { id: string; data_type: string; label: string; value: string }

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const dataTypeLabel: Record<string, string> = {
  address: 'Adress', measurement: 'Mått', material: 'Material',
  price: 'Pris', date: 'Datum', phone: 'Telefon', other: 'Övrigt',
}

export default function CallDetail() {
  const { customerId, callId } = useParams<{ customerId: string; callId: string }>()
  const [call, setCall] = useState<Call | null>(null)
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([])
  const [showTranscript, setShowTranscript] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/calls/${callId}`)
      .then((r) => r.json())
      .then((d) => { setCall(d.call); setExtractedData(d.extractedData); setLoading(false) })
      .catch(() => setLoading(false))
  }, [callId])

  if (loading) return <div style={{ padding: 24, color: '#888' }}>Laddar...</div>
  if (!call) return <div style={{ padding: 24, color: '#ef4444' }}>Samtal hittades inte</div>

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
      <Link to={`/kund/${customerId}`} style={{ color: '#FF6B35', textDecoration: 'none', fontSize: 14 }}>← Tillbaka</Link>

      <div style={{ marginTop: 20, marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0f0f0' }}>
          {call.direction === 'inbound' ? 'Inkommande samtal' : 'Utgående samtal'}
        </h1>
        <p style={{ color: '#888', marginTop: 6 }}>{new Date(call.called_at).toLocaleString('sv-SE')}</p>
        {call.duration_seconds != null && (
          <p style={{ color: '#888', fontSize: 14, marginTop: 2 }}>
            Längd: {Math.round(call.duration_seconds / 60)} min {call.duration_seconds % 60} sek
          </p>
        )}
      </div>

      {extractedData.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#FF6B35', marginBottom: 12 }}>Extraherad info</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {extractedData.map((item) => (
              <div key={item.id} style={{ display: 'flex', gap: 12, background: '#1a1a1a', borderRadius: 8, padding: '8px 12px' }}>
                <span style={{ color: '#666', fontSize: 12, minWidth: 80 }}>{dataTypeLabel[item.data_type] ?? item.data_type}</span>
                <span style={{ color: '#888', minWidth: 120 }}>{item.label}</span>
                <span style={{ color: '#f0f0f0', fontWeight: 500 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <button
          onClick={() => setShowTranscript((v) => !v)}
          style={{ background: 'transparent', border: '1px solid #3a3a3a', borderRadius: 8, color: '#f0f0f0', padding: '10px 16px', cursor: 'pointer', fontSize: 14, marginBottom: 12, width: '100%', textAlign: 'left' }}
        >
          {showTranscript ? '▲' : '▼'} Transkript
        </button>
        {showTranscript && (
          <div style={{ background: '#1a1a1a', borderRadius: 10, padding: '16px', lineHeight: 1.7, color: '#ccc', fontSize: 15, whiteSpace: 'pre-wrap' }}>
            {call.transcript ?? 'Inget transkript tillgängligt'}
          </div>
        )}
      </section>
    </div>
  )
}
