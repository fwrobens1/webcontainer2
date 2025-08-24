import { WebContainer } from '@webcontainer/api';
import React, { useEffect, useState } from 'react';

interface PreviewFrameProps {
  files: any[];
  webContainer: WebContainer;
}

export function PreviewFrame({ files, webContainer }: PreviewFrameProps) {
  // In a real implementation, this would compile and render the preview
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function main() {
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

      // Wait for installation to complete
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

      // Wait for `server-ready` event
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
    if (webContainer && files.length > 0) {
      main();
    }
  }, [webContainer, files]);
  
  return (
    <div className="h-full flex items-center justify-center text-gray-400">
      {error && (
        <div className="text-center text-red-400">
          <p className="mb-2">Preview Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      {!url && !error && (
        <div className="text-center">
          <p className="mb-2">{isLoading ? 'Loading preview...' : 'No preview available'}</p>
        </div>
      )}
      {url && (
        <iframe 
          width="100%" 
          height="100%" 
          src={url} 
          className="border-0"
          title="Preview"
        />
      </div>}
    </div>
  );
}