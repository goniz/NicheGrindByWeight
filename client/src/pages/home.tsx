import { useEffect } from "react";
import { useBluetooth } from "@/hooks/use-bluetooth";
import { ConnectionStatus } from "@/components/connection-status";
import { MeasurementDisplay } from "@/components/measurement-display";
import { Instructions } from "@/components/instructions";
import { Notification } from "@/components/notification";

export default function Home() {
  // Use Bluetooth hook
  const bluetooth = useBluetooth();
  
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
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 text-amber-900 font-sans">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <header className="mb-8 text-center">
          <div className="flex items-center justify-center mb-3">
            <svg className="h-8 w-8 text-amber-600 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 8h20M6 8v9a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V8M12 12v3M4 4h16"></path>
            </svg>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-700 to-amber-500 bg-clip-text text-transparent">Coffee Scale App</h1>
          </div>
          <p className="text-amber-700">
            Connect to your Black Coffee Scale for precise brewing
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
        
        <footer className="text-center text-amber-600 text-sm mt-12">
          <p>
            Coffee Scale App | Based on Black Coffee Scale Protocol
          </p>
        </footer>
      </div>
    </div>
  );
}
