import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, ScrollView, Text, ActivityIndicator, Linking } from 'react-native';
import { ThemedView } from '@/components/core/ThemedView';
import { useTheme } from '@/contexts/ThemeContext';
import { ExternalLink, MapPin, Store } from 'lucide-react-native';
import { VendorAPI } from '@/services/api';

// Define vendor interface matching API response
interface PartneredVendor {
  _id: string;
  name: string;
  description: string;
  google_maps_link?: string;
  website_link?: string;
}


export default function VendorsScreen() {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const [vendors, setVendors] = useState<PartneredVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await VendorAPI.getPartneredVendors();
      setVendors(data);
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
      setError('Failed to load partnered vendors');
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
  };
  
  return (
    <ThemedView className="flex-1">
      <View className="pt-20 pb-5 px-5">
        <Text className="text-3xl font-bold text-black dark:text-white">Partnered Vendors</Text>
      </View>
      
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 80 }}>
        <View className="mb-6">
          <Text className="text-lg font-semibold mb-4 px-5 text-blue-600 dark:text-blue-400">
            Accepted Stores
          </Text>
          
          {loading ? (
            <View className="mx-4 p-8 rounded-xl bg-white dark:bg-gray-800" 
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.3 : 0.08,
                shadowRadius: 8,
                elevation: 4,
              }}>
              <View className="items-center">
                <ActivityIndicator size="large" color={isDark ? '#60A5FA' : '#3B82F6'} />
                <Text className="text-gray-500 dark:text-gray-400 mt-4 text-base">Loading vendors...</Text>
              </View>
            </View>
          ) : error && vendors.length === 0 ? (
            <View className="mx-4 p-8 rounded-xl bg-white dark:bg-gray-800"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.3 : 0.08,
                shadowRadius: 8,
                elevation: 4,
              }}>
              <View className="items-center">
                <View className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 items-center justify-center mb-4">
                  <Store size={32} color={isDark ? '#FCA5A5' : '#EF4444'} />
                </View>
                <Text className="text-gray-900 dark:text-gray-100 font-semibold text-lg mb-2">Unable to Load Vendors</Text>
                <Text className="text-gray-500 dark:text-gray-400 text-center mb-6">{error}</Text>
                <TouchableOpacity 
                  onPress={fetchVendors}
                  activeOpacity={0.7}
                  className="bg-blue-500 dark:bg-blue-600 px-6 py-3 rounded-xl"
                >
                  <Text className="text-white font-semibold">Try Again</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="mx-4">
              {vendors.map((vendor, index) => (
                <View
                  key={vendor._id}
                  className={`bg-white dark:bg-gray-800 rounded-xl overflow-hidden ${index < vendors.length - 1 ? 'mb-3' : ''}`}
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0.3 : 0.08,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <View className="p-4">
                    <View className="flex-1">
                        <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                          {vendor.name}
                        </Text>
                        <Text className="text-sm text-gray-600 dark:text-gray-300 mt-1 opacity-80" numberOfLines={2}>
                          {vendor.description}
                        </Text>
                        <View className="flex-row mt-3 gap-4">
                          {vendor.google_maps_link && (
                            <TouchableOpacity 
                              onPress={() => openLink(vendor.google_maps_link)}
                              activeOpacity={0.7}
                              className="flex-row items-center bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg"
                            >
                              <MapPin size={14} color={isDark ? '#60A5FA' : '#3B82F6'} />
                              <Text className="text-xs font-medium text-blue-600 dark:text-blue-400 ml-1.5">Directions</Text>
                            </TouchableOpacity>
                          )}
                          {vendor.website_link && (
                            <TouchableOpacity 
                              onPress={() => openLink(vendor.website_link)}
                              activeOpacity={0.7}
                              className="flex-row items-center bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg"
                            >
                              <ExternalLink size={14} color={isDark ? '#60A5FA' : '#3B82F6'} />
                              <Text className="text-xs font-medium text-blue-600 dark:text-blue-400 ml-1.5">Website</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}