# Activity Social Proof System Documentation

## Overview

Complete post-activity social proof system with photo galleries, reactions, comments, reviews, and engagement analytics. All data stored in Firestore.

## Features Implemented

### ✅ Photo Gallery System
- Organizer photo upload after activity ends
- Multiple photos per activity
- Photo captions and user tagging
- Photo ordering and management
- Firebase Storage integration

### ✅ Social Engagement
- 4 types of reactions (like, love, celebrate, inspiring)
- Photo comments with @mentions
- Activity reviews with 5-star ratings
- Verified attendee badges
- Helpful/not helpful voting on reviews

### ✅ Engagement Analytics
- Total photos, reactions, comments, reviews
- Engagement rate calculation
- Attendee engagement percentage
- Reaction breakdown by type
- Review distribution (5-star ratings)
- Top performing photos
- Real-time analytics dashboard

### ✅ Attendance Integration
- Gallery linked to attendee list
- Verified attendee badges on reviews
- Attendee-only features
- Engagement tracking per attendee

## Firestore Collections

### 1. `activity_galleries` Collection
```typescript
{
  id: string;
  activityId: string;
  activityName: string;
  organizerId: string;
  organizerName: string;
  status: 'active' | 'archived';
  totalPhotos: number;
  totalReactions: number;
  totalComments: number;
  totalReviews: number;
  averageRating: number;
  attendeeCount: number;
  attendeeIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 2. `activity_media` Collection (Photos)
```typescript
{
  id: string;
  galleryId: string;
  activityId: string;
  uploadedBy: string;
  uploaderName: string;
  photoUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  taggedUsers: string[];
  reactions: {
    like: number;
    love: number;
    celebrate: number;
    inspiring: number;
  };
  commentCount: number;
  order: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 3. `photo_reactions` Collection
```typescript
{
  id: string (photoId-userId);
  photoId: string;
  userId: string;
  userName: string;
  reactionType: 'like' | 'love' | 'celebrate' | 'inspiring';
  createdAt: Timestamp;
}
```

### 4. `photo_comments` Collection
```typescript
{
  id: string;
  photoId: string;
  galleryId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  comment: string;
  mentions: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 5. `activity_reviews` Collection
```typescript
{
  id: string;
  galleryId: string;
  activityId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number (1-5);
  review: string;
  attendedActivity: boolean;
  verified: boolean;
  helpful: number;
  notHelpful: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## User Flow

### For Organizers

**1. Create Gallery After Activity**
```typescript
const gallery = await activitySocialProofService.createGallery(
  activityId,
  activityName,
  organizerId,
  organizerName,
  attendeeIds
);
```

**2. Upload Photos**
- Click "Upload Photos" button
- Select photo from device
- Photo automatically uploaded to Firebase Storage
- Photo added to gallery
- Counts updated in real-time

**3. View Analytics**
- Click "Analytics" button
- See engagement metrics:
  - Engagement rate
  - Attendee engagement
  - Reaction breakdown
  - Review distribution
  - Top performing photos

### For Attendees & Viewers

**1. View Gallery**
- Navigate to `/activity-gallery/:galleryId`
- See all photos in grid layout
- View activity stats (photos, reactions, comments, rating)

**2. React to Photos**
- Click photo to open lightbox
- Choose reaction type:
  - 👍 Like (blue)
  - ❤️ Love (red)
  - 🏆 Celebrate (yellow)
  - ✨ Inspiring (purple)
- Reaction count updates instantly
- Click again to remove reaction

**3. Comment on Photos**
- Open photo lightbox
- Type comment in input field
- Use @username to mention users
- Press Enter or click Send
- Comment appears immediately

**4. Write Reviews**
- Click "Write a Review" button
- Select star rating (1-5)
- Write detailed review
- Submit review
- Verified badge if attended activity

## API / Service Methods

### Gallery Management

```typescript
// Create gallery
const gallery = await activitySocialProofService.createGallery(
  activityId,
  activityName,
  organizerId,
  organizerName,
  attendeeIds
);

// Get gallery
const gallery = await activitySocialProofService.getGallery(galleryId);

// Get galleries by activity
const galleries = await activitySocialProofService.getGalleriesByActivity(activityId);

// Get recent galleries
const galleries = await activitySocialProofService.getRecentGalleries(limit);

// Search galleries
const galleries = await activitySocialProofService.searchGalleries(searchTerm);
```

### Photo Management

```typescript
// Upload photo
const photo = await activitySocialProofService.uploadPhoto(
  galleryId,
  activityId,
  uploaderId,
  uploaderName,
  photoFile,
  caption,
  taggedUsers
);

// Get gallery photos
const photos = await activitySocialProofService.getGalleryPhotos(galleryId);

// Delete photo
await activitySocialProofService.deletePhoto(photoId, galleryId);
```

### Reactions

```typescript
// Add/remove/change reaction
await activitySocialProofService.addReaction(
  photoId,
  userId,
  userName,
  reactionType // 'like' | 'love' | 'celebrate' | 'inspiring'
);

// Get user's reaction
const reaction = await activitySocialProofService.getUserReaction(photoId, userId);
```

### Comments

```typescript
// Add comment
const comment = await activitySocialProofService.addComment(
  photoId,
  galleryId,
  userId,
  userName,
  comment,
  userPhoto
);

// Get photo comments
const comments = await activitySocialProofService.getPhotoComments(photoId);

// Delete comment
await activitySocialProofService.deleteComment(commentId, photoId, galleryId);
```

### Reviews

```typescript
// Add review
const review = await activitySocialProofService.addReview(
  galleryId,
  activityId,
  userId,
  userName,
  rating,
  reviewText,
  attendedActivity,
  userPhoto
);

// Get activity reviews
const reviews = await activitySocialProofService.getActivityReviews(galleryId);

// Mark review helpful
await activitySocialProofService.markReviewHelpful(reviewId, helpful);
```

### Analytics

```typescript
// Get engagement analytics
const analytics = await activitySocialProofService.getEngagementAnalytics(galleryId);

// Returns:
{
  galleryId: string;
  activityId: string;
  totalViews: number;
  totalPhotos: number;
  totalReactions: number;
  totalComments: number;
  totalReviews: number;
  averageRating: number;
  reactionBreakdown: {
    like: number;
    love: number;
    celebrate: number;
    inspiring: number;
  };
  topPhotos: Array<{
    photoId: string;
    photoUrl: string;
    reactions: number;
    comments: number;
  }>;
  engagementRate: number; // (total engagements / attendees) * 100
  attendeeEngagement: number; // (attendees who engaged / total attendees) * 100
  reviewDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}
```

## Component Usage

### ActivityPhotoGallery Component

```typescript
<ActivityPhotoGallery
  galleryId={galleryId}
  activityId={activityId}
  canUpload={isOrganizer}
/>
```

**Props:**
- `galleryId`: Gallery ID to display
- `activityId`: Activity ID
- `canUpload`: Boolean, allows photo deletion for organizers

**Features:**
- Grid layout of photos
- Hover effects showing reactions/comments
- Lightbox view on click
- Reaction buttons
- Comment section
- Real-time updates

## Page Routes

### `/activity-gallery/:galleryId`

**Access:** Public (all users)

**Features:**
- View photo gallery
- React to photos
- Comment on photos
- Write reviews
- Organizer: Upload photos
- Organizer: View analytics

**URL Parameters:**
- `galleryId`: Gallery ID

**Example:**
```
/activity-gallery/abc123xyz
```

## Analytics Metrics Explained

### Engagement Rate
```
(Total Reactions + Total Comments + Total Reviews) / Attendee Count × 100
```
Shows overall activity engagement level.

### Attendee Engagement
```
(Number of Attendees Who Engaged) / Total Attendees × 100
```
Shows what percentage of attendees participated in social proof.

### Top Photos
Ranked by: `Total Reactions + Total Comments`

Photos with most engagement appear first.

## Integration Example

### After Activity Ends

```typescript
// In your activity management system
async function endActivity(activityId: string, attendeeIds: string[]) {
  // 1. Mark activity as ended
  await updateActivityStatus(activityId, 'completed');

  // 2. Create social proof gallery
  const gallery = await activitySocialProofService.createGallery(
    activityId,
    activityName,
    currentUser.uid,
    currentUser.name,
    attendeeIds
  );

  // 3. Redirect organizer to gallery
  navigate(`/activity-gallery/${gallery.id}`);

  // 4. Notify attendees about gallery
  await notifyAttendees(attendeeIds, {
    title: 'Activity Photos Available!',
    message: `Check out photos from ${activityName}`,
    link: `/activity-gallery/${gallery.id}`
  });
}
```

## Security Features

### Photo Upload Validation
- Only organizers can upload to their galleries
- File type validation (images only)
- File size limits enforced by Firebase Storage

### Reaction Validation
- One reaction per user per photo
- Can change reaction type
- Click again to remove reaction

### Comment Moderation
- Comments can be deleted by author or organizer
- @mentions extracted automatically
- Character limits can be added

### Review Validation
- One review per user per activity
- Verified badge only for attendees
- Rating must be 1-5 stars

## Firebase Storage Structure

```
activity-photos/
  {activityId}/
    {photoId}
    {photoId}
    ...
```

Photos stored with unique IDs in activity-specific folders.

## Real-Time Updates

All counts update automatically:
- Reaction counts
- Comment counts
- Review counts
- Average ratings
- Gallery totals

Changes propagate immediately through Firestore.

## Mobile Responsive

- Grid layout adjusts to screen size
- Lightbox optimized for mobile
- Touch-friendly reaction buttons
- Swipe gestures supported
- Optimized image loading

## Performance Optimizations

- Lazy loading images
- Thumbnail generation (optional)
- Pagination for large galleries
- Query limits on comments
- Efficient Firestore indexes

## Future Enhancements

- [ ] Photo albums within galleries
- [ ] Video uploads support
- [ ] Photo editing (crop, rotate, filters)
- [ ] Slideshow mode
- [ ] Download all photos (organizer)
- [ ] Photo tagging with face recognition
- [ ] Custom reaction types
- [ ] Comment threading (replies)
- [ ] Review sorting (helpful, recent, highest)
- [ ] Photo contests and voting
- [ ] Share gallery on social media
- [ ] Embed gallery on website
- [ ] Gallery privacy settings
- [ ] Bulk photo upload
- [ ] Photo captions editing

## Testing Guide

### Test Gallery Creation
1. Complete an activity
2. Call `createGallery()` with attendee IDs
3. Verify gallery created in Firestore
4. Check all fields populated

### Test Photo Upload
1. Navigate to gallery as organizer
2. Click "Upload Photos"
3. Select image file
4. Verify upload to Firebase Storage
5. Check photo appears in gallery
6. Verify `totalPhotos` incremented

### Test Reactions
1. Open photo lightbox
2. Click different reaction buttons
3. Verify reaction counts update
4. Click same button to remove
5. Check Firestore `photo_reactions`

### Test Comments
1. Open photo lightbox
2. Type comment with @mention
3. Press Enter to submit
4. Verify comment appears
5. Check mentions extracted
6. Verify `commentCount` incremented

### Test Reviews
1. Click "Write a Review"
2. Select star rating
3. Write review text
4. Submit review
5. Check verified badge (if attendee)
6. Verify average rating updated

### Test Analytics
1. Log in as organizer
2. Click "Analytics" button
3. Verify all metrics displayed
4. Check calculations correct
5. Test top photos ranking

## Governor Tools

Governors can:
- View all galleries
- View all photos and engagement
- Access detailed analytics
- Moderate comments and reviews
- Delete inappropriate content
- Archive galleries
- Generate reports

## Key Benefits

### For Organizers
- Showcase successful events
- Increase future registrations
- Understand attendee satisfaction
- Identify popular moments
- Build community engagement

### For Attendees
- Relive memories
- Share experiences
- Connect with other attendees
- Provide feedback
- Feel part of community

### For Platform
- Social proof for marketing
- User-generated content
- Increased engagement
- Retention tool
- Community building

---

**System Status**: ✅ Fully Implemented & Production Ready
**Build Status**: ✅ Successful
**Firestore Collections**: ✅ 5 collections created
**Firebase Storage**: ✅ Integrated
**UI Components**: ✅ Gallery + Lightbox + Analytics
**Real-Time**: ✅ All updates instant
**Mobile**: ✅ Fully responsive
