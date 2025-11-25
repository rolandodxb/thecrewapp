# Quick Test Guide - Reputation System

## 🚀 Quick Start (2 minutes)

### 1. View Your Score
- Go to **Profile** (`/profile`)
- Scroll down to see **Reputation Score** card
- Default score: **50** (Trusted tier)

### 2. Test Basic Features
**As Governor:**
1. Click **Test Reputation** in sidebar (NEW badge)
2. Click **"Run All Tests"** button
3. Watch tests execute automatically
4. All should pass with green checkmarks ✅

### 3. Test Score Changes
**Via Governor Dashboard:**
1. Go to **Reputation Manager** in sidebar
2. Find your user in the table
3. Click **"Override"** button
4. Set score to **85**
5. Enter reason: "Testing"
6. Click **"Save"**
7. Go to Profile - see new score!

## 🎯 Test Scenarios (Choose One)

### Scenario A: High Reputation User (2 min)
```
1. Set score to 90 via Governor dashboard
2. Check Profile - see "Legendary" gold badge
3. Try posting in Community Feed
4. Can post up to 50 times/hour
5. See Priority Support perk active
```

### Scenario B: Low Reputation User (2 min)
```
1. Set score to 30 via Governor dashboard
2. Check Profile - see "Novice" gray badge
3. Try posting in Community Feed
4. Limited to 5 posts/hour
5. Post 6 times quickly - should be blocked
```

### Scenario C: Cooldown Mode (2 min)
```
1. Set score to 15 via Governor dashboard
2. Try posting in Community Feed
3. See error: "Your account is in cooldown mode"
4. Check Profile - see cooldown warning
5. 24-hour restriction active
```

## 📍 Key Locations

| Feature | Location | Badge |
|---------|----------|-------|
| Your Score | `/profile` | Auto-shown |
| Test Page | `/governor/reputation-tester` | TEST |
| Manager | `/governor/reputation` | NEW |
| Guidelines | `REPUTATION_SYSTEM_TESTING_GUIDE.md` | - |

## ⚡ Quick Commands (Browser Console)

```javascript
// Get your current reputation
const rep = await reputationService.getReputation(auth.currentUser.uid);
console.log(rep);

// Check if you can post
const check = await reputationService.checkPostingAllowed(auth.currentUser.uid);
console.log(check);

// Recalculate your score
const score = await reputationService.calculateUserScore(auth.currentUser.uid);
console.log('New score:', score);
```

## 🎨 What Each Score Unlocks

| Score | Tier | Badge Color | Perks | Posts/Hour |
|-------|------|-------------|-------|------------|
| 0-39 | Novice | Gray | None | 2-5 |
| 40-59 | Trusted | Green | Standard | 20 |
| 60-74 | Veteran | Blue | Fast Posting | 20 |
| 75-89 | Elite | Purple | + Highlight Badge<br>+ Visibility Boost | 50 |
| 90-100 | Legendary | Gold | + Priority Support | 50 |

## ✅ Expected Behavior

### When Score < 20:
- ⛔ **Cooldown mode** active
- ⏰ 24-hour posting restriction
- 📉 Only 2 posts/hour after cooldown
- 🔴 Red warning on profile

### When Score 20-39:
- ⚠️ **Limited posting**
- 📊 5 posts/hour maximum
- 🟡 Orange status

### When Score 40-59:
- ✅ **Normal access**
- 📝 20 posts/hour
- 🟢 Green status

### When Score 60-74:
- 🚀 **Enhanced**
- 📝 20 posts/hour
- 🔵 Blue badge

### When Score 75+:
- ⭐ **Premium/VIP**
- 📝 50 posts/hour
- 🎨 Special badge
- 🎯 Featured content
- 💬 Priority support (90+)

## 🐛 Troubleshooting

**Score not showing?**
- Refresh page
- Check you're logged in
- System auto-initializes on first view

**Can't post despite good score?**
- Check recent posts (within 1 hour)
- Verify cooldown not active
- Recalculate score in Governor dashboard

**Tests failing?**
- Check Firebase connection
- Ensure Governor role
- Check browser console for errors

## 📱 Testing Checklist

- [ ] View reputation on profile
- [ ] Run automated tests
- [ ] Change score via override
- [ ] Test rate limiting (post 6 times quickly with score 30)
- [ ] Test cooldown mode (score 15)
- [ ] Test high score perks (score 85)
- [ ] Toggle visibility (eye icon)
- [ ] View in Reputation Manager
- [ ] Trigger recalculation
- [ ] Check badge appears correctly

## 🎓 Full Documentation
See `REPUTATION_SYSTEM_TESTING_GUIDE.md` for comprehensive testing instructions.

---

**Need Help?** Check browser console for detailed logs and errors.
