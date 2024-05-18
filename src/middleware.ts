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