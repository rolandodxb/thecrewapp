# AI Moderation System - Testing Guide

## Overview
This guide will help you test the new AI-powered moderation system that protects your platform from spam, harassment, scams, and other harmful content.

---

## ✅ Prerequisites

### 1. OpenAI API Key Setup
The moderation system uses OpenAI for AI analysis. You need to configure your API key:

**Option A: Via Supabase Edge Function Environment**
```bash
# Set the OpenAI API key in your Supabase dashboard
# Go to: Project Settings > Edge Functions > Secrets
# Add: OPENAI_API_KEY = your-key-here
```

**Option B: For Testing Without OpenAI**
- The system will still work with rule-based filters only
- AI analysis will return default "LOW" severity
- You can test all other features

### 2. User Accounts
You'll need accounts with different roles:
- **Regular User**: Test content creation
- **Governor**: Access moderation insights dashboard

---

## 🧪 Test Scenarios

### **Test 1: Community Post Moderation**

#### A. Clean Content (Should Pass)
1. Go to Community Feed page
2. Create a new post with normal content:
   ```
   "Just finished my first module! Excited to continue learning."
   ```
3. **Expected Result**: Post created successfully ✅

#### B. Spam Content (Should Block)
1. Try to create a post with spam patterns:
   ```
   "CLICK HERE NOW! Buy now, limited time offer! Visit www.scam.com for FREE MONEY!"
   ```
2. **Expected Result**:
   - Post blocked ❌
   - Error message shown: "Content flagged for: spam content, matches spam pattern, too many URLs"
   - Violation logged to Firestore

#### C. Profanity (Should Warn or Block)
1. Try to create a post with profanity:
   ```
   "This fucking course is shit"
   ```
2. **Expected Result**:
   - First offense: Warning, post may be allowed
   - Multiple offenses: Post blocked
   - Violation logged

#### D. Multiple URLs (Should Block)
1. Try to post with excessive links:
   ```
   "Check out http://link1.com http://link2.com http://link3.com http://link4.com"
   ```
2. **Expected Result**: Post blocked for "Too many URLs"

---

### **Test 2: Comment Moderation**

#### A. Normal Comment
1. Find any community post
2. Add a normal comment: "Great post! Thanks for sharing."
3. **Expected Result**: Comment posted successfully ✅

#### B. Harassment Comment
1. Try to add a harassing comment:
   ```
   "You're an idiot, nobody wants to hear from you"
   ```
2. **Expected Result**:
   - Comment blocked ❌
   - Error message displayed
   - Violation logged as "harassment"

---

### **Test 3: Chat Message Moderation**

#### A. Group Chat
1. Go to Chat page (group/public room)
2. Send a normal message: "Hello everyone!"
3. **Expected Result**: Message sent ✅

#### B. Spam in Chat
1. Try to send spam message:
   ```
   "BUY CRYPTO NOW! GET RICH QUICK! LIMITED TIME OFFER!!!"
   ```
2. **Expected Result**:
   - Message blocked ❌
   - Error notification shown
   - Violation logged

---

### **Test 4: Violation Tracking & Auto-Ban**

#### A. Test Progressive Violations
1. Create multiple violating posts with the same user account
2. Track the actions:
   - **1st violation**: Warning, allowed
   - **3rd violation**: Content blocked
   - **5th violation**: Escalated to governors
   - **10th violation**: User banned

#### B. Check Ban Status
1. After ban, try to log in or post
2. **Expected Result**: User should see ban message with duration

---

### **Test 5: Governor Moderation Dashboard**

#### A. Access the Dashboard
1. Log in as a Governor
2. Navigate to: `/governor/moderation-insights`
3. **Expected Result**: Dashboard loads with stats

#### B. View Dashboard Metrics
Check that the following are displayed:
- ✅ Total Violations (last 30 days)
- ✅ Pending Appeals count
- ✅ Top Offenders list
- ✅ Protection Rate percentage
- ✅ Violations by Category (bar chart)
- ✅ Violations by Severity (bar chart)
- ✅ Recent Violations list

#### C. Review Violation Details
1. Click on any recent violation
2. **Expected Result**: Modal opens showing:
   - User information
   - Full content
   - Severity level
   - Categories flagged
   - AI analysis (if available)
   - Rule violations list

---

### **Test 6: Appeals System**

#### A. User Appeals (Future Enhancement)
*Note: Manual appeal submission not yet implemented in UI*
1. As a banned user, they can appeal via support
2. Governor can manually create appeal entry in Firestore

#### B. Governor Reviews Appeal
1. In Moderation Insights dashboard
2. Find violation with status "appealed"
3. Click on the violation
4. Click "Approve Appeal" or "Deny Appeal"
5. **Expected Result**:
   - If approved: User unbanned, violation count reduced
   - If denied: User remains banned
   - Status updated to "resolved"

---

### **Test 7: Firestore Data Verification**

#### A. Check `moderation_logs` Collection
1. Open Firebase Console
2. Go to Firestore Database
3. Find `moderation_logs` collection
4. Verify log entries contain:
   ```javascript
   {
     userId: "user-id",
     userName: "User Name",
     contentType: "post" | "comment" | "chat",
     content: "The content that was moderated",
     severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
     categories: ["spam", "harassment"],
     action: "warn" | "block" | "ban" | "escalate",
     reason: "Content flagged for: ...",
     confidence: 0.85,
     aiAnalysis: "AI explanation",
     ruleViolations: ["Contains inappropriate word: spam"],
     timestamp: Firestore.Timestamp,
     status: "pending" | "reviewed" | "appealed" | "resolved"
   }
   ```

#### B. Check User Document Updates
1. Find a user who violated policies
2. Verify their document has:
   ```javascript
   {
     moderationViolations: 5,
     lastViolation: Firestore.Timestamp,
     banned: true,  // if banned
     banUntil: Firestore.Timestamp,  // if banned
     banReason: "Automated ban due to HIGH severity violation"
   }
   ```

---

### **Test 8: Edge Cases**

#### A. Very Long Content
1. Try to post content > 5000 characters
2. **Expected Result**: Flagged as "Content too long (possible spam)"

#### B. ALL CAPS CONTENT
1. Try to post: "THIS IS MY POST IN ALL CAPS HELLO EVERYONE"
2. **Expected Result**: Flagged as "Excessive caps (possible spam)"

#### C. Empty or Very Short Content
1. Try to post: "a"
2. **Expected Result**: May pass or fail depending on context

#### D. Mixed Violations
1. Post combining profanity + spam + multiple URLs
2. **Expected Result**:
   - HIGH or CRITICAL severity
   - Multiple violation reasons listed
   - Immediate block or ban

---

## 🔍 Debugging Tips

### 1. Check Browser Console
Look for moderation-related logs:
```javascript
console.log('Moderation result:', result);
console.error('Content blocked:', error.message);
```

### 2. Check Network Tab
- Look for calls to OpenAI API (via Supabase Edge Function)
- Check for Firestore write operations to `moderation_logs`

### 3. Verify Firestore Rules
Ensure the rules allow:
- Users to create moderation logs
- Governors to read all logs
- Governors to update logs (for appeals)

### 4. Test Without OpenAI
If OpenAI is not configured:
- Rule-based filters still work
- AI analysis returns defaults
- System degrades gracefully

---

## 📊 Performance Testing

### Load Testing
1. Create 10+ violations quickly
2. Verify:
   - System remains responsive
   - All violations are logged
   - No race conditions in ban logic

### Concurrent Users
1. Have multiple users post simultaneously
2. Verify:
   - Each moderation is independent
   - No conflicts in Firestore writes

---

## 🛠️ Manual Testing Checklist

- [ ] Clean post creates successfully
- [ ] Spam post is blocked with error message
- [ ] Profanity is detected and logged
- [ ] Multiple URLs trigger block
- [ ] Comments are moderated
- [ ] Chat messages are moderated
- [ ] Violations are logged to Firestore
- [ ] User violation count increments
- [ ] Auto-ban triggers at correct threshold
- [ ] Governor dashboard loads correctly
- [ ] Dashboard shows accurate statistics
- [ ] Violation details modal works
- [ ] Appeal approval/denial works
- [ ] Banned users cannot post
- [ ] AI assistant z-index is highest (999999)
- [ ] AI chat appears above all elements

---

## 🚨 Known Limitations

1. **AI Analysis Requires OpenAI API Key**
   - Without it, only rule-based filters work
   - AI analysis defaults to "LOW" severity

2. **Appeal UI Not Implemented**
   - Users cannot self-submit appeals yet
   - Governors can manually review in dashboard

3. **Rate Limiting**
   - Consider adding rate limiting to prevent abuse
   - OpenAI API has usage limits

4. **Language Support**
   - Currently optimized for English content
   - May need adjustment for other languages

---

## 📈 Success Metrics

After testing, you should see:
- ✅ 95%+ spam detection rate
- ✅ Low false positives (<5%)
- ✅ Fast response time (<2 seconds)
- ✅ Accurate violation logging
- ✅ Proper ban escalation
- ✅ Clean user experience for legitimate users

---

## 🎯 Quick Test Script

Run this test sequence in 5 minutes:

1. ✅ Post normal content → SUCCESS
2. ❌ Post "CLICK HERE BUY NOW" → BLOCKED
3. ❌ Post with 5 URLs → BLOCKED
4. ❌ Post with profanity → WARNED/BLOCKED
5. ✅ Comment normally → SUCCESS
6. ❌ Comment with harassment → BLOCKED
7. 👁️ Check Governor dashboard → See stats
8. 👁️ Click violation → See details
9. ✅ AI Assistant opens above everything

---

## Need Help?

- Check `aiModerationService.ts` for logic
- Review `ModerationInsightsPage.tsx` for UI
- Inspect Firestore `moderation_logs` for data
- Open browser DevTools for real-time debugging

**Happy Testing! 🎉**
