import { supabase } from '../lib/supabase';

export interface WaitlistEntry {
  id: string;
  name: string;
  email: string;
  created_at: string;
  approved: boolean;
  approved_at: string | null;
  approved_by: string | null;
}

export const waitlistService = {
  async getAllEntries(): Promise<WaitlistEntry[]> {
    try {
      const { data, error } = await supabase
        .from('waitlist')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching waitlist entries:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Unexpected error fetching waitlist:', err);
      return [];
    }
  },

  async addToWaitlist(name: string, email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('waitlist')
        .insert([{ name, email }]);

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'This email is already on the waitlist.' };
        }
        return { success: false, error: 'Failed to join waitlist. Please try again.' };
      }

      return { success: true };
    } catch {
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
  },

  async approveEntry(id: string, approvedBy: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('waitlist')
        .update({
          approved: true,
          approved_at: new Date().toISOString(),
          approved_by: approvedBy
        })
        .eq('id', id);

      return !error;
    } catch {
      return false;
    }
  },

  async verifyStaffCode(code: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('staff_access_codes')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) {
        return false;
      }

      await supabase
        .from('staff_access_codes')
        .update({ used_count: data.used_count + 1 })
        .eq('id', data.id);

      return true;
    } catch {
      return false;
    }
  }
};
