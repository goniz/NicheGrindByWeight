export interface ScaleMeasurement {
  weight?: number;
  timer?: number;
  flowRate?: number;
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

// Black Coffee Scale device UUIDs
export const BLACK_COFFEE_SCALE_SERVICE = '0000ffb0-0000-1000-8000-00805f9b34fb';
export const BLACK_COFFEE_WEIGHT_CHARACTERISTIC = '0000fff1-0000-1000-8000-00805f9b34fb';
export const BLACK_COFFEE_COMMAND_CHARACTERISTIC = '0000fff2-0000-1000-8000-00805f9b34fb';

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

export function parseBlackCoffeeWeightData(value: DataView): Partial<ScaleMeasurement> {
  try {
    const valueBytes = new Uint8Array(value.buffer);

    if (valueBytes.length > 14) {
      const hex = Array.from(valueBytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      const isNegative = hex[4] === '8' || hex[4] === 'c';
      const hexWeight = hex.slice(7, 14);
      const weight = ((isNegative ? -1 : 1) * parseInt(hexWeight, 16)) / 1000;

      return {
        weight: Number(weight.toFixed(3))
      };
    }

    console.warn('Bluetooth incoming statusUpdate has unrecognized format');
    return {};
  } catch (e) {
    console.error('Error parsing Black Coffee Scale data:', e);
    return {};
  }
}

export function calculateFlowRate(currentWeight: number, previousWeight: number, timeDiff: number): number {
  const weightDiff = Math.abs(currentWeight - previousWeight);
  const flowRate = (weightDiff * 1000) / (timeDiff / 1000);
  return Number(flowRate.toFixed(1));
}