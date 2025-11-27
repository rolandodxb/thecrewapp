import { auth, supabase } from '../lib/auth';

export async function initializeTestConversations(): Promise<void> {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const { data: existingConversations, error } = await supabase
      .from('conversations')
      .select('id')
      .limit(1);

    if (error) throw error;

    if (existingConversations && existingConversations.length > 0) {
      console.log('Conversations already exist, skipping initialization');
      return;
    }

    console.log('Creating test conversations...');

    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        type: 'group',
        title: 'The Crew Academy Support',
        members: [userId],
        created_by: userId,
        created_at: new Date().toISOString(),
        last_message: {
          text: 'Welcome to The Crew Academy! How can we help you today?',
          sender_id: 'system',
          created_at: new Date().toISOString(),
        },
        pinned: false,
        muted_by: {},
        is_archived_by: {},
      })
      .select()
      .single();

    if (convError) throw convError;

    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: 'system',
        sender_name: 'System',
        content: 'Welcome to The Crew Academy! How can we help you today?',
        content_type: 'text',
        created_at: new Date().toISOString(),
        deleted: false,
        reactions: {},
        likes_count: 0,
        read_by: { [userId]: new Date().toISOString() },
      });

    if (messageError) throw messageError;

    console.log('✅ Test conversations created successfully');
  } catch (error) {
    console.error('❌ Error initializing conversations:', error);
    throw error;
  }
}
