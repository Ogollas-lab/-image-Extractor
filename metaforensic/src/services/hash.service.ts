export class HashService {
  /**
   * Generates a SHA-256 hexadecimal hash for a given File or Blob.
   * Uses the native Web Crypto API.
   * 
   * @param blob The File or Blob to hash
   * @returns A promise that resolves to the hex string of the hash
   */
  static async calculateSHA256(blob: Blob): Promise<string> {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    } catch (error) {
      console.error('Failed to calculate hash:', error);
      return 'UNAVAILABLE';
    }
  }
}
