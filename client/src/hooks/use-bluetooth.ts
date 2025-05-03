import { useEffect, useReducer, useCallback } from 'react';
import { 
  BluetoothState, 
  initialBluetoothState, 
  getErrorMessage, 
  WEIGHT_SCALE_SERVICE,
  WEIGHT_MEASUREMENT_CHARACTERISTIC,
  BODY_COMPOSITION_CHARACTERISTIC,
  parseWeightMeasurement,
  parseBodyComposition
} from '@/lib/bluetooth';

// Enum for all possible actions
enum ActionType {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  CLEAR_ERROR = 'clear_error',
  UPDATE_MEASUREMENTS = 'update_measurements'
}

// Action type definitions
type BluetoothAction = 
  | { type: ActionType.CONNECTING }
  | { type: ActionType.CONNECTED; device: BluetoothDevice; server: BluetoothRemoteGATTServer; characteristics: Map<string, BluetoothRemoteGATTCharacteristic> }
  | { type: ActionType.DISCONNECTED }
  | { type: ActionType.ERROR; error: string }
  | { type: ActionType.CLEAR_ERROR }
  | { type: ActionType.UPDATE_MEASUREMENTS; measurements: Partial<BluetoothState['measurements']> };

// Reducer to handle state changes
function bluetoothReducer(state: BluetoothState, action: BluetoothAction): BluetoothState {
  switch (action.type) {
    case ActionType.CONNECTING:
      return {
        ...state,
        connecting: true,
        error: null
      };
    case ActionType.CONNECTED:
      return {
        ...state,
        device: action.device,
        server: action.server,
        characteristics: action.characteristics,
        connected: true,
        connecting: false,
        error: null
      };
    case ActionType.DISCONNECTED:
      return {
        ...initialBluetoothState
      };
    case ActionType.ERROR:
      return {
        ...state,
        connecting: false,
        error: action.error
      };
    case ActionType.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    case ActionType.UPDATE_MEASUREMENTS:
      return {
        ...state,
        measurements: {
          ...state.measurements,
          ...action.measurements
        }
      };
    default:
      return state;
  }
}

// Custom hook for Bluetooth functionality
export function useBluetooth(isDemoMode = false) {
  const [state, dispatch] = useReducer(bluetoothReducer, initialBluetoothState);

  // Function to connect to a Bluetooth device
  const connect = useCallback(async () => {
    if (state.connecting || state.connected) return;
    
    // For demo mode, simulate a connection
    if (isDemoMode) {
      dispatch({ type: ActionType.CONNECTING });
      
      // Simulate connection delay
      setTimeout(() => {
        const mockDevice = { 
          name: 'Demo Scale',
          gatt: { connected: true },
          addEventListener: () => {},
          removeEventListener: () => {}
        } as unknown as BluetoothDevice;
        
        const mockServer = {} as BluetoothRemoteGATTServer;
        const mockCharacteristics = new Map();
        
        dispatch({ 
          type: ActionType.CONNECTED, 
          device: mockDevice, 
          server: mockServer, 
          characteristics: mockCharacteristics 
        });
        
        // Start simulating measurements
        simulateDemoMeasurements();
      }, 2000);
      
      return;
    }
    
    // Check if Web Bluetooth API is available
    if (!navigator.bluetooth) {
      dispatch({ type: ActionType.ERROR, error: 'Web Bluetooth API is not supported in your browser.' });
      return;
    }
    
    try {
      dispatch({ type: ActionType.CONNECTING });
      
      // Request device with weight scale service UUID
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [WEIGHT_SCALE_SERVICE] }
        ],
        optionalServices: ['device_information']
      });
      
      // Add event listener for disconnection
      device.addEventListener('gattserverdisconnected', onDisconnected);
      
      // Connect to GATT server
      const server = await device.gatt!.connect();
      
      // Get primary service
      const service = await server.getPrimaryService(WEIGHT_SCALE_SERVICE);
      
      // Get characteristics
      const characteristics = new Map<string, BluetoothRemoteGATTCharacteristic>();
      
      try {
        const weightChar = await service.getCharacteristic(WEIGHT_MEASUREMENT_CHARACTERISTIC);
        characteristics.set(WEIGHT_MEASUREMENT_CHARACTERISTIC, weightChar);
        
        // Set up notifications for weight changes
        await weightChar.startNotifications();
        weightChar.addEventListener('characteristicvaluechanged', handleWeightChange);
      } catch (e) {
        console.warn('Weight measurement characteristic not found:', e);
      }
      
      try {
        const bodyCompChar = await service.getCharacteristic(BODY_COMPOSITION_CHARACTERISTIC);
        characteristics.set(BODY_COMPOSITION_CHARACTERISTIC, bodyCompChar);
        
        // Set up notifications for body composition changes
        await bodyCompChar.startNotifications();
        bodyCompChar.addEventListener('characteristicvaluechanged', handleBodyCompositionChange);
      } catch (e) {
        console.warn('Body composition characteristic not found:', e);
      }
      
      // Update state with connected device
      dispatch({
        type: ActionType.CONNECTED,
        device,
        server,
        characteristics
      });
      
    } catch (error: any) {
      console.error('Bluetooth connection error:', error);
      dispatch({ type: ActionType.ERROR, error: getErrorMessage(error) });
    }
  }, [state.connecting, state.connected, isDemoMode]);
  
  // Handle weight measurement changes
  const handleWeightChange = useCallback((event: Event) => {
    try {
      const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
      const dataView = characteristic.value as DataView;
      
      const weight = parseWeightMeasurement(dataView);
      
      // Update measurements state
      if (weight !== undefined) {
        dispatch({ 
          type: ActionType.UPDATE_MEASUREMENTS, 
          measurements: { weight } 
        });
        
        // Roughly estimate BMI if we have weight
        // Note: Real scales would provide this directly or calculate based on height
        const estimatedBmi = weight / (1.75 * 1.75); // Assuming 1.75m height
        dispatch({
          type: ActionType.UPDATE_MEASUREMENTS,
          measurements: { bmi: Number(estimatedBmi.toFixed(1)) }
        });
      }
    } catch (error) {
      console.error('Error handling weight change:', error);
    }
  }, []);
  
  // Handle body composition changes
  const handleBodyCompositionChange = useCallback((event: Event) => {
    try {
      const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
      const dataView = characteristic.value as DataView;
      
      const composition = parseBodyComposition(dataView);
      
      // Update measurements state
      if (Object.keys(composition).length > 0) {
        dispatch({ 
          type: ActionType.UPDATE_MEASUREMENTS, 
          measurements: composition 
        });
      }
    } catch (error) {
      console.error('Error handling body composition change:', error);
    }
  }, []);
  
  // Disconnect from the device
  const disconnect = useCallback(() => {
    if (state.device && state.device.gatt?.connected) {
      // Remove event listeners from characteristics
      state.characteristics.forEach(char => {
        if (char.properties.notify) {
          try {
            char.stopNotifications();
          } catch (e) {
            console.warn('Error stopping notifications:', e);
          }
        }
      });
      
      // Disconnect from GATT server
      state.device.gatt.disconnect();
    }
    
    onDisconnected();
  }, [state.device, state.characteristics]);
  
  // Handle disconnection
  const onDisconnected = useCallback(() => {
    // Clean up interval if in demo mode
    if (isDemoMode && demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    
    dispatch({ type: ActionType.DISCONNECTED });
  }, [isDemoMode]);
  
  // Clear error messages
  const clearError = useCallback(() => {
    dispatch({ type: ActionType.CLEAR_ERROR });
  }, []);
  
  // Simulate measurements for demo mode
  const demoIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  
  const simulateDemoMeasurements = useCallback(() => {
    // Initial simulation
    let baseWeight = 70 + Math.random() * 10;
    let baseBmi = 22 + Math.random() * 3;
    let baseFat = 18 + Math.random() * 5;
    let baseMuscle = 50 + Math.random() * 8;
    
    // Update with initial values
    dispatch({
      type: ActionType.UPDATE_MEASUREMENTS,
      measurements: {
        weight: Number(baseWeight.toFixed(1)),
        bmi: Number(baseBmi.toFixed(1)),
        bodyFat: Number(baseFat.toFixed(1)),
        muscleMass: Number(baseMuscle.toFixed(1))
      }
    });
    
    // Set up interval for periodic updates
    demoIntervalRef.current = setInterval(() => {
      // Small random changes
      baseWeight += (Math.random() - 0.5) * 0.2;
      baseBmi += (Math.random() - 0.5) * 0.1;
      baseFat += (Math.random() - 0.5) * 0.2;
      baseMuscle += (Math.random() - 0.5) * 0.3;
      
      dispatch({
        type: ActionType.UPDATE_MEASUREMENTS,
        measurements: {
          weight: Number(baseWeight.toFixed(1)),
          bmi: Number(baseBmi.toFixed(1)),
          bodyFat: Number(baseFat.toFixed(1)),
          muscleMass: Number(baseMuscle.toFixed(1))
        }
      });
    }, 2000);
    
  }, []);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (state.connected) {
        disconnect();
      }
      
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
      }
    };
  }, [state.connected, disconnect]);
  
  // Check for demo mode in query params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const demo = urlParams.get('demo') === 'true';
    
    if (demo && !isDemoMode) {
      window.history.replaceState(null, '', '?demo=true');
      location.reload();
    }
  }, [isDemoMode]);
  
  return {
    ...state,
    connect,
    disconnect,
    clearError
  };
}

import React from 'react';
