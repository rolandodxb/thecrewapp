import { db, auth } from '../lib/firebase';
import { collection, doc, setDoc, getDocs, Timestamp } from 'firebase/firestore';

export async function initializeTestConversations(): Promise<void> {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const conversationsRef = collection(db, 'conversations');
    const snapshot = await getDocs(conversationsRef);

    if (snapshot.docs.length > 0) {
      console.log('Conversations already exist, skipping initialization');
      return;
    }

    console.log('Creating test conversations...');

    const testConversation1 = doc(conversationsRef);
    await setDoc(testConversation1, {
      type: 'group',
      title: 'The Crew Academy Support',
      members: [userId],
      createdBy: userId,
      createdAt: Timestamp.now(),
      lastMessage: {
        text: 'Welcome to The Crew Academy! How can we help you today?',
        senderId: 'system',
        createdAt: Timestamp.now(),
      },
      pinned: false,
      mutedBy: {},
      isArchivedBy: {},
    });

    await setDoc(doc(conversationsRef, testConversation1.id, 'messages', 'welcome'), {
      messageId: 'welcome',
      senderId: 'system',
      senderName: 'System',
      content: 'Welcome to The Crew Academy! How can we help you today?',
      contentType: 'text',
      createdAt: Timestamp.now(),
      deleted: false,
      reactions: {},
      likesCount: 0,
      readBy: { [userId]: Timestamp.now() },
    });

    console.log('✅ Test conversations created successfully');
  } catch (error) {
    console.error('❌ Error initializing conversations:', error);
    throw error;
  }
}
