import { db } from '../lib/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

export interface PrivacySettings {
  user_id: string;
  profile_visibility: 'public' | 'friends' | 'private';
  posts_visibility: 'public' | 'friends' | 'private';
  achievements_visibility: 'public' | 'friends' | 'private';
  allow_messages_from: 'everyone' | 'friends' | 'nobody';
  show_online_status: boolean;
  show_activity: boolean;
  updated_at: Date;
}

const DEFAULT_PRIVACY_SETTINGS: Omit<PrivacySettings, 'user_id'> = {
  profile_visibility: 'public',
  posts_visibility: 'public',
  achievements_visibility: 'public',
  allow_messages_from: 'everyone',
  show_online_status: true,
  show_activity: true,
  updated_at: new Date()
};

export const getPrivacySettings = async (userId: string): Promise<PrivacySettings> => {
  const settingsRef = doc(db, 'privacy_settings', userId);
  const settingsSnap = await getDoc(settingsRef);

  if (settingsSnap.exists()) {
    return settingsSnap.data() as PrivacySettings;
  }

  // Return default settings if none exist
  const defaultSettings = {
    user_id: userId,
    ...DEFAULT_PRIVACY_SETTINGS
  };

  await setDoc(settingsRef, defaultSettings);
  return defaultSettings;
};

export const updatePrivacySettings = async (
  userId: string,
  updates: Partial<Omit<PrivacySettings, 'user_id'>>
): Promise<void> => {
  const settingsRef = doc(db, 'privacy_settings', userId);
  await updateDoc(settingsRef, {
    ...updates,
    updated_at: new Date()
  });
};

export const canViewProfile = async (
  viewerId: string | null,
  targetUserId: string,
  areFriends: boolean
): Promise<boolean> => {
  const settings = await getPrivacySettings(targetUserId);

  if (settings.profile_visibility === 'public') return true;
  if (settings.profile_visibility === 'private') return viewerId === targetUserId;
  if (settings.profile_visibility === 'friends') return areFriends || viewerId === targetUserId;

  return false;
};

export const canViewPosts = async (
  viewerId: string | null,
  targetUserId: string,
  areFriends: boolean
): Promise<boolean> => {
  const settings = await getPrivacySettings(targetUserId);

  if (settings.posts_visibility === 'public') return true;
  if (settings.posts_visibility === 'private') return viewerId === targetUserId;
  if (settings.posts_visibility === 'friends') return areFriends || viewerId === targetUserId;

  return false;
};

export const canViewAchievements = async (
  viewerId: string | null,
  targetUserId: string,
  areFriends: boolean
): Promise<boolean> => {
  const settings = await getPrivacySettings(targetUserId);

  if (settings.achievements_visibility === 'public') return true;
  if (settings.achievements_visibility === 'private') return viewerId === targetUserId;
  if (settings.achievements_visibility === 'friends') return areFriends || viewerId === targetUserId;

  return false;
};

export const canSendMessage = async (
  senderId: string,
  recipientId: string,
  areFriends: boolean
): Promise<boolean> => {
  const settings = await getPrivacySettings(recipientId);

  if (settings.allow_messages_from === 'everyone') return true;
  if (settings.allow_messages_from === 'nobody') return false;
  if (settings.allow_messages_from === 'friends') return areFriends;

  return false;
};
