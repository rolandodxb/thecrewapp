# Community Chat Supabase Migration

## Overview
Migrated the community chat system from Firestore to Supabase for messages, files, and images storage.

## What Was Changed

### 1. Created New Service (`src/services/supabaseChatService.ts`)
- Handles all community chat operations using Supabase
- Stores messages in `chat_messages` table
- Stores files and images in `chat-files` storage bucket
- Real-time message updates using Supabase realtime subscriptions
- Supports text, image, audio, and file attachments

### 2. Storage Setup
- Created `chat-files` storage bucket in Supabase
- 10MB file size limit
- Public access for viewing files
- Authenticated users can upload files
- Supports: images (jpeg, png, gif, webp), audio (webm, mp3, wav), video (mp4, webm), documents (pdf, doc, docx)

### 3. Updated CommunityPage Component
- Now uses `supabaseChatService` instead of Firestore
- All messages stored in Supabase
- All attachments (images, voice messages, files) stored in Supabase Storage
- Real-time message updates via Supabase subscriptions

## Database Tables Used

### conversations
- `id` (uuid) - Conversation identifier
- `type` (text) - 'public', 'private', or 'group'
- `name` (text) - Conversation name
- `created_at`, `updated_at` (timestamps)

### chat_messages
- `id` (uuid) - Message identifier
- `conversation_id` (uuid) - Links to conversations table
- `sender_id` (text) - Firebase Auth UID
- `sender_name` (text) - Display name
- `content` (text) - Message content
- `content_type` (text) - 'text', 'image', 'audio', or 'file'
- `attachment_url` (text) - URL to stored file
- `attachment_metadata` (jsonb) - File name, size, type
- `deleted`, `edited` (boolean)
- `created_at`, `updated_at` (timestamps)

### message_reactions
- Links users to emoji reactions on messages

### message_read_receipts
- Tracks which users have read which messages

## Features Supported
- Text messages
- Image attachments
- Voice messages (audio recording)
- File attachments
- Real-time message updates
- Message history
- Public community room

## Public Room
- UUID: `00000000-0000-0000-0000-000000000001`
- Name: "Community Chat"
- Type: public
- Available to all users

## Notes
- Firebase Auth is still used for user authentication
- User IDs from Firebase Auth are stored as sender_id in Supabase
- All file uploads are handled by Supabase Storage
- Real-time updates use Supabase's realtime subscriptions
