import { Alert } from 'react-native';
import axios from 'axios';
import bs58 from 'bs58';
import { serialize, parse, sign } from '@repyh-labs/delta-signing';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';

// API base URL - use centralized config
const API_BASE_URL = API_URL;

// Storage key for private key (must match the one in AuthContext)
const PRIVATE_KEY_KEY = 'encrypted-private-key';

// Test private key as fallback in case we can't get the real one
const TEST_PRIVATE_KEY = 'AmsNnymLVvHJKAWmC9RtKN8KizeXr1WGomLGjYvgvZAc';

// Helper function to decrypt data (similar to the one in AuthContext)
const decryptData = async (encryptedData: string): Promise<string> => {
  // In a real app, this would use a proper encryption key
  // For now, we're just returning the data as is since we need to match
  // whatever encryption method is used in AuthContext
  return encryptedData;
};

// Function to fetch a mock transaction from the backend
export const fetchMockTransaction = async () => {
  try {
    console.log('Fetching mock transaction from backend...');
    
    try {
      // Make sure we're using the correct endpoint as defined in the backend code
      console.log(`Calling endpoint: ${API_BASE_URL}/create-mock-transaction`);
      const response = await axios.get(`${API_BASE_URL}/create-mock-transaction`);
      
      // Log the response for debugging
      console.log('Backend response status:', response.status);
      console.log('Received mock transaction:', JSON.stringify(response.data, null, 2));
      
      if (!response.data) {
        throw new Error('Empty response from backend');
      }
      
      return response.data;
    } catch (fetchError: any) {
      // Log detailed error information
      console.warn('Could not fetch from backend:', fetchError.message);
      
      if (fetchError.response) {
        console.warn('Error response status:', fetchError.response.status);
        console.warn('Error response data:', JSON.stringify(fetchError.response.data, null, 2));
      }
      
      console.warn('Using hardcoded mock transaction as fallback');
      
      // Create a mock debit allowance transaction that matches the expected format
      // This should match the structure returned by the backend's create_mock_transaction function

      return {
        debited: "4wnjgqq2QEzQ9jrPbWrVbecLjwYodtivYotVoksciWSZ,1",
        credited: "xvrcY2Mq1pK8uix7N9B9gGrsEejkXQk8c3ugKMxJEsS,1",
        allowances: {
          "AQ6UQaWyq5ciZzes1rY17wwLjdQf2oSzqyJW7cj33dgd,1": 100
        },
        new_nonce: 1
      };
    }
  } catch (error) {
    console.error('Error fetching mock transaction:', error);
    throw error;
  }
};



// Function to sign a transaction with the private key from AuthContext
export const signTransaction = async (transactionData: any, privateKeyBase58: string) => {
  try {
    console.log('Signing transaction data:', JSON.stringify(transactionData, null, 2));
    
    // 1. Decode the private key from base58
    const privateKeyBytes = bs58.decode(privateKeyBase58);
    console.log('Private key bytes length:', privateKeyBytes.length);
    
    // Following the working example provided
    console.log('Using the all-in-one approach from the example...');
    
    // Use the all-in-one function to sign the debit allowance
    // This is equivalent to the signedTokenMint function in the example
    console.log('Using sign.signedDebitAllowance...');
    try {
      // Get the signed message from the library function
      const signedMessage = sign.signedDebitAllowance(transactionData, privateKeyBytes);
      console.log('Successfully signed debit allowance with signedDebitAllowance function');
      console.log('Raw signed message:', JSON.stringify(signedMessage, null, 2));
      
      // Based on the provided example, the backend is expecting a different format
      // It wants a payload and a signature with Ed25519 containing pubkey and signature
      const formattedMessage = {
        payload: signedMessage.payload,
        signature: {
          Ed25519: {
            pubkey: transactionData.debited.split(',')[0],
            signature: signedMessage.signature
          }
        }
      };
      
      console.log('Final formatted message:', JSON.stringify(formattedMessage, null, 2));
      return formattedMessage;
    } catch (signError) {
      console.error('Error with signedDebitAllowance:', signError);
      
      // If the all-in-one approach fails, try the step-by-step approach
      console.log('Falling back to manual signing approach...');
      
      // 1. Parse the debit allowance
      console.log('Parsing debit allowance...');
      const parsedDebitAllowance = parse.debitAllowance(transactionData);
      console.log('Successfully parsed debit allowance');
      
      // 2. Serialize the parsed debit allowance to bytes
      console.log('Serializing parsed debit allowance...');
      const serializedBytes = serialize(parsedDebitAllowance);
      console.log('Serialized DebitAllowance bytes length:', serializedBytes.length);
      
      // 3. Sign the serialized bytes
      console.log('Signing serialized bytes...');
      const signature = sign.signBytes(serializedBytes, privateKeyBytes);
      console.log('Signature length:', signature.length);
      
      // 4. Construct the signed message manually in the format expected by the backend
      // Based on the provided example, it should have payload and signature fields
      const manualSignedMessage = {
        payload: transactionData,
        signature: {
          Ed25519: {
            pubkey: transactionData.debited.split(',')[0],
            signature: bs58.encode(signature)
          }
        }
      };
      
      console.log('Created manual signed message:', JSON.stringify(manualSignedMessage, null, 2));
      return manualSignedMessage;
    }
  } catch (error) {
    console.error('Error signing transaction:', error);
    throw error;
  }
};



// Function to handle the mock transaction flow
export const sendMockTransaction = async (privateKey?: string) => {
  try {
    // 1. Fetch transaction data from backend
    const transactionData = await fetchMockTransaction();
    console.log('Transaction data:', transactionData);
    
    // 2. Sign the transaction
    // Use the provided private key or fall back to the test key
    const keyToUse = privateKey || TEST_PRIVATE_KEY;
    console.log('Using test private key for transaction signing');
    console.log('Private key type:', typeof keyToUse);
    console.log('Private key length:', keyToUse.length);
    
    // Decode the private key to make sure it's valid
    try {
      const decodedKey = bs58.decode(keyToUse);
      console.log('Successfully decoded private key, length in bytes:', decodedKey.length);
    } catch (decodeError) {
      console.error('Error decoding private key:', decodeError);
      throw new Error('Invalid private key format');
    }
    
    // 3. Sign the transaction
    const signedTransaction = await signTransaction(transactionData, keyToUse);
    
    // 4. Send the signed transaction back to the backend
    console.log('Sending signed transaction to backend:', signedTransaction);
    
    try {
      // Log the exact payload we're sending
      console.log('Sending payload to backend:', JSON.stringify(signedTransaction, null, 2));
      
      // Wrap the signed transaction in the signed_debit_allowance field for the backend
      const requestPayload = {
        signed_debit_allowance: signedTransaction
      };
      
      console.log('Final request payload:', JSON.stringify(requestPayload, null, 2));
      
      // Send the signed transaction to the /receive-signed endpoint
      const response = await axios.post(`${API_BASE_URL}/receive-signed`, requestPayload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Backend response:', response.data);
      
      // 5. Show a success alert
      Alert.alert(
        'Transaction Submitted', 
        'Successfully signed and submitted the transaction. Check console logs for details.'
      );
    } catch (submitError: any) {
      // Log detailed error information
      console.error('Error submitting signed transaction:', submitError);
      
      if (submitError.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', submitError.response.data);
        console.error('Error response status:', submitError.response.status);
        console.error('Error response headers:', submitError.response.headers);
        
        Alert.alert(
          'Submission Error', 
          `Server responded with error ${submitError.response.status}: ${JSON.stringify(submitError.response.data)}`
        );
      } else if (submitError.request) {
        // The request was made but no response was received
        console.error('No response received:', submitError.request);
        Alert.alert('Network Error', 'Request was sent but no response was received from the server.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up request:', submitError.message);
        Alert.alert('Request Error', `Error setting up request: ${submitError.message}`);
      }
    }
    
    return signedTransaction;
  } catch (error) {
    console.error('Error processing mock transaction:', error);
    Alert.alert('Failed', 'Could not process the transaction. Please try again.');
    throw error;
  }
};
