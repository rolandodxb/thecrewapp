import { getDatabase, ref, set, onValue, onDisconnect, serverTimestamp, get } from 'firebase/database';
import { auth } from '../lib/firebase';

let rtdb: ReturnType<typeof getDatabase>;

try {
  rtdb = getDatabase();
} catch (error) {
  console.error('Error initializing Firebase Realtime Database:', error);
}

export interface PresenceData {
  online: boolean;
  lastActive: number;
  currentConversationId: string | null;
}

export interface TypingData {
  userId: string;
  userName: string;
  timestamp: number;
}

export const presenceService = {
  initializePresence() {
    if (!rtdb) return;
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const presenceRef = ref(rtdb, `presence/${userId}`);
    const connectedRef = ref(rtdb, '.info/connected');

    onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === true) {
        set(presenceRef, {
          online: true,
          lastActive: serverTimestamp(),
          currentConversationId: null,
        });

        onDisconnect(presenceRef).set({
          online: false,
          lastActive: serverTimestamp(),
          currentConversationId: null,
        });
      }
    });
  },

  setCurrentConversation(conversationId: string | null) {
    if (!rtdb) return;
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const presenceRef = ref(rtdb, `presence/${userId}`);
    set(presenceRef, {
      online: true,
      lastActive: serverTimestamp(),
      currentConversationId: conversationId,
    });
  },

  subscribeToPresence(userId: string, callback: (data: PresenceData | null) => void) {
    if (!rtdb) return () => {};
    const presenceRef = ref(rtdb, `presence/${userId}`);
    return onValue(presenceRef, (snapshot) => {
      callback(snapshot.val());
    });
  },

  async getPresence(userId: string): Promise<PresenceData | null> {
    if (!rtdb) return null;
    const presenceRef = ref(rtdb, `presence/${userId}`);
    const snapshot = await get(presenceRef);
    return snapshot.val();
  },

  setTyping(conversationId: string, userName: string) {
    if (!rtdb) return;
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const typingRef = ref(rtdb, `typing/${conversationId}/${userId}`);
    set(typingRef, {
      userId,
      userName,
      timestamp: serverTimestamp(),
    });

    onDisconnect(typingRef).remove();

    setTimeout(() => {
      set(typingRef, null);
    }, 3000);
  },

  clearTyping(conversationId: string) {
    if (!rtdb) return;
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const typingRef = ref(rtdb, `typing/${conversationId}/${userId}`);
    set(typingRef, null);
  },

  subscribeToTyping(conversationId: string, callback: (typingUsers: TypingData[]) => void) {
    if (!rtdb) return () => {};
    const typingRef = ref(rtdb, `typing/${conversationId}`);
    return onValue(typingRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        callback([]);
        return;
      }

      const currentUserId = auth.currentUser?.uid;
      const typingUsers = Object.values(data).filter(
        (user: any) => user.userId !== currentUserId && Date.now() - user.timestamp < 5000
      );

      callback(typingUsers as TypingData[]);
    });
  },

  cleanup() {
    if (!rtdb) return;
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const presenceRef = ref(rtdb, `presence/${userId}`);
    set(presenceRef, {
      online: false,
      lastActive: serverTimestamp(),
      currentConversationId: null,
    });
  },
};
