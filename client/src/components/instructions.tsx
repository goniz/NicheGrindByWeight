import { Card, CardContent } from "@/components/ui/card";

export function Instructions() {
  return (
    <Card className="mb-8 bg-gradient-to-br from-amber-50 to-white border-amber-200">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-amber-900 flex items-center">
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12" y2="8"></line>
          </svg>
          How to Connect Your Coffee Scale
        </h2>
        <ol className="space-y-4 text-amber-800">
          <li className="flex items-start">
            <span className="flex items-center justify-center bg-amber-600 text-white rounded-full w-6 h-6 text-sm font-medium mr-3 mt-0.5 flex-shrink-0">1</span>
            <div>
              <p className="font-medium">Turn on your Black Coffee Scale</p>
              <p className="text-sm text-amber-700 mt-1">Make sure Bluetooth is enabled on your mobile device or computer.</p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="flex items-center justify-center bg-amber-600 text-white rounded-full w-6 h-6 text-sm font-medium mr-3 mt-0.5 flex-shrink-0">2</span>
            <div>
              <p className="font-medium">Connect to the scale</p>
              <p className="text-sm text-amber-700 mt-1">Click the "Connect Scale" button above to scan for nearby devices.</p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="flex items-center justify-center bg-amber-600 text-white rounded-full w-6 h-6 text-sm font-medium mr-3 mt-0.5 flex-shrink-0">3</span>
            <div>
              <p className="font-medium">Select your coffee scale</p>
              <p className="text-sm text-amber-700 mt-1">Black Coffee Scale should appear in the list of available devices.</p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="flex items-center justify-center bg-amber-600 text-white rounded-full w-6 h-6 text-sm font-medium mr-3 mt-0.5 flex-shrink-0">4</span>
            <div>
              <p className="font-medium">Start brewing coffee</p>
              <p className="text-sm text-amber-700 mt-1">Place your coffee beans or portafilter on the scale to see weight readings. The timer will start automatically when weight is detected.</p>
            </div>
          </li>
        </ol>
        
        <div className="mt-5 p-3 bg-amber-100 rounded-md">
          <h3 className="text-sm font-semibold text-amber-900 flex items-center">
            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm-1-13h2v6h-2V7zm0 8h2v2h-2v-2z"></path>
            </svg>
            Web Bluetooth Note
          </h3>
          <p className="text-xs text-amber-800 mt-1">Web Bluetooth API requires HTTPS and is not supported in all browsers. For testing in unsupported environments, add <code className="bg-amber-200 px-1 rounded">?demo=true</code> to the URL to use demo mode.</p>
        </div>
      </CardContent>
    </Card>
  );
}
