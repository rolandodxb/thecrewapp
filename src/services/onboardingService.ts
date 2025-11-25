import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface OnboardingStatus {
  hasCompletedOnboarding: boolean;
  onboardingCompletedAt?: string;
  hasSeenWelcomeBanner: boolean;
}

export async function getOnboardingStatus(userId: string): Promise<boolean> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      console.error('User document not found');
      return false;
    }

    const userData = userDoc.data();
    return userData.hasCompletedOnboarding === true;
  } catch (error) {
    console.error('Error fetching onboarding status:', error);
    return false;
  }
}

export async function completeOnboarding(userId: string): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      hasCompletedOnboarding: true,
      onboardingCompletedAt: new Date().toISOString()
    });
    console.log('Onboarding completed successfully');
  } catch (error) {
    console.error('Error completing onboarding:', error);
    throw error;
  }
}

export async function resetOnboarding(userId: string): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      hasCompletedOnboarding: false,
      onboardingCompletedAt: null
    });
    console.log('Onboarding reset successfully');
  } catch (error) {
    console.error('Error resetting onboarding:', error);
    throw error;
  }
}

export async function hasSeenWelcomeBanner(userId: string): Promise<boolean> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      console.error('User document not found');
      return false;
    }

    const userData = userDoc.data();
    return userData.hasSeenWelcomeBanner === true;
  } catch (error) {
    console.error('Error checking welcome banner status:', error);
    return false;
  }
}

export async function markWelcomeBannerSeen(userId: string): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      hasSeenWelcomeBanner: true,
      welcomeBannerSeenAt: new Date().toISOString()
    });
    console.log('Welcome banner marked as seen');
  } catch (error) {
    console.error('Error marking welcome banner as seen:', error);
    throw error;
  }
}
