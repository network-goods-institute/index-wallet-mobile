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

// Test private key for development - this would be replaced with a real key in production
// This is the same test key used in mockTransactionService.ts
const TEST_PRIVATE_KEY = '5JeqVC5myFajNwvqba1QNZLdWMNTnMkz5oSN5W1yJWhUr1TDQoP';

/**
 * Retrieves the private key from secure storage
 * Falls back to AsyncStorage if SecureStore is not available
 * @param providedPrivateKey Optional private key that can be passed directly
 */
export const getPrivateKey = async (providedPrivateKey?: string): Promise<string | null> => {
  // If a private key is provided directly, use it
  if (providedPrivateKey) {
    // console.log('Using provided private key');
    return providedPrivateKey;
  }
  
  try {
    // Try to get the key from SecureStore first
    let encryptedKey = await SecureStore.getItemAsync(PRIVATE_KEY_KEY);
    
    // If not found in SecureStore, try AsyncStorage as fallback
    if (!encryptedKey) {
      // console.log('Key not found in SecureStore, trying AsyncStorage');
      encryptedKey = await AsyncStorage.getItem(PRIVATE_KEY_KEY);
    }
    
    if (!encryptedKey) {
      // console.log('No private key found in storage, using test key for development');
      return TEST_PRIVATE_KEY;
    }
    
    return await decryptPrivateKey(encryptedKey);
  } catch (error) {
    console.error('Error retrieving encrypted private key:', error);
    // console.log('Falling back to test private key for development');
    return TEST_PRIVATE_KEY;
  }
};

/**
 * Decrypts the encrypted private key
 * Matches the AuthContext's decryptData implementation
 */
export const decryptPrivateKey = async (encryptedKey: string): Promise<string> => {
  // console.log('Decrypting key:', encryptedKey.substring(0, 20) + '...');
  
  // Match the AuthContext's decryption implementation exactly
  if (encryptedKey.startsWith('encrypted:')) {
    // console.log('Found encrypted: prefix, extracting data');
    return encryptedKey.substring(10);
  }
  
  // Try other possible formats
  if (encryptedKey.includes(':')) {
    // console.log('Found other prefix format, extracting after colon');
    return encryptedKey.substring(encryptedKey.indexOf(':') + 1);
  }
  
  // console.log('No encryption prefix found, returning as is');
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
    const privateKeyBytes = bs58.decode(privateKey);
    // console.log('Private key bytes length:', privateKeyBytes.length);
    
    try {
      // Sign the transaction using the all-in-one approach
      // console.log('Using sign.signedDebitAllowance...');
      const signedMessage = sign.signedDebitAllowance(transactionData, privateKeyBytes);
      // console.log('Successfully signed transaction');
      
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
      console.error('Error with signedDebitAllowance:', signError);
      
      // Fall back to manual signing approach
      // console.log('Falling back to manual signing approach...');
      
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
    console.error('Error signing transaction:', error);
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
    // console.log('Sending signed transaction to backend...');
    // console.log('Payment ID:', paymentId);
    // console.log('Signed transaction:', JSON.stringify(signedTransaction, null, 2));
    // console.log('Transaction details:', JSON.stringify(transactionDetails, null, 2));
    // console.log('Payer address:', payerAddress);
    
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
    
    // console.log('Final request body:', JSON.stringify(requestBody, null, 2));
    
    // Send to the correct backend endpoint: /payments/{payment_id}/sign
    const apiUrl = `${API_BASE_URL}/api/payments/${paymentId}/sign`;
    // console.log('Posting to API URL:', apiUrl);
    
    const response = await axios.post(apiUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    // console.log('Success with /payments/{payment_id}/sign endpoint:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending signed transaction:', error);
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', error.response.data);
    }
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
    // console.log('=== Starting signAndSendTransaction ===');
    // console.log('Payment ID:', paymentId);
    // console.log('Transaction data:', JSON.stringify(transactionData, null, 2));
    // console.log('Payer address:', payerAddress);
    // console.log('Private key override provided:', !!privateKeyOverride);
    
    // 1. Get the private key (either from override or storage)
    let privateKey = privateKeyOverride;
    
    if (!privateKey) {
      // console.log('No private key override, retrieving from storage...');
      privateKey = await getPrivateKey();
    }
    
    if (!privateKey) {
      throw new Error('No private key available for signing');
    }
    
    // console.log('Private key available for signing');
    // console.log('Private key type:', typeof privateKey);
    // console.log('Private key length:', privateKey.length);
    // console.log('Private key preview:', privateKey.substring(0, 10) + '...');
    
    // 2. Validate transaction data
    if (!transactionData) {
      throw new Error('No transaction data provided for signing');
    }
    
    if (typeof transactionData === 'string') {
      // console.log('Transaction data is string, parsing...');
      transactionData = JSON.parse(transactionData);
    }
    
    // Handle case where transaction data comes as an array (extract first element)
    if (Array.isArray(transactionData)) {
      // console.log('Transaction data is an array, extracting first element...');
      transactionData = transactionData[0];
    }
    
    // console.log('Parsed transaction data:', JSON.stringify(transactionData, null, 2));
    
    // 3. Sign the transaction
    // console.log('Signing transaction...');
    const signedTransaction = await signTransaction(transactionData, privateKey);
    // console.log('Transaction signed successfully');
    // console.log('Signed transaction:', JSON.stringify(signedTransaction, null, 2));
    
    // 4. Send the signed transaction to the backend
    // console.log('Sending signed transaction to backend...');
    const response = await sendSignedTransaction(
      paymentId, 
      signedTransaction, 
      completeTransactionDetails, 
      payerAddress
    );
    // console.log('Transaction sent successfully');
    // console.log('Backend response:', JSON.stringify(response, null, 2));
    
    return response;
  } catch (error) {
    // console.error('=== Error in signAndSendTransaction ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
};
