import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ModerationWarningModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

export function ModerationWarningModal({ isOpen, message, onClose }: ModerationWarningModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-3"
      style={{ zIndex: 9999999 }}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-white flex-shrink-0" />
          <h3 className="text-white font-semibold text-sm">Content Warning</h3>
        </div>

        <div className="p-4">
          <p className="text-gray-700 text-sm mb-3">
            {message}
          </p>

          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium py-2 px-4 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all text-sm"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
