import axios from 'axios';
import { API_BASE_URL } from '../constants/api';

export interface TokenValuation {
  token_name: string;
  token_symbol: string | null;
  current_valuation: number;
  has_set: boolean;
  token_image_url?: string;
}

export interface ValuationsResponse {
  valuations: TokenValuation[];
}

/**
 * Fetches token valuations for a specific wallet address
 * @param walletAddress The wallet address to fetch valuations for
 * @returns An array of token valuations
 */
export const fetchTokenValuations = async (walletAddress: string): Promise<TokenValuation[]> => {
  try {
    console.log(`Fetching valuations from: ${API_BASE_URL}/wallet/${walletAddress}/valuations`);
    const response = await axios.get(`${API_BASE_URL}/wallet/${walletAddress}/valuations`);
    
    // Check if response.data is an array directly
    if (Array.isArray(response.data)) {
      return response.data as TokenValuation[];
    }
    
    // Check if response.data has a valuations property
    if (response.data && response.data.valuations && Array.isArray(response.data.valuations)) {
      console.log('Response has valuations array with length:', response.data.valuations.length);
      return response.data.valuations;
    }
    
    // If we get here, the response format is unexpected
    console.error('Invalid response format. Expected valuations array or direct array.');
    console.error('Response structure:', Object.keys(response.data || {}));
    
    // Try to adapt to whatever format we received
    if (response.data && typeof response.data === 'object') {
      // Maybe it's an object with token valuations as properties
      const keys = Object.keys(response.data);
      if (keys.length > 0) {
        console.log('Attempting to convert object to array...');
        const adaptedData = keys.map(key => {
          const item = response.data[key];
          return {
            token_name: key,
            token_symbol: item.symbol || null,
            current_valuation: parseFloat(item.average_valuation || '0'),
            has_set: true,
            token_image_url: item.token_image_url
          };
        });
        console.log('Adapted data:', JSON.stringify(adaptedData, null, 2));
        return adaptedData;
      }
    }
    
    return [];
  } catch (error: any) {
    console.error('Error fetching token valuations:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error details:', error);
    }
    throw error;
  }
};

/**
 * Updates a token valuation for a specific wallet address
 * @param walletAddress The wallet address to update the valuation for
 * @param tokenSymbol The symbol of the token to update
 * @param valuation The new valuation value
 * @returns The updated token valuation
 */
export const updateTokenValuation = async (
  walletAddress: string,
  tokenSymbol: string,
  valuation: number
): Promise<any> => {
  try {
    console.log(`Updating valuation at: ${API_BASE_URL}/wallet/${walletAddress}/valuations`);
    console.log('Request payload:', { symbol: tokenSymbol, valuation });
    
    const response = await axios.post(`${API_BASE_URL}/wallet/${walletAddress}/valuations`, {
      symbol: tokenSymbol,
      valuation: valuation
    });
    
    console.log('Update response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('Error updating token valuation:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
};

/**
 * Fetches wallet balances for a specific wallet address
 * @param walletAddress The wallet address to fetch balances for
 * @returns The wallet balances
 */
export const fetchWalletBalances = async (walletAddress: string): Promise<any> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/wallet/${walletAddress}/balances`);
    return response.data;
  } catch (error) {
    console.error('Error fetching wallet balances:', error);
    throw error;
  }
};

/**
 * Fetches wallet details for a specific wallet address
 * @param walletAddress The wallet address to fetch details for
 * @returns The wallet details
 */
export const fetchWalletDetails = async (walletAddress: string): Promise<any> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/wallet/${walletAddress}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching wallet details:', error);
    throw error;
  }
};
