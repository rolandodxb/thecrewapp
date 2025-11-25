import { aiContextService, UserContext } from './aiContextService';

export type AIMode = 'coach' | 'cv-mentor' | 'tech-support' | 'marketplace-advisor' | 'content-instructor';

interface AIPersonality {
  systemPrompt: string;
  greeting: string;
  icon: string;
  color: string;
}

const AI_PERSONALITIES: Record<AIMode, AIPersonality> = {
  'coach': {
    systemPrompt: `You are an expert cabin crew training coach with years of aviation experience.
    You provide practical training advice, simulate interview scenarios, and help students prepare for their aviation career.
    Be motivational, professional, and focus on real-world cabin crew scenarios.`,
    greeting: "Ready to ace your cabin crew training? Let's get started!",
    icon: '🎯',
    color: 'bg-blue-600',
  },
  'cv-mentor': {
    systemPrompt: `You are a professional CV and resume optimization expert specializing in aviation careers.
    Analyze CVs, suggest improvements, highlight strengths, and ensure the resume meets airline standards.
    Be constructive, detailed, and focus on making candidates stand out.`,
    greeting: "Let me help you create a CV that airlines can't ignore!",
    icon: '📄',
    color: 'bg-green-600',
  },
  'tech-support': {
    systemPrompt: `You are a helpful technical support assistant for the platform.
    Help users navigate features, troubleshoot issues, and understand how to use the platform effectively.
    Be patient, clear, and provide step-by-step guidance.`,
    greeting: "Need help with the platform? I'm here to assist!",
    icon: '🛠️',
    color: 'bg-purple-600',
  },
  'marketplace-advisor': {
    systemPrompt: `You are a marketplace and business advisor helping users buy and sell training materials.
    Provide insights on pricing, product creation, marketing strategies, and buyer recommendations.
    Be business-savvy, data-driven, and focus on maximizing value.`,
    greeting: "Let's grow your marketplace presence together!",
    icon: '💼',
    color: 'bg-orange-600',
  },
  'content-instructor': {
    systemPrompt: `You are an educational content expert helping users learn and understand training modules.
    Explain concepts clearly, provide examples, answer questions, and guide through learning materials.
    Be pedagogical, encouraging, and break down complex topics into simple explanations.`,
    greeting: "Ready to learn? Let's make this module easy to understand!",
    icon: '📚',
    color: 'bg-indigo-600',
  },
};

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AIResponse {
  message: string;
  suggestions?: string[];
  actionItems?: Array<{
    title: string;
    action: string;
    icon: string;
  }>;
}

class EnhancedAIService {
  private currentMode: AIMode = 'coach';
  private conversationHistory: Map<string, Message[]> = new Map();

  setMode(mode: AIMode) {
    this.currentMode = mode;
  }

  getMode(): AIMode {
    return this.currentMode;
  }

  getPersonality(mode: AIMode): AIPersonality {
    return AI_PERSONALITIES[mode];
  }

  private buildContextPrompt(context: UserContext, mode: AIMode): string {
    const personality = AI_PERSONALITIES[mode];

    let contextPrompt = `${personality.systemPrompt}\n\n`;
    contextPrompt += `USER CONTEXT:\n`;
    contextPrompt += `- Name: ${context.profile.name}\n`;
    contextPrompt += `- Role: ${context.role}\n`;
    contextPrompt += `- Experience: ${context.profile.experience || 'Not specified'}\n`;
    contextPrompt += `- Progress: ${context.progress.completedModules} modules completed, ${context.progress.totalPoints} points\n`;
    contextPrompt += `- Level: ${context.progress.currentLevel}\n`;

    if (context.role === 'student') {
      contextPrompt += `- Enrolled in ${context.progress.enrolledCourses} courses\n`;
      contextPrompt += `- Purchased ${context.marketplace.purchasedProducts.length} marketplace items\n`;
    }

    if (context.role === 'coach' || context.role === 'mentor') {
      contextPrompt += `- Created ${context.modules.created} modules\n`;
      contextPrompt += `- ${context.analytics?.studentCount || 0} students enrolled\n`;
      contextPrompt += `- Total revenue: ${context.analytics?.revenue || 0} credits\n`;
    }

    if (context.role === 'governor' || context.role === 'moderator') {
      contextPrompt += `- Has moderation and governance permissions\n`;
    }

    contextPrompt += `\nBased on this context, provide personalized and relevant assistance.`;

    return contextPrompt;
  }

  async generateAIResponse(
    userId: string,
    userMessage: string,
    mode?: AIMode
  ): Promise<AIResponse> {
    const activeMode = mode || this.currentMode;
    const context = await aiContextService.getUserContext(userId);

    const conversationId = `${userId}-${activeMode}`;
    let history = this.conversationHistory.get(conversationId) || [];

    if (history.length === 0) {
      history.push({
        role: 'system',
        content: this.buildContextPrompt(context, activeMode),
      });
    }

    history.push({
      role: 'user',
      content: userMessage,
    });

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          messages: history,
          mode: activeMode,
          userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('AI service error:', errorData);
        throw new Error(errorData.error || 'AI service unavailable');
      }

      const data = await response.json();

      if (data.error) {
        console.error('AI API Error:', data.error);
        throw new Error(data.error);
      }

      const aiMessage = data.output_text || data.message || data.response || 'I apologize, but I could not generate a response.';

      history.push({
        role: 'assistant',
        content: aiMessage,
      });

      if (history.length > 20) {
        history = [history[0], ...history.slice(-19)];
      }

      this.conversationHistory.set(conversationId, history);

      const suggestions = this.generateSuggestions(context, activeMode, userMessage);
      const actionItems = this.generateActionItems(context, activeMode);

      return {
        message: aiMessage,
        suggestions,
        actionItems,
      };
    } catch (error) {
      console.error('AI generation error:', error);
      return this.getFallbackResponse(context, activeMode, userMessage);
    }
  }

  private generateSuggestions(context: UserContext, mode: AIMode, userMessage: string): string[] {
    const suggestions: string[] = [];

    if (mode === 'coach') {
      if (context.progress.completedModules < 5) {
        suggestions.push('Complete your foundational modules first');
      }
      suggestions.push('Practice mock interviews');
      suggestions.push('Review safety procedures');
    }

    if (mode === 'cv-mentor') {
      suggestions.push('Highlight your customer service experience');
      suggestions.push('Add language proficiency details');
      suggestions.push('Include relevant certifications');
    }

    if (mode === 'marketplace-advisor') {
      if (context.role === 'coach' || context.role === 'mentor') {
        suggestions.push('Create a digital product bundle');
        suggestions.push('Analyze top-selling products');
      } else {
        suggestions.push('Browse training materials');
        suggestions.push('Check new arrivals');
      }
    }

    if (mode === 'content-instructor') {
      suggestions.push('Review module summary');
      suggestions.push('Take practice quiz');
      suggestions.push('Watch video tutorial');
    }

    return suggestions.slice(0, 3);
  }

  private generateActionItems(context: UserContext, mode: AIMode): Array<{ title: string; action: string; icon: string }> {
    const actions: Array<{ title: string; action: string; icon: string }> = [];

    if (mode === 'coach' && context.role === 'student') {
      if (context.progress.enrolledCourses > 0) {
        actions.push({
          title: 'Continue Learning',
          action: 'view-courses',
          icon: '📖',
        });
      }
      actions.push({
        title: 'Practice Simulation',
        action: 'open-simulator',
        icon: '✈️',
      });
    }

    if (mode === 'cv-mentor') {
      actions.push({
        title: 'Upload CV for Analysis',
        action: 'upload-cv',
        icon: '📤',
      });
      actions.push({
        title: 'View CV Templates',
        action: 'view-templates',
        icon: '📋',
      });
    }

    if (mode === 'marketplace-advisor') {
      if (context.role === 'coach' || context.role === 'mentor') {
        actions.push({
          title: 'Create Product',
          action: 'create-product',
          icon: '➕',
        });
        actions.push({
          title: 'View Analytics',
          action: 'view-analytics',
          icon: '📊',
        });
      } else {
        actions.push({
          title: 'Browse Marketplace',
          action: 'view-marketplace',
          icon: '🛍️',
        });
      }
    }

    if (mode === 'content-instructor' && context.progress.enrolledCourses > 0) {
      actions.push({
        title: 'My Progress',
        action: 'view-progress',
        icon: '📈',
      });
    }

    return actions;
  }

  private getFallbackResponse(context: UserContext, mode: AIMode, userMessage: string): AIResponse {
    const personality = AI_PERSONALITIES[mode];

    let fallbackMessage = `Hello ${context.profile.name}! `;

    if (mode === 'coach') {
      fallbackMessage += `I'm here to help you with your cabin crew training. You've completed ${context.progress.completedModules} modules so far. What would you like to work on today?`;
    } else if (mode === 'cv-mentor') {
      fallbackMessage += `I can help you optimize your CV for airline applications. Would you like to review your current CV or create a new one?`;
    } else if (mode === 'tech-support') {
      fallbackMessage += `I'm here to help with any platform issues. What feature would you like assistance with?`;
    } else if (mode === 'marketplace-advisor') {
      if (context.role === 'coach' || context.role === 'mentor') {
        fallbackMessage += `You've sold ${context.marketplace.soldProducts.length} products. Let's discuss how to grow your marketplace presence!`;
      } else {
        fallbackMessage += `I can help you find the perfect training materials. What are you looking for?`;
      }
    } else if (mode === 'content-instructor') {
      fallbackMessage += `You're enrolled in ${context.progress.enrolledCourses} courses. Which module would you like help with?`;
    }

    return {
      message: fallbackMessage,
      suggestions: this.generateSuggestions(context, mode, userMessage),
      actionItems: this.generateActionItems(context, mode),
    };
  }

  clearConversation(userId: string, mode?: AIMode) {
    const conversationId = `${userId}-${mode || this.currentMode}`;
    this.conversationHistory.delete(conversationId);
  }

  getRealtimeSuggestions(context: UserContext): Array<{
    type: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
    action?: string;
  }> {
    const suggestions: Array<{
      type: string;
      message: string;
      priority: 'high' | 'medium' | 'low';
      action?: string;
    }> = [];

    if (context.role === 'student') {
      if (context.progress.enrolledCourses === 0) {
        suggestions.push({
          type: 'course',
          message: 'Start your first course to begin your cabin crew journey',
          priority: 'high',
          action: 'browse-courses',
        });
      }

      if (context.progress.completedModules > 0 && context.progress.completedModules % 5 === 0) {
        suggestions.push({
          type: 'achievement',
          message: `Congratulations on completing ${context.progress.completedModules} modules! Keep it up!`,
          priority: 'medium',
        });
      }

      if (context.marketplace.purchasedProducts.length === 0) {
        suggestions.push({
          type: 'marketplace',
          message: 'Check out exclusive training materials in the marketplace',
          priority: 'low',
          action: 'view-marketplace',
        });
      }
    }

    if (context.role === 'coach' || context.role === 'mentor') {
      if (context.modules.created === 0) {
        suggestions.push({
          type: 'module',
          message: 'Create your first module to start earning',
          priority: 'high',
          action: 'create-module',
        });
      }

      if (context.analytics && context.analytics.studentCount > 10 && context.marketplace.soldProducts.length === 0) {
        suggestions.push({
          type: 'marketplace',
          message: 'You have an engaged audience! Consider creating marketplace products',
          priority: 'medium',
          action: 'create-product',
        });
      }
    }

    if (context.community.postsCount === 0) {
      suggestions.push({
        type: 'community',
        message: 'Share your experience with the community',
        priority: 'low',
        action: 'create-post',
      });
    }

    return suggestions;
  }
}

export const enhancedAIService = new EnhancedAIService();
