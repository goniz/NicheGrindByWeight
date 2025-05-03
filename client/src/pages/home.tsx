import { useEffect } from "react";
import { useBluetooth } from "@/hooks/use-bluetooth";
import { ConnectionStatus } from "@/components/connection-status";
import { MeasurementDisplay } from "@/components/measurement-display";
import { Instructions } from "@/components/instructions";
import { Notification } from "@/components/notification";

export default function Home() {
  // Check if demo mode is enabled via URL parameter
  const isDemoMode = new URLSearchParams(window.location.search).get('demo') === 'true';
  
  // Use Bluetooth hook
  const bluetooth = useBluetooth(isDemoMode);
  
  // Determine connection status
  let connectionStatus: 'connected' | 'connecting' | 'disconnected' = 'disconnected';
  if (bluetooth.connected) connectionStatus = 'connected';
  if (bluetooth.connecting) connectionStatus = 'connecting';
  
  // Clean up Bluetooth connection when component unmounts
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (bluetooth.connected) {
        bluetooth.disconnect();
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (bluetooth.connected) {
        bluetooth.disconnect();
      }
    };
  }, [bluetooth]);
  
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-neutral-800 mb-2">Smart Scale Monitor</h1>
          <p className="text-neutral-600">
            Connect to your Bluetooth scale to view measurements
            {isDemoMode && <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium rounded px-2 py-0.5">Demo Mode</span>}
          </p>
        </header>
        
        <ConnectionStatus 
          status={connectionStatus} 
          onConnect={bluetooth.connect} 
          onDisconnect={bluetooth.disconnect} 
        />
        
        <MeasurementDisplay 
          measurements={bluetooth.measurements} 
          visible={bluetooth.connected} 
        />
        
        <Instructions />
        
        <Notification 
          message={bluetooth.error} 
          onClose={bluetooth.clearError} 
        />
        
        <footer className="text-center text-neutral-500 text-sm mt-12">
          <p>
            Smart Scale Monitor | 
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#2196F3] hover:underline ml-1"
            >
              GitHub
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
