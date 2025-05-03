export interface ScaleMeasurement {
  weight?: number;
  timer?: number;
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
    flowRate: undefined,
  },
};

// Black Coffee Scale device UUIDs from their documentation
export const BLACK_COFFEE_SCALE_SERVICE = '0000ffb0-0000-1000-8000-00805f9b34fb';

// Black Coffee Scale characteristics
export const BLACK_COFFEE_WEIGHT_CHARACTERISTIC = '0000fff1-0000-1000-8000-00805f9b34fb';
export const BLACK_COFFEE_COMMAND_CHARACTERISTIC = '0000fff2-0000-1000-8000-00805f9b34fb';

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
    // Format: [FF, AA, weight bytes, ...]
    if (valueBytes[0] === 0xFF && valueBytes[1] === 0xAA && valueBytes.length >= 6) {
      // Weight is stored in bytes 2-5 (4 bytes) in 0.1g precision
      const weightData = (valueBytes[2] << 24) | (valueBytes[3] << 16) | (valueBytes[4] << 8) | valueBytes[5];
      const weight = weightData / 10; // Convert to grams with 0.1g precision
      
      // Return the parsed data
      return {
        weight: Number((weight / 1000).toFixed(3)) // Convert to kg with 0.001kg precision
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


