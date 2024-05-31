import jwt from '@tsndr/cloudflare-worker-jwt'
import { DecodedToken } from './types';

export const verifyToken = async (request: any, env: any) => {
  try {
    const headers = request.headers;
    const authorization = headers.get('authorization')
    const token = authorization.split("Bearer ")[1]
    // Verifing token
    const isValid = await jwt.verify(token, env.CLIENT_SECRET)

    // Check for validity
    if (!isValid)
        throw new Error("invalid jwt")

    // Decoding token
    const { payload }: any = jwt.decode(token)
    const decoded: DecodedToken = payload
    return { valid: true, decoded: decoded };
  } catch (err) {
    console.error("Invalid JWT:", err);
    return { valid: false, error: err };
  }
}

export const logData = async (data: string, env: any) => {
  try {
    await fetch("https://api.exceptionless.com/api/v2/events", {
      method: "POST", 
      headers: {
        'Authorization': `Bearer ${env.EXCEPTIONLESS_KEY}`, 
        'Content-Type': 'application/json'
      }, 
      body: JSON.stringify({ "type": "log", "message": data, "date": new Date() })
    })
  } catch (error) {
    console.log(error)
    throw error;
  }
}

export const logError = async (error: any, env: any) => {
  try {
    const errorData = { "type": "error", "date": new Date(), "@simple_error": error }
    await fetch("https://api.exceptionless.com/api/v2/events", {
      method: "POST", 
      headers: {
        'Authorization': `Bearer ${env.EXCEPTIONLESS_KEY}`, 
        'Content-Type': 'application/json'
      }, 
      body: JSON.stringify(errorData)
    })
  } catch (error) {
    console.log(error)
    throw error;
  }
}