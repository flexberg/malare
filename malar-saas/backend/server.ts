import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import * as customerStore from './services/customerStore'
import { sendSms } from './services/smsNotifier'
import elksRoutes from './routes/elks'
import dashboardRoutes from './routes/dashboard'
import authRoutes from './routes/auth'

const app = express()
const PORT = process.env.PORT ?? 3000

app.use(cors())
app.use(express.urlencoded({ extended: false })) // 46elks skickar form-encoded
app.use(express.json())

app.use('/webhook', elksRoutes)
app.use('/api', dashboardRoutes)
app.use('/auth', authRoutes)

app.get('/health', (req, res) => res.json({ ok: true }))

// SMS-påminnelsesystem: kör var 15:e minut
async function checkReminders() {
  try {
    const dueTasks = await customerStore.getDueTasks()
    for (const task of dueTasks as any[]) {
      const customer = task.customers
      const dashUrl = `${process.env.DASHBOARD_URL}/kund/${task.customer_id}`
      await sendSms(
        process.env.PAINTER_PHONE!,
        `GLÖM INTE: ${task.title}\nKund: ${customer?.name || customer?.phone_number}\n→ ${dashUrl}`
      )
      await customerStore.snoozeTask(task.id)
    }
    if (dueTasks.length > 0) {
      console.log(`Sent ${dueTasks.length} reminder(s)`)
    }
  } catch (err) {
    console.error('checkReminders error:', err)
  }
}

setInterval(checkReminders, 15 * 60 * 1000)

app.listen(PORT, () => {
  console.log(`MålarSaaS backend running on port ${PORT}`)
  checkReminders() // Kör direkt vid start
})
