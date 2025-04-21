import React from 'react';
import { StyleSheet, View, FlatList, Image, TouchableOpacity } from 'react-native';
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
  
  const renderVendorItem = ({ item }: { item: Vendor }) => (
    <TouchableOpacity 
      style={[
        styles.vendorCard, 
        { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF' }
      ]}
      onPress={() => console.log(`Selected vendor: ${item.name}`)}
    >
      <Image source={{ uri: item.logoUrl }} style={styles.vendorLogo} />
      <View style={styles.vendorInfo}>
        <ThemedText className="text-lg font-bold">{item.name}</ThemedText>
        <ThemedText className="text-sm opacity-70">{item.category}</ThemedText>
        <ThemedText className="text-sm mt-1">{item.description}</ThemedText>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <ArrowLeft size={24} color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
      </TouchableOpacity>
      <View style={styles.headerTextContainer}>
        <ThemedText className="text-2xl font-bold">Partnered Vendors</ThemedText>
        <ThemedText className="text-sm opacity-70 mt-1">
          Support these businesses with your tokens
        </ThemedText>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={mockVendors}
        renderItem={renderVendorItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTextContainer: {
    marginLeft: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  vendorCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vendorLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  vendorInfo: {
    marginLeft: 16,
    flex: 1,
  },
});
