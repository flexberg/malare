export interface Customer {
  id: string
  phone_number: string
  name: string | null
  address: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Call {
  id: string
  customer_id: string
  twilio_call_sid: string
  recording_url: string | null
  transcript: string | null
  duration_seconds: number | null
  direction: 'inbound' | 'outbound'
  called_at: string
  created_at: string
}

export type DataType = 'address' | 'measurement' | 'material' | 'price' | 'date' | 'phone' | 'other'

export interface ExtractedData {
  id: string
  call_id: string
  customer_id: string
  data_type: DataType
  label: string
  value: string
  created_at: string
}

export type TaskCategory = 'kund' | 'material' | 'offert' | 'ringa' | 'möte' | 'övrigt'
export type TaskUrgency = 'nu' | 'idag' | 'veckan' | 'ingen_brads'

export interface Task {
  id: string
  customer_id: string
  call_id: string | null
  title: string
  detail: string | null
  category: TaskCategory
  urgency: TaskUrgency
  remind_at: string | null
  completed: boolean
  completed_at: string | null
  created_at: string
}

export interface SaveCallParams {
  customerId: string
  callSid: string
  recordingUrl: string
  transcript: string
  durationSeconds: number
  direction: 'inbound' | 'outbound'
  calledAt: Date
}

export interface ExtractedDataInput {
  data_type: DataType
  label: string
  value: string
}

export interface TaskInput {
  title: string
  detail?: string
  category: TaskCategory
  urgency: TaskUrgency
  remind_in_hours?: number
}

export interface CustomerUpdates {
  name?: string | null
  address?: string | null
}

export interface AnalysisResult {
  customerUpdates: CustomerUpdates
  data: ExtractedDataInput[]
  tasks: TaskInput[]
  summary: string
}

export interface ElksRecordingBody {
  callid: string
  recording: string
  from: string
  to: string
  direction: string
  duration: string
}
