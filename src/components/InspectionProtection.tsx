import { useEffect } from 'react';

interface InspectionProtectionProps {
  children: React.ReactNode;
  enabled?: boolean;
}

export default function InspectionProtection({ children, enabled = true }: InspectionProtectionProps) {
  useEffect(() => {
    if (!enabled) return;

    // Disable right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
        return false;
      }
    };

    // Detect DevTools
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;

      if (widthThreshold || heightThreshold) {
        document.body.innerHTML = `
          <div style="
            position: fixed;
            inset: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: system-ui, -apple-system, sans-serif;
            z-index: 999999;
          ">
            <div style="
              background: white;
              padding: 3rem;
              border-radius: 1rem;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
              text-align: center;
              max-width: 500px;
            ">
              <div style="
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 1.5rem;
              ">
                <svg style="width: 40px; height: 40px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 style="font-size: 1.875rem; font-weight: 700; color: #1f2937; margin-bottom: 1rem;">
                Protected Area
              </h1>
              <p style="color: #6b7280; font-size: 1rem; line-height: 1.75;">
                This section contains sensitive information and cannot be inspected.
                Please close developer tools to continue.
              </p>
            </div>
          </div>
        `;
      }
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    // Check for DevTools every 500ms
    const interval = setInterval(detectDevTools, 500);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      clearInterval(interval);
    };
  }, [enabled]);

  return <>{children}</>;
}
