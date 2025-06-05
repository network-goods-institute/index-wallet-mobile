import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { createKeyPairFromSeedPhrase, signMessage } from '../utils/cryptoUtils';
import { signAndSendTransaction } from '../services/transactionSigningService';

export const WalletDebugger = () => {
  const { walletAddress, status, keyPair, seedPhrase, login } = useAuth();
  
  // Debug logging for seed phrase visibility
  useEffect(() => {
    console.log('=== DEBUG UI: Auth context values updated ===');
    console.log('DEBUG UI: status:', status);
    console.log('DEBUG UI: seedPhrase from context:', seedPhrase ? 'PRESENT' : 'NULL');
    console.log('DEBUG UI: keyPair from context:', keyPair ? 'PRESENT' : 'NULL');
    console.log('DEBUG UI: walletAddress from context:', walletAddress ? 'PRESENT' : 'NULL');
    if (seedPhrase) {
      console.log('DEBUG UI: seedPhrase value:', seedPhrase.substring(0, 20) + '...');
    }
    if (keyPair) {
      console.log('DEBUG UI: privateKey value:', keyPair.privateKey.substring(0, 20) + '...');
      console.log('DEBUG UI: publicKey value:', keyPair.publicKey.substring(0, 20) + '...');
    }
    console.log('=== End DEBUG UI update ===');
  }, [seedPhrase, keyPair, status, walletAddress]);
  const [storedAddress, setStoredAddress] = useState<string | null>(null);
  const [storedPrivateKey, setStoredPrivateKey] = useState<string | null>(null);
  const [storedSeedPhrase, setStoredSeedPhrase] = useState<string | null>(null);
  const [decryptedPrivateKey, setDecryptedPrivateKey] = useState<string | null>(null);
  const [decryptedSeedPhrase, setDecryptedSeedPhrase] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [asyncStorageKeys, setAsyncStorageKeys] = useState<string[]>([]);
  const [asyncStorageValues, setAsyncStorageValues] = useState<Record<string, string>>({});
  const [testSignature, setTestSignature] = useState<string | null>(null);

  // Decrypt function
  const decryptData = async (encryptedData: string): Promise<string> => {
    if (encryptedData.startsWith('encrypted:')) {
      return encryptedData.substring(10);
    }
    if (encryptedData.includes(':')) {
      return encryptedData.substring(encryptedData.indexOf(':') + 1);
    }
    return encryptedData;
  };

  // Function to manually load the private key from storage
  const loadPrivateKey = async () => {
    try {
      // Try to get from SecureStore first
      let privateKey = null;
      let seedPhrase = null;
      
      try {
        const encryptedPrivateKey = await SecureStore.getItemAsync('encrypted-private-key');
        const encryptedSeedPhrase = await SecureStore.getItemAsync('encrypted-seed-phrase');
        
        if (encryptedPrivateKey) {
          console.log('Found encrypted private key in SecureStore:', encryptedPrivateKey.substring(0, 10) + '...');
          privateKey = encryptedPrivateKey;
          const decrypted = await decryptData(encryptedPrivateKey);
          setDecryptedPrivateKey(decrypted);
        }
        
        if (encryptedSeedPhrase) {
          console.log('Found encrypted seed phrase in SecureStore');
          seedPhrase = encryptedSeedPhrase;
          const decrypted = await decryptData(encryptedSeedPhrase);
          setDecryptedSeedPhrase(decrypted);
        }
      } catch (e) {
        console.log('Error accessing SecureStore:', e);
      }
      
      // If not found in SecureStore, try AsyncStorage
      if (!privateKey) {
        try {
          const asyncStoragePrivateKey = await AsyncStorage.getItem('encrypted-private-key');
          const asyncStorageSeedPhrase = await AsyncStorage.getItem('encrypted-seed-phrase');
          
          if (asyncStoragePrivateKey) {
            console.log('Found encrypted private key in AsyncStorage:', asyncStoragePrivateKey.substring(0, 10) + '...');
            privateKey = asyncStoragePrivateKey;
            const decrypted = await decryptData(asyncStoragePrivateKey);
            setDecryptedPrivateKey(decrypted);
          }
          
          if (asyncStorageSeedPhrase) {
            console.log('Found encrypted seed phrase in AsyncStorage');
            seedPhrase = asyncStorageSeedPhrase;
            const decrypted = await decryptData(asyncStorageSeedPhrase);
            setDecryptedSeedPhrase(decrypted);
          }
        } catch (e) {
          console.log('Error accessing AsyncStorage:', e);
        }
      }
      
      setStoredPrivateKey(privateKey);
      setStoredSeedPhrase(seedPhrase);
      
      if (privateKey) {
        return privateKey;
      } else {
        console.log('No private key found in storage');
        return null;
      }
    } catch (error) {
      console.error('Error loading private key:', error);
      return null;
    }
  };

  // Test key derivation from current seed phrase
  const testKeyDerivation = async () => {
    try {
      if (!decryptedSeedPhrase && !seedPhrase) {
        alert('No seed phrase available for testing');
        return;
      }
      
      const testSeed = decryptedSeedPhrase || seedPhrase;
      console.log('Testing key derivation with seed phrase...');
      const derivedKeys = await createKeyPairFromSeedPhrase(testSeed);
      
      alert(`Key Derivation Test:
Private Key: ${derivedKeys.privateKey}
Public Key: ${derivedKeys.publicKey}
Context Match: ${derivedKeys.privateKey === keyPair?.privateKey}`);
    } catch (error) {
      console.error('Error testing key derivation:', error);
      alert('Error testing key derivation: ' + error.message);
    }
  };

  // Test message signing
  const testSigning = async () => {
    try {
      if (!keyPair?.privateKey) {
        alert('No private key available for signing');
        return;
      }
      
      const testMessage = 'Hello, this is a test message for signing!';
      console.log('Signing test message...');
      const signature = await signMessage(testMessage, keyPair.privateKey);
      setTestSignature(signature);
      
      alert(`Message Signing Test:
Message: ${testMessage}
Signature: ${signature.substring(0, 40)}...`);
    } catch (error) {
      console.error('Error testing signing:', error);
      alert('Error testing signing: ' + error.message);
    }
  };

  // Test login function with stored seed phrase
  const testLoginFunction = async () => {
    try {
      if (!decryptedSeedPhrase && !seedPhrase) {
        alert('No seed phrase available for testing login');
        return;
      }
      
      const testSeed = decryptedSeedPhrase || seedPhrase;
      console.log('Testing login function with current seed phrase...');
      const loginResult = await login(testSeed, false);
      
      alert(`Login Function Test:
Result: ${loginResult ? 'SUCCESS' : 'FAILED'}
This should re-derive and store private keys.`);
    } catch (error) {
      console.error('Error testing login function:', error);
      alert('Error testing login function: ' + error.message);
    }
  };

  // Test transaction signing with mock data
  const testTransactionSigning = async () => {
    try {
      if (!keyPair?.privateKey) {
        alert('No private key available for testing transaction signing');
        return;
      }
      
      // Mock transaction data (similar to what comes from supplement response)
      const mockTransactionData = {
        debited: "4wnjgqq2QEzQ9jrPbWrVbecLjwYodtivYotVoksciWSZ,1",
        credited: "xvrcY2Mq1pK8uix7N9B9gGrsEejkXQk8c3ugKMxJEsS,1",
        allowances: {
          "AQ6UQaWyq5ciZzes1rY17wwLjdQf2oSzqyJW7cj33dgd,1": 100
        },
        new_nonce: 1
      };
      
      const mockCompleteTransaction = {
        payment_id: 'test-payment-123',
        vendor_address: 'mock-vendor-address',
        vendor_name: 'Test Vendor',
        price_usd: 10.00,
        payment_bundle: []
      };
      
      console.log('Testing transaction signing with mock data...');
      const result = await signAndSendTransaction(
        'test-payment-123',
        mockTransactionData,
        mockCompleteTransaction,
        walletAddress || 'test-address',
        keyPair.privateKey
      );
      
      alert(`Transaction Signing Test:
Result: SUCCESS
Check console for details.`);
    } catch (error) {
      console.error('Error testing transaction signing:', error);
      alert('Error testing transaction signing: ' + error.message);
    }
  };

  // Load the wallet address and private key from storage
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const address = await AsyncStorage.getItem('wallet-address');
        setStoredAddress(address);
        
        // Load private key
        await loadPrivateKey();
        
        // Get all keys in AsyncStorage
        const keys = await AsyncStorage.getAllKeys();
        setAsyncStorageKeys([...keys]); // Convert readonly array to mutable array
        
        // Get values for selected keys
        const relevantKeys = keys.filter(key => 
          key.includes('wallet') || 
          key.includes('address') || 
          key.includes('auth') ||
          key.includes('user') ||
          key.includes('private') ||
          key.includes('key')
        );
        
        const values: Record<string, string> = {};
        for (const key of relevantKeys) {
          const value = await AsyncStorage.getItem(key);
          values[key] = value || 'null';
        }
        setAsyncStorageValues(values);
      } catch (error) {
        console.error('Error loading stored data:', error);
      }
    };
    
    loadStoredData();
  }, []);

  const clearAllStorage = async () => {
    try {
      await AsyncStorage.clear();
      alert('All AsyncStorage data cleared. Please restart the app.');
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
    }
  };

  if (!expanded) {
    return (
      <TouchableOpacity 
        style={styles.minimizedContainer} 
        onPress={() => setExpanded(true)}
      >
        <Text style={styles.debugText}>Debug</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.closeButton} 
        onPress={() => setExpanded(false)}
      >
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
      
      <Text style={styles.title}>Wallet Address Debug</Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Auth Status:</Text>
        <Text style={styles.value}>{status}</Text>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Context Wallet Address:</Text>
        <Text style={styles.value}>{walletAddress || 'null'}</Text>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.label}>AsyncStorage Wallet Address:</Text>
        <Text style={styles.value}>{storedAddress || 'null'}</Text>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Seed Phrase in Context:</Text>
        <Text style={styles.value}>{seedPhrase ? seedPhrase.split(' ').slice(0, 3).join(' ') + '...' : 'null'}</Text>
        <TouchableOpacity onPress={() => {
          console.log('MANUAL CHECK: seedPhrase from context:', seedPhrase);
          alert(seedPhrase || 'No seed phrase in context');
        }}>
          <Text style={styles.viewButton}>View Full</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Decrypted Seed Phrase:</Text>
        <Text style={styles.value}>{decryptedSeedPhrase ? decryptedSeedPhrase.split(' ').slice(0, 3).join(' ') + '...' : 'null'}</Text>
        <TouchableOpacity onPress={() => alert(decryptedSeedPhrase || 'No decrypted seed phrase')}>
          <Text style={styles.viewButton}>View Full</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Private Key in Context:</Text>
        <Text style={styles.value}>{keyPair?.privateKey ? keyPair.privateKey.substring(0, 10) + '...' : 'null'}</Text>
        <TouchableOpacity onPress={() => alert(keyPair?.privateKey || 'No private key in context')}>
          <Text style={styles.viewButton}>View Full</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Public Key in Context:</Text>
        <Text style={styles.value}>{keyPair?.publicKey ? keyPair.publicKey.substring(0, 10) + '...' : 'null'}</Text>
        <TouchableOpacity onPress={() => alert(keyPair?.publicKey || 'No public key in context')}>
          <Text style={styles.viewButton}>View Full</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Decrypted Private Key:</Text>
        <Text style={styles.value}>{decryptedPrivateKey ? decryptedPrivateKey.substring(0, 10) + '...' : 'null'}</Text>
        <TouchableOpacity onPress={() => alert(decryptedPrivateKey || 'No decrypted private key')}>
          <Text style={styles.viewButton}>View Full</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Test Signature:</Text>
        <Text style={styles.value}>{testSignature ? testSignature.substring(0, 10) + '...' : 'none'}</Text>
        <TouchableOpacity onPress={() => alert(testSignature || 'No test signature available')}>
          <Text style={styles.viewButton}>View Full</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={loadPrivateKey}
        >
          <Text style={styles.refreshButtonText}>Refresh Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.testButton}
          onPress={testKeyDerivation}
        >
          <Text style={styles.testButtonText}>Test Derivation</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.signButton}
          onPress={testSigning}
        >
          <Text style={styles.signButtonText}>Test Signing</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.loginTestButton}
          onPress={testLoginFunction}
        >
          <Text style={styles.loginTestButtonText}>Test Login</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.testButton}
          onPress={async () => {
            // Store test private key in storage for testing
            const testKey = '5JeqVC5myFajNwvqba1QNZLdWMNTnMkz5oSN5W1yJWhUr1TDQoP';
            const encryptedKey = 'encrypted:' + testKey;
            try {
              await SecureStore.setItemAsync('encrypted-private-key', encryptedKey);
              alert('Test private key stored in SecureStore');
              await loadPrivateKey();
            } catch (e) {
              console.error('Failed to store in SecureStore:', e);
              try {
                await AsyncStorage.setItem('encrypted-private-key', encryptedKey);
                alert('Test private key stored in AsyncStorage');
                await loadPrivateKey();
              } catch (e2) {
                alert('Failed to store test key: ' + e2);
              }
            }
          }}
        >
          <Text style={styles.testButtonText}>Store Test Key</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.subtitle}>AsyncStorage Values:</Text>
      <ScrollView style={styles.scrollView}>
        {Object.entries(asyncStorageValues).map(([key, value]) => (
          <View key={key} style={styles.storageItem}>
            <Text style={styles.storageKey}>{key}:</Text>
            <Text style={styles.storageValue}>{value}</Text>
          </View>
        ))}
      </ScrollView>
      
      <TouchableOpacity 
        style={styles.clearButton} 
        onPress={clearAllStorage}
      >
        <Text style={styles.clearButtonText}>Clear All Storage</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  minimizedContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    zIndex: 1000,
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
    zIndex: 1000,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  infoContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  refreshButton: {
    backgroundColor: '#4a90e2',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  testButton: {
    backgroundColor: '#5cb85c',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  signButton: {
    backgroundColor: '#e67e22',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  signButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  loginTestButton: {
    backgroundColor: '#9b59b6',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  loginTestButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ccc',
    marginRight: 8,
  },
  value: {
    fontSize: 14,
    color: 'white',
    flex: 1,
  },
  viewButton: {
    fontSize: 12,
    color: '#4a90e2',
    fontWeight: 'bold',
    marginLeft: 8,
    padding: 4,
  },
  debugText: {
    color: 'white',
    fontWeight: 'bold',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  closeButtonText: {
    color: '#ccc',
    fontWeight: 'bold',
  },
  scrollView: {
    maxHeight: 200,
  },
  storageItem: {
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 4,
  },
  storageKey: {
    fontSize: 12,
    color: '#ccc',
    fontWeight: 'bold',
  },
  storageValue: {
    fontSize: 12,
    color: 'white',
  },
  clearButton: {
    backgroundColor: '#d9534f',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
