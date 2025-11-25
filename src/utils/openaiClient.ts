import { supabase } from '../lib/supabase';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  output_text: string;
  tokens_used?: number;
}

export class OpenAIClient {
  async sendMessage(
    messages: Message[],
    userId: string
  ): Promise<{ reply: string; tokensUsed?: number }> {
    try {
      if (!userId) {
        throw new Error('User ID is required. Please log in.');
      }

      const { data, error } = await supabase.functions.invoke('ai', {
        body: { messages, userId },
      });

      if (error) {
        console.error('Edge function error:', error);

        if (error.message?.includes('OpenAI API key not configured')) {
          throw new Error('AI service is not configured. Please contact the administrator to set up the OpenAI API key.');
        }

        throw new Error(error.message || 'Failed to get AI response');
      }

      if (!data) {
        throw new Error('No response from AI service');
      }

      console.log('Success response:', data);

      return {
        reply: data.output_text,
        tokensUsed: data.tokens_used,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      console.error('AI Client Error:', err);
      console.error('Error details:', error);
      throw err;
    }
  }

  async streamChat(
    messages: Message[],
    options: {
      userId: string;
      onChunk?: (content: string) => void;
      onComplete?: (totalTokens?: number) => void;
      onError?: (error: Error) => void;
    }
  ): Promise<string> {
    try {
      const result = await this.sendMessage(messages, options.userId);

      if (options.onChunk) {
        options.onChunk(result.reply);
      }

      if (options.onComplete) {
        options.onComplete(result.tokensUsed);
      }

      return result.reply;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      if (options.onError) {
        options.onError(err);
      }
      throw err;
    }
  }
}

export const openaiClient = new OpenAIClient();
