import { useState, useEffect, useCallback, useRef } from 'react';
import { presenceService, TypingData } from '../services/presenceService';

const TYPING_TIMEOUT = 3000;

export function useTypingIndicator(conversationId: string | null, userId: string, userName: string) {
  const [typingUsers, setTypingUsers] = useState<TypingData[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!conversationId) {
      setTypingUsers([]);
      return;
    }

    const unsubscribe = presenceService.subscribeToTyping(conversationId, (typing) => {
      setTypingUsers(typing.filter((t) => t.userId !== userId));
    });

    return () => {
      unsubscribe();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId, userId]);

  const startTyping = useCallback(() => {
    if (!conversationId) return;

    presenceService.setTyping(conversationId, userName);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      presenceService.clearTyping(conversationId);
    }, TYPING_TIMEOUT);
  }, [conversationId, userName]);

  const stopTyping = useCallback(() => {
    if (!conversationId) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    presenceService.clearTyping(conversationId);
  }, [conversationId]);

  return {
    typingUsers,
    startTyping,
    stopTyping,
  };
}
