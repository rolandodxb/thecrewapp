import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Send, AlertCircle, HelpCircle } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { doc, updateDoc, getDoc, setDoc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { auditLogService } from '../../../services/auditLogService';

interface CommandResponse {
  success: boolean;
  message: string;
  timestamp: Date;
}

const COMMANDS = {
  '/help': 'Show all available commands',
  '/user ban <email>': 'Ban a user by email',
  '/user unban <email>': 'Unban a user by email',
  '/user promote <email> <role>': 'Change user role (student, crew, mentor, governor)',
  '/user mute <email>': 'Mute a user in chat',
  '/user unmute <email>': 'Unmute a user in chat',
  '/system clear-cache': 'Clear system cache',
  '/feature disable <name>': 'Disable a feature',
  '/feature enable <name>': 'Enable a feature',
  '/stats users': 'Show user statistics',
  '/stats courses': 'Show course statistics',
  '/clear': 'Clear console output',
};

export default function CommandConsole() {
  const { currentUser } = useApp();
  const [command, setCommand] = useState('');
  const [responses, setResponses] = useState<CommandResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showHelp, setShowHelp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isGovernor = currentUser?.role === 'governor';

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const addResponse = (success: boolean, message: string) => {
    setResponses((prev) => [{ success, message, timestamp: new Date() }, ...prev]);
  };

  const executeCommand = async (cmd: string) => {
    const parts = cmd.toLowerCase().trim().split(' ');
    const mainCmd = parts[0];

    if (!currentUser) {
      addResponse(false, 'User not authenticated');
      return;
    }

    try {
      switch (mainCmd) {
        case '/help':
          setShowHelp(true);
          addResponse(true, 'Showing command help panel');
          break;

        case '/clear':
          setResponses([]);
          addResponse(true, 'Console cleared');
          break;

        case '/user':
          await handleUserCommand(parts.slice(1));
          break;

        case '/system':
          await handleSystemCommand(parts.slice(1));
          break;

        case '/feature':
          await handleFeatureCommand(parts.slice(1));
          break;

        case '/stats':
          await handleStatsCommand(parts.slice(1));
          break;

        default:
          addResponse(false, `Unknown command: ${mainCmd}. Type /help for available commands.`);
      }
    } catch (error: any) {
      addResponse(false, `Error: ${error.message}`);
    }
  };

  const handleUserCommand = async (args: string[]) => {
    const action = args[0];
    const email = args[1];

    if (!email) {
      addResponse(false, 'Email required. Usage: /user <action> <email>');
      return;
    }

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      addResponse(false, `User not found: ${email}`);
      return;
    }

    const userDoc = snapshot.docs[0];
    const userRef = doc(db, 'users', userDoc.id);

    switch (action) {
      case 'ban':
        await updateDoc(userRef, { banned: true });
        await auditLogService.log(currentUser!.uid, currentUser!.email, `Banned user ${email}`, 'admin_action', { targetEmail: email });
        addResponse(true, `User ${email} has been banned`);
        break;

      case 'unban':
        await updateDoc(userRef, { banned: false });
        await auditLogService.log(currentUser!.uid, currentUser!.email, `Unbanned user ${email}`, 'admin_action', { targetEmail: email });
        addResponse(true, `User ${email} has been unbanned`);
        break;

      case 'mute':
        await updateDoc(userRef, { muted: true });
        await auditLogService.log(currentUser!.uid, currentUser!.email, `Muted user ${email}`, 'moderation', { targetEmail: email });
        addResponse(true, `User ${email} has been muted`);
        break;

      case 'unmute':
        await updateDoc(userRef, { muted: false });
        await auditLogService.log(currentUser!.uid, currentUser!.email, `Unmuted user ${email}`, 'moderation', { targetEmail: email });
        addResponse(true, `User ${email} has been unmuted`);
        break;

      case 'promote':
        const newRole = args[2];
        if (!['student', 'crew', 'mentor', 'governor'].includes(newRole)) {
          addResponse(false, 'Invalid role. Use: student, crew, mentor, or governor');
          return;
        }
        await updateDoc(userRef, { role: newRole });
        await auditLogService.log(currentUser!.uid, currentUser!.email, `Changed ${email} role to ${newRole}`, 'role_change', { targetEmail: email, newRole });
        addResponse(true, `User ${email} promoted to ${newRole}`);
        break;

      default:
        addResponse(false, `Unknown user action: ${action}`);
    }
  };

  const handleSystemCommand = async (args: string[]) => {
    const action = args[0];

    switch (action) {
      case 'clear-cache':
        addResponse(true, 'System cache cleared (simulated)');
        await auditLogService.log(currentUser!.uid, currentUser!.email, 'Cleared system cache', 'system', {});
        break;

      default:
        addResponse(false, `Unknown system action: ${action}`);
    }
  };

  const handleFeatureCommand = async (args: string[]) => {
    const action = args[0];
    const featureName = args.slice(1).join(' ');

    if (!featureName) {
      addResponse(false, 'Feature name required. Usage: /feature <enable|disable> <name>');
      return;
    }

    const controlRef = doc(db, 'systemControl', 'status');
    const controlDoc = await getDoc(controlRef);

    if (!controlDoc.exists()) {
      addResponse(false, 'System control document not found');
      return;
    }

    const features = controlDoc.data().features || {};

    switch (action) {
      case 'disable':
        features[featureName] = { enabled: false };
        await updateDoc(controlRef, { features });
        await auditLogService.log(currentUser!.uid, currentUser!.email, `Disabled feature: ${featureName}`, 'feature_shutdown', { feature: featureName });
        addResponse(true, `Feature "${featureName}" disabled`);
        break;

      case 'enable':
        features[featureName] = { enabled: true };
        await updateDoc(controlRef, { features });
        await auditLogService.log(currentUser!.uid, currentUser!.email, `Enabled feature: ${featureName}`, 'feature_shutdown', { feature: featureName });
        addResponse(true, `Feature "${featureName}" enabled`);
        break;

      default:
        addResponse(false, `Unknown feature action: ${action}`);
    }
  };

  const handleStatsCommand = async (args: string[]) => {
    const type = args[0];

    switch (type) {
      case 'users':
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersByRole: Record<string, number> = {};
        usersSnapshot.docs.forEach(doc => {
          const role = doc.data().role || 'student';
          usersByRole[role] = (usersByRole[role] || 0) + 1;
        });
        const statsMsg = `Total Users: ${usersSnapshot.size}\n${Object.entries(usersByRole).map(([role, count]) => `  ${role}: ${count}`).join('\n')}`;
        addResponse(true, statsMsg);
        break;

      case 'courses':
        const coursesSnapshot = await getDocs(collection(db, 'courses'));
        const published = coursesSnapshot.docs.filter(doc => doc.data().published).length;
        addResponse(true, `Total Courses: ${coursesSnapshot.size}\nPublished: ${published}\nDrafts: ${coursesSnapshot.size - published}`);
        break;

      default:
        addResponse(false, `Unknown stats type: ${type}. Use: users, courses`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || !isGovernor) return;

    setLoading(true);
    setHistory(prev => [command, ...prev.slice(0, 49)]);
    setHistoryIndex(-1);

    try {
      await executeCommand(command);
      setCommand('');
    } catch (error: any) {
      addResponse(false, `Error executing command: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommand(history[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(history[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full glass-light rounded-xl shadow-lg p-3 md:p-6 border-2 border-transparent hover:border-gray-200 transition overflow-hidden"
    >
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Terminal className="w-4 h-4 md:w-5 md:h-5 text-gray-700 flex-shrink-0" />
        <h2 className="text-base md:text-xl font-bold text-gray-900 tracking-tight">Command Console</h2>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="ml-auto p-2 hover:bg-gray-200 rounded-lg transition"
        >
          <HelpCircle className="w-4 h-4 text-gray-600" />
        </button>
        {!isGovernor && (
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full uppercase tracking-wide font-bold border border-yellow-300 flex-shrink-0">
            View Only
          </span>
        )}
      </div>

      {!isGovernor && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-yellow-700">
            Only governors can execute commands.
          </p>
        </div>
      )}

      {showHelp && (
        <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <h3 className="font-bold text-blue-900 mb-2">Available Commands:</h3>
          <div className="space-y-1 text-sm font-mono">
            {Object.entries(COMMANDS).map(([cmd, desc]) => (
              <div key={cmd} className="flex flex-col sm:flex-row sm:gap-4">
                <span className="text-blue-700 font-bold break-all">{cmd}</span>
                <span className="text-blue-600 text-xs sm:text-sm">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isGovernor ? "Type /help for commands" : "Command disabled"}
            disabled={!isGovernor || loading}
            className="flex-1 px-3 md:px-4 py-2 md:py-3 bg-gray-900 text-green-400 font-mono text-xs md:text-sm rounded-lg border-2 border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#D71920] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!isGovernor || loading || !command.trim()}
            className="px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-lg text-sm font-bold hover:from-[#B91518] hover:to-[#A01315] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 shadow-md uppercase tracking-wide"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-3 h-3 md:w-4 md:h-4" />
            )}
            <span className="hidden sm:inline">Execute</span>
          </button>
        </div>
      </form>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {responses.length === 0 ? (
          <div className="text-center py-8 glass-light rounded-xl border-2 border-gray-200">
            <Terminal className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-600 font-mono text-sm">Awaiting commands...</p>
            <p className="text-xs text-gray-500 mt-2">Type /help to see available commands</p>
          </div>
        ) : (
          responses.map((response, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-3 rounded-lg border-2 ${
                response.success
                  ? 'bg-green-50 border-green-300'
                  : 'bg-red-50 border-red-300'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className={`text-xs font-bold uppercase tracking-wide ${
                  response.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {response.success ? '✓ SUCCESS' : '✗ ERROR'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 font-mono whitespace-pre-wrap break-words">{response.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {response.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
