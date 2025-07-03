import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedView } from '@/components/core/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import SeedPhraseWarningModal from '@/components/modals/SeedPhraseWarningModal';
import LoadWalletModal from '@/components/modals/LoadWalletModal';
import LogoutModal from '@/components/modals/LogoutModal';
import { Wallet } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IconSymbol, IconSymbolName } from '@/components/core/IconSymbol';

// Define types for settings items
type ToggleSettingItem = {
  title: string;
  description?: string;
  type: 'toggle';
  value: boolean;
  onValueChange: (value: boolean) => void;
  icon: IconSymbolName;
  iconDark?: IconSymbolName;
};

type LinkSettingItem = {
  title: string;
  description?: string;
  type: 'link';
  onPress: () => void;
  icon: IconSymbolName;
  customIcon?: React.ReactNode;
  disabled?: boolean;
};

type InfoSettingItem = {
  title: string;
  description?: string;
  type: 'info';
  icon: IconSymbolName;
};

type SettingItem = ToggleSettingItem | LinkSettingItem | InfoSettingItem;

type SettingsSection = {
  title: string;
  items: SettingItem[];
};

export default function SettingsScreen() {
  const { colorScheme } = useTheme();
  const { logout, seedPhrase } = useAuth();
  const isDarkMode = colorScheme === 'dark';
  
  // These would be connected to actual functionality in a real implementation
  const [showSeedPhraseModal, setShowSeedPhraseModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showLoadWalletModal, setShowLoadWalletModal] = useState(false);
  const [loadedSeedPhrase, setLoadedSeedPhrase] = useState<string | null>(null);
  const [isLoadingSeedPhrase, setIsLoadingSeedPhrase] = useState(false);
  
  const handleLogout = () => {
    setShowLogoutModal(true);
  };
  
  const performLogout = async () => {
    try {
      await logout();
      // Don't navigate - let the auth state change handle the routing
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };
  
  const handleViewSeedPhrase = async () => {
    console.log('handleViewSeedPhrase called, seedPhrase from context:', !!seedPhrase);
    
    // If we have the seed phrase from context, use it
    if (seedPhrase) {
      setShowSeedPhraseModal(true);
      return;
    }
    
    // Set loading state
    setIsLoadingSeedPhrase(true);
    
    // Otherwise, try to load it from storage (web fallback)
    console.log('Attempting to load seed phrase from storage...');
    try {
      // Try AsyncStorage directly (since SecureStore doesn't work on web)
      const encryptedSeed = await AsyncStorage.getItem('encrypted-seed-phrase');
      console.log('Encrypted seed from storage:', encryptedSeed ? 'Found' : 'Not found');
      
      if (encryptedSeed) {
        // Simple decryption - remove the "encrypted:" prefix
        let decrypted = encryptedSeed;
        if (encryptedSeed.startsWith('encrypted:')) {
          decrypted = encryptedSeed.substring(10);
        }
        
        console.log('Decrypted seed phrase words:', decrypted ? decrypted.split(' ').length : 0);
        
        if (decrypted && decrypted.split(' ').length >= 12) {
          setLoadedSeedPhrase(decrypted);
          setShowSeedPhraseModal(true);
          return;
        }
      }
      
      // Also try without encryption prefix (in case it's stored differently)
      const plainSeed = await AsyncStorage.getItem('seedPhrase');
      if (plainSeed) {
        console.log('Found plain seed phrase');
        setLoadedSeedPhrase(plainSeed);
        setShowSeedPhraseModal(true);
        return;
      }
    } catch (error) {
      console.error('Error loading seed phrase:', error);
    } finally {
      setIsLoadingSeedPhrase(false);
    }
    
    // If we still don't have it, show error
    Alert.alert(
      'Seed Phrase Not Available',
      'Your seed phrase could not be loaded. Please log out and log back in to view your seed phrase.',
      [{ text: 'OK' }]
    );
  };
  
  const handleLoadWallet = () => {
    setShowLoadWalletModal(true);
  };
  
  // Setting sections
  const sections: SettingsSection[] = [
    {
      title: 'Wallet',
      items: [
        {
          title: 'Load Wallet',
          description: 'Add funds to your wallet',
          type: 'link',
          onPress: handleLoadWallet,
          icon: 'house.fill',
          customIcon: <Wallet size={24} color="#2563EB" />,
        },
        {
          title: isLoadingSeedPhrase ? 'Loading...' : 'View Seed Phrase',
          description: 'View your wallet recovery phrase',
          type: 'link',
          onPress: handleViewSeedPhrase,
          icon: 'key.fill',
          disabled: isLoadingSeedPhrase,
        },
        {
          title: 'Sign Out',
          description: 'Sign out of your wallet',
          type: 'link',
          onPress: handleLogout,
          icon: 'arrow.right.square.fill',
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          title: 'Version',
          description: '1.0.0',
          type: 'info',
          icon: 'info.circle.fill',
        },
        {
          title: 'Terms of Service',
          type: 'link',
          onPress: () => {},
          icon: 'doc.text.fill',
          disabled: true,
        },
        {
          title: 'Privacy Policy',
          type: 'link',
          onPress: () => {},
          icon: 'shield.fill',
          disabled: true,
        },
      ],
    },
  ];

  return (
    <ThemedView className="flex-1">
      <View className="pt-20 pb-5 px-5">
        <Text className="text-3xl font-bold text-black dark:text-white">Settings</Text>
      </View>
      
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 80 }}>
        {sections.map((section, sectionIndex) => (
          <View key={`section-${sectionIndex}`} className="mb-6">
            <Text className="text-lg font-semibold mb-2 px-5 text-blue-600 dark:text-blue-400">
              {section.title}
            </Text>
            
            <View className="mx-4 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
              {section.items.map((item, itemIndex) => {
                const content = (
                  <>
                    <View className="flex-row items-center flex-1">
                      {(item.type === 'link' && (item as LinkSettingItem).customIcon) ? (
                        <View style={{ opacity: (item as LinkSettingItem).disabled ? 0.5 : 1 }}>
                          {item.customIcon}
                        </View>
                      ) : (
                        <IconSymbol 
                          name={item.icon} 
                          size={24} 
                          color={'#2563EB'}
                        />
                      )}
                      <View className="ml-4 flex-1">
                        <Text className={`text-base font-medium ${(item.type === 'link' && (item as LinkSettingItem).disabled) ? 'text-gray-500 dark:text-gray-600' : 'text-black dark:text-white'}`}>
                          {item.title}
                        </Text>
                        {item.description && (
                          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {item.description}
                          </Text>
                        )}
                      </View>
                    </View>
                    
                    {/* {item.type === 'toggle' && (
                      <Switch
                        value={(item as ToggleSettingItem).value}
                        onValueChange={(item as ToggleSettingItem).onValueChange}
                        trackColor={{ false: '#767577', true: isDarkMode ? '#60A5FA' : '#2563EB' }}
                        thumbColor={Platform.OS === 'ios' ? undefined : (item as ToggleSettingItem).value ? '#fff' : '#f4f3f4'}
                        ios_backgroundColor="#3e3e3e"
                      />
                    )} */}
                    
                    {item.type === 'link' && (
                      <IconSymbol 
                        name="chevron.right" 
                        size={20} 
                        color={isDarkMode ? '#9CA3AF' : '#6B7280'} 
                      />
                    )}
                  </>
                );

                if (item.type === 'link') {
                  const linkItem = item as LinkSettingItem;
                  return (
                    <TouchableOpacity
                      key={`item-${sectionIndex}-${itemIndex}`}
                      onPress={linkItem.disabled ? undefined : linkItem.onPress}
                      className={`flex-row items-center justify-between py-4 px-4 ${itemIndex < section.items.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''} ${linkItem.disabled ? 'opacity-50' : ''}`}
                      activeOpacity={linkItem.disabled ? 1 : 0.7}
                      disabled={linkItem.disabled}
                    >
                      {content}
                    </TouchableOpacity>
                  );
                }

                return (
                  <View 
                    key={`item-${sectionIndex}-${itemIndex}`} 
                    className={`flex-row items-center justify-between py-4 px-4 ${itemIndex < section.items.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}
                  >
                    {content}
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
      
      <SeedPhraseWarningModal
        visible={showSeedPhraseModal}
        onContinue={() => {
          setShowSeedPhraseModal(false);
          setLoadedSeedPhrase(null); // Clear loaded seed phrase
        }}
        mode="reveal"
        seedPhrase={seedPhrase || loadedSeedPhrase || ''}
      />
      
      <LoadWalletModal
        visible={showLoadWalletModal}
        onClose={() => setShowLoadWalletModal(false)}
      />
      
      <LogoutModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={performLogout}
        colorScheme={colorScheme}
      />
    </ThemedView>
  );
}
