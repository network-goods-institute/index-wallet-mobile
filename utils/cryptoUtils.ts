import 'react-native-get-random-values'; // must come first
import * as bip39 from 'bip39';
import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';
import { concatBytes } from '@noble/hashes/utils';
import bs58 from 'bs58';

// ——— noble-ed25519 sha512 shim ———
if (!(ed as any).utils) (ed as any).utils = {};
if (!(ed as any).etc)   (ed as any).etc   = {};

(ed as any).utils.sha512Sync = (...msgs: Uint8Array[]) => sha512(concatBytes(...msgs));
(ed as any).etc.sha512Sync   = (msg: Uint8Array)    => sha512(msg);

// ——— Helpers to go back and forth ———
const toBase58 = (b: Uint8Array) => bs58.encode(b);
const fromBase58 = (s: string)   => bs58.decode(s);

// ——— Seed phrase ———
export const generateSeedPhrase = () => bip39.generateMnemonic(128);
export const validateSeedPhrase = (p: string) => bip39.validateMnemonic(p);

// ——— Key derivation & KeyPair factory ———
export type KeyPair = {
  privateKey: string;
  publicKey:  string;
};

export const createKeyPairFromSeedPhrase = async (
  seedPhrase: string
): Promise<KeyPair> => {
  const seed = await bip39.mnemonicToSeed(seedPhrase); // 64 bytes
  const priv = seed.slice(0, 32);                      // 32-byte private key
  const pub  = await ed.getPublicKey(priv);            // 32-byte public key

  return {
    privateKey: toBase58(priv),
    publicKey:  toBase58(pub),
  };
};

// ——— Sign & verify ———
/**
 * Sign arbitrary bytes with a Base58-encoded private key
 */
export const signBytes = async (
  data: Uint8Array,
  privateBase58: string
): Promise<string> => {
  const priv = fromBase58(privateBase58);
  const sig  = await ed.sign(data, priv);
  return toBase58(sig);
};

/**
 * Verify a Base58 signature against message bytes and Base58 public key
 */
export const verifyBytes = async (
  data: Uint8Array,
  signatureBase58: string,
  publicBase58: string
): Promise<boolean> => {
  const sig = fromBase58(signatureBase58);
  const pub = fromBase58(publicBase58);
  return ed.verify(sig, data, pub);
};

// ——— Convenience wrappers for strings ———
export const signMessage = async (
  message: string,
  privateBase58: string
): Promise<string> => {
  const data = new TextEncoder().encode(message);
  return signBytes(data, privateBase58);
};

export const verifyMessage = async (
  message: string,
  signatureBase58: string,
  publicBase58: string
): Promise<boolean> => {
  const data = new TextEncoder().encode(message);
  return verifyBytes(data, signatureBase58, publicBase58);
};
