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
        className="rounded-lg bg-white shadow p-4 w-full max-w-md flex items-center justify-between"
        data-state={status}
      >
        <div className="flex items-center">
          <div 
            className={cn(
              "w-3 h-3 rounded-full mr-3",
              {
                "bg-neutral-300": status === 'disconnected',
                "bg-[#4CAF50]": status === 'connected',
                "bg-yellow-400 animate-pulse": status === 'connecting'
              }
            )}
            aria-hidden="true"
          />
          <span className="font-medium">
            {status === 'connected' && 'Connected'}
            {status === 'connecting' && 'Connecting...'}
            {status === 'disconnected' && 'Disconnected'}
          </span>
        </div>
        <Button
          variant={isConnected ? "destructive" : "default"}
          onClick={handleClick}
          disabled={isConnecting}
          className={cn({
            "bg-[#2196F3] hover:bg-blue-600": !isConnected,
            "bg-neutral-700 hover:bg-neutral-800": isConnected,
            "opacity-75": isConnecting
          })}
        >
          {isConnected ? "Disconnect" : "Connect Scale"}
        </Button>
      </div>
    </div>
  );
}
