export interface ScaleMeasurement {
  weight?: number;
  bmi?: number;
  bodyFat?: number;
  muscleMass?: number;
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
    bmi: undefined,
    bodyFat: undefined,
    muscleMass: undefined,
  },
};

// Typically the weight scale service UUID (weight_service)
// This is a standard service for Bluetooth scale devices
export const WEIGHT_SCALE_SERVICE = '0x181D';

// Standard characteristic UUID for weight measurement
export const WEIGHT_MEASUREMENT_CHARACTERISTIC = '0x2A9D';

// Body composition measurement characteristic
export const BODY_COMPOSITION_CHARACTERISTIC = '0x2A9C';

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
 * Parse weight measurement data according to Bluetooth GATT standard
 */
export function parseWeightMeasurement(value: DataView): number | undefined {
  try {
    // The weight value is typically in the first 2 bytes (uint16)
    // The format depends on the specific scale, but common format is:
    // Flags (1 byte) + Weight (2 bytes) in units of 0.005 kg
    
    const flags = value.getUint8(0);
    const weightInUnits = value.getUint16(1, true); // true for little-endian
    
    // The weight unit flag is typically bit 0 of flags (0 = kg, 1 = lb)
    const isImperial = (flags & 0x01) === 0x01;
    
    // Convert to kg if imperial
    const weightInKg = isImperial 
      ? weightInUnits * 0.005 * 0.45359237 // Convert from lb to kg
      : weightInUnits * 0.005; // Scale units to kg
      
    return Number(weightInKg.toFixed(1));
  } catch (e) {
    console.error('Error parsing weight data:', e);
    return undefined;
  }
}

/**
 * Parse body composition data
 */
export function parseBodyComposition(value: DataView): Partial<ScaleMeasurement> {
  try {
    // This is a simplified parser - real implementations need to follow
    // the Bluetooth GATT Body Composition Measurement characteristic specification
    
    const flags = value.getUint16(0, true);
    let offset = 2;
    
    // Skip past time stamp if present (bit 0)
    if (flags & 0x01) {
      offset += 7; // Year (2) + Month (1) + Day (1) + Hour (1) + Min (1) + Sec (1)
    }
    
    // Skip user ID if present (bit 1)
    if (flags & 0x02) {
      offset += 1;
    }
    
    // Parse the body fat percentage if present (bit 2)
    let bodyFat: number | undefined;
    if (flags & 0x04) {
      bodyFat = value.getUint16(offset, true) * 0.1;
      offset += 2;
    }
    
    // Parse muscle mass if available (typically comes after body fat)
    // This depends on the specific scale implementation
    let muscleMass: number | undefined;
    if (offset + 2 <= value.byteLength) {
      muscleMass = value.getUint16(offset, true) * 0.1;
    }
    
    return {
      bodyFat: bodyFat !== undefined ? Number(bodyFat.toFixed(1)) : undefined,
      muscleMass: muscleMass !== undefined ? Number(muscleMass.toFixed(1)) : undefined,
    };
  } catch (e) {
    console.error('Error parsing body composition data:', e);
    return {};
  }
}

/**
 * Simulate measurements for demo/testing purposes
 */
export function simulateMeasurements(): ScaleMeasurement {
  // Create base measurements with small random variations
  const baseWeight = 70 + Math.random() * 10;
  const baseBmi = 22 + Math.random() * 3;
  const baseFat = 18 + Math.random() * 5; 
  const baseMuscle = 50 + Math.random() * 8;
  
  return {
    weight: Number(baseWeight.toFixed(1)),
    bmi: Number(baseBmi.toFixed(1)),
    bodyFat: Number(baseFat.toFixed(1)),
    muscleMass: Number(baseMuscle.toFixed(1))
  };
}
