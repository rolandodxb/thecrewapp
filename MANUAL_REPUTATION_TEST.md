# Manual Reputation System Testing

## ⚠️ If Test Button Doesn't Work

The automated test button requires proper Firebase permissions. Here's how to test manually:

## 🎯 Simple Manual Tests (No Code Required)

### Test 1: View Your Reputation (30 seconds)
1. Log in to your account
2. Click **Profile** in sidebar
3. Scroll down to see **Reputation Score** card
4. **Expected**: Shows score of 50, "Trusted" badge, metrics

### Test 2: Change Your Score (1 minute)
**As Governor:**
1. Click **Reputation Manager** in sidebar (or go to `/governor/reputation`)
2. Use search to find your username
3. Click **Override** button on your row
4. Change score to `85` in the input box
5. Type reason: `"Testing high score"`
6. Click **Save**
7. Go back to Profile page
8. **Expected**: Score now shows 85, "Elite" purple badge

### Test 3: Test Rate Limiting (2 minutes)
1. Set your score to `30` (via Governor override)
2. Go to **Community Feed** (`/community-feed`)
3. Try to create 6 posts quickly:
   - Post 1: "Test 1" ✅
   - Post 2: "Test 2" ✅
   - Post 3: "Test 3" ✅
   - Post 4: "Test 4" ✅
   - Post 5: "Test 5" ✅
   - Post 6: "Test 6" ❌ Should be blocked!
4. **Expected**: 6th post shows error "You've reached your posting limit"

### Test 4: Test Cooldown Mode (1 minute)
1. Set your score to `15` (via Governor override)
2. Go to **Community Feed**
3. Try to create any post
4. **Expected**: Error message "Your account is in cooldown mode"
5. Go to Profile
6. **Expected**: Red warning box showing cooldown active

### Test 5: Test High Score Perks (1 minute)
1. Set your score to `90` (via Governor override)
2. Go to Profile
3. **Expected**:
   - Gold "Legendary" badge
   - Perks section shows all 4 perks active
   - Can post 50 times per hour

### Test 6: Test Visibility Toggle (30 seconds)
1. Go to Profile
2. Click the **eye icon** in Reputation card
3. **Expected**: Icon changes to "eye-off", score becomes private
4. Click again
5. **Expected**: Icon back to "eye", score public again

## 🔍 Debug Steps If Issues Occur

### If Reputation Card Doesn't Show:
1. Open browser console (F12)
2. Look for any red errors
3. Check if you're logged in
4. Try refreshing the page
5. Check Firebase connection

### If Override Doesn't Work:
1. Verify you have "governor" role
2. Check browser console for errors
3. Try refreshing the Reputation Manager page
4. Verify Firebase rules allow writes to `user_reputation` collection

### If Rate Limiting Doesn't Work:
1. Check your current score in Profile
2. Delete old test posts from today
3. Wait 1 hour and try again
4. Check browser console for errors

## 📊 Quick Reference

### Score Ranges:
- **0-19**: Cooldown (can't post for 24h)
- **20-39**: Limited (5 posts/hour)
- **40-59**: Normal (20 posts/hour)
- **60-74**: Enhanced (20 posts/hour + fast posting)
- **75-89**: Elite (50 posts/hour + special badge)
- **90-100**: Legendary (50 posts/hour + all perks)

### What Increases Score:
- Creating helpful posts (posts with 5+ likes or 3+ comments)
- Posting consistently (3+ posts per week)
- Being active in chat
- Good marketplace ratings (if you're a seller)

### What Decreases Score:
- AI moderation violations: -15 each
- AI moderation warnings: -5 each

## 🛠️ Manual Score Calculation

If you want to test score calculation:

1. Create some posts with quality content
2. Get some likes on your posts
3. Be active in Community Chat
4. Go to Governor Reputation Manager
5. Click **"Recalculate All"** button
6. Wait 30-60 seconds
7. Check your Profile - score should update based on your activity

## ✅ What Success Looks Like

**Profile Page:**
- ✅ Reputation card visible
- ✅ Score displayed (0-100)
- ✅ Tier badge with correct color
- ✅ Metrics shown when clicking "Show Details"
- ✅ Perks displayed if score > 75
- ✅ Cooldown warning if score < 20

**Reputation Manager:**
- ✅ Can see all users with scores
- ✅ Can search by name
- ✅ Can override scores
- ✅ Stats cards show correct counts
- ✅ Recalculate All button works

**Rate Limiting:**
- ✅ Can post normally with good score
- ✅ Blocked after limit reached
- ✅ Clear error messages
- ✅ Cooldown prevents posting when score < 20

## 📝 Test Results Checklist

Test each and mark complete:

- [ ] Reputation shows on Profile
- [ ] Score defaults to 50 for new users
- [ ] Can change score via Governor override
- [ ] Score change reflects on Profile
- [ ] Tier badge changes with score
- [ ] Rate limiting works (test with score 30)
- [ ] Cooldown blocks posting (test with score 15)
- [ ] High score unlocks perks (test with score 85)
- [ ] Visibility toggle works
- [ ] Reputation Manager shows all users
- [ ] Can search users
- [ ] Recalculate All works
- [ ] Error messages are clear

## 🚨 Common Issues & Solutions

**"Test Reputation" button doesn't work:**
- This is OK! Use manual tests above instead
- Button requires special Firebase permissions
- All features work without automated tests

**Score won't change:**
- Make sure you clicked "Save" after override
- Refresh the page
- Check browser console for errors

**Can still post despite cooldown:**
- Verify score is actually < 20
- Check Profile to confirm cooldown is active
- Try refreshing and posting again

**Perks not showing:**
- Score must be ≥75 for highlight badge
- Score must be ≥60 for fast posting
- Score must be ≥90 for priority support
- Refresh Profile page

## 💡 Pro Tips

1. **Test with multiple scores**: Try 15, 30, 50, 80, and 95 to see all tiers
2. **Check Profile after each change**: Always verify changes took effect
3. **Use Governor dashboard**: Easiest way to change scores
4. **Monitor browser console**: Shows helpful debug info
5. **Test rate limits carefully**: Don't get yourself actually limited!

---

**Remember**: The system works even if automated tests don't run. Manual testing is just as effective!
