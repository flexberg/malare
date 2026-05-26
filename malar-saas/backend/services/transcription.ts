import OpenAI from 'openai'
import https from 'https'
import http from 'http'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function downloadRecording(url: string): Promise<Buffer> {
  const auth = Buffer.from(
    `${process.env.ELKS_API_USERNAME}:${process.env.ELKS_API_PASSWORD}`
  ).toString('base64')

  const parsedUrl = new URL(url)
  const protocol = parsedUrl.protocol === 'https:' ? https : http

  return new Promise((resolve, reject) => {
    protocol.get(
      url,
      { headers: { Authorization: `Basic ${auth}` } },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('end', () => resolve(Buffer.concat(chunks)))
        res.on('error', reject)
      }
    ).on('error', reject)
  })
}

export async function transcribeRecording(recordingUrl: string): Promise<string> {
  const audioBuffer = await downloadRecording(recordingUrl)

  const file = new File([audioBuffer], 'recording.mp3', { type: 'audio/mpeg' })

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'sv',
  })

  return transcription.text
}
