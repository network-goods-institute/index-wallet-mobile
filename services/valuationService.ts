import axios from 'axios';
import { API_BASE_URL } from '../constants/api';

export interface TokenValuation {
  token_name: string;
  token_symbol: string | null;
  current_valuation: number;
  has_set: boolean;
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
    const response = await axios.get<ValuationsResponse>(`${API_BASE_URL}/wallet/${walletAddress}/valuations`);
    console.log('Raw API response:', JSON.stringify(response.data, null, 2));
    
    if (!response.data || !response.data.valuations) {
      console.error('Invalid response format. Expected valuations array.');
      return [];
    }
    
    return response.data.valuations;
  } catch (error: any) {
    console.error('Error fetching token valuations:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
};

/**
 * Updates a token valuation for a specific wallet address
 * @param walletAddress The wallet address to update the valuation for
 * @param tokenName The name of the token to update
 * @param valuation The new valuation value
 * @returns The updated token valuation
 */
export const updateTokenValuation = async (
  walletAddress: string,
  tokenName: string,
  valuation: number
): Promise<any> => {
  try {
    console.log(`Updating valuation at: ${API_BASE_URL}/wallet/${walletAddress}/valuations`);
    console.log('Request payload:', { token_name: tokenName, valuation });
    
    const response = await axios.post(`${API_BASE_URL}/wallet/${walletAddress}/valuations`, {
      token_name: tokenName,
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
