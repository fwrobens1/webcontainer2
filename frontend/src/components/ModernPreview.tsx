import React, { useEffect, useState } from 'react';
import { WebContainer } from '@webcontainer/api';
import { Eye, ExternalLink, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';

interface ModernPreviewProps {
  files: any[];
  webContainer: WebContainer | undefined;
}

export function ModernPreview({ files, webContainer }: ModernPreviewProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function startPreview() {
    if (!webContainer || files.length === 0) return;

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Installing dependencies...');
      const installProcess = await webContainer.spawn('npm', ['install']);

      installProcess.output.pipeTo(new WritableStream({
        write(data) {
          console.log('Install output:', data);
        }
      }));

      const installExitCode = await installProcess.exit;
      if (installExitCode !== 0) {
        throw new Error('Failed to install dependencies');
      }

      console.log('Starting dev server...');
      const devProcess = await webContainer.spawn('npm', ['run', 'dev']);

      devProcess.output.pipeTo(new WritableStream({
        write(data) {
          console.log('Dev server output:', data);
        }
      }));

      webContainer.on('server-ready', (port, url) => {
        console.log('Server ready:', { port, url });
        setUrl(url);
        setIsLoading(false);
      });
      
    } catch (error) {
      console.error('Error starting preview:', error);
      setError(error instanceof Error ? error.message : 'Failed to start preview');
      setIsLoading(false);
    }
  }

  useEffect(() => {
    startPreview();
  }, [webContainer, files]);

  const handleRefresh = () => {
    if (url) {
      const iframe = document.querySelector('iframe');
      if (iframe) {
        iframe.src = iframe.src;
      }
    } else {
      startPreview();
    }
  };

  const handleOpenExternal = () => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="h-full bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Eye className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-white">Preview</span>
          {url && (
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
              Live
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {url && (
            <button
              onClick={handleOpenExternal}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 relative">
        {error && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Preview Error</h3>
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
        
        {!url && !error && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            {isLoading ? (
              <>
                <Loader2 className="w-16 h-16 text-blue-400 animate-spin mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Starting Preview</h3>
                <p className="text-gray-400">Installing dependencies and starting dev server...</p>
              </>
            ) : (
              <>
                <Eye className="w-16 h-16 text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Preview Available</h3>
                <p className="text-gray-400">Build something to see it here</p>
              </>
            )}
          </div>
        )}
        
        {url && (
          <iframe 
            src={url}
            className="w-full h-full border-0 bg-white"
            title="Preview"
          />
        )}
      </div>
    </div>
  );
}