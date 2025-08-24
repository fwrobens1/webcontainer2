import React, { useState } from 'react';
import { 
  FolderTree, 
  File, 
  ChevronRight, 
  ChevronDown, 
  FileText,
  Code,
  Image,
  Settings,
  Package
} from 'lucide-react';
import { FileItem } from '../types';

interface ModernFileExplorerProps {
  files: FileItem[];
  onFileSelect: (file: FileItem) => void;
  selectedFile?: FileItem | null;
}

interface FileNodeProps {
  item: FileItem;
  depth: number;
  onFileClick: (file: FileItem) => void;
  selectedFile?: FileItem | null;
}

function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return Code;
    case 'json':
      return Settings;
    case 'md':
      return FileText;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
      return Image;
    case 'lock':
      return Package;
    default:
      return File;
  }
}

function FileNode({ item, depth, onFileClick, selectedFile }: FileNodeProps) {
  const [isExpanded, setIsExpanded] = useState(depth === 0);
  const isSelected = selectedFile?.path === item.path;
  const IconComponent = item.type === 'folder' ? FolderTree : getFileIcon(item.name);

  const handleClick = () => {
    if (item.type === 'folder') {
      setIsExpanded(!isExpanded);
    } else {
      onFileClick(item);
    }
  };

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 px-2 py-1.5 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors duration-150 ${
          isSelected ? 'bg-blue-600/20 text-blue-400' : 'text-gray-300'
        }`}
        style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
        onClick={handleClick}
      >
        {item.type === 'folder' && (
          <span className="text-gray-400">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </span>
        )}
        <IconComponent className={`w-4 h-4 ${
          item.type === 'folder' 
            ? 'text-blue-400' 
            : isSelected 
              ? 'text-blue-400' 
              : 'text-gray-400'
        }`} />
        <span className="text-sm font-medium truncate">{item.name}</span>
      </div>
      {item.type === 'folder' && isExpanded && item.children && (
        <div>
          {item.children.map((child, index) => (
            <FileNode
              key={`${child.path}-${index}`}
              item={child}
              depth={depth + 1}
              onFileClick={onFileClick}
              selectedFile={selectedFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ModernFileExplorer({ files, onFileSelect, selectedFile }: ModernFileExplorerProps) {
  return (
    <div className="h-full bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-800 p-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <FolderTree className="w-5 h-5 text-blue-400" />
          Explorer
        </h2>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <FolderTree className="w-12 h-12 text-gray-600 mb-3" />
            <p className="text-gray-400 text-sm">No files yet</p>
            <p className="text-gray-500 text-xs mt-1">Files will appear here as you build</p>
          </div>
        ) : (
          <div className="space-y-1">
            {files.map((file, index) => (
              <FileNode
                key={`${file.path}-${index}`}
                item={file}
                depth={0}
                onFileClick={onFileSelect}
                selectedFile={selectedFile}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}