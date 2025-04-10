import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Dimensions, SafeAreaView } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, ArrowRight, Wallet, Zap, Lock } from 'lucide-react-native';
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
    title: 'Pay Anywhere, Anytime',
    description: 'With Index Wallet, you can make payments to any vendor quickly and securely using cryptocurrency.',
    image: mockImages.slide1,
    backgroundColor: '#E8EAF6',
    textColor: '#303F9F',
    icon: <Wallet size={40} color="#303F9F" />
  },
  {
    key: '2',
    title: 'Lightning Fast Transactions',
    description: 'Send payments in seconds without the delays of traditional banking systems.',
    image: mockImages.slide2,
    backgroundColor: '#F3E5F5',
    textColor: '#7B1FA2',
    icon: <Zap size={40} color="#7B1FA2" />
  },
  {
    key: '3',
    title: 'Your Money, Your Control',
    description: 'Take full control of your finances with a wallet that only you can access.',
    image: mockImages.slide3,
    backgroundColor: '#E0F7FA',
    textColor: '#006064',
    icon: <Lock size={40} color="#006064" />
  },
];

export default function CustomerSlidesScreen() {
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
              { backgroundColor: index === currentIndex ? '#7B1FA2' : '#E1BEE7' }
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
    color: '#7B1FA2',
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
    backgroundColor: '#7B1FA2',
    width: '100%',
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});
