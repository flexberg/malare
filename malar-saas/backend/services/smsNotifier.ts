import https from 'https'
import { URLSearchParams } from 'url'

export async function sendSms(to: string, message: string): Promise<void> {
  const auth = Buffer.from(
    `${process.env.ELKS_API_USERNAME}:${process.env.ELKS_API_PASSWORD}`
  ).toString('base64')

  const body = new URLSearchParams({
    from: process.env.ELKS_PHONE_NUMBER!,
    to,
    message,
  }).toString()

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.46elks.com',
        path: '/a1/sms',
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        res.resume()
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`46elks SMS error: ${res.statusCode}`))
        } else {
          resolve()
        }
      }
    )
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}
