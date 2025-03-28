import React, { useState } from 'react';
import { StyleSheet, View, Text, Switch, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

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
  const { colorScheme, toggleTheme, setTheme, theme } = useTheme();
  const { status, logout, hasPasskey, seedPhrase } = useAuth();
  const router = useRouter();
  const isDarkMode = colorScheme === 'dark';
  const isSystemTheme = theme === 'system';
  
  // These would be connected to actual functionality in a real implementation
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(hasPasskey);
  const [autoLockEnabled, setAutoLockEnabled] = useState(true);
  
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
    Alert.alert(
      'View Seed Phrase',
      'Your seed phrase is: \n\n' + seedPhrase + '\n\nKeep this safe and never share it with anyone.',
      [{ text: 'OK' }]
    );
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
      title: 'Appearance',
      items: [
        {
          title: 'Dark Mode',
          description: 'Switch between light and dark theme',
          type: 'toggle',
          value: isDarkMode,
          onValueChange: () => toggleTheme(),
          icon: 'sun.max.fill',
          iconDark: 'moon.fill',
        },
        {
          title: 'Use System Theme',
          description: 'Automatically match your device settings',
          type: 'toggle',
          value: isSystemTheme,
          onValueChange: (value: boolean) => setTheme(value ? 'system' : isDarkMode ? 'dark' : 'light'),
          icon: 'gearshape.fill',
        },
      ],
    },
    {
      title: 'Security',
      items: [
        {
          title: 'Biometric Authentication',
          description: 'Use Face ID or Touch ID to unlock the app',
          type: 'toggle',
          value: biometricsEnabled,
          onValueChange: (value: boolean) => {
            setBiometricsEnabled(value);
            // In a real implementation, we would update the auth context
            // and store the preference
            Alert.alert(
              'Biometric Authentication',
              value ? 'Biometric authentication enabled' : 'Biometric authentication disabled'
            );
          },
          icon: 'faceid',
        },
        {
          title: 'Auto-Lock',
          description: 'Automatically lock the app when inactive',
          type: 'toggle',
          value: autoLockEnabled,
          onValueChange: (value: boolean) => setAutoLockEnabled(value),
          icon: 'lock.fill',
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          title: 'Push Notifications',
          description: 'Receive alerts about important updates',
          type: 'toggle',
          value: notificationsEnabled,
          onValueChange: (value: boolean) => setNotificationsEnabled(value),
          icon: 'bell.fill',
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
      <View className="pt-16 pb-5 px-5">
        <Text className="text-3xl font-bold text-black dark:text-white">Settings</Text>
      </View>
      
      <ScrollView className="flex-1">
        {sections.map((section, sectionIndex) => (
          <View key={`section-${sectionIndex}`} className="mb-6">
            <Text className="text-lg font-semibold mb-2 px-5 text-blue-600 dark:text-blue-400">
              {section.title}
            </Text>
            
            <View className="mx-4 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
              {section.items.map((item, itemIndex) => (
                <View 
                  key={`item-${sectionIndex}-${itemIndex}`} 
                  className={`flex-row items-center justify-between py-4 px-4 ${itemIndex < section.items.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}
                >
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
                    <TouchableOpacity onPress={(item as LinkSettingItem).onPress}>
                      <IconSymbol 
                        name="chevron.right" 
                        size={20} 
                        color={isDarkMode ? '#9CA3AF' : '#6B7280'} 
                      />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

// Styles removed in favor of Tailwind classes
