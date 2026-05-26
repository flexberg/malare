import { Router, Request, Response } from 'express'
import { transcribeRecording } from '../services/transcription'
import { analyzeCall } from '../services/aiAnalysis'
import * as customerStore from '../services/customerStore'
import { sendSms } from '../services/smsNotifier'
import { ElksRecordingBody } from '../types'

const router = Router()

// Inkommande samtal – 46elks väntar på JSON som talar om vad som ska hända
router.post('/incoming', (req: Request, res: Response) => {
  res.json({
    connect: process.env.PAINTER_REAL_PHONE,
    record: 'yes',
    recordingurl: `${process.env.BACKEND_URL}/webhook/recording-ready`,
  })
})

// Webhook: inspelning klar – hela pipeline körs här
router.post('/recording-ready', async (req: Request, res: Response) => {
  // Svara 46elks direkt, processing sker asynkront
  res.status(200).send('OK')

  const body = req.body as ElksRecordingBody
  const { callid, recording, from, to, direction, duration } = body

  if (!recording) {
    console.log(`Call ${callid} has no recording, skipping`)
    return
  }

  try {
    console.log(`Processing call ${callid}`)

    // Identifiera kund (den som INTE är målarens 46elks-nummer)
    const elksNumber = process.env.ELKS_PHONE_NUMBER!
    const customerPhone = from === elksNumber ? to : from

    // Hämta eller skapa kundkort
    const customer = await customerStore.upsertCustomer(customerPhone)

    // Ladda ned och transkribera inspelningen
    const transcript = await transcribeRecording(recording)

    // Spara samtal
    const call = await customerStore.saveCall({
      customerId: customer.id,
      callSid: callid,
      recordingUrl: recording,
      transcript,
      durationSeconds: parseInt(duration ?? '0'),
      direction: direction?.toLowerCase() === 'incoming' ? 'inbound' : 'outbound',
      calledAt: new Date(),
    })

    // Analysera med Claude
    const analysis = await analyzeCall(transcript, customer)

    // Spara extraherad data + uppgifter
    await customerStore.saveExtractedData(call.id, customer.id, analysis.data)
    await customerStore.saveTasks(call.id, customer.id, analysis.tasks)

    // Uppdatera kundkort med ny info från AI
    await customerStore.updateCustomer(customer.id, analysis.customerUpdates)

    // Hämta uppdaterat kundkort för SMS
    const updatedCustomer = await customerStore.getCustomerById(customer.id)
    const displayName = updatedCustomer?.name || customerPhone

    const durationMin = Math.round(parseInt(duration ?? '0') / 60)
    const dashboardUrl = `${process.env.DASHBOARD_URL}/kund/${customer.id}`

    await sendSms(
      process.env.PAINTER_PHONE!,
      `Samtal klart med ${displayName} (${durationMin} min)\n\n${analysis.summary}\n\nNy info sparad → ${dashboardUrl}`
    )

    console.log(`Call ${callid} processed successfully`)
  } catch (err) {
    console.error(`Error processing call ${callid}:`, err)
  }
})

export default router
