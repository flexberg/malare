import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'

interface Customer { id: string; phone_number: string; name: string | null; address: string | null; notes: string | null; updated_at: string }
interface Call { id: string; duration_seconds: number | null; direction: string; called_at: string; transcript: string | null }
interface ExtractedData { id: string; data_type: string; label: string; value: string }
interface Task { id: string; title: string; detail: string | null; category: string; urgency: string; completed: boolean; remind_at: string | null }

interface CustomerData { customer: Customer; calls: Call[]; extractedData: ExtractedData[]; tasks: Task[] }

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const urgencyBadge: Record<string, { label: string; color: string }> = {
  nu: { label: 'Nu', color: '#ef4444' },
  idag: { label: 'Idag', color: '#f97316' },
  veckan: { label: 'Veckan', color: '#eab308' },
  ingen_brads: { label: 'Ingen brådska', color: '#6b7280' },
}

const dataTypeLabel: Record<string, string> = {
  address: 'Adress', measurement: 'Mått', material: 'Material',
  price: 'Pris', date: 'Datum', phone: 'Telefon', other: 'Övrigt',
}

export default function CustomerPage() {
  const { customerId } = useParams<{ customerId: string }>()
  const [data, setData] = useState<CustomerData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/customers/${customerId}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [customerId])

  async function completeTask(taskId: string) {
    await fetch(`${API}/api/tasks/${taskId}/complete`, { method: 'POST' })
    setData((prev) => prev ? {
      ...prev,
      tasks: prev.tasks.map((t) => t.id === taskId ? { ...t, completed: true } : t)
    } : prev)
  }

  if (loading) return <div style={{ padding: 24, color: '#888' }}>Laddar...</div>
  if (!data) return <div style={{ padding: 24, color: '#ef4444' }}>Kund hittades inte</div>

  const { customer, calls, extractedData, tasks } = data
  const activeTasks = tasks.filter((t) => !t.completed)
  const groupedData = extractedData.reduce<Record<string, ExtractedData[]>>((acc, d) => {
    if (!acc[d.data_type]) acc[d.data_type] = []
    acc[d.data_type].push(d)
    return acc
  }, {})

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
      <Link to="/" style={{ color: '#FF6B35', textDecoration: 'none', fontSize: 14 }}>← Alla kunder</Link>

      <div style={{ marginTop: 20, marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#f0f0f0' }}>
          {customer.name ?? customer.phone_number}
        </h1>
        {customer.name && <p style={{ color: '#888', marginTop: 4 }}>{customer.phone_number}</p>}
        {customer.address && <p style={{ color: '#888', marginTop: 4 }}>{customer.address}</p>}
        <p style={{ color: '#555', fontSize: 12, marginTop: 8 }}>
          Uppdaterad {new Date(customer.updated_at).toLocaleString('sv-SE')}
        </p>
      </div>

      {activeTasks.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#FF6B35', marginBottom: 12 }}>Uppgifter</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activeTasks.map((task) => {
              const badge = urgencyBadge[task.urgency] ?? { label: task.urgency, color: '#6b7280' }
              return (
                <div key={task.id} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ background: badge.color + '22', color: badge.color, borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>{badge.label}</span>
                      <span style={{ fontWeight: 600, color: '#f0f0f0' }}>{task.title}</span>
                    </div>
                    {task.detail && <p style={{ color: '#888', fontSize: 14 }}>{task.detail}</p>}
                  </div>
                  <button onClick={() => completeTask(task.id)} style={{ background: 'transparent', border: '1px solid #3a3a3a', borderRadius: 6, color: '#888', padding: '4px 10px', cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' }}>Klar</button>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {Object.keys(groupedData).length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#FF6B35', marginBottom: 12 }}>Extraherad info</h2>
          {Object.entries(groupedData).map(([type, items]) => (
            <div key={type} style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{dataTypeLabel[type] ?? type}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', gap: 12, background: '#1a1a1a', borderRadius: 8, padding: '8px 12px' }}>
                    <span style={{ color: '#888', minWidth: 140 }}>{item.label}</span>
                    <span style={{ color: '#f0f0f0', fontWeight: 500 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      <section>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#FF6B35', marginBottom: 12 }}>Samtalstidslinje</h2>
        {calls.length === 0 && <p style={{ color: '#555' }}>Inga samtal</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {calls.map((call) => (
            <Link key={call.id} to={`/kund/${customerId}/samtal/${call.id}`} style={{ textDecoration: 'none' }}>
              <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#FF6B35')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#2a2a2a')}>
                <div>
                  <span style={{ color: '#888', fontSize: 13, marginRight: 8 }}>{call.direction === 'inbound' ? '↙ Inkommande' : '↗ Utgående'}</span>
                  <span style={{ color: '#f0f0f0', fontSize: 14 }}>{new Date(call.called_at).toLocaleString('sv-SE')}</span>
                </div>
                <span style={{ color: '#888', fontSize: 13 }}>
                  {call.duration_seconds ? `${Math.round(call.duration_seconds / 60)} min` : '–'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
