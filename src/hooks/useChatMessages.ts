import { useState, useEffect, useCallback, useRef } from 'react';
import { DocumentSnapshot } from 'firebase/firestore';
import { communityChatService, Message } from '../services/communityChatService';

const PAGE_SIZE = 30;

export function useChatMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setHasMore(true);
      setLastDoc(null);
      return;
    }

    setLoading(true);

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    unsubscribeRef.current = communityChatService.subscribeToMessages(
      conversationId,
      (newMessages) => {
        setMessages((prev) => {
          const messageMap = new Map<string, Message>();
          [...prev, ...newMessages].forEach(msg => {
            if (msg.messageId) {
              messageMap.set(msg.messageId, msg);
            }
          });
          return Array.from(messageMap.values()).sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || 0;
            const bTime = b.createdAt?.toMillis?.() || 0;
            return aTime - bTime;
          });
        });
        setLoading(false);
      },
      (error) => {
        console.error('Error subscribing to messages:', error);
        setLoading(false);
      },
      PAGE_SIZE
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [conversationId]);

  const loadMoreMessages = useCallback(async () => {
    if (!conversationId || loading || !hasMore) return;

    setLoading(true);
    try {
      const { messages: olderMessages, lastDoc: newLastDoc } = await communityChatService.getMessages(
        conversationId,
        PAGE_SIZE,
        lastDoc || undefined
      );

      if (olderMessages.length < PAGE_SIZE) {
        setHasMore(false);
      }

      setMessages((prev) => {
        const messageMap = new Map<string, Message>();
        [...olderMessages, ...prev].forEach(msg => {
          if (msg.messageId) {
            messageMap.set(msg.messageId, msg);
          }
        });
        return Array.from(messageMap.values()).sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return aTime - bTime;
        });
      });
      setLastDoc(newLastDoc);
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId, loading, hasMore, lastDoc]);

  return {
    messages,
    loading,
    hasMore,
    loadMoreMessages,
  };
}
