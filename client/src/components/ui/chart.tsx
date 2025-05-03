import React from "react";
import { cn } from "@/lib/utils";

interface ChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: number[];
  labels?: string[];
  height?: number;
  showLabels?: boolean;
  showValues?: boolean;
  baseColor?: string;
  valueFormatter?: (value: number) => string;
}

export function Chart({
  className,
  data = [],
  labels = [],
  height = 200,
  showLabels = true,
  showValues = true,
  baseColor = "var(--chart-1)",
  valueFormatter = (value) => value.toString(),
  ...props
}: ChartProps) {
  // Find the max value for scaling
  const maxValue = Math.max(...data, 1);
  
  return (
    <div className={cn("w-full", className)} {...props}>
      <div 
        className="w-full flex items-end justify-between space-x-2"
        style={{ height: `${height}px` }}
      >
        {data.map((value, index) => {
          const percentage = (value / maxValue) * 100;
          const label = labels[index] || `Item ${index + 1}`;
          
          return (
            <div 
              key={index}
              className="flex flex-col items-center flex-1"
            >
              {showValues && (
                <span className="text-xs mb-1 text-muted-foreground">
                  {valueFormatter(value)}
                </span>
              )}
              <div
                className="w-full bg-primary/10 rounded-t-sm relative group"
                style={{ 
                  height: `${Math.max(percentage, 1)}%`,
                  backgroundColor: baseColor
                }}
                title={`${label}: ${valueFormatter(value)}`}
              ></div>
              {showLabels && (
                <span className="text-xs mt-1 text-muted-foreground truncate w-full text-center">
                  {label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
