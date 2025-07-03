import React from 'react';
import { OnboardingStep } from '@/contexts/AuthContext';

import WelcomeScreen from '@/app/auth/welcome';
import CreateWalletScreen from '@/app/auth/create-wallet';
import ImportWalletScreen from '@/app/auth/import-wallet';
import VerifySeedScreen from '@/app/auth/verify-seed';
import UserTypeScreen from '@/app/auth/user-type';
import UserNameScreen from '@/app/auth/user-name';
import VendorDetailsScreen from '@/app/auth/vendor-details';
import VendorSlides from '@/app/onboarding/vendor-slides';
import CustomerSlides from '@/app/onboarding/customer-slides';

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
    case 'vendor-details':
      return <VendorDetailsScreen />;
    case 'vendor-slides':
      return <VendorSlides />;
    case 'customer-slides':
      return <CustomerSlides />;
    case 'create-seed':
      return <CreateWalletScreen />;
    case 'verify-seed':
      return <VerifySeedScreen />;
    case 'import-seed':
      return <ImportWalletScreen />;
    case 'create-passkey':
    case 'complete':
      return <CreateWalletScreen />; // Could be replaced with a dedicated completion screen
    default:
      return <WelcomeScreen />;
  }
}
