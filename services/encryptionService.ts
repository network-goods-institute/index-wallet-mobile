import * as Crypto from 'expo-crypto';

/**
 * Encryption service for handling sensitive data encryption/decryption
 * 
 * NOTE: This is currently using a simplified implementation for demonstration.
 * In a production app, should use passkeys.
 */

const ENCRYPTION_PREFIX = 'encrypted:';
const ENCRYPTION_KEY_SALT = 'wallet-encryption-key';

class EncryptionService {
  /**
   * Encrypt sensitive data
   * @param data - The string data to encrypt
   * @returns The encrypted data with a prefix
   */
  async encrypt(data: string): Promise<string> {
    try {
      // In a real implementation, use a proper encryption method
      // This is a simplified mock for demonstration
      const encryptionKey = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        ENCRYPTION_KEY_SALT
      );
      
      // For a real app, use a proper encryption algorithm
      // This is just a mock for demonstration purposes
      return `${ENCRYPTION_PREFIX}${data}`;
    } catch (error) {
      console.error('Error encrypting data:', error);
      // Fallback to unencrypted in case of error
      // In production, you might want to throw the error instead
      return data;
    }
  }

  /**
   * Decrypt encrypted data
   * @param encryptedData - The encrypted string to decrypt
   * @returns The decrypted data
   */
  async decrypt(encryptedData: string): Promise<string> {
    // In a real implementation, use proper decryption
    // This is a simplified mock for demonstration
    
    if (encryptedData.startsWith(ENCRYPTION_PREFIX)) {
      return encryptedData.substring(ENCRYPTION_PREFIX.length);
    }
    
    // Try other possible formats for backward compatibility
    if (encryptedData.includes(':')) {
      return encryptedData.substring(encryptedData.indexOf(':') + 1);
    }
    
    // No encryption prefix found, return as is
    return encryptedData;
  }

  /**
   * Check if a string is encrypted
   * @param data - The string to check
   * @returns True if the data appears to be encrypted
   */
  isEncrypted(data: string): boolean {
    return data.startsWith(ENCRYPTION_PREFIX) || data.includes(':');
  }

  /**
   * Generate a secure encryption key (for future use)
   * In a real implementation, this would generate a proper encryption key
   */
  async generateKey(): Promise<string> {
    // This would generate a proper encryption key
    // For now, return a hash as a placeholder
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    return Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      randomBytes.toString()
    );
  }
}

// Export a singleton instance
export const encryptionService = new EncryptionService();

// Also export the class for testing
export { EncryptionService };

// Maintain backward compatibility with the old function names
export const encryptData = (data: string) => encryptionService.encrypt(data);
export const decryptData = (data: string) => encryptionService.decrypt(data);