# AI Assistant Integration Guide

## Overview
The AI Assistant is a context-aware, role-adaptive chatbot integrated into the coaching platform. It provides personalized assistance based on user role, progress, and activity.

## Components

### 1. **AIContextService** (`src/services/aiContextService.ts`)
Aggregates user data from Firestore to provide full context awareness.

**Features:**
- Fetches user profile, role, and preferences
- Tracks progress (courses, modules, points, badges)
- Monitors marketplace activity (purchases, sales)
- Analyzes community engagement (posts, comments, likes)
- Caches context for 5 minutes to optimize performance

**Usage:**
```typescript
import { aiContextService } from '../services/aiContextService';

const context = await aiContextService.getUserContext(userId);
console.log(context.progress.totalPoints);
```

### 2. **EnhancedAIService** (`src/services/enhancedAIService.ts`)
Manages AI personality modes and generates responses.

**Personality Modes:**
1. **Coach** - Training simulation and interview prep
2. **CV Mentor** - Resume optimization and career advice
3. **Tech Support** - Platform help and troubleshooting
4. **Marketplace Advisor** - Product creation and sales guidance
5. **Content Instructor** - Learning assistance and module explanations

**Role-Adaptive Behavior:**
- **Students**: Get training help, course recommendations, progress insights
- **Coaches/Mentors**: Receive analytics, student management tips, content creation guidance
- **Governors**: Access moderation tools, system insights, platform analytics

**Usage:**
```typescript
import { enhancedAIService } from '../services/enhancedAIService';

// Set personality mode
enhancedAIService.setMode('coach');

// Generate response
const response = await enhancedAIService.generateAIResponse(
  userId,
  'How do I prepare for cabin crew interviews?',
  'coach'
);

console.log(response.message);
console.log(response.suggestions);
console.log(response.actionItems);
```

### 3. **AIAssistant Component** (`src/components/AIAssistant.tsx`)
Full-screen modal chat interface with mode selector.

**Features:**
- Dynamic personality switching
- Conversation history
- Quick suggestions
- Action buttons for common tasks
- Animated UI with framer-motion

**Usage:**
```typescript
import AIAssistant from '../components/AIAssistant';

<AIAssistant
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  initialMode="coach"
/>
```

### 4. **AIAssistantButton** (`src/components/AIAssistantButton.tsx`)
Floating action button to open the AI Assistant.

**Features:**
- Fixed bottom-right positioning
- Animated sparkle effect
- Opens AI Assistant modal

**Usage:**
```typescript
import AIAssistantButton from '../components/AIAssistantButton';

<AIAssistantButton initialMode="coach" />
```

### 5. **AIRealtimeSuggestions** (`src/components/AIRealtimeSuggestions.tsx`)
Contextual suggestion cards displayed on dashboard.

**Features:**
- Priority-based suggestions (high, medium, low)
- Action buttons for quick navigation
- Dismissible cards
- Auto-refresh every 5 minutes

**Usage:**
```typescript
import AIRealtimeSuggestions from '../components/AIRealtimeSuggestions';

<AIRealtimeSuggestions />
```

## Integration Points

### Global Integration
The AI Assistant button is globally available in `App.tsx`:
```typescript
<Layout>
  <AIAssistantButton />
  <Routes>...</Routes>
</Layout>
```

### Dashboard Integration
Realtime suggestions appear at the top of the student dashboard:
```typescript
<Dashboard>
  <AIRealtimeSuggestions />
  ...
</Dashboard>
```

## Backend Edge Function Setup

### Prerequisites
The AI Assistant requires an OpenAI API key to function. You need to:

1. **Get an OpenAI API Key**:
   - Go to https://platform.openai.com/api-keys
   - Create a new API key
   - Copy the key (starts with `sk-`)

2. **Set the API Key in Supabase**:
   ```bash
   # Using Supabase CLI
   supabase secrets set OPENAI_API_KEY=sk-your-api-key-here

   # Or via Supabase Dashboard:
   # Project Settings > Edge Functions > Secrets > Add Secret
   # Name: OPENAI_API_KEY
   # Value: sk-your-api-key-here
   ```

3. **Deploy the Edge Function** (if not already deployed):
   The AI edge function is located at `supabase/functions/ai/index.ts`

### Edge Function Details

The AI uses Supabase Edge Function at `/functions/v1/ai` which:
- Accepts POST requests with `messages`, `mode`, and `userId`
- Calls OpenAI API (gpt-4o-mini) with context-enriched prompts
- Logs all AI interactions to `ai_logs` table
- Returns structured response with message, suggestions, and action items

**Expected Request:**
```json
{
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "How do I prepare?" }
  ],
  "mode": "coach",
  "userId": "user123"
}
```

**Expected Response:**
```json
{
  "output_text": "To prepare for cabin crew interviews...",
  "message": "To prepare for cabin crew interviews...",
  "response": "To prepare for cabin crew interviews...",
  "tokens_used": 150
}
```

## Realtime Suggestions Logic

Based on user context, the system generates smart suggestions:

**For Students:**
- Start first course if not enrolled
- Complete next module
- Check marketplace for materials
- Join community discussions

**For Coaches/Mentors:**
- Create first module if none exist
- Monetize content through marketplace
- View student analytics
- Engage with students

**For Governors:**
- Review moderation queue
- Check system health
- Analyze platform metrics

## Customization

### Adding New AI Modes
Edit `src/services/enhancedAIService.ts`:

```typescript
const AI_PERSONALITIES: Record<AIMode, AIPersonality> = {
  'new-mode': {
    systemPrompt: 'You are a...',
    greeting: 'Hello! I am...',
    icon: '🎨',
    color: 'bg-teal-600',
  },
  ...
};
```

### Customizing Context
Edit `src/services/aiContextService.ts` to add more data sources:

```typescript
private async fetchUserContext(userId: string): Promise<UserContext> {
  // Add new data aggregation here
  const customData = await this.getCustomData(userId);

  return {
    ...context,
    customData,
  };
}
```

## Security Notes

- User context is cached for performance (5-minute TTL)
- All Firestore queries use proper where clauses
- No sensitive data (passwords, tokens) included in context
- Edge function validates user authentication
- Cache is user-specific and isolated

## Performance Optimization

1. **Context Caching**: User context cached for 5 minutes
2. **Lazy Loading**: AI components loaded on-demand
3. **Batch Queries**: Multiple Firestore queries optimized
4. **Fallback Responses**: Offline-friendly with local fallbacks

## Future Enhancements

- [ ] Voice input/output support
- [ ] Multi-language support
- [ ] Advanced analytics integration
- [ ] Custom training on platform-specific data
- [ ] Scheduled AI-driven insights (daily/weekly reports)
- [ ] Integration with recruitment partners
- [ ] Predictive success modeling

## Troubleshooting

**AI not responding / "I apologize, but I could not generate a response":**
1. **Check OpenAI API Key**:
   - Verify the key is set in Supabase: Project Settings > Edge Functions > Secrets
   - The key should start with `sk-`
   - Make sure you have credits in your OpenAI account
2. **Check Supabase Edge Function is deployed**: The `ai` function must be deployed
3. **Verify environment variables**: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in `.env`
4. **Check browser console**: Look for network errors or CORS issues
5. **Check Supabase logs**: Functions > ai > Logs to see error details

**OpenAI API Key errors:**
- Error message will say: "OpenAI API key not configured"
- Solution: Set the OPENAI_API_KEY secret in Supabase (see Backend Edge Function Setup above)

**Context not loading:**
- Verify Firestore permissions
- Check user has required data in collections
- Clear cache: `aiContextService.clearCache(userId)`

**Suggestions not appearing:**
- User may not meet criteria for suggestions
- Check Dashboard component integration
- Verify aiContextService.getRealtimeSuggestions() returns data

**Edge Function timeout:**
- OpenAI API can be slow sometimes
- Check your OpenAI account status and rate limits
- Consider upgrading OpenAI plan for faster responses
