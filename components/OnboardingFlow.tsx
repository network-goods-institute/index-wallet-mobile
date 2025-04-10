import React from 'react';
import { OnboardingStep } from '@/contexts/AuthContext';

import WelcomeScreen from '../app/auth/welcome';
import CreateWalletScreen from '../app/auth/create-wallet';
import ImportWalletScreen from '../app/auth/import-wallet';
import SecuritySettingsScreen from '../app/auth/security-settings';
import VerifySeedScreen from '../app/auth/verify-seed';
import UserTypeScreen from '../app/auth/user-type';
import UserNameScreen from '../app/auth/user-name';
import VendorSlidesScreen from '../app/auth/vendor-slides';
import CustomerSlidesScreen from '../app/auth/customer-slides';

/**
 * Component that handles the different screens in the onboarding flow
 * based on the current onboarding step
 */
export default function OnboardingFlow({ step }: { step: OnboardingStep }) {
  switch (step) {
    case 'user-type':
      return <UserTypeScreen />;
    case 'user-name':
      return <UserNameScreen />;
    case 'vendor-slides':
      return <VendorSlidesScreen />;
    case 'customer-slides':
      return <CustomerSlidesScreen />;
    case 'create-seed':
      return <CreateWalletScreen />;
    case 'verify-seed':
      return <VerifySeedScreen />;
    case 'import-seed':
      return <ImportWalletScreen />;
    case 'create-passkey':
      return <SecuritySettingsScreen />;
    case 'complete':
      return <CreateWalletScreen />; // Could be replaced with a dedicated completion screen
    default:
      return <WelcomeScreen />;
  }
}
