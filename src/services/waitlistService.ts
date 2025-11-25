import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, updateDoc, doc, query, orderBy, where, Timestamp } from 'firebase/firestore';

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
      const waitlistRef = collection(db, 'waitlist');
      const q = query(waitlistRef, orderBy('created_at', 'desc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          email: data.email,
          created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
          approved: data.approved || false,
          approved_at: data.approved_at?.toDate?.()?.toISOString() || null,
          approved_by: data.approved_by || null,
        };
      });
    } catch (err) {
      console.error('Unexpected error fetching waitlist:', err);
      return [];
    }
  },

  async addToWaitlist(name: string, email: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if email already exists
      const waitlistRef = collection(db, 'waitlist');
      const q = query(waitlistRef, where('email', '==', email));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        return { success: false, error: 'This email is already on the waitlist.' };
      }

      // Add new entry
      await addDoc(waitlistRef, {
        name,
        email,
        created_at: Timestamp.now(),
        approved: false,
        approved_at: null,
        approved_by: null,
      });

      return { success: true };
    } catch (err) {
      console.error('Error adding to waitlist:', err);
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
  },

  async approveEntry(id: string, approvedBy: string): Promise<boolean> {
    try {
      const entryRef = doc(db, 'waitlist', id);
      await updateDoc(entryRef, {
        approved: true,
        approved_at: Timestamp.now(),
        approved_by: approvedBy
      });

      return true;
    } catch (err) {
      console.error('Error approving entry:', err);
      return false;
    }
  },

  async verifyStaffCode(code: string): Promise<boolean> {
    try {
      const codesRef = collection(db, 'staff_access_codes');
      const q = query(codesRef, where('code', '==', code), where('is_active', '==', true));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return false;
      }

      const docData = snapshot.docs[0];
      const data = docData.data();

      // Update used count
      const codeRef = doc(db, 'staff_access_codes', docData.id);
      await updateDoc(codeRef, {
        current_uses: (data.current_uses || 0) + 1
      });

      return true;
    } catch (err) {
      console.error('Error verifying staff code:', err);
      return false;
    }
  }
};
