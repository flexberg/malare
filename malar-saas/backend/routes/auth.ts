import { Router, Request, Response } from 'express'
import { sendSms } from '../services/smsNotifier'

const router = Router()

// Enkelt PIN-baserat login – genererar ett engångslösenord via SMS
const activePins = new Map<string, { pin: string; expiresAt: number }>()

function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Begär PIN-kod via SMS
router.post('/request-pin', async (req: Request, res: Response) => {
  const painterPhone = process.env.PAINTER_PHONE!

  const pin = generatePin()
  activePins.set(painterPhone, {
    pin,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minuter
  })

  try {
    await sendSms(painterPhone, `Din inloggningskod till MålarSaaS: ${pin}\n\nKoden gäller i 10 minuter.`)
    res.json({ ok: true, message: 'PIN skickad via SMS' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Kunde inte skicka SMS' })
  }
})

// Verifiera PIN
router.post('/verify-pin', (req: Request, res: Response) => {
  const { pin } = req.body
  const painterPhone = process.env.PAINTER_PHONE!

  const stored = activePins.get(painterPhone)
  if (!stored || stored.expiresAt < Date.now()) {
    res.status(401).json({ error: 'PIN har gått ut, begär en ny' })
    return
  }

  if (stored.pin !== pin) {
    res.status(401).json({ error: 'Fel PIN-kod' })
    return
  }

  activePins.delete(painterPhone)

  // Enkel session-token – i produktion byt till JWT
  const sessionToken = Buffer.from(`${painterPhone}:${Date.now()}`).toString('base64')
  res.json({ ok: true, token: sessionToken })
})

export default router
