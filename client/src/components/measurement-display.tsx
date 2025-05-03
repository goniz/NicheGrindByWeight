import { Card, CardContent } from "@/components/ui/card";
import { ScaleMeasurement } from "@/lib/bluetooth";

interface MeasurementDisplayProps {
  measurements: ScaleMeasurement;
  visible: boolean;
}

export function MeasurementDisplay({ 
  measurements, 
  visible 
}: MeasurementDisplayProps) {
  if (!visible) return null;

  // Convert weight from kg to g for display (coffee is measured in grams)
  const weightInGrams = measurements.weight !== undefined 
    ? (measurements.weight * 1000).toFixed(1) 
    : '--';
  
  // Format timer as MM:SS
  const formattedTimer = measurements.timer !== undefined
    ? `${Math.floor(measurements.timer / 60).toString().padStart(2, '0')}:${(measurements.timer % 60).toString().padStart(2, '0')}`
    : '--:--';

  return (
    <div className="mb-8">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Weight Card */}
        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200">
          <CardContent className="p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-amber-800 font-semibold">Coffee Weight</h3>
              <svg className="w-6 h-6 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 8h20M6 8v9a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V8M12 12v3M4 4h16"></path>
              </svg>
            </div>
            <div className="text-center">
              <span className="text-5xl font-mono font-medium text-amber-900">
                {weightInGrams}
              </span>
              <span className="text-xl font-medium text-amber-700 ml-2">g</span>
            </div>
          </CardContent>
        </Card>

        {/* Timer Card */}
        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200">
          <CardContent className="p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-amber-800 font-semibold">Brew Timer</h3>
              <svg className="w-6 h-6 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 6v6l4 2"></path>
              </svg>
            </div>
            <div className="text-center">
              <span className="text-5xl font-mono font-medium text-amber-900">
                {formattedTimer}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Flow Rate Card */}
        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200">
          <CardContent className="p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-amber-800 font-semibold">Flow Rate</h3>
              <svg className="w-6 h-6 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v6m0 12v2M4.93 10.93l1.41 1.41m11.32-1.41l-1.41 1.41M2 18h2m16 0h2M5 15a7 7 0 1 1 14 0 7 7 0 0 1-14 0z"></path>
              </svg>
            </div>
            <div className="text-center">
              <span className="text-5xl font-mono font-medium text-amber-900">
                {measurements.flowRate !== undefined ? measurements.flowRate : '--'}
              </span>
              <span className="text-xl font-medium text-amber-700 ml-2">g/s</span>
            </div>
          </CardContent>
        </Card>

        {/* Battery Level Card */}
        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200">
          <CardContent className="p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-amber-800 font-semibold">Battery</h3>
              <svg className="w-6 h-6 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="10" rx="2" ry="2"></rect>
                <line x1="22" y1="11" x2="24" y2="11"></line>
                <line x1="6" y1="7" x2="6" y2="17"></line>
                <line x1="10" y1="7" x2="10" y2="17"></line>
                <line x1="14" y1="7" x2="14" y2="17"></line>
              </svg>
            </div>
            <div className="text-center">
              <span className="text-5xl font-mono font-medium text-amber-900">
                {measurements.batteryLevel !== undefined ? measurements.batteryLevel : '--'}
              </span>
              <span className="text-xl font-medium text-amber-700 ml-2">%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
