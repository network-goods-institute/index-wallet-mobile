import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';
import FloatingTabBar from '@/components/FloatingTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          elevation: 0,
          borderTopWidth: 0,
          backgroundColor: 'transparent',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="valuations"
        options={{
          title: 'Market',
        }}
      />
      <Tabs.Screen
        name="transact"
        options={{
          title: 'Pay',
        }}
      />
      <Tabs.Screen
        name="vendors"
        options={{
          title: 'Accepted Stores',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
    </Tabs>
  );
}
