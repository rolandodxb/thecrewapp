import { useState } from 'react';
import { Terminal, Send } from 'lucide-react';
import { motion } from 'framer-motion';

interface CommandResult {
  command: string;
  output: string;
  timestamp: Date;
  success: boolean;
}

export default function CommandConsole() {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<CommandResult[]>([]);

  const commands = [
    { cmd: 'enable', desc: 'Enable a feature (e.g., enable aiTrainer)' },
    { cmd: 'disable', desc: 'Disable a feature (e.g., disable chat)' },
    { cmd: 'maintenance', desc: 'Toggle maintenance mode' },
    { cmd: 'announce', desc: 'Create system announcement' },
    { cmd: 'backup', desc: 'Trigger system backup' },
    { cmd: 'clear', desc: 'Clear console history' },
  ];

  const executeCommand = () => {
    if (!command.trim()) return;

    const result: CommandResult = {
      command: command.trim(),
      timestamp: new Date(),
      success: true,
      output: '',
    };

    const parts = command.trim().split(' ');
    const cmd = parts[0].toLowerCase();

    switch (cmd) {
      case 'enable':
        result.output = parts[1] ? `✅ Feature '${parts[1]}' enabled successfully` : '❌ Usage: enable <feature>';
        result.success = !!parts[1];
        break;
      case 'disable':
        result.output = parts[1] ? `✅ Feature '${parts[1]}' disabled successfully` : '❌ Usage: disable <feature>';
        result.success = !!parts[1];
        break;
      case 'maintenance':
        result.output = parts[1] === 'on' ? '✅ Maintenance mode enabled' : '✅ Maintenance mode disabled';
        break;
      case 'announce':
        result.output = parts.slice(1).length ? `✅ Announcement created: "${parts.slice(1).join(' ')}"` : '❌ Usage: announce <message>';
        result.success = parts.slice(1).length > 0;
        break;
      case 'backup':
        result.output = '✅ System backup initiated successfully';
        break;
      case 'clear':
        setHistory([]);
        setCommand('');
        return;
      case 'help':
        result.output = 'Available commands:\n' + commands.map(c => `  ${c.cmd} - ${c.desc}`).join('\n');
        break;
      default:
        result.output = `❌ Unknown command: '${cmd}'. Type 'help' for available commands.`;
        result.success = false;
    }

    setHistory([...history, result]);
    setCommand('');
  };

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-3">
          <Terminal className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">Command Console</h1>
            <p className="text-gray-300 mt-1">Execute system commands and monitor activity</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900 rounded-xl shadow-2xl overflow-hidden"
      >
        <div className="bg-gray-800 px-4 py-2 flex items-center gap-2 border-b border-gray-700">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="ml-3 text-sm text-gray-400 font-mono">governor@crews-academy:~$</span>
        </div>

        <div className="p-6 h-96 overflow-y-auto font-mono text-sm">
          {history.length === 0 ? (
            <div className="text-gray-500">
              <p>Crews Academy Governor Console v1.0</p>
              <p className="mt-2">Type 'help' for available commands.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((result, index) => (
                <div key={index} className="space-y-1">
                  <div className="text-green-400">
                    $ {result.command}
                  </div>
                  <div className={result.success ? 'text-gray-300' : 'text-red-400'}>
                    {result.output}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-800 px-6 py-4 border-t border-gray-700">
          <div className="flex items-center gap-3">
            <span className="text-green-400 font-mono">$</span>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && executeCommand()}
              placeholder="Type a command..."
              className="flex-1 bg-transparent text-white font-mono outline-none"
            />
            <button
              onClick={executeCommand}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Send className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {commands.slice(0, 5).map((cmd) => (
              <button
                key={cmd.cmd}
                onClick={() => setCommand(cmd.cmd + ' ')}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-gray-300 transition-colors"
              >
                {cmd.cmd}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
