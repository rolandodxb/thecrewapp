import { db } from '../lib/firebase';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, Timestamp } from 'firebase/firestore';

export interface OpenDay {
  id?: string;
  city: string;
  country: string;
  date: string;
  recruiter: string;
  description: string;
  created_by?: string;
  created_at?: string;
  last_updated?: string;
}

export async function getAllOpenDays(): Promise<OpenDay[]> {
  try {
    const openDaysRef = collection(db, 'open_days');
    const q = query(openDaysRef, orderBy('date', 'asc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as OpenDay[];
  } catch (error) {
    console.error('Error fetching open days:', error);
    return [];
  }
}

export async function createOpenDay(openDay: OpenDay, userId: string): Promise<OpenDay | null> {
  try {
    const openDaysRef = collection(db, 'open_days');
    const docRef = await addDoc(openDaysRef, {
      ...openDay,
      created_by: userId,
      created_at: Timestamp.now(),
      last_updated: Timestamp.now()
    });

    return {
      id: docRef.id,
      ...openDay,
      created_by: userId
    };
  } catch (error) {
    console.error('Error creating open day:', error);
    return null;
  }
}

export async function updateOpenDay(id: string, updates: Partial<OpenDay>): Promise<boolean> {
  try {
    const openDayRef = doc(db, 'open_days', id);
    await updateDoc(openDayRef, {
      ...updates,
      last_updated: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error updating open day:', error);
    return false;
  }
}

export async function deleteOpenDay(id: string): Promise<boolean> {
  try {
    const openDayRef = doc(db, 'open_days', id);
    await deleteDoc(openDayRef);
    return true;
  } catch (error) {
    console.error('Error deleting open day:', error);
    return false;
  }
}
