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

  return (
    <div className="mb-8">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Weight Card */}
        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-neutral-700 font-semibold">Weight</h3>
              <svg className="scale-icon w-6 h-6 text-[#2196F3]" viewBox="0 0 24 24">
                <path d="M3 6l2-2h14l2 2v12l-2 2H5l-2-2V6zm17 0H4m3 4h10M7 14h10m-13 4h16"></path>
              </svg>
            </div>
            <div className="text-center">
              <span className="text-4xl font-mono font-medium">
                {measurements.weight !== undefined ? measurements.weight : '--'}
              </span>
              <span className="text-xl font-medium text-neutral-500 ml-2">kg</span>
            </div>
          </CardContent>
        </Card>

        {/* BMI Card */}
        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-neutral-700 font-semibold">BMI</h3>
              <svg className="scale-icon w-6 h-6 text-[#2196F3]" viewBox="0 0 24 24">
                <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm-1-13h2v6h-2V7zm0 8h2v2h-2v-2z"></path>
              </svg>
            </div>
            <div className="text-center">
              <span className="text-4xl font-mono font-medium">
                {measurements.bmi !== undefined ? measurements.bmi : '--'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Body Fat Card */}
        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-neutral-700 font-semibold">Body Fat</h3>
              <svg className="scale-icon w-6 h-6 text-[#2196F3]" viewBox="0 0 24 24">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
            </div>
            <div className="text-center">
              <span className="text-4xl font-mono font-medium">
                {measurements.bodyFat !== undefined ? measurements.bodyFat : '--'}
              </span>
              <span className="text-xl font-medium text-neutral-500 ml-2">%</span>
            </div>
          </CardContent>
        </Card>

        {/* Muscle Mass Card */}
        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-neutral-700 font-semibold">Muscle Mass</h3>
              <svg className="scale-icon w-6 h-6 text-[#2196F3]" viewBox="0 0 24 24">
                <path d="M6.5 6.5h3v11h-3z"></path>
                <path d="M14.5 6.5h3v11h-3z"></path>
              </svg>
            </div>
            <div className="text-center">
              <span className="text-4xl font-mono font-medium">
                {measurements.muscleMass !== undefined ? measurements.muscleMass : '--'}
              </span>
              <span className="text-xl font-medium text-neutral-500 ml-2">kg</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
