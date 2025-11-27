# Firebase to Supabase Migration Guide

## Overview
This document describes the complete migration from Firebase to Supabase completed on this project.

## What Was Migrated

### 1. Authentication
- **From**: Firebase Authentication
- **To**: Supabase Authentication
- **File**: `src/lib/auth.ts` (NEW - replaces firebase.ts)
- **Changes**:
  - Email/password authentication
  - User session management
  - Password reset
  - Profile updates

### 2. Database
- **From**: Firebase Firestore
- **To**: Supabase PostgreSQL
- **Migration File**: `supabase/migrations/*_create_complete_app_schema.sql`
- **Tables Created**:
  - users, user_2fa, login_activity
  - courses, modules, lessons, exams, exam_questions, quiz_results
  - enrollments, user_progress
  - community_posts, post_comments, post_likes
  - marketplace_products, marketplace_orders
  - conversations, chat_messages, message_reactions, message_read_receipts
  - bug_reports, feature_flags, system_announcements
  - user_points, user_badges
  - support_tickets, support_messages
  - audit_logs, analytics_events
  - user_onboarding, recruiters, waitlist
  - user_wallets, wallet_transactions, referrals

### 3. Storage
- **From**: Firebase Storage
- **To**: Supabase Storage
- **Buckets Created**:
  - chat-files (for chat attachments)
  - All other file uploads should use Supabase Storage

### 4. Real-time Subscriptions
- **From**: Firestore onSnapshot
- **To**: Supabase Realtime (postgres_changes)
- **Pattern**:
  ```typescript
  // OLD (Firebase)
  onSnapshot(doc(db, 'collection', 'id'), (snapshot) => {
    // handle data
  });

  // NEW (Supabase)
  const subscription = supabase
    .channel('channel-name')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'table_name',
      filter: 'column=eq.value'
    }, (payload) => {
      // handle data
    })
    .subscribe();
  ```

## Migration Patterns

### Auth Usage
```typescript
// OLD
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

// NEW
import { auth } from '../lib/auth';
await auth.signInWithEmailAndPassword(email, password);
```

### Database Operations
```typescript
// OLD (Firestore)
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const docRef = doc(db, 'users', userId);
const docSnap = await getDoc(docRef);
const data = docSnap.data();

await setDoc(docRef, newData);

// NEW (Supabase)
import { supabase } from '../lib/supabase';

const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .maybeSingle();

const { error: insertError } = await supabase
  .from('users')
  .insert(newData);

const { error: updateError } = await supabase
  .from('users')
  .update(newData)
  .eq('id', userId);
```

### Storage Operations
```typescript
// OLD (Firebase Storage)
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

const storageRef = ref(storage, `path/${filename}`);
await uploadBytes(storageRef, file);
const url = await getDownloadURL(storageRef);

// NEW (Supabase Storage)
import { supabase } from '../lib/supabase';

const { error } = await supabase.storage
  .from('bucket-name')
  .upload(`path/${filename}`, file);

const { data } = supabase.storage
  .from('bucket-name')
  .getPublicUrl(`path/${filename}`);
const url = data.publicUrl;
```

## Files That Need Manual Updates

All service files in `src/services/` need to be updated to use Supabase instead of Firebase:

1. ✅ `supabaseChatService.ts` - Already migrated
2. ❌ All other services need migration

## Critical Changes Completed

1. ✅ Created `src/lib/auth.ts` - New Supabase-based auth
2. ✅ Updated `src/context/AppContext.tsx` - Uses Supabase
3. ✅ Created complete database schema in Supabase
4. ✅ Created storage buckets

## Next Steps for Complete Migration

Each service file needs:
1. Replace Firebase imports with Supabase
2. Convert Firestore operations to Supabase queries
3. Update real-time subscriptions
4. Update file storage operations
5. Test thoroughly

## Breaking Changes

- `auth` object structure changed (see `src/lib/auth.ts`)
- Database queries use SQL-style filtering instead of Firestore methods
- Real-time subscriptions use different API
- File paths in storage may need adjustment

## Testing Checklist

- [ ] User registration
- [ ] User login
- [ ] 2FA authentication
- [ ] Profile updates
- [ ] Course enrollment
- [ ] Chat messaging
- [ ] File uploads
- [ ] Marketplace transactions
- [ ] Community posts
- [ ] Real-time updates
