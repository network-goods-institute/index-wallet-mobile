import React, { useState } from 'react';
import { StyleSheet, View, Text, Switch, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useColorScheme } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  // These would be connected to actual functionality in a real implementation
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [autoLockEnabled, setAutoLockEnabled] = useState(true);
  
  // Setting sections
  const sections = [
    {
      title: 'Appearance',
      items: [
        {
          title: 'Dark Mode',
          description: 'Switch between light and dark theme',
          type: 'toggle',
          value: isDarkMode,
          // In a real app, this would be connected to a theme context
          onValueChange: () => {
            // This is a placeholder - actual implementation would use a theme context
            console.log('Theme toggle pressed');
          },
          icon: 'sun.max.fill',
          iconDark: 'moon.fill',
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
          onValueChange: (value: boolean) => setBiometricsEnabled(value),
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
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.headerText, { color: Colors[colorScheme ?? 'light'].text }]}>Settings</Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {sections.map((section, sectionIndex) => (
          <View key={`section-${sectionIndex}`} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].tint }]}>
              {section.title}
            </Text>
            
            <View style={[styles.sectionContent, { backgroundColor: colorScheme === 'dark' ? '#1E1E1E' : '#F5F5F5' }]}>
              {section.items.map((item, itemIndex) => (
                <View 
                  key={`item-${sectionIndex}-${itemIndex}`} 
                  style={[
                    styles.settingItem,
                    itemIndex < section.items.length - 1 && styles.settingItemBorder,
                    { borderBottomColor: colorScheme === 'dark' ? '#333' : '#E0E0E0' }
                  ]}
                >
                  <View style={styles.settingItemLeft}>
                    <IconSymbol 
                      name={item.type === 'toggle' && item.value && item.iconDark ? item.iconDark : item.icon} 
                      size={24} 
                      color={Colors[colorScheme ?? 'light'].tint} 
                    />
                    <View style={styles.settingItemTextContainer}>
                      <Text style={[styles.settingItemTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                        {item.title}
                      </Text>
                      {item.description && (
                        <Text style={[styles.settingItemDescription, { color: Colors[colorScheme ?? 'light'].icon }]}>
                          {item.description}
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  {item.type === 'toggle' && (
                    <Switch
                      value={item.value}
                      onValueChange={item.onValueChange}
                      trackColor={{ false: '#767577', true: Colors[colorScheme ?? 'light'].tint }}
                      thumbColor={Platform.OS === 'ios' ? undefined : item.value ? '#fff' : '#f4f3f4'}
                      ios_backgroundColor="#3e3e3e"
                    />
                  )}
                  
                  {item.type === 'link' && (
                    <TouchableOpacity onPress={item.onPress}>
                      <IconSymbol 
                        name="chevron.right" 
                        size={20} 
                        color={Colors[colorScheme ?? 'light'].icon} 
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerText: {
    fontSize: 34,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  sectionContent: {
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingItemTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingItemDescription: {
    fontSize: 14,
    marginTop: 4,
  },
});
