/**
 * AuthService.ts
 * Service for handling authentication and cookie decryption
 */

import crypto from 'crypto';

/**
 * Decrypt Laravel cookie to extract authentication token
 * @param cookie - The encrypted Laravel cookie
 * @returns The decrypted cookie content or null if decryption fails
 */
export function decryptLaravelCookie(cookie: string): string | null { 
  if (!cookie) return null; 

  console.log("Encrypted cookie:", cookie); 

  try { 
    const payload = JSON.parse( 
      Buffer.from(cookie, "base64").toString() 
    ); 

    const iv = Buffer.from(payload.iv, "base64"); 
    const value = Buffer.from(payload.value, "base64"); 
    const mac = payload.mac; 

    let appKey = process.env.ANINKA_APP_KEY; 

    if (!appKey) { 
      throw new Error("APP_KEY not found in environment variables."); 
    } 

    // Laravel APP_KEY is base64 encoded, remove 'base64:' prefix and decode 
    const decodedAppKey = Buffer.from(appKey.replace("base64:", ""), "base64"); 

    // Laravel uses the decoded APP_KEY directly as the encryption and MAC key 
    const encryptionKey = decodedAppKey; 

    console.log("Encryption Key (hex):", encryptionKey.toString("hex")); 

    // Verify MAC 
    const expectedMac = crypto 
      .createHmac("sha256", encryptionKey) 
      .update(payload.iv + payload.value) 
      .digest("hex"); 

    if (expectedMac !== mac) { 
      throw new Error("Invalid MAC — possible tampering or wrong APP_KEY."); 
    } 

    // Decrypt with AES-256-CBC 
    const decipher = crypto.createDecipheriv("aes-256-cbc", encryptionKey, iv); 
    decipher.setAutoPadding(true); 

    let decrypted = decipher.update(value, undefined, "utf8"); 
    decrypted += decipher.final("utf8"); 

    return decrypted; 
  } catch (error) { 
    console.error("Laravel cookie decryption error:", error); 
    return null; 
  } 
}

/**
 * Extract authentication token from cookie
 * @param cookie - The encrypted Laravel cookie
 * @returns The authentication token or null if extraction fails
 */
export function extractAuthToken(cookie: string): string | null {
  const decrypted = decryptLaravelCookie(cookie);
  if (!decrypted) return null;
  
  try {

    // biasanya formatnya: id|token|hash
    const parts = decrypted.split("|");
    let bearerToken;

    if (parts.length === 3) {
      // ambil tengah + kanan biar match dengan Laravel
      bearerToken = `${parts[1]}|${parts[2]}`;
    } else if (parts.length === 2) {
      bearerToken = `${parts[0]}|${parts[1]}`;
    } else {
      bearerToken = decrypted; // fallback
    }

    console.log("Bearer Token:", bearerToken);
    // Parse the decrypted content to extract the token
    // Adjust according to the actual structure of your Laravel cookie
    const data = JSON.parse(decrypted);
    
    // Look for common Laravel auth token fields
    if (data.token) {
      return data.token;
    } else if (data.access_token) {
      return data.access_token;
    } else if (data.auth && data.auth.token) {
      return data.auth.token;
    } else if (data.user && data.user.api_token) {
      return data.user.api_token;
    }
    
    // If no token found in expected fields, return null
    return null;
  } catch (error) {
    console.error("Error extracting auth token:", error);
    return null;
  }
}

/**
 * Get authentication headers with bearer token
 * @param cookie - The encrypted Laravel cookie
 * @returns Headers object with Authorization header or empty object if extraction fails
 */
export function getAuthHeaders(cookie: string): Record<string, string> {
  const token = extractAuthToken(cookie);
  if (!token) return {};
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}