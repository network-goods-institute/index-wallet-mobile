import React, { useState } from 'react';
import { StyleSheet, View, Text, Switch, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import SeedPhraseWarningModal from '@/components/SeedPhraseWarningModal';

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
  
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? You will need your seed phrase to log back in.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/welcome');
          },
        },
      ]
    );
  };
  
  const handleViewSeedPhrase = () => {
    setShowSeedPhraseModal(true);
  };
  
  // Setting sections
  const sections: SettingsSection[] = [
    {
      title: 'Wallet',
      items: [
        {
          title: 'View Seed Phrase',
          description: 'View your wallet recovery phrase',
          type: 'link',
          onPress: handleViewSeedPhrase,
          icon: 'key.fill',
        },
        {
          title: 'Logout',
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
          onPress: () => console.log('Terms of Service pressed'),
          icon: 'doc.text.fill',
        },
        {
          title: 'Privacy Policy',
          type: 'link',
          onPress: () => console.log('Privacy Policy pressed'),
          icon: 'shield.fill',
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
                      <IconSymbol 
                        name={item.type === 'toggle' && (item as ToggleSettingItem).value && (item as ToggleSettingItem).iconDark 
                          ? (item as ToggleSettingItem).iconDark! 
                          : item.icon} 
                        size={24} 
                        color={isDarkMode ? '#60A5FA' : '#2563EB'} 
                      />
                      <View className="ml-4 flex-1">
                        <Text className="text-base font-medium text-black dark:text-white">
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
                        color={isDarkMode ? '#9CA3AF' : '#6B7280'} 
                      />
                    )}
                  </>
                );

                if (item.type === 'link') {
                  return (
                    <TouchableOpacity
                      key={`item-${sectionIndex}-${itemIndex}`}
                      onPress={(item as LinkSettingItem).onPress}
                      className={`flex-row items-center justify-between py-4 px-4 ${itemIndex < section.items.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}
                      activeOpacity={0.7}
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
    </ThemedView>
  );
}

// Styles removed in favor of Tailwind classes
