import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import bs58 from 'bs58';
import { serialize, parse, sign } from '@repyh-labs/delta-signing';

// Base URL for API requests - import from config for consistency
import { API_URL } from '../config';
const API_BASE_URL = API_URL;

// Storage keys - must match the ones in AuthContext
const PRIVATE_KEY_KEY = 'encrypted-private-key';

/**
 * Retrieves the private key from secure storage
 * Falls back to AsyncStorage if SecureStore is not available
 * @param providedPrivateKey Optional private key that can be passed directly
 */
export const getPrivateKey = async (providedPrivateKey?: string): Promise<string | null> => {
  // If a private key is provided directly, use it
  if (providedPrivateKey) {
    // Check if it needs decryption
    if (providedPrivateKey.startsWith('encrypted:')) {
      return await decryptPrivateKey(providedPrivateKey);
    }
    return providedPrivateKey;
  }
  
  try {
    // Try to get the key from SecureStore first
    let encryptedKey = await SecureStore.getItemAsync(PRIVATE_KEY_KEY);
    
    // If not found in SecureStore, try AsyncStorage as fallback
    if (!encryptedKey) {
      encryptedKey = await AsyncStorage.getItem(PRIVATE_KEY_KEY);
    }
    
    if (!encryptedKey) {
      return null;
    }
    
    return await decryptPrivateKey(encryptedKey);
  } catch (error) {
    return null;
  }
};

/**
 * Decrypts the encrypted private key
 * Matches the AuthContext's decryptData implementation
 */
export const decryptPrivateKey = async (encryptedKey: string): Promise<string> => {
  // Match the AuthContext's decryption implementation exactly
  // Mock encryption mechanism for MVP: 
  if (encryptedKey.startsWith('encrypted:')) {
    return encryptedKey.substring(10);
  }
  
  // Try other possible formats
  if (encryptedKey.includes(':')) {
    return encryptedKey.substring(encryptedKey.indexOf(':') + 1);
  }
  
  return encryptedKey;
};

/**
 * Signs a transaction using the private key
 * @param transactionData The unsigned transaction data
 * @param privateKey The private key in base58 format
 * @returns The signed transaction in the format expected by the backend
 */
export const signTransaction = async (transactionData: any, privateKey: string) => {
  try {
    // Decode the private key from base58
    let privateKeyBytes = bs58.decode(privateKey);
    
    // Check if we need to extract the actual private key from a larger format
    if (privateKeyBytes.length === 37) {
      // Common formats:
      // - WIF: 1 byte version + 32 bytes key + 4 bytes checksum = 37 bytes
      // - Some formats: 1 byte prefix + 32 bytes key + 4 bytes suffix = 37 bytes
      
      // Try extracting the 32-byte key (skip first byte, take next 32)
      privateKeyBytes = privateKeyBytes.slice(1, 33);
    } else if (privateKeyBytes.length === 64) {
      // Take first 32 bytes as private key
      privateKeyBytes = privateKeyBytes.slice(0, 32);
    } else if (privateKeyBytes.length !== 32) {
      throw new Error(`Invalid private key length: expected 32, got ${privateKeyBytes.length}`);
    }
    
    try {
      // Sign the transaction using the all-in-one approach
      const signedMessage = sign.signedDebitAllowance(transactionData, privateKeyBytes);
      
      // Format the signed transaction as expected by the API
      return {
        payload: signedMessage.payload,
        signature: {
          Ed25519: {
            pubkey: transactionData.debited.split(',')[0],
            signature: signedMessage.signature
          }
        }
      };
    } catch (signError) {
      // Fall back to manual signing approach
      
      // Parse the debit allowance
      const parsedDebitAllowance = parse.debitAllowance(transactionData);
      
      // Serialize the parsed debit allowance to bytes
      const serializedBytes = serialize(parsedDebitAllowance);
      
      // Sign the serialized bytes
      const signature = sign.signBytes(serializedBytes, privateKeyBytes);
      
      // Construct the signed message in the format expected by the backend
      return {
        payload: transactionData,
        signature: {
          Ed25519: {
            pubkey: transactionData.debited.split(',')[0],
            signature: bs58.encode(signature)
          }
        }
      };
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Sends a signed transaction to the backend
 * @param paymentId The ID of the payment
 * @param signedTransaction The signed transaction data
 * @param transactionDetails The complete transaction details from the API
 * @param payerAddress The address of the payer/customer
 * @returns The response from the backend
 */
export const sendSignedTransaction = async (
  paymentId: string, 
  signedTransaction: any, 
  transactionDetails: any,
  payerAddress: string
) => {
  try {
    // Format the request according to the backend's ProcessSignedTransactionRequest struct
    // The signed_transaction should be an array containing the signed transaction
    const requestBody = {
      payment_id: paymentId,
      signed_transaction: JSON.stringify([signedTransaction]), // Wrap in array
      vendor_address: transactionDetails.vendor_address,
      vendor_name: transactionDetails.vendor_name,
      price_usd: transactionDetails.price_usd,
      payment_bundle: transactionDetails.payment_bundle || [],
      payer_address: payerAddress
    };
    
    // Send to the correct backend endpoint: /payments/{payment_id}/sign
    const apiUrl = `${API_BASE_URL}/api/payments/${paymentId}/sign`;
    
    const response = await axios.post(apiUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Complete flow for signing and sending a transaction
 * @param paymentId The ID of the payment
 * @param transactionData The unsigned transaction data
 * @param completeTransactionDetails The complete transaction details from the API
 * @param payerAddress The address of the payer/customer
 * @param privateKeyOverride Optional private key to use instead of retrieving from storage
 * @returns The response from the backend
 */
export const signAndSendTransaction = async (
  paymentId: string, 
  transactionData: any, 
  completeTransactionDetails: any, 
  payerAddress: string,
  privateKeyOverride?: string
) => {
  try {
    
    // 1. Get the private key (either from override or storage)
    let privateKey = privateKeyOverride;
    
    if (!privateKey) {
      privateKey = await getPrivateKey();
    }
    
    if (!privateKey) {
      throw new Error('No private key available for signing');
    }
    
    
    
    // 2. Validate transaction data
    if (!transactionData) {
      throw new Error('No transaction data provided for signing');
    }
    
    if (typeof transactionData === 'string') {
      transactionData = JSON.parse(transactionData);
    }
    
    if (Array.isArray(transactionData)) {
      transactionData = transactionData[0];
    }
    
    // 3. Sign the transaction
    const signedTransaction = await signTransaction(transactionData, privateKey);
    
    // 4. Send the signed transaction to the backend
    const response = await sendSignedTransaction(
      paymentId, 
      signedTransaction, 
      completeTransactionDetails, 
      payerAddress
    );
    
    return response;
  } catch (error) {
    throw error;
  }
};
