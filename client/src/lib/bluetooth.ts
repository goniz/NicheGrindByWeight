export interface ScaleMeasurement {
  weight?: number;
  timer?: number;
  batteryLevel?: number;
  flowRate?: number;
}

// Web Bluetooth API types
declare global {
  interface Navigator {
    bluetooth: {
      requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
    };
  }

  interface RequestDeviceOptions {
    filters?: Array<{
      services?: string[];
      name?: string;
      namePrefix?: string;
    }>;
    optionalServices?: string[];
    acceptAllDevices?: boolean;
  }

  interface BluetoothDevice {
    id: string;
    name?: string;
    gatt?: BluetoothRemoteGATTServer;
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
  }

  interface BluetoothRemoteGATTServer {
    device: BluetoothDevice;
    connected: boolean;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
  }

  interface BluetoothRemoteGATTService {
    device: BluetoothDevice;
    uuid: string;
    getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
  }

  interface BluetoothRemoteGATTCharacteristic {
    service: BluetoothRemoteGATTService;
    uuid: string;
    properties: {
      broadcast: boolean;
      read: boolean;
      writeWithoutResponse: boolean;
      write: boolean;
      notify: boolean;
      indicate: boolean;
      authenticatedSignedWrites: boolean;
    };
    value?: DataView;
    startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    readValue(): Promise<DataView>;
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
  }
}

export interface BluetoothState {
  device: BluetoothDevice | null;
  server: BluetoothRemoteGATTServer | null;
  connected: boolean;
  connecting: boolean;
  error: string | null;
  characteristics: Map<string, BluetoothRemoteGATTCharacteristic>;
  measurements: ScaleMeasurement;
}

export const initialBluetoothState: BluetoothState = {
  device: null,
  server: null,
  connected: false,
  connecting: false,
  error: null,
  characteristics: new Map(),
  measurements: {
    weight: undefined,
    timer: undefined,
    batteryLevel: undefined,
    flowRate: undefined,
  },
};

// Black Coffee Scale device UUIDs from their documentation
export const BLACK_COFFEE_SCALE_SERVICE = '0000fff0-0000-1000-8000-00805f9b34fb';
export const BATTERY_SERVICE = '0000180f-0000-1000-8000-00805f9b34fb';

// Black Coffee Scale characteristics
export const BLACK_COFFEE_WEIGHT_CHARACTERISTIC = '0000fff1-0000-1000-8000-00805f9b34fb';
export const BLACK_COFFEE_COMMAND_CHARACTERISTIC = '0000fff2-0000-1000-8000-00805f9b34fb';
export const BATTERY_CHARACTERISTIC = '00002a19-0000-1000-8000-00805f9b34fb';

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: any): string {
  if (error.name === 'NotFoundError') {
    return 'No compatible Bluetooth scale found.';
  } else if (error.name === 'SecurityError') {
    return 'Bluetooth permission denied.';
  } else if (error.name === 'NotAllowedError') {
    return 'Bluetooth permission denied or request canceled.';
  } else {
    return `Connection error: ${error.message || 'Unknown error'}`;
  }
}

/**
 * Parse weight data from Black Coffee Scale
 * Based on the GitHub implementation: https://github.com/graphefruit/Beanconqueror/blob/master/src/classes/devices/blackcoffeeScale.ts
 */
export function parseBlackCoffeeWeightData(value: DataView): Partial<ScaleMeasurement> {
  try {
    // Extract the value bytes from the data view
    const byteLength = value.byteLength;
    const valueBytes = new Uint8Array(byteLength);
    for (let i = 0; i < byteLength; i++) {
      valueBytes[i] = value.getUint8(i);
    }

    // Check the value format based on the GitHub code
    // Format: [FF, AA, weight bytes, battery byte, ...]
    if (valueBytes[0] === 0xFF && valueBytes[1] === 0xAA && valueBytes.length >= 7) {
      // Weight is stored in bytes 2-5 (4 bytes) in 0.1g precision
      const weightData = (valueBytes[2] << 24) | (valueBytes[3] << 16) | (valueBytes[4] << 8) | valueBytes[5];
      const weight = weightData / 10; // Convert to grams with 0.1g precision
      
      // Battery level is byte 6 (percentage)
      const batteryLevel = valueBytes[6];
      
      // Return the parsed data
      return {
        weight: Number((weight / 1000).toFixed(3)), // Convert to kg with 0.001kg precision
        batteryLevel: batteryLevel
      };
    }
    
    return {};
  } catch (e) {
    console.error('Error parsing Black Coffee Scale data:', e);
    return {};
  }
}

/**
 * Calculate flow rate based on weight changes
 */
export function calculateFlowRate(currentWeight: number, previousWeight: number, timeDiff: number): number {
  // Flow rate in g/s
  const weightDiff = Math.abs(currentWeight - previousWeight); // in kg
  const flowRate = (weightDiff * 1000) / (timeDiff / 1000); // Convert to g/s
  return Number(flowRate.toFixed(1));
}

/**
 * Simulate measurements for demo/testing purposes for coffee scale
 */
export function simulateMeasurements(): ScaleMeasurement {
  // Coffee measurements vary between 15-22g for espresso
  const baseWeight = (18 + Math.random() * 4) / 1000; // in kg (typical coffee dose 18-22g)
  const baseTimer = Math.floor(Date.now() / 1000) % 60; // Simple timer in seconds
  const baseBatteryLevel = 80 + Math.floor(Math.random() * 20); // Battery level 80-100%
  const baseFlowRate = 1.2 + Math.random() * 0.6; // Flow rate g/s for espresso (1.2-1.8g/s)
  
  return {
    weight: Number(baseWeight.toFixed(3)), // 0.018-0.022kg (18-22g) with 0.001kg precision
    timer: baseTimer,
    batteryLevel: baseBatteryLevel,
    flowRate: Number(baseFlowRate.toFixed(1))
  };
}
