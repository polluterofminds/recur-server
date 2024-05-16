import jwt from '@tsndr/cloudflare-worker-jwt'

export const verifyToken = async (request: any, env: any) => {
  try {
    const headers = request.headers;
    console.log(headers)
    const authorization = headers['authorization']
    console.log(authorization)
    const token = authorization.split("Bearer ")[1]
    console.log(token)
    // Verifing token
    const isValid = await jwt.verify(token, 'secret')

    // Check for validity
    if (!isValid)
        throw new Error("invalid jwt")

    // Decoding token
    const { payload } = jwt.decode(token)

    return { valid: true, decoded: payload };
  } catch (err) {
    console.error("Invalid JWT:", err);
    return { valid: false, error: err };
  }
}