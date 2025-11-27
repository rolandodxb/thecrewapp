import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
}

export const auth = {
  currentUser: null as AuthUser | null,

  async signInWithEmailAndPassword(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return { user: convertUser(data.user) };
  },

  async createUserWithEmailAndPassword(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    return { user: convertUser(data.user) };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async sendPasswordResetEmail(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  },

  async updateProfile(updates: { displayName?: string; photoURL?: string }) {
    const { error } = await supabase.auth.updateUser({
      data: {
        display_name: updates.displayName,
        photo_url: updates.photoURL,
      },
    });
    if (error) throw error;
  },

  onAuthStateChanged(callback: (user: AuthUser | null) => void) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ? convertUser(session.user) : null;
      this.currentUser = user;
      callback(user);
    });

    return data.subscription.unsubscribe;
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    const { data } = await supabase.auth.getUser();
    return data.user ? convertUser(data.user) : null;
  },

  async getIdToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  },
};

function convertUser(user: User | null): AuthUser | null {
  if (!user) return null;

  return {
    uid: user.id,
    email: user.email || null,
    displayName: user.user_metadata?.display_name || user.user_metadata?.name || null,
    photoURL: user.user_metadata?.photo_url || user.user_metadata?.avatar_url || null,
    emailVerified: user.email_confirmed_at != null,
    phoneNumber: user.phone || null,
  };
}

export type { User as SupabaseUser, Session };
export { supabase };
