import React from 'react';
import { StyleSheet, View, FlatList, Image, TouchableOpacity, ScrollView, SafeAreaView, Text } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/contexts/ThemeContext';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';

// Define vendor interface
interface Vendor {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  category: string;
}

// Mock data for partnered vendors
const mockVendors: Vendor[] = [
  {
    id: '1',
    name: 'Green Earth Cafe',
    description: 'Sustainable coffee shop with plant-based options',
    logoUrl: 'https://placehold.co/200x200/orange/white?text=GE',
    category: 'Food & Beverage',
  },
  {
    id: '2',
    name: 'EcoMarket',
    description: 'Zero-waste grocery store with local products',
    logoUrl: 'https://placehold.co/200x200/green/white?text=EM',
    category: 'Retail',
  },
  {
    id: '3',
    name: 'Renewable Energy Co-op',
    description: 'Community-owned renewable energy provider',
    logoUrl: 'https://placehold.co/200x200/blue/white?text=REC',
    category: 'Utilities',
  },
  {
    id: '4',
    name: 'Sustainable Transport',
    description: 'Electric bike and scooter rentals',
    logoUrl: 'https://placehold.co/200x200/purple/white?text=ST',
    category: 'Transportation',
  },
  {
    id: '5',
    name: 'Community Garden',
    description: 'Local urban farming initiative',
    logoUrl: 'https://placehold.co/200x200/darkgreen/white?text=CG',
    category: 'Agriculture',
  },
];

export default function VendorsScreen() {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  
  return (
    <ThemedView className="flex-1">
      <View className="pt-16 pb-5 px-5">
        <Text className="text-3xl font-bold text-black dark:text-white">Partnered Vendors</Text>
      </View>
      
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 80 }}>
        <View className="mb-6">
          <Text className="text-lg font-semibold mb-2 px-5 text-blue-600 dark:text-blue-400">
            Accepted Stores
          </Text>
          
          <View className="mx-4 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
            {mockVendors.map((vendor, index) => (
              <TouchableOpacity
                key={vendor.id}
                onPress={() => console.log(`Selected vendor: ${vendor.name}`)}
                className={`flex-row items-center justify-between py-4 px-4 ${index < mockVendors.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}
              >
                <View className="flex-row items-center flex-1">
                  <Image 
                    source={{ uri: vendor.logoUrl }} 
                    className="w-10 h-10 rounded-full"
                    style={{ backgroundColor: isDark ? '#374151' : '#E5E7EB' }}
                  />
                  <View className="ml-4 flex-1">
                    <Text className="text-base font-medium text-black dark:text-white">
                      {vendor.name}
                    </Text>
                    <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {vendor.category}
                    </Text>
                  </View>
                </View>
                
                <View className="ml-2">
                  <Text className="text-sm text-gray-500 dark:text-gray-400">
                    ›
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({});
