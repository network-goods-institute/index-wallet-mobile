import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Fingerprint, Cloud, Shield } from 'lucide-react-native';

export default function SecuritySettingsScreen() {
  const { 
    setOnboardingStep, 
    completeOnboarding, 
    seedPhrase, 
    biometricsAvailable,
    enableiCloudBackup,
    backupToiCloud,
    platformOS,
    backupProvider
  } = useAuth();
  
  const [useBiometrics, setUseBiometrics] = useState<boolean>(biometricsAvailable);
  const [useICloudBackup, setUseICloudBackup] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [backupStatus, setBackupStatus] = useState<string>('');

  // Initialize default settings
  useEffect(() => {
    // Set biometrics to enabled by default if available
    setUseBiometrics(biometricsAvailable);
    // Set iCloud backup to enabled by default
    setUseICloudBackup(true);
    setBackupStatus('Backup will be enabled after setup');
  }, [biometricsAvailable]);

  const handleBiometricsToggle = (value: boolean) => {
    if (!biometricsAvailable && value) {
      Alert.alert(
        'Biometrics Not Available',
        'Your device does not support biometric authentication or it has not been set up.',
        [{ text: 'OK' }]
      );
      return;
    }
    setUseBiometrics(value);
  };

  const handleICloudBackupToggle = async (value: boolean) => {
    setUseICloudBackup(value);
    
    if (value) {
      setBackupStatus(`${backupProvider} backup will be enabled after setup`);
    } else {
      setBackupStatus('');
    }
  };

  const handleBack = () => {
    // Go back to the previous step
    const previousStep = seedPhrase ? 'create-seed' : 'import-seed';
    setOnboardingStep(previousStep);
  };

  const handleContinue = async () => {
    setIsLoading(true);
    
    try {
      if (!seedPhrase) {
        Alert.alert('Error', 'No seed phrase found. Please try again.');
        setIsLoading(false);
        return;
      }
      
      // Complete the onboarding process with the selected settings
      const success = await completeOnboarding(seedPhrase, useBiometrics);
      
      if (success) {
        // Set iCloud backup based on user selection
        // Note: iCloud backup is already enabled by default in completeOnboarding,
        // but we'll explicitly set it here based on the toggle to ensure consistency
        await enableiCloudBackup(useICloudBackup);
        
        // If iCloud backup is enabled, trigger an immediate backup
        if (useICloudBackup) {
          await backupToiCloud();
        }
      }
      
      // Navigation will be handled by the app layout based on auth status
    } catch (error) {
      console.error('Error completing setup:', error);
      Alert.alert('Error', 'Failed to complete setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1 p-6">
        <View className="flex-row items-center mb-8">
          <TouchableOpacity onPress={handleBack} className="mr-4">
            <ArrowLeft size={24} className="text-black dark:text-white" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-black dark:text-white">Security Settings</Text>
        </View>

        <View className="flex-1">
          <Text className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Enhance your wallet security with these additional features.
          </Text>

          {/* Biometric Authentication Option */}
          <View className="bg-gray-100 dark:bg-gray-800 rounded-xl p-5 mb-6">
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center">
                <Fingerprint size={24} className="text-blue-600 mr-3" />
                <Text className="text-lg font-semibold text-black dark:text-white">
                  Biometric Authentication
                </Text>
              </View>
              <Switch
                value={useBiometrics}
                onValueChange={handleBiometricsToggle}
                disabled={!biometricsAvailable}
              />
            </View>
            <Text className="text-gray-600 dark:text-gray-400">
              {biometricsAvailable 
                ? "Use your device's biometrics (fingerprint or face recognition) to quickly access your wallet."
                : "Biometric authentication is not available on this device."}
            </Text>
          </View>

          {/* Cloud Backup Option */}
          <View className="bg-gray-100 dark:bg-gray-800 rounded-xl p-5 mb-6">
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center">
                <Cloud size={24} className="text-blue-600 mr-3" />
                <Text className="text-lg font-semibold text-black dark:text-white">
                  {backupProvider} Backup
                </Text>
              </View>
              <Switch
                value={useICloudBackup}
                onValueChange={handleICloudBackupToggle}
              />
            </View>
            <Text className="text-gray-600 dark:text-gray-400">
              {platformOS === 'ios' 
                ? `Securely back up your encrypted wallet data to iCloud. This allows you to recover your wallet on other devices.`
                : platformOS === 'android' 
                ? `Securely back up your encrypted wallet data to Google Drive. This allows you to recover your wallet on other devices.`
                : `Securely back up your encrypted wallet data. This allows you to recover your wallet on other devices.`
              }
            </Text>
            {backupStatus ? (
              <Text className="text-blue-600 mt-2">{backupStatus}</Text>
            ) : null}
          </View>

          {/* Security Note */}
          <View className="bg-yellow-100 dark:bg-yellow-900 p-5 rounded-lg mb-8">
            <View className="flex-row items-center mb-2">
              <Shield size={20} className="text-yellow-800 dark:text-yellow-200 mr-2" />
              <Text className="text-yellow-800 dark:text-yellow-200 font-semibold">Security Note</Text>
            </View>
            <Text className="text-yellow-800 dark:text-yellow-200">
              These features enhance security but do not replace the need to securely store your recovery phrase.
              Always keep your recovery phrase in a safe place.
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          className={`py-4 rounded-xl items-center mb-6 ${isLoading ? 'bg-blue-400' : 'bg-blue-600'}`}
          onPress={handleContinue}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-lg">Continue</Text>
          )}
        </TouchableOpacity>
        
        {/* Platform info */}
        <View className="mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <Text className="text-xs text-center text-gray-500 dark:text-gray-400">
            Platform: {platformOS} | Backup Provider: {backupProvider}
          </Text>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}
