import { useEffect, useReducer, useCallback, useRef } from 'react';
import { 
  BluetoothState, 
  initialBluetoothState, 
  getErrorMessage, 
  BLACK_COFFEE_SCALE_SERVICE,
  BLACK_COFFEE_WEIGHT_CHARACTERISTIC,
  BLACK_COFFEE_COMMAND_CHARACTERISTIC,
  parseBlackCoffeeWeightData,
  calculateFlowRate,
  ScaleMeasurement
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
export function useBluetooth() {
  const [state, dispatch] = useReducer(bluetoothReducer, initialBluetoothState);

  // Function to connect to a Bluetooth device
  const connect = useCallback(async () => {
    if (state.connecting || state.connected) return;
    
    // Check if Web Bluetooth API is available
    if (!navigator.bluetooth) {
      dispatch({ type: ActionType.ERROR, error: 'Web Bluetooth API is not supported in your browser.' });
      return;
    }
    
    try {
      dispatch({ type: ActionType.CONNECTING });
      
      // Request device with Black Coffee Scale service UUID
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [BLACK_COFFEE_SCALE_SERVICE] }
        ]
      });
      
      // Add event listener for disconnection
      device.addEventListener('gattserverdisconnected', onDisconnected);
      
      // Connect to GATT server
      const server = await device.gatt!.connect();
      
      // Get scale service
      const scaleService = await server.getPrimaryService(BLACK_COFFEE_SCALE_SERVICE);
      
      // Get characteristics
      const characteristics = new Map<string, BluetoothRemoteGATTCharacteristic>();
      
      // Get weight characteristic
      try {
        const weightChar = await scaleService.getCharacteristic(BLACK_COFFEE_WEIGHT_CHARACTERISTIC);
        characteristics.set(BLACK_COFFEE_WEIGHT_CHARACTERISTIC, weightChar);
        
        // Set up notifications for weight changes
        await weightChar.startNotifications();
        weightChar.addEventListener('characteristicvaluechanged', handleCoffeeScaleData);
      } catch (e) {
        console.warn('Black Coffee Scale weight characteristic not found:', e);
      }
      
      // Get command characteristic
      try {
        const commandChar = await scaleService.getCharacteristic(BLACK_COFFEE_COMMAND_CHARACTERISTIC);
        characteristics.set(BLACK_COFFEE_COMMAND_CHARACTERISTIC, commandChar);
      } catch (e) {
        console.warn('Black Coffee Scale command characteristic not found:', e);
      }
      
      // Note: Battery service has been removed as requested
      
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
  }, [state.connecting, state.connected]);
  
  // Store previous weight and timestamp for flow rate calculation
  const prevWeightRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number>(Date.now());
  
  // Handle coffee scale data
  const handleCoffeeScaleData = useCallback((event: Event) => {
    try {
      const characteristic = event.target as unknown as BluetoothRemoteGATTCharacteristic;
      const dataView = characteristic.value as DataView;
      
      // Parse the data using our Black Coffee Scale parser
      const scaleData = parseBlackCoffeeWeightData(dataView);
      
      // Update measurements state with weight
      if (scaleData.weight !== undefined) {
        // Calculate flow rate if we have previous weight
        const currentWeight = scaleData.weight;
        const currentTime = Date.now();
        
        if (prevWeightRef.current !== null) {
          const timeDiff = currentTime - lastTimestampRef.current;
          
          // Only calculate flow rate if time difference is reasonable (100ms-3s)
          if (timeDiff > 100 && timeDiff < 3000 && currentWeight !== prevWeightRef.current) {
            const flowRate = calculateFlowRate(currentWeight, prevWeightRef.current, timeDiff);
            
            // Update flow rate in state
            dispatch({
              type: ActionType.UPDATE_MEASUREMENTS,
              measurements: { flowRate }
            });
          }
        }
        
        // Update timer (simulated since scale might not have one)
        const timer = Math.floor((Date.now() - lastTimestampRef.current) / 1000);
        
        // Update state with weight and timer
        dispatch({ 
          type: ActionType.UPDATE_MEASUREMENTS, 
          measurements: { 
            weight: scaleData.weight,
            timer: timer
          }
        });
        
        // Save current weight for next calculation
        prevWeightRef.current = currentWeight;
        lastTimestampRef.current = currentTime;
      }
    } catch (error) {
      console.error('Error handling coffee scale data:', error);
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
    dispatch({ type: ActionType.DISCONNECTED });
  }, []);
  
  // Clear error messages
  const clearError = useCallback(() => {
    dispatch({ type: ActionType.CLEAR_ERROR });
  }, []);
  

  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (state.connected) {
        disconnect();
      }
    };
  }, [state.connected, disconnect]);
  
  return {
    ...state,
    connect,
    disconnect,
    clearError
  };
}


