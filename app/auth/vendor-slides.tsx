import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, Dimensions, SafeAreaView } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, ArrowRight, Store, CreditCard, ShieldCheck } from 'lucide-react-native';
import EducationalSlide from '@/components/EducationalSlide';

const { width } = Dimensions.get('window');

const slides = [
  {
    key: '1',
    title: 'Accept Payments Anywhere',
    description: 'With Index Wallet, you can accept crypto payments from customers in-store or online with just a few taps.',
    image: <Store size={120} color="#2196F3" />,
    textColor: '#2196F3'
  },
  {
    key: '2',
    title: 'Instant Settlement',
    description: 'Receive funds instantly in your wallet without waiting for traditional payment processing times.',
    image: <CreditCard size={120} color="#2196F3" />,
    textColor: '#2196F3'
  },
  {
    key: '3',
    title: 'Secure Your Business',
    description: 'Your wallet is protected by advanced cryptography and your private keys never leave your device.',
    image: <ShieldCheck size={120} color="#2196F3" />,
    textColor: '#2196F3'
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
      setOnboardingStep('user-name');
    }
  };

  const handleBack = () => {
    setOnboardingStep('user-type');
  };

  const handleSkip = () => {
    setOnboardingStep('user-name');
  };

  const renderItem = ({ item }: { item: typeof slides[0] }) => (
    <View className="w-screen flex-1 justify-center items-center">
      <EducationalSlide
        title={item.title}
        description={item.description}
        image={item.image}
        textColor={item.textColor}
      />
    </View>
  );

  const renderDotIndicator = () => {
    return (
      <View className="flex-row justify-center items-center mb-5">
        {slides.map((_, index) => (
          <View
            key={index}
            className={`w-2.5 h-2.5 rounded-full mx-1 ${
              index === currentIndex ? 'bg-blue-500 dark:bg-blue-400' : 'bg-blue-200 dark:bg-blue-800'
            }`}
          />
        ))}
      </View>
    );
  };

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-4 py-4">
          <TouchableOpacity onPress={handleBack} className="flex-row items-center">
            <ArrowLeft size={32} color="#6E6E6E" style={{ opacity: 1 }} />
            <Text className="text-blue-500 dark:text-blue-400 font-semibold text-base ml-2">
              Back
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSkip} className="flex-row items-center">
            <Text className="text-blue-500 dark:text-blue-400 font-semibold text-base">
              Skip
            </Text>
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

        <View className="px-5 pb-5">
          <TouchableOpacity
            className="w-full bg-blue-500 dark:bg-blue-400 py-3 px-6 rounded-full flex-row justify-center items-center"
            onPress={handleNext}
          >
            <Text className="text-white font-bold text-base mr-2">
              {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <ArrowRight size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}
