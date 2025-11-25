import { useEffect, useRef, useCallback } from 'react';
import { Message } from '../../services/communityChatService';
import ChatMessageBubble from './ChatMessageBubble';
import { Loader2 } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  typingUsers?: Array<{ userId: string; userName: string }>;
  onReact?: (messageId: string, emoji: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onReport?: (messageId: string) => void;
}

export default function MessageList({
  messages,
  currentUserId,
  loading = false,
  hasMore = false,
  onLoadMore,
  typingUsers = [],
  onReact,
  onEdit,
  onReport,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const topElementRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef(0);
  const isInitialLoadRef = useRef(true);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior,
      });
    }
  }, []);

  useEffect(() => {
    if (isInitialLoadRef.current && messages.length > 0) {
      setTimeout(() => scrollToBottom('auto'), 100);
      isInitialLoadRef.current = false;
    }
  }, [messages.length, scrollToBottom]);

  useEffect(() => {
    if (!topElementRef.current || !onLoadMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const currentScrollHeight = scrollRef.current?.scrollHeight || 0;
          prevScrollHeightRef.current = currentScrollHeight;
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(topElementRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, onLoadMore]);

  useEffect(() => {
    if (!loading && prevScrollHeightRef.current > 0 && scrollRef.current) {
      const newScrollHeight = scrollRef.current.scrollHeight;
      const scrollDiff = newScrollHeight - prevScrollHeightRef.current;
      scrollRef.current.scrollTop = scrollDiff;
      prevScrollHeightRef.current = 0;
    }
  }, [loading, messages]);

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};

    messages.forEach((message) => {
      const date = message.createdAt?.toDate?.();
      if (!date) return;

      const dateKey = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });

    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto px-3 py-3 space-y-3">
      {hasMore && (
        <div ref={topElementRef} className="flex justify-center py-4">
          {loading && <Loader2 className="w-6 h-6 animate-spin text-gray-400" />}
        </div>
      )}

      {Object.keys(messageGroups).length === 0 && !loading && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <p className="text-base font-medium mb-1">No messages yet</p>
            <p className="text-xs">Start the conversation!</p>
          </div>
        </div>
      )}

      {Object.entries(messageGroups).map(([date, msgs]) => (
        <div key={date}>
          <div className="flex justify-center my-3">
            <div className="px-3 py-0.5 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">
              {date}
            </div>
          </div>
          <div className="space-y-2">
            {msgs.map((message, index) => {
              const showAvatar =
                index === 0 ||
                msgs[index - 1].senderId !== message.senderId;

              return (
                <ChatMessageBubble
                  key={message.messageId}
                  message={message}
                  currentUserId={currentUserId}
                  showAvatar={showAvatar}
                  onReact={onReact}
                  onEdit={onEdit}
                  onReport={onReport}
                />
              );
            })}
          </div>
        </div>
      ))}

      {typingUsers.length > 0 && (
        <div className="flex items-start gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
            <span className="text-xs">👤</span>
          </div>
          <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                ></span>
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                ></span>
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                ></span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
