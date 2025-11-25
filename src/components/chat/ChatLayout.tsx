import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface ChatLayoutProps {
  sidebar: ReactNode;
  navbar: ReactNode;
  messages: ReactNode;
  composer: ReactNode;
  showSidebar?: boolean;
}

export default function ChatLayout({
  sidebar,
  navbar,
  messages,
  composer,
  showSidebar = true,
}: ChatLayoutProps) {
  return (
    <div className="flex h-[calc(100vh-100px)] bg-gray-50 rounded-xl overflow-hidden shadow-xl border border-gray-200">
      {showSidebar && (
        <motion.aside
          initial={{ x: -320 }}
          animate={{ x: 0 }}
          className="w-80 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col"
        >
          {sidebar}
        </motion.aside>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 flex-shrink-0 z-10">
          {navbar}
        </header>

        <main className="flex-1 overflow-hidden bg-gray-50 relative">
          {messages}
        </main>

        <footer className="bg-white border-t border-gray-200 flex-shrink-0">
          {composer}
        </footer>
      </div>
    </div>
  );
}
