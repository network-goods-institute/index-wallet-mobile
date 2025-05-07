import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { API_URL } from '../config';

// Create a dedicated Stripe API instance
const stripeApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client-Platform': Platform.OS,
    'X-Client-Version': Constants.expoConfig?.version || '1.0.0',
  },
  timeout: 10000,
});

// Types for Stripe payment
export interface StripePaymentLinkRequest {
  amount: number;           // Amount in USD cents (e.g., 1000 for $10.00)
  walletAddress: string;    // User's public wallet address
  name?: string;            // Optional user name
  email?: string;           // Optional user email
  description?: string;     // Optional payment description
  metadata?: Record<string, string>; // Any additional metadata
}

export interface StripePaymentLinkResponse {
  url: string;              // The payment link URL
  id: string;               // Stripe payment link ID
  expiresAt?: number;       // Optional expiration timestamp
  metadata?: Record<string, string>; // Any returned metadata
}

// Stripe API functions
export const StripeAPI = {
  /**
   * Generate a Stripe payment (donation) link
   * @param paymentData Payment link generation data
   * @returns Payment link URL and related information
   */
  createPaymentLink: async (paymentData: StripePaymentLinkRequest): Promise<StripePaymentLinkResponse> => {
    try {
      console.log('Creating Stripe payment link with data:', paymentData);
      
      // Ensure amount is provided and is a number
      if (!paymentData.amount || typeof paymentData.amount !== 'number' || paymentData.amount <= 0) {
        throw new Error('Valid amount is required for payment link');
      }
      
      // Ensure wallet address is provided
      if (!paymentData.walletAddress) {
        throw new Error('Wallet address is required for payment link');
      }
      
      // Create the payment link
      const response = await stripeApi.post('/api/stripe/payment-link', paymentData);
      console.log('Payment link created:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error creating Stripe payment link:', error);
      throw error;
    }
  },
  
  /**
   * Retrieve information about an existing payment link
   * @param linkId The Stripe payment link ID
   * @returns Payment link details
   */
  getPaymentLink: async (linkId: string): Promise<StripePaymentLinkResponse> => {
    try {
      const response = await stripeApi.get(`/api/stripe/payment-link/${linkId}`);
      return response.data;
    } catch (error) {
      console.error('Error retrieving payment link:', error);
      throw error;
    }
  },
  
  /**
   * Check the status of a payment
   * @param paymentId The Stripe payment ID
   * @returns Payment status information
   */
  checkPaymentStatus: async (paymentId: string) => {
    try {
      const response = await stripeApi.get(`/api/stripe/payment-status/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error('Error checking payment status:', error);
      throw error;
    }
  }
};

// Set auth token for authenticated requests if needed
export const setStripeAuthToken = (token: string | null) => {
  if (token) {
    stripeApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete stripeApi.defaults.headers.common['Authorization'];
  }
};

// Error handling interceptor
stripeApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle Stripe-specific error codes
    if (error.response) {
      const { status, data } = error.response;
      
      // Format error message based on Stripe error response structure
      const errorMessage = data?.error?.message || 
                          data?.message || 
                          'An error occurred with the payment service';
      
      console.error(`Stripe API Error (${status}):`, errorMessage);
      
      // You can handle specific error codes here
      if (status === 400) {
        // Bad request - invalid parameters
        console.error('Invalid payment parameters');
      } else if (status === 401) {
        // Unauthorized - API key issues
        console.error('API authentication error');
      } else if (status === 404) {
        // Not found
        console.error('Payment resource not found');
      }
    } else if (error.request) {
      console.error('No response received from Stripe API');
    } else {
      console.error('Error setting up Stripe request:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default StripeAPI;