import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';

export async function initializeUpdates() {
  try {
    const updatesSnapshot = await getDocs(collection(db, 'updates'));

    if (updatesSnapshot.empty) {
      console.log('Initializing updates collection with recent changes...');

      const updates = [
        {
          type: 'feature',
          title: 'What\'s New Section',
          description: 'Added comprehensive updates tracking system showing all recent changes, fixes, and announcements in the Notifications page.',
          version: '2.0.0',
          createdBy: 'system',
          createdAt: Timestamp.now(),
          notifyUsers: false
        },
        {
          type: 'feature',
          title: 'Interactive Leaderboard',
          description: 'Leaderboard cards now expand inline to show detailed user statistics including points, rank, streak, achievements, and bio.',
          createdBy: 'system',
          createdAt: Timestamp.now(),
          notifyUsers: false
        },
        {
          type: 'fix',
          title: 'Login Activity Cards - Mobile Responsive',
          description: 'Fixed text overflow issues on mobile devices. All text now properly wraps within cards with no overflow.',
          createdBy: 'system',
          createdAt: Timestamp.now(),
          notifyUsers: false
        },
        {
          type: 'improvement',
          title: 'Inline Forms for Recruiters & Open Days',
          description: 'Replaced floating modals with smooth inline dropdown forms for better user experience when adding recruiters and open days.',
          createdBy: 'system',
          createdAt: Timestamp.now(),
          notifyUsers: false
        },
        {
          type: 'feature',
          title: 'Unified Notification System',
          description: 'Integrated all notification types including community posts, chat messages, bug reports, system announcements, and learning updates into one comprehensive system.',
          version: '2.0.0',
          createdBy: 'system',
          createdAt: Timestamp.now(),
          notifyUsers: false
        },
        {
          type: 'feature',
          title: 'Supabase Notifications Integration',
          description: 'Migrated notifications to Supabase for better performance, real-time updates, and improved scalability.',
          version: '2.0.0',
          createdBy: 'system',
          createdAt: Timestamp.now(),
          notifyUsers: false
        },
        {
          type: 'improvement',
          title: 'Enhanced Chat System',
          description: 'Improved community chat with better message handling, emoji support, and real-time presence indicators.',
          createdBy: 'system',
          createdAt: Timestamp.now(),
          notifyUsers: false
        },
        {
          type: 'fix',
          title: 'Notification Bell Updates',
          description: 'Fixed notification bell to properly show unread counts and sync with Supabase notifications.',
          createdBy: 'system',
          createdAt: Timestamp.now(),
          notifyUsers: false
        }
      ];

      const promises = updates.map(update => addDoc(collection(db, 'updates'), update));
      await Promise.all(promises);

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
