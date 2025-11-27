# UI Verification Guide - Targeted Audience & Locked Posts

## ✅ CONFIRMED: Both Features Are Implemented

The code for both features has been verified in the codebase:
- ✅ Targeted Audience selection in CreatePostModal
- ✅ Locked post display in PostCard

---

## How to Test: Targeted Audience Feature

### Prerequisites:
- You must be logged in as a **Governor** or **Mentor**
- Regular users (Free, Pro, VIP, Student) will NOT see this feature

### Steps to Test:

1. **Log in as Governor or Mentor**
   - Email: Your governor/mentor account
   - Password: Your password

2. **Navigate to Community Feed**
   - Click "Community" in the navigation
   - Or go to `/community-feed`

3. **Click "Create Post" button**
   - Look for the floating "+" button or "Create Post" button

4. **You Should See:**
   ```
   ┌─────────────────────────────────────────┐
   │  Create Post                            │
   ├─────────────────────────────────────────┤
   │                                         │
   │  Post Type                              │
   │  [Regular Post] [Product Post]          │
   │                                         │
   │  Channel                                │
   │  [📢 Announcements] [💬 General] [📚 Study] │
   │                                         │
   │  👥 Target Audience *                   │
   │  [Governor/Mentor Only badge]           │
   │  ────────────────────────────────────   │
   │  [All Users]  [Free Only]  [Pro Only]   │
   │  [VIP Only]   [Pro + VIP]               │
   │                                         │
   │  Content *                              │
   │  [Text area...]                         │
   │                                         │
   │  [Create Post Button]                   │
   └─────────────────────────────────────────┘
   ```

5. **Select Different Target Audiences:**
   - Click "All Users" - Everyone can see (default)
   - Click "Free Only" - Only Free users see it
   - Click "Pro Only" - Only Pro subscribers see it
   - Click "VIP Only" - Only VIP members see it
   - Click "Pro + VIP" - All paid members see it

6. **Create a Test Post:**
   - Select "Pro Only"
   - Write: "This is a test Pro-only post"
   - Click "Create Post"

---

## How to Test: Locked Post Visibility

### Test Scenario 1: Free User Viewing Pro Post

1. **Create a Pro-only post** (as Governor/Mentor)
   - Target Audience: "Pro Only"
   - Content: "Exclusive Pro content here!"

2. **Log out and log in as a Free user**

3. **Navigate to Community Feed**

4. **You Should See:**
   ```
   ┌────────────────────────────────────────┐
   │  👤 Author Name          📢 Channel    │
   │  Nov 23                                │
   ├────────────────────────────────────────┤
   │                                        │
   │        🔒 (Gold glowing lock)          │
   │                                        │
   │      Pro Exclusive Content             │
   │                                        │
   │  This post is exclusive to Pro         │
   │  members. Upgrade now to unlock        │
   │  this content and access all           │
   │  premium features!                     │
   │                                        │
   │  ✨ What you'll get:                   │
   │  ✓ Access to exclusive posts           │
   │  ✓ Full community engagement           │
   │                                        │
   │  [Upgrade to Pro] (Gold button)        │
   │  Learn more about our plans            │
   │                                        │
   ├────────────────────────────────────────┤
   │  💬 5  ❤️ 12  (grayed out)            │
   └────────────────────────────────────────┘
   ```

5. **Click "Upgrade to Pro"** - Should redirect to `/upgrade`

### Test Scenario 2: VIP Exclusive Post

1. **Create a VIP-only post** (as Governor/Mentor)
   - Target Audience: "VIP Only"
   - Content: "VIP exclusive opportunity!"

2. **View as Free or Pro user**

3. **You Should See:**
   - 👑 Crown icon (instead of lock)
   - "VIP Exclusive Content" heading
   - Additional benefits shown:
     - ✓ AI Trainer & Open Day Simulator
     - ✓ Direct recruiter access
   - "Upgrade to VIP" button

---

## Troubleshooting

### "I don't see the Target Audience section"

**Possible causes:**
1. ✅ **You're not logged in as Governor or Mentor**
   - Solution: Log in with a Governor or Mentor account
   - Check your role in the database: `users` collection → `role` field

2. ✅ **Browser cache issue**
   - Solution: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - Or clear browser cache and reload

3. ✅ **Using old build**
   - Solution: Run `npm run build` again
   - Restart the dev server

### "I don't see locked posts"

**Possible causes:**
1. ✅ **No posts with targetAudience set**
   - Solution: Create a new post as Governor with specific target

2. ✅ **You're logged in as the wrong user type**
   - Free user should see Pro/VIP posts locked
   - Pro user should see VIP posts locked
   - VIP user sees everything unlocked

3. ✅ **All existing posts have targetAudience='all'**
   - Solution: Create a new test post with specific targeting

---

## Database Verification

### Check if targetAudience field exists:

1. Open Firebase Console → Firestore
2. Navigate to `community_posts` collection
3. Open any post document
4. Look for `targetAudience` field
   - Should be: `'all'`, `'free'`, `'pro'`, `'vip'`, or `'pro-vip'`

### Check user role:

1. Open Firebase Console → Firestore
2. Navigate to `users` collection
3. Find your user document
4. Check `role` field
   - Should be: `'governor'` or `'mentor'` to see targeting feature

---

## Visual Reference

### Target Audience Icons:
- 👥 **All Users** - Everyone
- 🔒 **Free Only** - Gray lock
- ⚡ **Pro Only** - Red lightning bolt
- 👑 **VIP Only** - Gray crown
- 👑 **Pro + VIP** - Purple crown

### Locked Post Colors:
- **Background:** Gold gradient (amber-50 → yellow-50 → amber-100)
- **Lock Circle:** Gold gradient (amber-400 → yellow-500)
- **Button:** Gold gradient (amber-500 → yellow-500 → amber-600)
- **Border:** Amber-200

---

## Developer Testing Commands

### Verify Build:
```bash
npm run build
# Should complete without errors
```

### Check for Feature Code:
```bash
# Check CreatePostModal
grep -n "canTargetAudience" src/components/community/CreatePostModal.tsx

# Check PostCard
grep -n "isPostLocked" src/components/community/PostCard.tsx
```

### Expected Output:
- CreatePostModal should show line with `canTargetAudience` variable
- PostCard should show line with `isPostLocked` logic

---

## Quick Test Script

To quickly verify both features are working:

1. **As Governor:**
   ```
   1. Create post → Select "Pro Only" → Post content: "Pro test"
   2. Create post → Select "VIP Only" → Post content: "VIP test"
   3. Create post → Select "All Users" → Post content: "Everyone test"
   ```

2. **As Free User:**
   ```
   1. View feed
   2. Should see:
      - "Everyone test" → Normal post (unlocked)
      - "Pro test" → 🔒 Gold locked (Upgrade to Pro)
      - "VIP test" → 👑 Gold locked (Upgrade to VIP)
   ```

3. **As Pro User:**
   ```
   1. View feed
   2. Should see:
      - "Everyone test" → Normal post
      - "Pro test" → Normal post (unlocked)
      - "VIP test" → 👑 Gold locked (Upgrade to VIP)
   ```

4. **As VIP User:**
   ```
   1. View feed
   2. Should see:
      - All posts unlocked and normal
      - No gold locks anywhere
   ```

---

## Success Criteria

✅ **Targeted Audience Feature Working:**
- Governor/Mentor sees "Target Audience" section in create post modal
- 5 targeting options visible and selectable
- Badge shows "Governor/Mentor Only"
- Posts save with correct targetAudience field

✅ **Locked Post Visibility Working:**
- Free users see Pro/VIP posts with gold lock overlay
- Lock icon prominent and animated
- "Upgrade to [Plan]" button visible
- Clicking button redirects to /upgrade
- Locked post takes same space as normal post
- Header and footer visible but content hidden

---

## Still Not Working?

If after following this guide the features still don't appear:

1. **Check browser console for errors** (F12 → Console tab)
2. **Verify you're on the latest build** (check timestamp in browser)
3. **Try incognito/private browsing** (eliminates cache issues)
4. **Check database permissions** in Firebase Console
5. **Verify user role** is set correctly in database

**Build timestamp check:**
- Open browser dev tools → Network tab
- Reload page
- Check `index.js` file timestamp
- Should match recent build time

---

## Contact

If features are still not visible after all checks:
- Screenshot the create post modal
- Screenshot a post in the feed
- Check browser console errors
- Verify user role in database

The code is confirmed present and correct. Issues are likely:
- User role not set to governor/mentor
- Browser cache
- Viewing old build
- No test posts with targetAudience set
