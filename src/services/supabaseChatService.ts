import { supabase } from '../lib/supabase';
import { auth } from '../lib/firebase';

export interface SupabaseChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  content_type: 'text' | 'image' | 'audio' | 'file';
  attachment_url?: string;
  attachment_metadata?: {
    name: string;
    size: number;
    type: string;
  };
  deleted: boolean;
  edited: boolean;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  type: 'public' | 'private' | 'group';
  name: string;
  created_at: string;
  updated_at: string;
}

const PUBLIC_ROOM_ID = '00000000-0000-0000-0000-000000000001';

export const supabaseChatService = {
  getPublicRoomId(): string {
    return PUBLIC_ROOM_ID;
  },

  async ensurePublicRoom(): Promise<void> {
    const { data: existingRoom } = await supabase
      .from('conversations')
      .select('id')
      .eq('type', 'public')
      .maybeSingle();

    if (existingRoom) {
      return;
    }

    const { error } = await supabase
      .from('conversations')
      .insert({
        id: PUBLIC_ROOM_ID,
        type: 'public',
        name: 'Community Chat',
      });

    if (error && error.code !== '23505') {
      console.error('Error creating public room:', error);
    }
  },

  async uploadAttachment(file: File, conversationId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${conversationId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `chat-attachments/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('chat-files')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  },

  async sendMessage(
    conversationId: string,
    content: string,
    contentType: 'text' | 'image' | 'audio' | 'file' = 'text',
    attachmentFile?: File
  ): Promise<string> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Not authenticated');

    const userDoc = await auth.currentUser?.getIdTokenResult();
    const userName = auth.currentUser?.displayName || 'Unknown User';

    let attachmentUrl: string | undefined;
    let attachmentMetadata: any = undefined;

    if (attachmentFile) {
      try {
        attachmentUrl = await this.uploadAttachment(attachmentFile, conversationId);
        attachmentMetadata = {
          name: attachmentFile.name,
          size: attachmentFile.size,
          type: attachmentFile.type,
        };
      } catch (error) {
        console.error('Error uploading attachment:', error);
        throw error;
      }
    }

    const messageData = {
      conversation_id: conversationId,
      sender_id: userId,
      sender_name: userName,
      content,
      content_type: contentType,
      attachment_url: attachmentUrl,
      attachment_metadata: attachmentMetadata,
      deleted: false,
      edited: false,
    };

    const { data, error } = await supabase
      .from('chat_messages')
      .insert(messageData)
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }

    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return data.id;
  },

  subscribeToMessages(
    conversationId: string,
    callback: (messages: SupabaseChatMessage[]) => void,
    onError?: (error: Error) => void
  ) {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('deleted', false)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Error fetching messages:', error);
        onError?.(new Error(error.message));
        return;
      }

      callback(data || []);
    };

    fetchMessages();

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  async getConversations(): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }

    return data || [];
  },

  async markAsRead(conversationId: string, messageId: string): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const { error } = await supabase
      .from('message_read_receipts')
      .upsert({
        message_id: messageId,
        user_id: userId,
        read_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error marking as read:', error);
    }
  },

  async addReaction(
    conversationId: string,
    messageId: string,
    emoji: string
  ): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('message_reactions')
      .insert({
        message_id: messageId,
        user_id: userId,
        emoji,
      });

    if (error && error.code !== '23505') {
      console.error('Error adding reaction:', error);
      throw error;
    }
  },

  async removeReaction(
    conversationId: string,
    messageId: string,
    emoji: string
  ): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('message_reactions')
      .delete()
      .match({
        message_id: messageId,
        user_id: userId,
        emoji,
      });

    if (error) {
      console.error('Error removing reaction:', error);
      throw error;
    }
  },
};
