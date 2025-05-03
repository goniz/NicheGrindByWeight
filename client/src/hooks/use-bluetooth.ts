import { useEffect, useReducer, useCallback, useRef } from 'react';
import { 
  BluetoothState, 
  initialBluetoothState, 
  getErrorMessage, 
  BLACK_COFFEE_SCALE_SERVICE,
  BATTERY_SERVICE,
  BLACK_COFFEE_WEIGHT_CHARACTERISTIC,
  BLACK_COFFEE_COMMAND_CHARACTERISTIC,
  BATTERY_CHARACTERISTIC,
  parseBlackCoffeeWeightData,
  calculateFlowRate,
  simulateMeasurements,
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
      
      // Request device with Black Coffee Scale service UUID
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [BLACK_COFFEE_SCALE_SERVICE] }
        ],
        optionalServices: [BATTERY_SERVICE, 'device_information']
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
      
      // Try to get battery service
      try {
        const batteryService = await server.getPrimaryService(BATTERY_SERVICE);
        const batteryChar = await batteryService.getCharacteristic(BATTERY_CHARACTERISTIC);
        characteristics.set(BATTERY_CHARACTERISTIC, batteryChar);
        
        // Read battery level
        const batteryValue = await batteryChar.readValue();
        const batteryLevel = batteryValue.getUint8(0);
        
        dispatch({
          type: ActionType.UPDATE_MEASUREMENTS,
          measurements: { batteryLevel }
        });
        
        // Set up notifications for battery changes if supported
        if (batteryChar.properties.notify) {
          await batteryChar.startNotifications();
          batteryChar.addEventListener('characteristicvaluechanged', handleBatteryChange);
        }
      } catch (e) {
        console.warn('Battery service not available:', e);
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
      
      // Check for battery level
      if (scaleData.batteryLevel !== undefined) {
        dispatch({
          type: ActionType.UPDATE_MEASUREMENTS,
          measurements: { batteryLevel: scaleData.batteryLevel }
        });
      }
    } catch (error) {
      console.error('Error handling coffee scale data:', error);
    }
  }, []);
  
  // Handle battery level changes
  const handleBatteryChange = useCallback((event: Event) => {
    try {
      const characteristic = event.target as unknown as BluetoothRemoteGATTCharacteristic;
      const dataView = characteristic.value as DataView;
      
      // Battery level is a single byte percentage value
      const batteryLevel = dataView.getUint8(0);
      
      dispatch({
        type: ActionType.UPDATE_MEASUREMENTS,
        measurements: { batteryLevel }
      });
    } catch (error) {
      console.error('Error handling battery change:', error);
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
  const demoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const simulateDemoMeasurements = useCallback(() => {
    // Initial simulation of a coffee dose being measured
    // Start with empty scale
    let isPouring = false;
    let baseWeight = 0; // empty scale
    let baseTimer = 0;
    let baseBatteryLevel = 85;
    let baseFlowRate = 0;
    let pourStartTime = 0;
    let targetWeight = (18 + Math.random() * 4); // Target weight 18-22g
    
    // Update with initial empty scale values
    dispatch({
      type: ActionType.UPDATE_MEASUREMENTS,
      measurements: {
        weight: 0,
        timer: 0,
        batteryLevel: baseBatteryLevel,
        flowRate: 0
      }
    });
    
    // Set up interval for a simulated pour
    demoIntervalRef.current = setInterval(() => {
      // Current time in simulation
      const now = Date.now();
      
      // If not pouring and scale is empty, randomly start a pour
      if (!isPouring && baseWeight < 0.001 && Math.random() > 0.7) {
        isPouring = true;
        pourStartTime = now;
        baseTimer = 0;
      }
      
      // If pouring, increase weight towards target
      if (isPouring) {
        // Update timer
        baseTimer = Math.floor((now - pourStartTime) / 1000);
        
        // Calculate remaining weight to target
        const remaining = targetWeight - baseWeight * 1000;
        
        if (remaining > 0.1) {
          // Simulate flow rate changes during pour
          if (baseTimer < 5) {
            // Initial fast pour
            baseFlowRate = 1.5 + (Math.random() * 0.3);
            baseWeight += baseFlowRate / 1000; // Convert g/s to kg/s
          } else if (baseTimer < 15) {
            // Slow down as we approach target
            baseFlowRate = 0.8 + (Math.random() * 0.4);
            baseWeight += baseFlowRate / 1000;
          } else {
            // Final drips
            baseFlowRate = 0.2 + (Math.random() * 0.2);
            baseWeight += baseFlowRate / 1000;
          }
        } else {
          // Reached target weight
          isPouring = false;
          baseFlowRate = 0;
          
          // Randomly reset after a while (empty the scale)
          if (Math.random() > 0.8) {
            baseWeight = 0;
            baseTimer = 0;
          }
        }
      } else {
        // Small random fluctuations when not pouring (scale stability)
        if (baseWeight > 0) {
          baseWeight += (Math.random() - 0.5) * 0.0001;
        }
        baseFlowRate = 0;
      }
      
      // Ensure weight doesn't exceed target
      if (baseWeight * 1000 > targetWeight) {
        baseWeight = targetWeight / 1000;
      }
      
      // Update the state with new values
      dispatch({
        type: ActionType.UPDATE_MEASUREMENTS,
        measurements: {
          weight: Number(baseWeight.toFixed(3)), // 3 decimal places (g precision)
          timer: baseTimer,
          batteryLevel: baseBatteryLevel,
          flowRate: Number(baseFlowRate.toFixed(1))
        }
      });
    }, 200); // More frequent updates for smoother simulation
    
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


