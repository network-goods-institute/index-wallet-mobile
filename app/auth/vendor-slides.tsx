import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Dimensions, SafeAreaView } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, ArrowRight, Store, CreditCard, ShieldCheck } from 'lucide-react-native';
import EducationalSlide from '@/components/EducationalSlide';

const { width } = Dimensions.get('window');

// Mock images - in a real app, you would import actual images
const mockImages = {
  slide1: { uri: 'https://via.placeholder.com/300' },
  slide2: { uri: 'https://via.placeholder.com/300' },
  slide3: { uri: 'https://via.placeholder.com/300' },
};

const slides = [
  {
    key: '1',
    title: 'Accept Payments Anywhere',
    description: 'With Index Wallet, you can accept crypto payments from customers in-store or online with just a few taps.',
    image: mockImages.slide1,
    backgroundColor: '#E3F2FD',
    textColor: '#0D47A1',
    icon: <Store size={40} color="#0D47A1" />
  },
  {
    key: '2',
    title: 'Instant Settlement',
    description: 'Receive funds instantly in your wallet without waiting for traditional payment processing times.',
    image: mockImages.slide2,
    backgroundColor: '#E8F5E9',
    textColor: '#1B5E20',
    icon: <CreditCard size={40} color="#1B5E20" />
  },
  {
    key: '3',
    title: 'Secure Your Business',
    description: 'Your wallet is protected by advanced cryptography and your private keys never leave your device.',
    image: mockImages.slide3,
    backgroundColor: '#FFF3E0',
    textColor: '#E65100',
    icon: <ShieldCheck size={40} color="#E65100" />
  },
];

export default function VendorSlidesScreen() {
  const { setOnboardingStep } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
      setCurrentIndex(currentIndex + 1);
    } else {
      // Move to name input
      setOnboardingStep('user-name');
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex - 1,
        animated: true,
      });
      setCurrentIndex(currentIndex - 1);
    } else {
      // Go back to user name input
      setOnboardingStep('user-name');
    }
  };

  const handleSkip = () => {
    // Skip directly to name input
    setOnboardingStep('user-name');
  };

  const renderItem = ({ item }: { item: typeof slides[0] }) => (
    <View style={styles.slideContainer}>
      <View style={[styles.iconContainer, { backgroundColor: item.backgroundColor }]}>
        {item.icon}
      </View>
      <EducationalSlide
        title={item.title}
        description={item.description}
        image={item.image}
        backgroundColor={item.backgroundColor}
        textColor={item.textColor}
      />
    </View>
  );

  const renderDotIndicator = () => {
    return (
      <View style={styles.paginationContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              { backgroundColor: index === currentIndex ? '#2196F3' : '#BBDEFB' }
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <ThemedView className="flex-1">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(
              event.nativeEvent.contentOffset.x / width
            );
            setCurrentIndex(index);
          }}
        />

        {renderDotIndicator()}

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.nextButton]}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <ArrowRight size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  skipText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
  slideContainer: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButton: {
    backgroundColor: '#2196F3',
    width: '100%',
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});
