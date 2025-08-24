import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { ChatPanel } from '../components/ChatPanel';
import { ModernFileExplorer } from '../components/ModernFileExplorer';
import { ModernCodeEditor } from '../components/ModernCodeEditor';
import { ModernPreview } from '../components/ModernPreview';
import { StepsPanel } from '../components/StepsPanel';
import { Step, FileItem, StepType } from '../types';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import { parseXml } from '../steps';
import { useWebContainer } from '../hooks/useWebContainer';
import { Code, Eye } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function Builder() {
  const location = useLocation();
  const { prompt } = location.state as { prompt: string };
  const [userPrompt, setPrompt] = useState("");
  const [llmMessages, setLlmMessages] = useState<{role: "user" | "assistant", content: string;}[]>([]);
  const [loading, setLoading] = useState(false);
  const [templateSet, setTemplateSet] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const webcontainer = useWebContainer();

  const [currentStep, setCurrentStep] = useState(1);
  const [activeView, setActiveView] = useState<'chat' | 'files' | 'terminal'>('chat');
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  
  const [steps, setSteps] = useState<Step[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const [files, setFiles] = useState<FileItem[]>([]);

  // Add initial message
  useEffect(() => {
    if (prompt) {
      setMessages([{
        id: '1',
        role: 'user',
        content: prompt,
        timestamp: new Date()
      }]);
    }
  }, [prompt]);

  useEffect(() => {
    let originalFiles = [...files];
    let updateHappened = false;
    steps.filter(({status}) => status === "pending").map(step => {
      updateHappened = true;
      if (step?.type === StepType.CreateFile) {
        let parsedPath = step.path?.split("/") ?? []; // ["src", "components", "App.tsx"]
        let currentFileStructure = [...originalFiles]; // {}
        let finalAnswerRef = currentFileStructure;
  
        let currentFolder = ""
        while(parsedPath.length) {
          currentFolder =  `${currentFolder}/${parsedPath[0]}`;
          let currentFolderName = parsedPath[0];
          parsedPath = parsedPath.slice(1);
  
          if (!parsedPath.length) {
            // final file
            let file = currentFileStructure.find(x => x.path === currentFolder)
            if (!file) {
              currentFileStructure.push({
                name: currentFolderName,
                type: 'file',
                path: currentFolder,
                content: step.code
              })
            } else {
              file.content = step.code;
            }
          } else {
            /// in a folder
            let folder = currentFileStructure.find(x => x.path === currentFolder)
            if (!folder) {
              // create the folder
              currentFileStructure.push({
                name: currentFolderName,
                type: 'folder',
                path: currentFolder,
                children: []
              })
            }
  
            currentFileStructure = currentFileStructure.find(x => x.path === currentFolder)!.children!;
          }
        }
        originalFiles = finalAnswerRef;
      }

    })

    if (updateHappened) {

      setFiles(originalFiles)
      setSteps(steps => steps.map((s: Step) => {
        return {
          ...s,
          status: "completed"
        }
        
      }))
    }
    console.log(files);
  }, [steps, files]);

  useEffect(() => {
    const createMountStructure = (files: FileItem[]): Record<string, any> => {
      const mountStructure: Record<string, any> = {};
  
      const processFile = (file: FileItem, isRootFolder: boolean) => {  
        if (file.type === 'folder') {
          // For folders, create a directory entry
          mountStructure[file.name] = {
            directory: file.children ? 
              Object.fromEntries(
                file.children.map(child => [child.name, processFile(child, false)])
              ) 
              : {}
          };
        } else if (file.type === 'file') {
          if (isRootFolder) {
            mountStructure[file.name] = {
              file: {
                contents: file.content || ''
              }
            };
          } else {
            // For files, create a file entry with contents
            return {
              file: {
                contents: file.content || ''
              }
            };
          }
        }
  
        return mountStructure[file.name];
      };
  
      // Process each top-level file/folder
      files.forEach(file => processFile(file, true));
  
      return mountStructure;
    };
  
    const mountStructure = createMountStructure(files);
  
    // Mount the structure if WebContainer is available
    console.log(mountStructure);
    webcontainer?.mount(mountStructure);
  }, [files, webcontainer]);

  async function init() {
    try {
      setError(null);
      console.log('Initializing with prompt:', prompt);
      
      const response = await axios.post(`${BACKEND_URL}/template`, {
        prompt: prompt.trim()
      });
      
      console.log('Template response:', response.data);
      setTemplateSet(true);
      
      const {prompts, uiPrompts} = response.data;

      if (uiPrompts && uiPrompts[0]) {
        const initialSteps = parseXml(uiPrompts[0]);
        console.log('Initial steps:', initialSteps);
        setSteps(initialSteps.map((x: Step) => ({
          ...x,
          status: "pending"
        })));
      }

      setLoading(true);
      const chatMessages = [...prompts, prompt].map(content => ({
        role: "user" as const,
        content
      }));
      
      console.log('Sending chat messages:', chatMessages);
      
      const stepsResponse = await axios.post(`${BACKEND_URL}/chat`, {
        messages: chatMessages
      });

      console.log('Chat response:', stepsResponse.data);
      setLoading(false);

      if (stepsResponse.data.response) {
        const newSteps = parseXml(stepsResponse.data.response);
        console.log('New steps:', newSteps);
        
        setSteps(s => [...s, ...newSteps.map(x => ({
          ...x,
          status: "pending" as "pending"
        }))]);

        setLlmMessages(chatMessages);
        setLlmMessages(x => [...x, {role: "assistant", content: stepsResponse.data.response}]);
        
        // Add AI response to messages
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'I\'ve created a plan for your project. You can see the steps in the sidebar and files will appear as I build them.',
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Error during initialization:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      setLoading(false);
    }
  }

  useEffect(() => {
    init();
  }, [])

  const handleSendMessage = async (message: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setPrompt(message);
    // Trigger the existing logic for sending messages
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      
      {/* Left Panel */}
      <div className="w-80 border-r border-gray-800">
        {activeView === 'chat' && (
          <ChatPanel 
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={loading}
          />
        )}
        {activeView === 'files' && (
          <ModernFileExplorer 
            files={files} 
            onFileSelect={setSelectedFile}
            selectedFile={selectedFile}
          />
        )}
        {activeView === 'terminal' && (
          <StepsPanel
            steps={steps}
            currentStep={currentStep}
            onStepClick={setCurrentStep}
          />
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Tab Bar */}
        <div className="border-b border-gray-800 px-4 py-2 flex space-x-1">
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'code'
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Code</span>
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'preview'
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'code' ? (
            <ModernCodeEditor file={selectedFile} />
          ) : (
            <ModernPreview webContainer={webcontainer} files={files} />
          )}
        </div>
      </div>
    </div>
  );
}

// Keep the existing message sending logic
async function sendFollowUpMessage(
  userPrompt: string,
  llmMessages: any[],
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void,
  setLlmMessages: (fn: (prev: any[]) => any[]) => void,
  setSteps: (fn: (prev: Step[]) => Step[]) => void,
  setMessages: (fn: (prev: Message[]) => Message[]) => void
) {
  if (!userPrompt.trim()) return;
  
  try {
    setError(null);
    const newMessage = {
      role: "user" as "user",
      content: userPrompt
    };

    setLoading(true);
    console.log('Sending follow-up message:', newMessage);
    
    const stepsResponse = await axios.post(`${BACKEND_URL}/chat`, {
      messages: [...llmMessages, newMessage]
    });
    
    console.log('Follow-up response:', stepsResponse.data);
    setLoading(false);

    setLlmMessages(x => [...x, newMessage]);
    setLlmMessages(x => [...x, {
      role: "assistant",
      content: stepsResponse.data.response
    }]);
    
    const newSteps = parseXml(stepsResponse.data.response);
    setSteps(s => [...s, ...newSteps.map(x => ({
      ...x,
      status: "pending" as "pending"
    }))]);
    
    // Add AI response to messages
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'I\'ve updated your project with the requested changes.',
      timestamp: new Date()
    }]);
    
  } catch (error) {
    console.error('Error sending message:', error);
    setError(error instanceof Error ? error.message : 'An error occurred');
    setLoading(false);
  }
}
          </div>
          <div className="col-span-1">
              <FileExplorer 
                files={files} 
                onFileSelect={setSelectedFile}
              />
            </div>
          <div className="col-span-2 bg-gray-900 rounded-lg shadow-lg p-4 h-[calc(100vh-8rem)]">
            <TabView activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="h-[calc(100%-4rem)]">
              {activeTab === 'code' ? (
                <CodeEditor file={selectedFile} />
              ) : (
                <PreviewFrame webContainer={webcontainer} files={files} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}