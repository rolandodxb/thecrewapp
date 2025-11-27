import { supabase } from '../lib/auth';
export interface Recruiter {
  id?: string;
  name: string;
  country: string;
  airline: string;
  notes: string;
  created_by?: string;
  created_at?: string;
  last_updated?: string;
}
export async function getAllRecruiters(): Promise<Recruiter[]> {
  try {
    const recruitersRef = collection(db, 'recruiters');
    const q = query(recruitersRef, orderBy('last_updated', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Recruiter[];
  } catch (error) {
    console.error('Error fetching recruiters:', error);
    return [];
  }
}
export async function createRecruiter(recruiter: Recruiter, userId: string): Promise<Recruiter | null> {
  try {
    const recruitersRef = collection(db, 'recruiters');
    const docRef = await addDoc(recruitersRef, {
      ...recruiter,
      created_by: userId,
      created_at: Timestamp.now(),
      last_updated: Timestamp.now()
    });
    return {
      id: docRef.id,
      ...recruiter,
      created_by: userId
    };
  } catch (error) {
    console.error('Error creating recruiter:', error);
    return null;
  }
}
export async function updateRecruiter(id: string, updates: Partial<Recruiter>): Promise<boolean> {
  try {
    const recruiterRef = doc(db, 'recruiters', id);
    await updateDoc(recruiterRef, {
      ...updates,
      last_updated: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error updating recruiter:', error);
    return false;
  }
}
export async function deleteRecruiter(id: string): Promise<boolean> {
  try {
    const recruiterRef = doc(db, 'recruiters', id);
    await deleteDoc(recruiterRef);
    return true;
  } catch (error) {
    console.error('Error deleting recruiter:', error);
    return false;
  }
}