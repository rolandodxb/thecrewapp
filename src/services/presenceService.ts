import { auth, supabase } from '../lib/auth';

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

// Using Supabase Realtime for presence
export const presenceService = {
  async initializePresence() {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    // Upsert presence record
    await supabase
      .from('users')
      .update({
        metadata: {
          online: true,
          lastActive: Date.now(),
          currentConversationId: null,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    // Update presence on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.setOffline();
      } else {
        this.setOnline();
      }
    });

    // Update presence on beforeunload
    window.addEventListener('beforeunload', () => {
      this.setOffline();
    });
  },

  async setOnline() {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    await supabase
      .from('users')
      .update({
        metadata: {
          online: true,
          lastActive: Date.now(),
        },
      })
      .eq('id', userId);
  },

  async setOffline() {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    await supabase
      .from('users')
      .update({
        metadata: {
          online: false,
          lastActive: Date.now(),
        },
      })
      .eq('id', userId);
  },

  async setCurrentConversation(conversationId: string | null) {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    await supabase
      .from('users')
      .update({
        metadata: {
          online: true,
          lastActive: Date.now(),
          currentConversationId: conversationId,
        },
      })
      .eq('id', userId);
  },

  async getPresence(userId: string): Promise<PresenceData | null> {
    const { data, error } = await supabase
      .from('users')
      .select('metadata')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      online: data.metadata?.online || false,
      lastActive: data.metadata?.lastActive || Date.now(),
      currentConversationId: data.metadata?.currentConversationId || null,
    };
  },

  subscribeToPresence(userId: string, callback: (presence: PresenceData) => void): () => void {
    const channel = supabase
      .channel(`presence:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new) {
            const data = payload.new as any;
            callback({
              online: data.metadata?.online || false,
              lastActive: data.metadata?.lastActive || Date.now(),
              currentConversationId: data.metadata?.currentConversationId || null,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  async setTyping(conversationId: string, isTyping: boolean) {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    // Use Supabase broadcast for typing indicators
    const channel = supabase.channel(`typing:${conversationId}`);

    if (isTyping) {
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId, timestamp: Date.now() },
      });
    }
  },

  subscribeToTyping(conversationId: string, callback: (typing: Record<string, TypingData>) => void): () => void {
    const typingUsers: Record<string, TypingData> = {};

    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { userId, timestamp } = payload.payload;
        typingUsers[userId] = {
          userId,
          userName: 'User',
          timestamp,
        };

        // Remove typing indicator after 5 seconds
        setTimeout(() => {
          delete typingUsers[userId];
          callback({ ...typingUsers });
        }, 5000);

        callback({ ...typingUsers });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
