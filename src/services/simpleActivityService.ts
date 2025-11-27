import { db } from '../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import QRCode from 'qrcode';

export interface Activity {
  id: string;
  name: string;
  description: string;
  price: number;
  imageBase64: string;
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  createdAt: any;
  status: 'active' | 'completed' | 'cancelled';
  registeredCount: number;
  checkedInCount: number;
}

export interface ActivityRegistration {
  id: string;
  activityId: string;
  userId: string;
  userName: string;
  userEmail: string;
  paymentStatus: 'free' | 'paid' | 'pending';
  qrCode: string;
  checkedIn: boolean;
  checkedInAt?: any;
  registeredAt: any;
}

export const createActivity = async (
  name: string,
  description: string,
  price: number,
  imageBase64: string,
  creatorId: string,
  creatorName: string,
  creatorEmail: string
): Promise<string> => {
  try {
    const activityRef = doc(collection(db, 'activities'));

    const activityData: Omit<Activity, 'id'> = {
      name,
      description,
      price,
      imageBase64,
      creatorId,
      creatorName,
      creatorEmail,
      createdAt: Timestamp.now(),
      status: 'active',
      registeredCount: 0,
      checkedInCount: 0
    };

    await setDoc(activityRef, activityData);
    return activityRef.id;
  } catch (error) {
    console.error('Error creating activity:', error);
    throw error;
  }
};

export const getAllActivities = async (): Promise<Activity[]> => {
  try {
    const activitiesRef = collection(db, 'activities');
    const q = query(activitiesRef, where('status', '==', 'active'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Activity[];
  } catch (error) {
    console.error('Error getting activities:', error);
    return [];
  }
};

export const getActivityById = async (activityId: string): Promise<Activity | null> => {
  try {
    const activityRef = doc(db, 'activities', activityId);
    const activitySnap = await getDoc(activityRef);

    if (activitySnap.exists()) {
      return {
        id: activitySnap.id,
        ...activitySnap.data()
      } as Activity;
    }
    return null;
  } catch (error) {
    console.error('Error getting activity:', error);
    return null;
  }
};

export const generateUserQRCode = async (
  userId: string,
  activityId: string
): Promise<string> => {
  try {
    const qrData = JSON.stringify({
      userId,
      activityId,
      timestamp: Date.now()
    });

    const qrCodeUrl = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return qrCodeUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

export const joinFreeActivity = async (
  activityId: string,
  userId: string,
  userName: string,
  userEmail: string
): Promise<{ success: boolean; registrationId?: string; qrCode?: string; message: string }> => {
  try {
    const activity = await getActivityById(activityId);

    if (!activity) {
      return { success: false, message: 'Activity not found' };
    }

    if (activity.price > 0) {
      return { success: false, message: 'This is a paid activity. Please use payment option.' };
    }

    const existingRegQuery = query(
      collection(db, 'activity_registrations'),
      where('activityId', '==', activityId),
      where('userId', '==', userId)
    );
    const existingSnap = await getDocs(existingRegQuery);

    if (!existingSnap.empty) {
      const existing = existingSnap.docs[0];
      return {
        success: true,
        registrationId: existing.id,
        qrCode: existing.data().qrCode,
        message: 'Already registered for this activity'
      };
    }

    const qrCode = await generateUserQRCode(userId, activityId);
    const registrationRef = doc(collection(db, 'activity_registrations'));

    const registrationData: Omit<ActivityRegistration, 'id'> = {
      activityId,
      userId,
      userName,
      userEmail,
      paymentStatus: 'free',
      qrCode,
      checkedIn: false,
      registeredAt: Timestamp.now()
    };

    await setDoc(registrationRef, registrationData);

    await updateDoc(doc(db, 'activities', activityId), {
      registeredCount: (activity.registeredCount || 0) + 1
    });

    return {
      success: true,
      registrationId: registrationRef.id,
      qrCode,
      message: 'Successfully registered for free activity'
    };
  } catch (error) {
    console.error('Error joining free activity:', error);
    return { success: false, message: 'Failed to join activity' };
  }
};

export const joinPaidActivity = async (
  activityId: string,
  userId: string,
  userName: string,
  userEmail: string,
  paymentConfirmed: boolean = false
): Promise<{ success: boolean; registrationId?: string; qrCode?: string; message: string }> => {
  try {
    const activity = await getActivityById(activityId);

    if (!activity) {
      return { success: false, message: 'Activity not found' };
    }

    if (activity.price === 0) {
      return { success: false, message: 'This is a free activity. Use join free option.' };
    }

    if (!paymentConfirmed) {
      return { success: false, message: 'Payment required for this activity' };
    }

    const existingRegQuery = query(
      collection(db, 'activity_registrations'),
      where('activityId', '==', activityId),
      where('userId', '==', userId)
    );
    const existingSnap = await getDocs(existingRegQuery);

    if (!existingSnap.empty) {
      const existing = existingSnap.docs[0];
      return {
        success: true,
        registrationId: existing.id,
        qrCode: existing.data().qrCode,
        message: 'Already registered for this activity'
      };
    }

    const qrCode = await generateUserQRCode(userId, activityId);
    const registrationRef = doc(collection(db, 'activity_registrations'));

    const registrationData: Omit<ActivityRegistration, 'id'> = {
      activityId,
      userId,
      userName,
      userEmail,
      paymentStatus: 'paid',
      qrCode,
      checkedIn: false,
      registeredAt: Timestamp.now()
    };

    await setDoc(registrationRef, registrationData);

    await updateDoc(doc(db, 'activities', activityId), {
      registeredCount: (activity.registeredCount || 0) + 1
    });

    return {
      success: true,
      registrationId: registrationRef.id,
      qrCode,
      message: 'Successfully registered for paid activity'
    };
  } catch (error) {
    console.error('Error joining paid activity:', error);
    return { success: false, message: 'Failed to join activity' };
  }
};

export const scanQRAndCheckIn = async (
  qrCodeData: string,
  scannerId: string
): Promise<{ success: boolean; message: string; userName?: string }> => {
  try {
    const parsedData = JSON.parse(qrCodeData);
    const { userId, activityId } = parsedData;

    if (!userId || !activityId) {
      return { success: false, message: 'Invalid QR code' };
    }

    const registrationQuery = query(
      collection(db, 'activity_registrations'),
      where('activityId', '==', activityId),
      where('userId', '==', userId)
    );
    const registrationSnap = await getDocs(registrationQuery);

    if (registrationSnap.empty) {
      return { success: false, message: 'Registration not found' };
    }

    const registrationDoc = registrationSnap.docs[0];
    const registrationData = registrationDoc.data();

    if (registrationData.checkedIn) {
      return {
        success: true,
        message: 'Already checked in',
        userName: registrationData.userName
      };
    }

    await updateDoc(doc(db, 'activity_registrations', registrationDoc.id), {
      checkedIn: true,
      checkedInAt: Timestamp.now()
    });

    const activity = await getActivityById(activityId);
    if (activity) {
      await updateDoc(doc(db, 'activities', activityId), {
        checkedInCount: (activity.checkedInCount || 0) + 1
      });
    }

    return {
      success: true,
      message: 'Check-in successful',
      userName: registrationData.userName
    };
  } catch (error) {
    console.error('Error scanning QR code:', error);
    return { success: false, message: 'Failed to process QR code' };
  }
};

export const getActivityAttendees = async (activityId: string): Promise<ActivityRegistration[]> => {
  try {
    const registrationsRef = collection(db, 'activity_registrations');
    const q = query(
      registrationsRef,
      where('activityId', '==', activityId)
    );
    const snapshot = await getDocs(q);

    const results = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ActivityRegistration[];

    // Sort in memory
    return results.sort((a, b) => {
      const dateA = a.registeredAt?.toMillis() || 0;
      const dateB = b.registeredAt?.toMillis() || 0;
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error getting attendees:', error);
    return [];
  }
};

export const getMyActivities = async (userId: string): Promise<ActivityRegistration[]> => {
  try {
    const registrationsRef = collection(db, 'activity_registrations');
    const q = query(
      registrationsRef,
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);

    const results = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ActivityRegistration[];

    // Sort in memory
    return results.sort((a, b) => {
      const dateA = a.registeredAt?.toMillis() || 0;
      const dateB = b.registeredAt?.toMillis() || 0;
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error getting my activities:', error);
    return [];
  }
};

export const deleteActivity = async (activityId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'activities', activityId), {
      status: 'cancelled'
    });
  } catch (error) {
    console.error('Error deleting activity:', error);
    throw error;
  }
};

export const updateActivity = async (
  activityId: string,
  updates: Partial<Pick<Activity, 'name' | 'description' | 'price' | 'imageBase64'>>
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'activities', activityId), updates);
  } catch (error) {
    console.error('Error updating activity:', error);
    throw error;
  }
};

export const getAllRegistrations = async (): Promise<ActivityRegistration[]> => {
  try {
    const registrationsRef = collection(db, 'activity_registrations');
    const snapshot = await getDocs(registrationsRef);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ActivityRegistration[];
  } catch (error) {
    console.error('Error getting all registrations:', error);
    return [];
  }
};
