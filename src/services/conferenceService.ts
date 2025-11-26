import { db } from '../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp,
  updateDoc,
  onSnapshot
} from 'firebase/firestore';

export interface Conference {
  id: string;
  title: string;
  description: string;
  host_id: string;
  host_name: string;
  meet_link: string;
  access_key: string;
  event_id?: string;
  chat_enabled: boolean;
  slow_mode_enabled: boolean;
  slow_mode_seconds: number;
  max_participants?: number;
  participants: string[];
  created_at: Timestamp;
  starts_at: Timestamp;
  ends_at?: Timestamp;
  status: 'scheduled' | 'live' | 'ended';
}

export interface ConferenceMessage {
  id: string;
  conference_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  message: string;
  created_at: Timestamp;
}

export interface ConferenceParticipant {
  conference_id: string;
  user_id: string;
  user_name: string;
  joined_at: Timestamp;
}

// Create a new conference
export const createConference = async (
  title: string,
  description: string,
  hostId: string,
  hostName: string,
  meetLink: string,
  accessKey: string,
  startsAt: Date,
  eventId?: string
): Promise<string> => {
  const conferenceRef = doc(collection(db, 'conferences'));
  const conferenceId = conferenceRef.id;

  const conference: Omit<Conference, 'id'> = {
    title,
    description,
    host_id: hostId,
    host_name: hostName,
    meet_link: meetLink,
    access_key: accessKey,
    event_id: eventId,
    chat_enabled: true,
    slow_mode_enabled: false,
    slow_mode_seconds: 5,
    participants: [],
    created_at: Timestamp.now(),
    starts_at: Timestamp.fromDate(startsAt),
    status: 'scheduled'
  };

  await setDoc(conferenceRef, conference);
  return conferenceId;
};

// Get conference by ID
export const getConference = async (conferenceId: string): Promise<Conference | null> => {
  const conferenceSnap = await getDoc(doc(db, 'conferences', conferenceId));
  if (!conferenceSnap.exists()) return null;
  return { id: conferenceSnap.id, ...conferenceSnap.data() } as Conference;
};

// Verify conference access key
export const verifyConferenceKey = async (
  conferenceId: string,
  accessKey: string
): Promise<boolean> => {
  const conference = await getConference(conferenceId);
  return conference?.access_key === accessKey;
};

// Join conference
export const joinConference = async (
  conferenceId: string,
  userId: string,
  userName: string,
  accessKey: string
): Promise<{ success: boolean; message: string; conference?: Conference }> => {
  const conference = await getConference(conferenceId);

  if (!conference) {
    return { success: false, message: 'Conference not found' };
  }

  if (conference.access_key !== accessKey) {
    return { success: false, message: 'Invalid access key' };
  }

  if (conference.status === 'ended') {
    return { success: false, message: 'Conference has ended' };
  }

  // Add participant
  const participantRef = doc(db, 'conference_participants', `${conferenceId}_${userId}`);
  await setDoc(participantRef, {
    conference_id: conferenceId,
    user_id: userId,
    user_name: userName,
    joined_at: Timestamp.now()
  });

  // Update participants list
  const conferenceRef = doc(db, 'conferences', conferenceId);
  const updatedParticipants = [...new Set([...conference.participants, userId])];
  await updateDoc(conferenceRef, {
    participants: updatedParticipants,
    status: 'live'
  });

  return {
    success: true,
    message: 'Joined successfully',
    conference: { ...conference, participants: updatedParticipants, status: 'live' }
  };
};

// Update conference settings
export const updateConferenceSettings = async (
  conferenceId: string,
  hostId: string,
  settings: {
    chat_enabled?: boolean;
    slow_mode_enabled?: boolean;
    slow_mode_seconds?: number;
  }
): Promise<void> => {
  const conference = await getConference(conferenceId);

  if (!conference || conference.host_id !== hostId) {
    throw new Error('Unauthorized: Only host can update conference settings');
  }

  const conferenceRef = doc(db, 'conferences', conferenceId);
  await updateDoc(conferenceRef, settings);
};

// Send conference chat message
export const sendConferenceMessage = async (
  conferenceId: string,
  userId: string,
  userName: string,
  userAvatar: string | undefined,
  message: string
): Promise<void> => {
  const conference = await getConference(conferenceId);

  if (!conference) throw new Error('Conference not found');
  if (!conference.chat_enabled) throw new Error('Chat is disabled for this conference');

  // Check slow mode
  if (conference.slow_mode_enabled) {
    const recentMessagesQuery = query(
      collection(db, 'conference_messages'),
      where('conference_id', '==', conferenceId),
      where('user_id', '==', userId)
    );

    const recentMessages = await getDocs(recentMessagesQuery);
    const now = Date.now();

    for (const msgDoc of recentMessages.docs) {
      const msg = msgDoc.data();
      const msgTime = msg.created_at.toMillis();
      const timeDiff = (now - msgTime) / 1000;

      if (timeDiff < conference.slow_mode_seconds) {
        throw new Error(
          `Please wait ${Math.ceil(conference.slow_mode_seconds - timeDiff)} seconds before sending another message`
        );
      }
    }
  }

  const messageRef = doc(collection(db, 'conference_messages'));
  await setDoc(messageRef, {
    conference_id: conferenceId,
    user_id: userId,
    user_name: userName,
    user_avatar: userAvatar,
    message,
    created_at: Timestamp.now()
  });
};

// Get conference messages (realtime)
export const subscribeToConferenceMessages = (
  conferenceId: string,
  callback: (messages: ConferenceMessage[]) => void
) => {
  const q = query(
    collection(db, 'conference_messages'),
    where('conference_id', '==', conferenceId)
  );

  return onSnapshot(q, snapshot => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ConferenceMessage[];

    messages.sort((a, b) => a.created_at.toMillis() - b.created_at.toMillis());
    callback(messages);
  });
};

// Get conference participants
export const getConferenceParticipants = async (
  conferenceId: string
): Promise<ConferenceParticipant[]> => {
  const q = query(
    collection(db, 'conference_participants'),
    where('conference_id', '==', conferenceId)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as ConferenceParticipant);
};

// End conference
export const endConference = async (conferenceId: string, hostId: string): Promise<void> => {
  const conference = await getConference(conferenceId);

  if (!conference || conference.host_id !== hostId) {
    throw new Error('Unauthorized: Only host can end conference');
  }

  const conferenceRef = doc(db, 'conferences', conferenceId);
  await updateDoc(conferenceRef, {
    status: 'ended',
    ends_at: Timestamp.now()
  });
};

// Get user's conferences
export const getUserConferences = async (userId: string): Promise<Conference[]> => {
  const q = query(
    collection(db, 'conferences'),
    where('participants', 'array-contains', userId)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conference));
};
