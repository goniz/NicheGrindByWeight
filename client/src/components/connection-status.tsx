import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConnectionStatusProps {
  status: 'connected' | 'connecting' | 'disconnected';
  onConnect: () => void;
  onDisconnect: () => void;
}

export function ConnectionStatus({ 
  status, 
  onConnect, 
  onDisconnect 
}: ConnectionStatusProps) {
  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';
  
  const handleClick = () => {
    if (isConnected) {
      onDisconnect();
    } else if (!isConnecting) {
      onConnect();
    }
  };
  
  return (
    <div className="mb-8 flex justify-center">
      <div 
        className="rounded-lg bg-gradient-to-r from-amber-50 to-white shadow-md border border-amber-200 p-4 w-full max-w-md flex items-center justify-between"
        data-state={status}
      >
        <div className="flex items-center">
          <div 
            className={cn(
              "w-3 h-3 rounded-full mr-3",
              {
                "bg-neutral-300": status === 'disconnected',
                "bg-emerald-500": status === 'connected',
                "bg-amber-400 animate-pulse": status === 'connecting'
              }
            )}
            aria-hidden="true"
          />
          <div className="flex flex-col">
            <span className="font-medium text-amber-900">
              {status === 'connected' && 'Connected to Coffee Scale'}
              {status === 'connecting' && 'Connecting to Coffee Scale...'}
              {status === 'disconnected' && 'Coffee Scale Disconnected'}
            </span>
            {status === 'connected' && (
              <span className="text-xs text-amber-700">Receiving data from Black Coffee Scale</span>
            )}
          </div>
        </div>
        <Button
          variant={isConnected ? "destructive" : "default"}
          onClick={handleClick}
          disabled={isConnecting}
          className={cn(
            "transition-all duration-200",
            {
              "bg-amber-600 hover:bg-amber-700 text-white": !isConnected && !isConnecting,
              "bg-red-500 hover:bg-red-600": isConnected,
              "bg-amber-400 text-amber-900 cursor-wait": isConnecting
            }
          )}
        >
          {isConnected ? "Disconnect" : isConnecting ? "Connecting..." : "Connect Scale"}
        </Button>
      </div>
    </div>
  );
}
