import { Card, CardContent } from "@/components/ui/card";

export function Instructions() {
  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-neutral-800">How to Connect</h2>
        <ol className="space-y-3 text-neutral-700">
          <li className="flex items-start">
            <span className="flex items-center justify-center bg-[#2196F3] text-white rounded-full w-6 h-6 text-sm font-medium mr-3 mt-0.5 flex-shrink-0">1</span>
            <p>Turn on your smart scale and make sure Bluetooth is enabled on your device.</p>
          </li>
          <li className="flex items-start">
            <span className="flex items-center justify-center bg-[#2196F3] text-white rounded-full w-6 h-6 text-sm font-medium mr-3 mt-0.5 flex-shrink-0">2</span>
            <p>Click the "Connect Scale" button above to scan for nearby devices.</p>
          </li>
          <li className="flex items-start">
            <span className="flex items-center justify-center bg-[#2196F3] text-white rounded-full w-6 h-6 text-sm font-medium mr-3 mt-0.5 flex-shrink-0">3</span>
            <p>Select your scale from the list of available devices that appears.</p>
          </li>
          <li className="flex items-start">
            <span className="flex items-center justify-center bg-[#2196F3] text-white rounded-full w-6 h-6 text-sm font-medium mr-3 mt-0.5 flex-shrink-0">4</span>
            <p>Step on the scale after connection is established to see your measurements.</p>
          </li>
        </ol>
      </CardContent>
    </Card>
  );
}
