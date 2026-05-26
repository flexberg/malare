import Anthropic from '@anthropic-ai/sdk'
import { Customer, AnalysisResult } from '../types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Du är en assistent för en målare i Sverige. Analysera samtalstranskriptet och extrahera ALL relevant information. Returnera ENDAST giltig JSON utan markdown-kodblock.

{
  "customerUpdates": {
    "name": "namn om det nämnts, annars null",
    "address": "adress om det nämnts, annars null"
  },
  "data": [
    {
      "data_type": "address|measurement|material|price|date|phone|other",
      "label": "Vad det gäller",
      "value": "Det faktiska värdet"
    }
  ],
  "tasks": [
    {
      "title": "Kort titel",
      "detail": "Mer detaljer",
      "category": "kund|material|offert|ringa|möte|övrigt",
      "urgency": "nu|idag|veckan|ingen_brads",
      "remind_in_hours": 2
    }
  ],
  "summary": "En mening som sammanfattar samtalet"
}

Exempel på data att extrahera:
- Adresser: "Storgatan 12, Halmstad"
- Mått: "Vardagsrum 24 kvm", "tak 2.4m högt"
- Material: "vill ha halvmatt vit", "Alcro Brilliant White"
- Priser: "kom överens om 12000 kr för hela jobbet"
- Datum: "vi sa fredag den 14:e", "klart till midsommar"
- Telefonnummer: "min fru heter Anna, ring henne på 070-xxx"
- Övrigt: allt annat som kan vara relevant för jobbet`

export async function analyzeCall(
  transcript: string,
  customer: Customer
): Promise<AnalysisResult> {
  const userMessage = `Kundens telefonnummer: ${customer.phone_number}
Kundens namn (om känt): ${customer.name ?? 'okänt'}
Kundens adress (om känd): ${customer.address ?? 'okänd'}

Transkript:
${transcript}`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  })

  const responseText = message.content
    .filter((block) => block.type === 'text')
    .map((block) => (block as { type: 'text'; text: string }).text)
    .join('')

  try {
    const result = JSON.parse(responseText) as AnalysisResult
    return result
  } catch {
    console.error('Failed to parse AI response:', responseText)
    return {
      customerUpdates: { name: null, address: null },
      data: [],
      tasks: [],
      summary: 'Kunde inte analysera samtalet automatiskt.',
    }
  }
}
