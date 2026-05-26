import { Router, Request, Response } from 'express'
import * as customerStore from '../services/customerStore'

const router = Router()

// Alla kunder, sorterade på senaste aktivitet
router.get('/customers', async (req: Request, res: Response) => {
  try {
    const customers = await customerStore.getAllCustomers()
    res.json(customers)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Kunde inte hämta kunder' })
  }
})

// Kundkort med all data
router.get('/customers/:id', async (req: Request, res: Response) => {
  try {
    const customer = await customerStore.getCustomerById(req.params.id as string)
    if (!customer) {
      res.status(404).json({ error: 'Kund hittades inte' })
      return
    }

    const [calls, extractedData, tasks] = await Promise.all([
      customerStore.getCallsByCustomer(customer.id),
      customerStore.getExtractedDataByCustomer(customer.id),
      customerStore.getTasksByCustomer(customer.id),
    ])

    res.json({ customer, calls, extractedData, tasks })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Kunde inte hämta kunddata' })
  }
})

// Uppdatera kund manuellt
router.patch('/customers/:id', async (req: Request, res: Response) => {
  try {
    const { name, address, notes } = req.body
    await customerStore.updateCustomer(req.params.id as string, { name, address })
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Kunde inte uppdatera kund' })
  }
})

// Enskilt samtal med extraherad data
router.get('/calls/:id', async (req: Request, res: Response) => {
  try {
    const call = await customerStore.getCallById(req.params.id as string)
    if (!call) {
      res.status(404).json({ error: 'Samtal hittades inte' })
      return
    }

    const extractedData = await customerStore.getExtractedDataByCall(call.id)
    res.json({ call, extractedData })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Kunde inte hämta samtal' })
  }
})

// Slutför uppgift
router.post('/tasks/:id/complete', async (req: Request, res: Response) => {
  try {
    await customerStore.completeTask(req.params.id as string)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Kunde inte slutföra uppgift' })
  }
})

export default router
