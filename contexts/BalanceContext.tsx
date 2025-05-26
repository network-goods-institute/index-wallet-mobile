import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

// Define token balance type
export type TokenBalance = {
  tokenSymbol: string;
  tokenName: string;
  amount: number;
  valueUSD: number;
  logoUrl?: string;
  averageValuation?: string;
  totalAllocated?: number;
};

// Context interface
interface BalanceContextType {
  balances: TokenBalance[];
  totalValueUSD: number;
  isLoading: boolean;
  error: string | null;
  refreshBalances: () => Promise<void>;
  lastUpdated: Date | null;
}

// Create context with default values
const BalanceContext = createContext<BalanceContextType>({
  balances: [],
  totalValueUSD: 0,
  isLoading: false,
  error: null,
  refreshBalances: async () => {},
  lastUpdated: null,
});

// API base URL
const API_BASE_URL = 'http://localhost:8080';

export const BalanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [totalValueUSD, setTotalValueUSD] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const { status, walletAddress } = useAuth();
  
  // Function to fetch balances from API
  const fetchBalances = async (): Promise<void> => {
    console.log("FETCHING BALANCES");
    if (status !== 'authenticated' || !walletAddress) {
      setBalances([]);
      setTotalValueUSD(0);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/wallet/${walletAddress}/balances`);
      console.log("RESPONSE DATA: ", response.data);
      
      // Parse the response data and transform it into TokenBalance objects
      const tokenBalances: TokenBalance[] = [];
      let calculatedTotalValue = 0;
      
      // Process each token in the response
      for (const [tokenId, tokenData] of Object.entries(response.data)) {
        const [mintAddress, decimals] = tokenId.split(',');
        const data = tokenData as any;
        
        // Calculate token value based on balance and average valuation
        // Divide by 100 to adjust for two decimal places
        const balance = (data.balance || 0) / 100;
        const averageValuation = parseFloat(data.average_valuation || '0');
        const valueUSD = balance * averageValuation;
        
        // Add to total value
        calculatedTotalValue += valueUSD;
        
        // Create token balance object
        tokenBalances.push({
          tokenSymbol: data.symbol || 'Unknown',
          tokenName: data.name || 'Unknown Token',
          amount: balance,
          valueUSD: valueUSD,
          averageValuation: data.average_valuation,
          totalAllocated: data.total_allocated,
        });
      }
      
      // Sort tokens to ensure USD is always first if present
      const sortedTokenBalances = [...tokenBalances].sort((a, b) => {
        // If token is USD, it goes first
        if (a.tokenSymbol === 'USD') return -1;
        if (b.tokenSymbol === 'USD') return 1;
        return 0;
      });
      
      // Update state with the parsed data
      setBalances(sortedTokenBalances);
      setTotalValueUSD(calculatedTotalValue);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching balances:', err);
      setError('Failed to fetch wallet balances');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Refresh balances function that can be called from components
  const refreshBalances = async (): Promise<void> => {
    await fetchBalances();
  };
  
  // Fetch balances when auth status changes
  useEffect(() => {
    if (status === 'authenticated') {
      fetchBalances();
    }
  }, [status]);
  
  return (
    <BalanceContext.Provider 
      value={{ 
        balances, 
        totalValueUSD, 
        isLoading, 
        error, 
        refreshBalances,
        lastUpdated
      }}
    >
      {children}
    </BalanceContext.Provider>
  );
};

export const useBalance = (): BalanceContextType => {
  const context = useContext(BalanceContext);
  if (context === undefined) {
    throw new Error('useBalance must be used within a BalanceProvider');
  }
  return context;
};
