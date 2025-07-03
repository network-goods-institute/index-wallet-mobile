import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, MapPin, Globe, FileText } from 'lucide-react-native';

export default function VendorDetailsScreen() {
  const { setOnboardingStep, setVendorInfo } = useAuth();
  const [description, setDescription] = useState('');
  const [googleMapsLink, setGoogleMapsLink] = useState('');
  const [websiteLink, setWebsiteLink] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handleBack = () => {
    setOnboardingStep('user-name');
  };

  const validateURL = (url: string): boolean => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (googleMapsLink && !validateURL(googleMapsLink)) {
      newErrors.googleMaps = 'Please enter a valid URL';
    }
    if (websiteLink && !validateURL(websiteLink)) {
      newErrors.website = 'Please enter a valid URL';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validateForm()) return;
    
    // Save vendor information if provided
    const vendorData: Partial<{ description: string; googleMapsLink: string; websiteLink: string }> = {};
    
    if (description.trim()) {
      vendorData.description = description.trim();
    }
    if (googleMapsLink.trim()) {
      vendorData.googleMapsLink = googleMapsLink.trim();
    }
    if (websiteLink.trim()) {
      vendorData.websiteLink = websiteLink.trim();
    }
    
    // Update all vendor info at once
    if (Object.keys(vendorData).length > 0) {
      setVendorInfo(vendorData);
    }
    
    setOnboardingStep('create-seed');
  };

  const handleSkip = () => {
    setOnboardingStep('create-seed');
  };

  return (
    <ThemedView className="flex-1 bg-white">
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className="px-6 pt-4">
              <View className="flex-row justify-between items-center mb-8">
                <TouchableOpacity onPress={handleBack}>
                  <ArrowLeft size={32} color="#2196F3" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSkip}>
                  <Text className="text-blue-500 text-base font-semibold">Skip</Text>
                </TouchableOpacity>
              </View>

              <Text className="text-3xl font-bold text-gray-900 leading-tight mb-2">
                Tell customers about{'\n'}your business
              </Text>
              <Text className="text-gray-600 text-base">
                This helps customers find and trust you
              </Text>
            </View>

            {/* Content area */}
            <View className="px-6 mt-8">
              {/* Description Field */}
              <View className="mb-8">
                <View className="flex-row items-center mb-3">
                  <FileText size={20} color="#2196F3" />
                  <Text className="text-gray-900 font-semibold text-base ml-2">
                    Business Description
                  </Text>
                  <Text className="text-gray-500 text-sm ml-auto">Optional</Text>
                </View>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 text-base"
                  placeholder="Tell customers about your business"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  value={description}
                  onChangeText={setDescription}
                  maxLength={500}
                  style={Platform.OS === 'web' ? { outline: 'none' } : {}}
                />
                <Text className="text-gray-500 text-xs mt-2 text-right">
                  {description.length}/500
                </Text>
              </View>

              {/* Google Maps Link */}
              <View className="mb-8">
                <View className="flex-row items-center mb-3">
                  <MapPin size={20} color="#2196F3" />
                  <Text className="text-gray-900 font-semibold text-base ml-2">
                    Google Maps Link
                  </Text>
                  <Text className="text-gray-500 text-sm ml-auto">Optional</Text>
                </View>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 text-base"
                  placeholder="https://maps.google.com/..."
                  placeholderTextColor="#9CA3AF"
                  value={googleMapsLink}
                  onChangeText={(text) => {
                    setGoogleMapsLink(text);
                    if (errors.googleMaps) {
                      setErrors({...errors, googleMaps: ''});
                    }
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  style={Platform.OS === 'web' ? { outline: 'none' } : {}}
                />
                {errors.googleMaps && (
                  <Text className="text-red-500 text-sm mt-2">{errors.googleMaps}</Text>
                )}
              </View>

              {/* Website Link */}
              <View className="mb-8">
                <View className="flex-row items-center mb-3">
                  <Globe size={20} color="#2196F3" />
                  <Text className="text-gray-900 font-semibold text-base ml-2">
                    Website
                  </Text>
                  <Text className="text-gray-500 text-sm ml-auto">Optional</Text>
                </View>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 text-base"
                  placeholder="https://yourbusiness.com"
                  placeholderTextColor="#9CA3AF"
                  value={websiteLink}
                  onChangeText={(text) => {
                    setWebsiteLink(text);
                    if (errors.website) {
                      setErrors({...errors, website: ''});
                    }
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  style={Platform.OS === 'web' ? { outline: 'none' } : {}}
                />
                {errors.website && (
                  <Text className="text-red-500 text-sm mt-2">{errors.website}</Text>
                )}
              </View>
            </View>

            {/* Continue button */}
            <View className="px-6 pb-6 mt-4">
              <TouchableOpacity
                onPress={handleContinue}
                className="bg-blue-500 py-4 rounded-2xl shadow-sm"
              >
                <Text className="text-white font-bold text-center text-lg">Continue</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}