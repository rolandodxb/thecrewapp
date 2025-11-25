# Reputation System Testing Guide

This guide will help you test the complete AI-powered behavior scoring system.

## Quick Start Testing

### 1. Initialize Your Reputation Score

**Method A: Automatic (First Login)**
- Simply log in to your account
- The system will automatically create your reputation profile
- Default score: 50 (Trusted tier)

**Method B: Manual Initialization**
- Go to your Profile page
- The ReputationDisplay component will auto-initialize if needed
- Score will appear within 2-3 seconds

### 2. View Your Reputation

**Profile Page** (`/profile`)
- Scroll down to see your Reputation Score card
- Shows your score, tier badge, and metrics
- Click "Show Details" to see:
  - Helpful posts count
  - Total posts
  - Engagement score
  - Consistency score
  - Violations/warnings
- Toggle visibility with the eye icon

### 3. Test Posting Rate Limits

**Low Score Testing** (Score < 40):
1. Use Governor dashboard to set your score to 30
2. Try to post in Community Feed
3. You should be limited to 5 posts/hour

**Very Low Score Testing** (Score < 20):
1. Set your score to 15 via Governor dashboard
2. Try to post in Community Feed
3. You should see: "Your account is in cooldown mode"
4. Wait time: 24 hours
5. Only 2 posts/hour allowed after cooldown

**High Score Testing** (Score 75+):
1. Set your score to 80 via Governor dashboard
2. Post frequently in Community Feed
3. You should be able to post up to 50 times/hour
4. Notice your "Elite" badge

### 4. Test AI Moderation Impact on Score

**Get Warnings**:
1. Post slightly inappropriate content
2. AI moderator will warn you (orange modal)
3. After a few warnings, check your score
4. It should decrease (-5 per warning)

**Get Violations**:
1. Post clearly inappropriate content
2. AI moderator will block it
3. Check your score
4. It should decrease significantly (-15 per block)

### 5. Test Score Calculation

**Increase Your Score**:

**A. Create Helpful Posts**:
- Post quality content in Community Feed
- Get 5+ likes OR 3+ comments
- Each helpful post = +3 points
- Check score in Governor dashboard

**B. Be Consistent**:
- Post at least 3 times per week
- Consistency metric increases
- Adds up to +15 points

**C. High Engagement**:
- Send messages in Community Chat
- Post regularly in Feed
- Adds up to +20 points

**D. Marketplace Rating** (if seller):
- Sell products with good ratings
- Each 5-star rating boosts score
- Adds up to +25 points

### 6. Test Weekly Recalculation

**Manual Trigger** (Governor only):
1. Go to `/governor/reputation`
2. Click "Recalculate All" button
3. Wait 30-60 seconds
4. All scores will be updated
5. Check your profile to see new score

**Automatic Schedule**:
- Runs every Sunday at midnight
- All scores auto-update
- No action needed

### 7. Test Governor Override

**As Governor**:
1. Go to `/governor/reputation`
2. Find a user in the table
3. Click "Override" button
4. Enter new score (0-100)
5. Enter reason: "Testing manual override"
6. Click "Save"
7. User's score updates immediately
8. Check user's profile - shows "Manual Override Active" badge

### 8. Test Perks Unlock

**Fast Posting (Score 60+)**:
- Set score to 65
- Max posts/hour: 20
- Faster than normal users

**Highlight Badge (Score 75+)**:
- Set score to 80
- Purple/gradient badge appears
- "Elite" tier
- Posts may be featured

**Visibility Boost (Score 75+)**:
- Same as highlight badge
- Content prioritized in feeds

**Priority Support (Score 90+)**:
- Set score to 95
- "Legendary" tier
- Gold crown badge
- VIP support access

### 9. Test Visibility Toggle

**Make Private**:
1. Go to your Profile
2. Click the eye icon in Reputation card
3. Icon changes to "eye-off"
4. Other users can't see your score
5. They see "Reputation score is private"

**Make Public**:
1. Click eye icon again
2. Score becomes visible to everyone

### 10. Test Different Tiers

Set your score to test each tier:

**Novice (0-39)**:
```
Score: 25
Badge: Gray shield
Restrictions: 5 posts/hour max
Status: Limited posting
```

**Trusted (40-59)**:
```
Score: 50
Badge: Green star
Restrictions: 20 posts/hour
Status: Normal access
```

**Veteran (60-74)**:
```
Score: 65
Badge: Blue award
Perks: Fast posting (20 posts/hour)
Status: Enhanced
```

**Elite (75-89)**:
```
Score: 80
Badge: Purple sparkles
Perks: Fast posting, Highlight badge, Visibility boost
Status: Premium
```

**Legendary (90-100)**:
```
Score: 95
Badge: Gold crown
Perks: All perks + Priority support
Status: VIP
```

## Testing Scenarios

### Scenario 1: New User Journey
1. Register new account
2. Check profile - should show 50 score
3. Make 3 quality posts
4. Get some likes
5. Wait or trigger recalculation
6. Score should increase to ~55-60

### Scenario 2: Bad Behavior
1. Post spam content
2. Get AI warnings
3. Continue posting spam
4. Get violations
5. Score drops to ~30
6. Limited to 5 posts/hour
7. Try posting 6th time - blocked

### Scenario 3: Redemption
1. Start with low score (30)
2. Post helpful content over time
3. Engage positively in chat
4. Avoid violations
5. After recalculation: score increases
6. Restrictions lift
7. Unlock perks

### Scenario 4: Governor Management
1. As Governor, go to `/governor/reputation`
2. Search for specific user
3. Review their metrics
4. If score is wrong, override
5. Set correct score with reason
6. Verify in user's profile
7. Check audit logs

## API Testing (Developer Console)

```javascript
// Initialize reputation for current user
const userId = auth.currentUser.uid;
const userName = auth.currentUser.displayName;
await reputationService.initializeReputation(userId, userName);

// Get reputation
const rep = await reputationService.getReputation(userId);
console.log('My reputation:', rep);

// Check if posting allowed
const check = await reputationService.checkPostingAllowed(userId);
console.log('Can post?', check);

// Calculate score (recalculate)
const newScore = await reputationService.calculateUserScore(userId);
console.log('New score:', newScore);

// Toggle visibility
await reputationService.toggleVisibility(userId, false); // make private
await reputationService.toggleVisibility(userId, true);  // make public
```

## Expected Results

### Initial State
- Score: 50
- Tier: Trusted
- Perks: None
- Restrictions: Normal (20 posts/hour)

### After 5 Helpful Posts
- Score: ~65
- Tier: Veteran
- Perks: Fast posting
- Restrictions: 20 posts/hour

### After 10 Helpful Posts + Consistency
- Score: ~80
- Tier: Elite
- Perks: Fast posting, Highlight badge, Visibility boost
- Restrictions: 50 posts/hour

### After Violations
- Score: Decreases by 15 per violation
- May enter cooldown if score drops below 20
- Restrictions increase

## Troubleshooting

### Score Not Showing
1. Refresh the page
2. Check browser console for errors
3. Verify you're logged in
4. Check Firebase connection

### Score Not Updating
1. Trigger manual recalculation in Governor dashboard
2. Check if enough activity (need posts/engagement)
3. Verify data exists in `user_reputation` collection

### Rate Limit Not Working
1. Check your current score
2. Verify reputation service is imported
3. Check browser console for errors
4. Clear recent posts older than 1 hour

### Perks Not Unlocking
1. Verify score is above threshold
2. Refresh page
3. Check perk flags in Firebase
4. Trigger recalculation

## Firebase Collections to Monitor

### `user_reputation`
```
Document ID: userId
Fields:
- score: number
- tier: string
- metrics: object
- perks: object
- restrictions: object
- history: array
```

### `moderation_logs`
```
Used to calculate violations/warnings
Affects score calculation
```

### `community_posts`
```
Used to calculate helpful posts
Checks likes and comments
```

### `marketplace_products`
```
Used for seller ratings
Affects score for sellers
```

## Governor Dashboard Features

### Stats Overview
- Total users with reputation
- Average reputation score
- High reputation count (75+)
- Low reputation count (<40)

### User Management
- Search by name/ID
- View all metrics
- See restrictions
- Manual override with reason
- Inline editing

### Bulk Operations
- Recalculate all scores
- Takes 1-2 minutes for 100+ users
- Shows progress

## Best Practices for Testing

1. **Start Clean**: Use a test account
2. **Document Changes**: Note what you do
3. **Test Edge Cases**: Very low/high scores
4. **Test Rate Limits**: Try rapid posting
5. **Test Cooldowns**: Set score < 20
6. **Test Visibility**: Toggle public/private
7. **Test Override**: Use Governor dashboard
8. **Monitor Logs**: Check browser console
9. **Verify Data**: Check Firebase directly
10. **Test Perks**: Verify each unlock threshold

## Need Help?

- Check browser console for errors
- Verify Firebase rules allow access
- Ensure you have proper role (Governor for management)
- Contact system admin if data is corrupted
- Use "Recalculate All" to fix inconsistencies
