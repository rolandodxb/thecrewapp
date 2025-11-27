import { supabase } from '../lib/auth';

export async function initializeUpdates() {
  try {
    const { data: existingUpdates, error } = await supabase
      .from('updates')
      .select('id')
      .limit(1);

    if (error) throw error;

    if (!existingUpdates || existingUpdates.length === 0) {
      console.log('Initializing updates collection with recent changes...');

      const updates = [
        {
          type: 'feature',
          title: 'What\'s New Section',
          description: 'Added comprehensive updates tracking system showing all recent changes, fixes, and announcements in the Notifications page.',
          version: '2.0.0',
          created_by: 'system',
          created_at: new Date().toISOString(),
          notify_users: false
        },
        {
          type: 'feature',
          title: 'Interactive Leaderboard',
          description: 'Leaderboard cards now expand inline to show detailed user statistics including points, rank, streak, achievements, and bio.',
          created_by: 'system',
          created_at: new Date().toISOString(),
          notify_users: false
        },
        {
          type: 'fix',
          title: 'Login Activity Cards - Mobile Responsive',
          description: 'Fixed text overflow issues on mobile devices. All text now properly wraps within cards with no overflow.',
          created_by: 'system',
          created_at: new Date().toISOString(),
          notify_users: false
        },
        {
          type: 'improvement',
          title: 'Inline Forms for Recruiters & Open Days',
          description: 'Replaced floating modals with smooth inline dropdown forms for better user experience when adding recruiters and open days.',
          created_by: 'system',
          created_at: new Date().toISOString(),
          notify_users: false
        },
        {
          type: 'feature',
          title: 'Unified Notification System',
          description: 'Integrated all notification types including community posts, chat messages, bug reports, system announcements, and learning updates into one comprehensive system.',
          version: '2.0.0',
          created_by: 'system',
          created_at: new Date().toISOString(),
          notify_users: false
        },
        {
          type: 'feature',
          title: 'Supabase Migration Complete',
          description: 'Successfully migrated entire application from Firebase to Supabase for better performance, real-time updates, and improved scalability.',
          version: '2.0.0',
          created_by: 'system',
          created_at: new Date().toISOString(),
          notify_users: false
        },
        {
          type: 'improvement',
          title: 'Enhanced Chat System',
          description: 'Improved community chat with better message handling, emoji support, and real-time presence indicators using Supabase.',
          created_by: 'system',
          created_at: new Date().toISOString(),
          notify_users: false
        },
        {
          type: 'fix',
          title: 'Notification Bell Updates',
          description: 'Fixed notification bell to properly show unread counts and sync with Supabase notifications.',
          created_by: 'system',
          created_at: new Date().toISOString(),
          notify_users: false
        }
      ];

      const { error: insertError } = await supabase
        .from('updates')
        .insert(updates);

      if (insertError) throw insertError;

      console.log(`Successfully initialized ${updates.length} updates`);
      return true;
    } else {
      console.log('Updates collection already has data');
      return false;
    }
  } catch (error) {
    console.error('Error initializing updates:', error);
    return false;
  }
}
