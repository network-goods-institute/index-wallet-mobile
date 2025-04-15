import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, Dimensions, SafeAreaView } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, ArrowRight, Wallet, Zap, Lock } from 'lucide-react-native';
import EducationalSlide from '@/components/EducationalSlide';

const { width } = Dimensions.get('window');

const slides = [
  {
    key: '1',
    title: 'Pay Anywhere, Anytime',
    description: 'With Index Wallet, you can make payments to any vendor quickly and securely using cryptocurrency.',
    image: <Wallet size={120} color="#7B1FA2" />,
    textColor: '#7B1FA2'
  },
  {
    key: '2',
    title: 'Lightning Fast Transactions',
    description: 'Send payments in seconds without the delays of traditional banking systems.',
    image: <Zap size={120} color="#7B1FA2" />,
    textColor: '#7B1FA2'
  },
  {
    key: '3',
    title: 'Your Money, Your Control',
    description: 'Take full control of your finances with a wallet that only you can access.',
    image: <Lock size={120} color="#7B1FA2" />,
    textColor: '#7B1FA2'
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
              index === currentIndex ? 'bg-purple-700 dark:bg-purple-500' : 'bg-purple-200 dark:bg-purple-800'
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
            <ArrowLeft size={32} color="#7B1FA2" />
            <Text className="text-purple-700 dark:text-purple-500 font-semibold text-base ml-2">
              Back
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSkip} className="flex-row items-center">
            <Text className="text-purple-700 dark:text-purple-500 font-semibold text-base">
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
            className="w-full bg-purple-700 dark:bg-purple-500 py-3 px-6 rounded-full flex-row justify-center items-center"
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
