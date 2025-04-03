import * as bip39 from 'bip39';
import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';

// Configure ed25519 to use the proper hash function
// @ts-ignore - The Noble ed25519 library types are incomplete
ed.utils.sha512Sync = (...m: Uint8Array[]) => sha512(ed.utils.concatBytes(...m));

/**
 * Generates a new BIP39 mnemonic (seed phrase) with 128 bits of entropy (12 words)
 * @returns A 12-word seed phrase
 */
export const generateSeedPhrase = (): string => {
  // Generate a random mnemonic (128 bits = 12 words)
  return bip39.generateMnemonic(128);
};

/**
 * Validates if a seed phrase is a valid BIP39 mnemonic
 * @param phrase The seed phrase to validate
 * @returns True if the phrase is valid, false otherwise
 */
export const validateSeedPhrase = (phrase: string): boolean => {
  return bip39.validateMnemonic(phrase);
};

/**
 * Derives a private key from a seed phrase
 * @param seedPhrase The BIP39 mnemonic seed phrase
 * @returns The private key as a hex string
 */
export const derivePrimaryPrivateKey = async (seedPhrase: string): Promise<string> => {
  // Convert mnemonic to seed (512 bits)
  const seed = await bip39.mnemonicToSeed(seedPhrase);
  
  // Use the first 32 bytes of the seed as our private key
  const privateKey = seed.slice(0, 32);
  
  return bytesToHex(privateKey);
};

/**
 * Creates a key pair from a private key
 * @param privateKeyHex The private key as a hex string
 * @returns An object containing the private and public keys
 */
export const createKeyPairFromPrivateKey = async (privateKeyHex: string) => {
  const privateKey = hexToBytes(privateKeyHex);
  
  // Derive the public key from the private key
  const publicKey = await ed.getPublicKey(privateKey);
  
  return {
    privateKey: privateKeyHex,
    publicKey: bytesToHex(publicKey)
  };
};

/**
 * Creates a new key pair from a seed phrase
 * @param seedPhrase The BIP39 mnemonic seed phrase
 * @returns An object containing the private and public keys
 */
export const createKeyPairFromSeedPhrase = async (seedPhrase: string) => {
  const privateKeyHex = await derivePrimaryPrivateKey(seedPhrase);
  return createKeyPairFromPrivateKey(privateKeyHex);
};

/**
 * Signs a message using a private key
 * @param message The message to sign
 * @param privateKeyHex The private key as a hex string
 * @returns The signature as a hex string
 */
export const signMessageWithPrivateKey = async (message: string, privateKeyHex: string): Promise<string> => {
  const privateKey = hexToBytes(privateKeyHex);
  const messageBytes = new TextEncoder().encode(message);
  
  const signature = await ed.sign(messageBytes, privateKey);
  
  return bytesToHex(signature);
};

/**
 * Verifies a signature using a public key
 * @param message The original message
 * @param signatureHex The signature as a hex string
 * @param publicKeyHex The public key as a hex string
 * @returns True if the signature is valid, false otherwise
 */
export const verifySignature = async (
  message: string, 
  signatureHex: string, 
  publicKeyHex: string
): Promise<boolean> => {
  const publicKey = hexToBytes(publicKeyHex);
  const signature = hexToBytes(signatureHex);
  const messageBytes = new TextEncoder().encode(message);
  
  return await ed.verify(signature, messageBytes, publicKey);
};
