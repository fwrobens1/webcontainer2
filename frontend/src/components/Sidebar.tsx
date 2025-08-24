import React from 'react';
import { 
  FolderTree, 
  MessageSquare, 
  Settings, 
  Zap, 
  Code2, 
  Terminal,
  FileText,
  Layers,
  GitBranch
} from 'lucide-react';

interface SidebarProps {
  activeView: 'chat' | 'files' | 'terminal';
  onViewChange: (view: 'chat' | 'files' | 'terminal') => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const menuItems = [
    { id: 'chat' as const, icon: MessageSquare, label: 'Chat' },
    { id: 'files' as const, icon: FolderTree, label: 'Files' },
    { id: 'terminal' as const, icon: Terminal, label: 'Terminal' },
  ];

  return (
    <div className="w-16 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-4">
      {/* Logo */}
      <div className="mb-8">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex flex-col space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
              activeView === item.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            title={item.label}
          >
            <item.icon className="w-5 h-5" />
          </button>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="mt-auto">
        <button className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-200">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}