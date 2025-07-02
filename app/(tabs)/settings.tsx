import React, { useState } from 'react';
import { StyleSheet, View, Text, Switch, TouchableOpacity, ScrollView, Platform, Alert, Modal, SafeAreaView, Linking } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import SeedPhraseWarningModal from '@/components/SeedPhraseWarningModal';
import { Wallet, Store, ArrowRight, X, AlertTriangle } from 'lucide-react-native';

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
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol, IconSymbolName } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';

export default function SettingsScreen() {
  const { colorScheme } = useTheme();
  const { status, logout, hasPasskey, seedPhrase } = useAuth();
  const router = useRouter();
  const isDarkMode = colorScheme === 'dark';
  
  // These would be connected to actual functionality in a real implementation
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(hasPasskey);
  const [autoLockEnabled, setAutoLockEnabled] = useState(true);
  const [showSeedPhraseModal, setShowSeedPhraseModal] = useState(false);
  const [showLoadWalletModal, setShowLoadWalletModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const handleLogout = () => {
    setShowLogoutModal(true);
  };
  
  const performLogout = async () => {
    try {
      await logout();
      router.replace('/auth/welcome');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };
  
  const handleViewSeedPhrase = () => {
    setShowSeedPhraseModal(true);
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
          icon: 'wallet.pass.fill',
          customIcon: <Wallet size={24} />,
        },
        {
          title: 'View Seed Phrase',
          description: 'View your wallet recovery phrase',
          type: 'link',
          onPress: handleViewSeedPhrase,
          icon: 'key.fill',
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
                          {React.cloneElement((item as LinkSettingItem).customIcon as React.ReactElement, {
                            color: (item as LinkSettingItem).disabled 
                              ? (isDarkMode ? '#4B5563' : '#9CA3AF')
                              : (isDarkMode ? '#60A5FA' : '#2563EB')
                          })}
                        </View>
                      ) : (
                        <IconSymbol 
                          name={item.type === 'toggle' && (item as ToggleSettingItem).value && (item as ToggleSettingItem).iconDark 
                            ? (item as ToggleSettingItem).iconDark! 
                            : item.icon} 
                          size={24} 
                          color={(item.type === 'link' && (item as LinkSettingItem).disabled) 
                            ? (isDarkMode ? '#4B5563' : '#9CA3AF')
                            : (isDarkMode ? '#60A5FA' : '#2563EB')
                          } 
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
                    
                    {item.type === 'toggle' && (
                      <Switch
                        value={(item as ToggleSettingItem).value}
                        onValueChange={(item as ToggleSettingItem).onValueChange}
                        trackColor={{ false: '#767577', true: isDarkMode ? '#60A5FA' : '#2563EB' }}
                        thumbColor={Platform.OS === 'ios' ? undefined : (item as ToggleSettingItem).value ? '#fff' : '#f4f3f4'}
                        ios_backgroundColor="#3e3e3e"
                      />
                    )}
                    
                    {item.type === 'link' && (
                      <IconSymbol 
                        name="chevron.right" 
                        size={20} 
                        color={(item as LinkSettingItem).disabled 
                          ? (isDarkMode ? '#374151' : '#D1D5DB')
                          : (isDarkMode ? '#9CA3AF' : '#6B7280')
                        } 
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
        onContinue={() => setShowSeedPhraseModal(false)}
        mode="reveal"
        seedPhrase={seedPhrase || ''}
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

// Load Wallet Modal Component
function LoadWalletModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colorScheme } = useTheme();
  const { walletAddress } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleAddUSD = async () => {
    try {
      setIsLoading(true);
      
      // Direct Stripe checkout link with client reference ID
      const stripeBaseUrl = process.env.EXPO_PUBLIC_STRIPE_USD_ID || 'https://buy.stripe.com/test_6oE6pt3uO3gH1tS5kk';
      const stripeUrl = `${stripeBaseUrl}?client_reference_id=${walletAddress}`;
      
      // Open the Stripe checkout page in browser
      await Linking.openURL(stripeUrl);
      
      // Close modal after opening the link
      onClose();
    } catch (error) {
      // console.error('Error opening Stripe payment link:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSupportCauses = async () => {
    // Open Index Wallets website in browser
    await Linking.openURL('https://app.indexwallets.org');
    onClose();
  };
  
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView className={`flex-1 ${colorScheme === 'dark' ? 'bg-black/50' : 'bg-black/30'}`}>
        <TouchableOpacity 
          className="flex-1 justify-center items-center px-6"
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity
            activeOpacity={1}
            className={`w-full max-w-sm p-8 rounded-3xl ${colorScheme === 'dark' ? 'bg-gray-800/95' : 'bg-white'}`}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.08,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            {/* Close button */}
            <TouchableOpacity 
              className="absolute top-4 right-4 p-2"
              onPress={onClose}
            >
              <X size={24} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
            
            <View className={`w-20 h-20 rounded-full items-center justify-center mx-auto mb-6 ${
              colorScheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <Text className="text-3xl">💵</Text>
            </View>
            
            <Text className={`text-center text-2xl font-bold mb-2 ${colorScheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Load Your Wallet
            </Text>
            <Text className={`text-center text-base mb-8 ${colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Choose how you'd like to add value to your wallet
            </Text>
            
            {/* Add with USD - Opens explainer */}
            <TouchableOpacity 
              className="py-4 px-5 rounded-2xl mb-4 flex-row items-center"
              style={{ 
                backgroundColor: colorScheme === 'dark' ? '#3B82F6' : '#3B82F6',
                shadowColor: '#3B82F6',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 5,
              }}
              onPress={handleAddUSD}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <View className="w-12 h-12 bg-white/20 rounded-xl justify-center items-center mr-3">
                <Wallet size={24} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold text-base">Add with USD</Text>
                <Text className="text-blue-100 text-sm opacity-90">Buy USD Index tokens</Text>
              </View>
              <ArrowRight size={20} color="#FFFFFF" />
            </TouchableOpacity>
            
            {/* Support Other Causes */}
            <TouchableOpacity 
              className="py-4 px-5 rounded-2xl mb-4 flex-row items-center"
              style={{ 
                backgroundColor: colorScheme === 'dark' ? '#F59E0B' : '#F59E0B',
                shadowColor: '#F59E0B',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 5,
              }}
              onPress={handleSupportCauses}
              activeOpacity={0.8}
            >
              <View className="w-12 h-12 bg-white/20 rounded-xl justify-center items-center mr-3">
                <Store size={24} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold text-base">Support Other Causes</Text>
                <Text className="text-amber-100 text-sm opacity-90">Browse partnered causes</Text>
              </View>
              <ArrowRight size={20} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={onClose} className="mt-2">
              <Text className={`text-center text-base ${colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Cancel
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}

// Logout Modal Component
function LogoutModal({ 
  visible, 
  onClose, 
  onConfirm, 
  colorScheme 
}: { 
  visible: boolean; 
  onClose: () => void; 
  onConfirm: () => void;
  colorScheme: 'light' | 'dark';
}) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleConfirm = async () => {
    setIsLoading(true);
    await onConfirm();
    setIsLoading(false);
    onClose();
  };
  
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView className={`flex-1 ${colorScheme === 'dark' ? 'bg-black/50' : 'bg-black/30'}`}>
        <TouchableOpacity 
          className="flex-1 justify-center items-center px-6"
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity
            activeOpacity={1}
            className={`w-full max-w-sm p-8 rounded-3xl ${colorScheme === 'dark' ? 'bg-gray-800/95' : 'bg-white'}`}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.08,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            {/* Close button */}
            <TouchableOpacity 
              className="absolute top-4 right-4 p-2"
              onPress={onClose}
            >
              <X size={24} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
            
            {/* Warning Icon */}
            <View className={`w-20 h-20 rounded-full items-center justify-center mx-auto mb-6 ${
              colorScheme === 'dark' ? 'bg-red-900/30' : 'bg-red-100'
            }`}>
              <AlertTriangle size={40} color={colorScheme === 'dark' ? '#EF4444' : '#DC2626'} />
            </View>
            
            <Text className={`text-center text-2xl font-bold mb-2 ${colorScheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Sign Out
            </Text>
            <Text className={`text-center text-base mb-8 ${colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Are you sure you want to sign out? You will need your seed phrase to log back in.
            </Text>
            
            {/* Action Button */}
            <TouchableOpacity 
              className={`py-4 px-8 rounded-2xl items-center ${isLoading ? 'opacity-50' : ''}`}
              style={{ 
                backgroundColor: colorScheme === 'dark' ? '#DC2626' : '#DC2626',
                shadowColor: '#DC2626',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 5,
              }}
              onPress={handleConfirm}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-base text-center">
                {isLoading ? 'Signing out...' : 'Sign Out'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={onClose} 
              className="py-4"
              disabled={isLoading}
            >
              <Text className={`text-center text-base ${colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Cancel
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}

// Styles removed in favor of Tailwind classes
