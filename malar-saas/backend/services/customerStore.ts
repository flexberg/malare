import { createClient } from '@supabase/supabase-js'
import {
  Customer,
  Call,
  SaveCallParams,
  ExtractedDataInput,
  TaskInput,
  CustomerUpdates,
} from '../types'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function upsertCustomer(phoneNumber: string): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .upsert({ phone_number: phoneNumber }, { onConflict: 'phone_number' })
    .select()
    .single()

  if (error) throw new Error(`upsertCustomer: ${error.message}`)
  return data
}

export async function updateCustomer(
  customerId: string,
  updates: CustomerUpdates
): Promise<void> {
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== null && v !== undefined)
  )
  if (Object.keys(filtered).length === 0) return

  const { error } = await supabase
    .from('customers')
    .update(filtered)
    .eq('id', customerId)

  if (error) throw new Error(`updateCustomer: ${error.message}`)
}

export async function saveCall(params: SaveCallParams): Promise<Call> {
  const { data, error } = await supabase
    .from('calls')
    .insert({
      customer_id: params.customerId,
      twilio_call_sid: params.callSid,
      recording_url: params.recordingUrl,
      transcript: params.transcript,
      duration_seconds: params.durationSeconds,
      direction: params.direction,
      called_at: params.calledAt.toISOString(),
    })
    .select()
    .single()

  if (error) throw new Error(`saveCall: ${error.message}`)
  return data
}

export async function saveExtractedData(
  callId: string,
  customerId: string,
  items: ExtractedDataInput[]
): Promise<void> {
  if (items.length === 0) return

  const rows = items.map((item) => ({
    call_id: callId,
    customer_id: customerId,
    data_type: item.data_type,
    label: item.label,
    value: item.value,
  }))

  const { error } = await supabase.from('extracted_data').insert(rows)
  if (error) throw new Error(`saveExtractedData: ${error.message}`)
}

export async function saveTasks(
  callId: string,
  customerId: string,
  tasks: TaskInput[]
): Promise<void> {
  if (tasks.length === 0) return

  const rows = tasks.map((task) => ({
    call_id: callId,
    customer_id: customerId,
    title: task.title,
    detail: task.detail ?? null,
    category: task.category,
    urgency: task.urgency,
    remind_at: task.remind_in_hours
      ? new Date(Date.now() + task.remind_in_hours * 60 * 60 * 1000).toISOString()
      : null,
  }))

  const { error } = await supabase.from('tasks').insert(rows)
  if (error) throw new Error(`saveTasks: ${error.message}`)
}

export async function getAllCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) throw new Error(`getAllCustomers: ${error.message}`)
  return data
}

export async function getCustomerById(customerId: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single()

  if (error?.code === 'PGRST116') return null
  if (error) throw new Error(`getCustomerById: ${error.message}`)
  return data
}

export async function getCallsByCustomer(customerId: string): Promise<Call[]> {
  const { data, error } = await supabase
    .from('calls')
    .select('*')
    .eq('customer_id', customerId)
    .order('called_at', { ascending: false })

  if (error) throw new Error(`getCallsByCustomer: ${error.message}`)
  return data
}

export async function getCallById(callId: string): Promise<Call | null> {
  const { data, error } = await supabase
    .from('calls')
    .select('*')
    .eq('id', callId)
    .single()

  if (error?.code === 'PGRST116') return null
  if (error) throw new Error(`getCallById: ${error.message}`)
  return data
}

export async function getExtractedDataByCustomer(customerId: string) {
  const { data, error } = await supabase
    .from('extracted_data')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`getExtractedDataByCustomer: ${error.message}`)
  return data
}

export async function getExtractedDataByCall(callId: string) {
  const { data, error } = await supabase
    .from('extracted_data')
    .select('*')
    .eq('call_id', callId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`getExtractedDataByCall: ${error.message}`)
  return data
}

export async function getTasksByCustomer(customerId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('customer_id', customerId)
    .order('urgency', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) throw new Error(`getTasksByCustomer: ${error.message}`)
  return data
}

export async function getDueTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, customers(name, phone_number)')
    .eq('completed', false)
    .lte('remind_at', new Date().toISOString())

  if (error) throw new Error(`getDueTasks: ${error.message}`)
  return data
}

export async function snoozeTask(taskId: string, hours: number = 2): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({
      remind_at: new Date(Date.now() + hours * 60 * 60 * 1000).toISOString(),
    })
    .eq('id', taskId)

  if (error) throw new Error(`snoozeTask: ${error.message}`)
}

export async function completeTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq('id', taskId)

  if (error) throw new Error(`completeTask: ${error.message}`)
}
