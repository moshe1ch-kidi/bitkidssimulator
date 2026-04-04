import React, { useState, useRef, useEffect } from 'react';
import * as Blockly from 'blockly';
import './blockly/blocks'; // Register blocks
import './blockly/generators'; // Register generators
import { javascriptGenerator } from './blockly/generators';
import { Play, Square, Trash2, Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw, Save, FolderOpen, Monitor, HelpCircle, X, ClipboardList, Lightbulb, ShieldAlert, Thermometer, Droplets, Palette, Move, Zap } from 'lucide-react';
import { MicrobitBoard } from './components/MicrobitBoard';
import { ElectronicComponents, DraggableComponent } from './components/ElectronicComponents';

const WireCanvas = ({ wires, drawingWireFrom, mousePos, resizeTrigger }: { wires: any[], drawingWireFrom: string | null, mousePos: {x: number, y: number}, resizeTrigger: number }) => {
  const [paths, setPaths] = useState<{id: string, d: string, color: string, isDashed: boolean}[]>([]);

  useEffect(() => {
    let frameId: number;
    const updatePaths = () => {
      const boardEl = document.getElementById('microbit-board-container');
      if (!boardEl) {
        frameId = requestAnimationFrame(updatePaths);
        return;
      }
      const boardRect = boardEl.getBoundingClientRect();
      
      const newPaths: {id: string, d: string, color: string, isDashed: boolean}[] = [];
      
      const calcPath = (startId: string, endId: string, isDrawing: boolean) => {
        const startEl = document.getElementById(startId);
        const endEl = endId === 'mouse-tracker' ? document.getElementById('mouse-tracker') : document.getElementById(endId);
        const svgEl = document.getElementById('wire-canvas-svg');
        
        if (!startEl || !endEl || !svgEl) return null;
        
        const startRect = startEl.getBoundingClientRect();
        const endRect = endEl.getBoundingClientRect();
        const svgRect = svgEl.getBoundingClientRect();
        
        const isM = startId.includes('port-M');
        const isS = startId.includes('port-S');
        const isJ = startId.includes('port-J');
        const isI = startId.includes('port-I');
        
        // Extract port number for dynamic offset to prevent overlapping
        const portNumMatch = startId.match(/\d+/);
        const portNum = portNumMatch ? parseInt(portNumMatch[0]) : 0;
        const portOffset = (portNum - 1) * 12; // 12px separation between wires

        let startX = startRect.left + startRect.width / 2 - svgRect.left;
        let startY = startRect.top + startRect.height / 2 - svgRect.top;
        
        if (isJ) startX = startRect.right - svgRect.left;
        if (isI) startX = startRect.left - svgRect.left;
        if (isM) startY = startRect.bottom - svgRect.top;
        
        let endX = endRect.left + endRect.width / 2 - svgRect.left;
        let endY = endRect.top - svgRect.top;
        if (isDrawing) {
          endX = endRect.left - svgRect.left;
          endY = endRect.top - svgRect.top;
        }
        
        let d = `M ${startX} ${startY} `;
        
        const padding = 40;
        const boardBottom = boardRect.bottom + padding - svgRect.top;
        
        if (isJ) {
          const rightEdge = Math.max(boardRect.right + 60 - svgRect.left, startX + 60) + portOffset;
          d += `L ${rightEdge} ${startY} `;
          const midY = endY - 20 - (portOffset / 2);
          
          if (endX > rightEdge) {
             d += `L ${rightEdge} ${midY} `;
             d += `L ${endX} ${midY} `;
          } else {
             const safeY = Math.max(boardBottom + portOffset, midY);
             d += `L ${rightEdge} ${safeY} `;
             d += `L ${endX} ${safeY} `;
             if (safeY !== midY) {
                d += `L ${endX} ${midY} `;
             }
          }
          d += `L ${endX} ${endY}`;
        } else if (isI) {
          const leftEdge = Math.min(boardRect.left - padding - svgRect.left, startX - padding) - portOffset;
          d += `L ${leftEdge} ${startY} `;
          const midY = endY - 20 - (portOffset / 2);
          
          if (endX < leftEdge) {
             d += `L ${leftEdge} ${midY} `;
             d += `L ${endX} ${midY} `;
          } else {
             const safeY = Math.max(boardBottom + portOffset, midY);
             d += `L ${leftEdge} ${safeY} `;
             d += `L ${endX} ${safeY} `;
             if (safeY !== midY) {
                d += `L ${endX} ${midY} `;
             }
          }
          d += `L ${endX} ${endY}`;
        } else if (isS) {
          // 90-degree bypass routing for S ports
          // Route UP first to the top area of the board to avoid side ports (I/J)
          const isLeft = endX < startX;
          const sideX = isLeft 
            ? boardRect.left - 50 - svgRect.left - portOffset
            : boardRect.right + 50 - svgRect.left + portOffset;
            
          // Bypass Y: near the top of the board but below the very top edge
          const bypassY = boardRect.top + 15 - svgRect.top - portOffset;
          
          d += `L ${startX} ${bypassY} `;
          d += `L ${sideX} ${bypassY} `;
          
          const midY = endY - 30 - (portOffset / 2);
          const isUnderBoard = endY > boardRect.bottom - svgRect.top;
          
          if (isUnderBoard) {
            // If component is below the board, route around the bottom
            const bottomBypassY = boardRect.bottom + 40 - svgRect.top + portOffset;
            d += `L ${sideX} ${bottomBypassY} `;
            d += `L ${endX} ${bottomBypassY} `;
          } else {
            // If component is to the side, route to its midY
            d += `L ${sideX} ${midY} `;
            d += `L ${endX} ${midY} `;
          }
          
          d += `L ${endX} ${endY}`;
        } else if (isM) {
          // 90-degree routing for M ports
          const dropY = Math.max(boardBottom, startY + 30) + portOffset;
          const midY = Math.max(dropY, endY - 30);
          d += `L ${startX} ${midY} `;
          d += `L ${endX} ${midY} `;
          d += `L ${endX} ${endY}`;
        } else {
          d += `L ${endX} ${startY} L ${endX} ${endY}`;
        }
        
        return d;
      };

      const getColor = (from: string, to: string) => {
        const port = from.includes('port-') ? from : to;
        if (port.includes('port-J')) return '#ef4444'; // Red
        if (port.includes('port-S')) return '#f97316'; // Orange
        if (port.includes('port-M')) return '#22c55e'; // Green
        if (port.includes('port-I')) return '#3b82f6'; // Blue
        return '#475569'; // Default Gray
      };

      wires.forEach((wire, i) => {
        const d = calcPath(wire.from, wire.to, false);
        if (d) {
          newPaths.push({ id: `wire-${i}`, d, color: getColor(wire.from, wire.to), isDashed: false });
        }
      });
      
      if (drawingWireFrom) {
        const d = calcPath(drawingWireFrom, 'mouse-tracker', true);
        if (d) {
          newPaths.push({ id: 'wire-drawing', d, color: getColor(drawingWireFrom, 'mouse-tracker'), isDashed: true });
        }
      }
      
      setPaths(newPaths);
      frameId = requestAnimationFrame(updatePaths);
    };
    
    frameId = requestAnimationFrame(updatePaths);
    return () => cancelAnimationFrame(frameId);
  }, [wires, drawingWireFrom, resizeTrigger]);

  return (
    <svg id="wire-canvas-svg" className="absolute inset-0 w-full h-full pointer-events-none z-50">
      <style>
        {`
          @keyframes dash {
            to {
              stroke-dashoffset: -20;
            }
          }
          .animate-dash {
            animation: dash 1s linear infinite;
          }
        `}
      </style>
      {paths.map(p => (
        <path
          key={p.id}
          d={p.d}
          fill="none"
          stroke={p.color}
          strokeWidth={4}
          strokeDasharray={p.isDashed ? "8,8" : "none"}
          className={p.isDashed ? "animate-dash" : ""}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
};

export default function App() {
  const blocklyDiv = useRef<HTMLDivElement>(null);
  const workspace = useRef<Blockly.WorkspaceSvg | null>(null);
  const boardRef = useRef<any>(null);

  const [showMobileWarning, setShowMobileWarning] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showMissionsModal, setShowMissionsModal] = useState(false);
  const [showVariableWatcher, setShowVariableWatcher] = useState(false);
  const [variableValues, setVariableValues] = useState<{ [key: string]: any }>({});
  const [watcherPos, setWatcherPos] = useState({ x: 24, y: 80 });
  const [isDraggingWatcher, setIsDraggingWatcher] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [promptConfig, setPromptConfig] = useState<{
    visible: boolean;
    message: string;
    defaultValue: string;
    callback: (value: string | null) => void;
  } | null>(null);
  const [promptInputValue, setPromptInputValue] = useState('');
  const [helpTab, setHelpTab] = useState<'components' | 'nightlight' | 'thermostat'>('components');

  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth < 1024) {
        setShowMobileWarning(true);
      }
    };
    checkMobile();
  }, []);

  const componentData = [
    { category: "Input", name: "Ultrasonic Sensor", role: "Measures distance (cm)", port: "J1 / J2 / J3 / J4", notes: "Range: 2cm–400cm. Uses sound waves." },
    { category: "Input", name: "Line Tracking Sensor", role: "Detects lines for navigation", port: "J1 / J2 / J3 / J4", notes: "Detects IR reflection (Black/White)." },
    { category: "Input", name: "Light Sensor", role: "Measures ambient light", port: "J1 / J2 / J3 / J4", notes: "Analog input (0–1023 range)." },
    { category: "Input", name: "Temperature Sensor", role: "Measures ambient temperature", port: "J1 / J2 / J3 / J4", notes: "Range: -10°C to 60°C." },
    { category: "Input", name: "Sound Sensor", role: "Detects noise/claps", port: "J1 / J2 / J3 / J4", notes: "Sensitivity can be adjusted via onboard screw." },
    { category: "Input", name: "Soil Moisture Sensor", role: "Checks soil wetness", port: "J1 / J2 / J3 / J4", notes: "Clean the probes after use to prevent rust." },
    { category: "Input", name: "Crash Sensor", role: "Detects physical touch", port: "J1 / J2 / J3 / J4", notes: "A mechanical switch (Returns 0 or 1)." },
    { category: "Input", name: "Color Sensor", role: "Detects RGB colors", port: "I1 / I2 / I3 / I4", notes: "Requires I2C protocol. Calibrate for best results." },
    { category: "Input", name: "Gesture Sensor", role: "Detects hand movements", port: "I1 / I2 / I3 / I4", notes: "Senses Up, Down, Left, Right, Near, Far." },
    { category: "Input", name: "DHT11 Sensor", role: "Measures Temp & Humidity", port: "J1 / J2 / I1 / I2 / I3 / I4", notes: "The DHT11 is a low-cost, digital temperature and humidity sensor." },
    { category: "Input", name: "Smart AI Cam", role: "Recognizes faces/objects", port: "I1 / I2 / I3 / I4", notes: "Advanced AI processing. High power draw." },
    { category: "Output", name: "LED (Red/Yellow/Green)", role: "Simple light output", port: "J1 / J2 / J3 / J4", notes: "Digital or PWM control (brightness)." },
    { category: "Output", name: "Rainbow LED", role: "Full RGB color light", port: "J1 / J2 / J3 / J4", notes: "Can display any color in the spectrum." },
    { category: "Output", name: "Buzzer", role: "Plays tones/melodies", port: "J1 / J2 / J3 / J4", notes: "Used for alarms or simple music." },
    { category: "Output", name: "OLED Display", role: "Displays text/graphics", port: "I1 / I2 / I3 / I4", notes: "128x64 pixels. Clear screen before updates." },
    { category: "Output", name: "DC Motor", role: "Continuous rotation", port: "M1 / M2 / M3 / M4", notes: "For wheels/fans. Speed control (0-100)." },
    { category: "Output", name: "Servo Motor", role: "Precise angle rotation", port: "S1 / S2 / S3 / S4", notes: "Rotates 0–180°. For arms or gates." }
  ];

  const missions = [
    {
      id: 'lamp',
      title: 'Table Lamp',
      description: 'Create a smart table lamp. When the external button (Crash Sensor) is pressed, the LED should turn on. When released, it should turn off.',
      icon: <Lightbulb className="text-yellow-500" />,
      difficulty: 'Easy',
      components: ['Micro:bit', 'Crash Sensor', 'LED']
    },
    {
      id: 'alarm',
      title: 'Distance Alarm',
      description: 'Build a security system. If the Ultrasonic Sensor detects an object closer than 20cm, play a warning tone on the Buzzer.',
      icon: <ShieldAlert className="text-red-500" />,
      difficulty: 'Medium',
      components: ['Micro:bit', 'Ultrasonic Sensor', 'Buzzer']
    },
    {
      id: 'nightlight',
      title: 'Automatic Night Light',
      description: 'Program the Micro:bit to be a night light. If the Light Sensor value drops below 300, turn on the Rainbow LED with a soft white color.',
      icon: <Zap className="text-blue-500" />,
      difficulty: 'Medium',
      components: ['Micro:bit', 'Light Sensor', 'Rainbow LED']
    },
    {
      id: 'plant',
      title: 'Plant Monitor',
      description: 'Help your plants stay hydrated! If the Soil Moisture Sensor detects dry soil (value < 400), show a "Sad Face" icon on the Micro:bit screen.',
      icon: <Droplets className="text-cyan-500" />,
      difficulty: 'Easy',
      components: ['Micro:bit', 'Soil Moisture Sensor']
    },
    {
      id: 'thermostat',
      title: 'Smart Fan',
      description: 'Maintain a stable temperature of 30°C. If the temperature is below 30°C, turn on the LED to heat. If it reaches 30°C, turn off the LED and start the Fan Motor.',
      icon: <Thermometer className="text-orange-500" />,
      difficulty: 'Hard',
      components: ['Micro:bit', 'Temperature Sensor', 'LED', 'Fan Motor']
    },
    {
      id: 'sorter',
      title: 'Color Sorter',
      description: 'Sort objects by color. Move the Servo Motor to 0° if Red is detected, 90° if Green is detected, and 180° if Blue is detected.',
      icon: <Palette className="text-purple-500" />,
      difficulty: 'Hard',
      components: ['Micro:bit', 'Color Sensor', 'Servo Motor']
    },
    {
      id: 'gate',
      title: 'Security Gate',
      description: 'Use the Gesture Sensor to control a gate. Swipe "Up" to open the Servo (180°) and swipe "Down" to close it (0°).',
      icon: <Move className="text-green-500" />,
      difficulty: 'Medium',
      components: ['Micro:bit', 'Gesture Sensor', 'Servo Motor']
    }
  ];

  // Wire drawing state
  const [wires, setWires] = useState<{ from: string; to: string }[]>([]);
  const [drawingWireFrom, setDrawingWireFrom] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [droppedComponents, setDroppedComponents] = useState<{ id: string, compBase: any, x: number, y: number }[]>([]);
  const [isSimulationExpanded, setIsSimulationExpanded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [resizeTrigger, setResizeTrigger] = useState(0);
  const [motorStates, setMotorStates] = useState<{ [key: string]: { direction: string, speed: number } }>({});
  const [servoStates, setServoStates] = useState<{ [key: string]: number }>({
    'S1': 90, 'S2': 90, 'S3': 90, 'S4': 90
  });
  const [ultrasonicDistances, setUltrasonicDistances] = useState<{ [compId: string]: number }>({});
  const [ledColors, setLedColors] = useState<{ [compId: string]: string }>({});
  const [pinStates, setPinStates] = useState<{ [key: string]: number }>({});
  const [colorSensorValues, setColorSensorValues] = useState<{ [compId: string]: string }>({});
  const [lightLevels, setLightLevels] = useState<{ [compId: string]: number }>({});
  const [temperatures, setTemperatures] = useState<{ [compId: string]: number }>({});
  const [dht11Data, setDht11Data] = useState<{ [compId: string]: { mode: 'temp' | 'hum', value: number } }>({});

  const getMotorStateForComponent = (compId: string) => {
    const wire = wires.find(w => 
      (w.from === compId && w.to.startsWith('port-M')) || 
      (w.to === compId && w.from.startsWith('port-M'))
    );
    if (wire) {
      const portId = wire.from.startsWith('port-M') ? wire.from : wire.to;
      const portName = portId.replace('port-', '');
      return motorStates[portName];
    }
    return undefined;
  };

  const getServoAngleForComponent = (compId: string) => {
    const wire = wires.find(w => 
      (w.from === compId && w.to.startsWith('port-S')) || 
      (w.to === compId && w.from.startsWith('port-S'))
    );
    if (wire) {
      const portId = wire.from.startsWith('port-S') ? wire.from : wire.to;
      const portName = portId.replace('port-', '');
      return servoStates[portName];
    }
    return undefined;
  };

  const getLedStateForComponent = (compId: string) => {
    const wire = wires.find(w => 
      (w.from === compId && (w.to.startsWith('port-I') || w.to.startsWith('port-J'))) || 
      (w.to === compId && (w.from.startsWith('port-I') || w.from.startsWith('port-J')))
    );
    if (wire) {
      const portId = wire.from.startsWith('port-') ? wire.from : wire.to;
      const portName = portId.replace('port-', '');
      return pinStates[portName] === 1;
    }
    return false;
  };

  const getUltrasonicDistanceForPort = async (port: string) => {
    const portId = `port-${port}`;
    const wire = wires.find(w => w.from === portId || w.to === portId);
    if (wire) {
      const compId = wire.from === portId ? wire.to : wire.from;
      return ultrasonicDistances[compId] || 100;
    }
    return 0;
  };
  
  const getColorForPort = async (port: string) => {
    const portId = `port-${port}`;
    const wire = wires.find(w => w.from === portId || w.to === portId);
    if (wire) {
      const compId = wire.from === portId ? wire.to : wire.from;
      return colorSensorValues[compId] || 'None';
    }
    return 'None';
  };

  const getLightLevelForPort = async (port: string) => {
    const portId = `port-${port}`;
    const wire = wires.find(w => w.from === portId || w.to === portId);
    if (wire) {
      const compId = wire.from === portId ? wire.to : wire.from;
      return lightLevels[compId] || 0;
    }
    return 0;
  };

  const getTemperatureForPort = async (port: string) => {
    const portId = `port-${port}`;
    const wire = wires.find(w => w.from === portId || w.to === portId);
    if (wire) {
      const compId = wire.from === portId ? wire.to : wire.from;
      if (temperatures[compId] !== undefined) return temperatures[compId];
      const dhtData = dht11Data[compId];
      if (dhtData && dhtData.mode === 'temp') return dhtData.value;
    }
    return 25;
  };

  const getHumidityForPort = async (port: string) => {
    const portId = `port-${port}`;
    const wire = wires.find(w => w.from === portId || w.to === portId);
    if (wire) {
      const compId = wire.from === portId ? wire.to : wire.from;
      const dhtData = dht11Data[compId];
      if (dhtData && dhtData.mode === 'hum') return dhtData.value;
    }
    return 0;
  };

  useEffect(() => {
    const handleResize = () => setResizeTrigger(prev => prev + 1);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (drawingWireFrom) {
        setMousePos({ x: e.clientX, y: e.clientY });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    const handleMouseUp = () => {
      setIsDraggingWatcher(false);
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [drawingWireFrom]);

  useEffect(() => {
    if (isDraggingWatcher) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        const container = document.getElementById('simulation-container');
        const watcher = document.getElementById('variable-watcher-panel');
        if (!container || !watcher) return;

        const containerRect = container.getBoundingClientRect();
        const watcherRect = watcher.getBoundingClientRect();

        // Calculate position relative to container
        let newX = e.clientX - containerRect.left - dragOffset.x;
        let newY = e.clientY - containerRect.top - dragOffset.y;

        // Clamp within container boundaries
        const maxX = containerRect.width - watcherRect.width;
        const maxY = containerRect.height - watcherRect.height;

        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        setWatcherPos({ x: newX, y: newY });
      };
      window.addEventListener('mousemove', handleGlobalMouseMove);
      return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
    }
  }, [isDraggingWatcher, dragOffset]);

  useEffect(() => {
    if (blocklyDiv.current && !workspace.current) {
      // Override prompt for variable naming to be more robust in iframes
      Blockly.dialog.setPrompt((message, defaultValue, callback) => {
        setPromptInputValue(defaultValue);
        setPromptConfig({
          visible: true,
          message,
          defaultValue,
          callback
        });
      });

      workspace.current = Blockly.inject(blocklyDiv.current, {
        toolbox: {
          kind: 'categoryToolbox',
          contents: [
            {
              kind: 'category',
              name: 'Events',
              colour: '#FFBF00',
              cssConfig: {
                row: 'blocklyTreeRowCustom events-category'
              },
              contents: [
                { kind: 'block', type: 'event_when_green_flag_clicked' },
                { kind: 'block', type: 'microbit_button_pressed' },
              ],
            },
            {
              kind: 'category',
              name: 'Micro:bit',
              colour: '#4C97FF',
              cssConfig: {
                row: 'blocklyTreeRowCustom microbit-category'
              },
              contents: [
                { kind: 'block', type: 'microbit_show_icon' },
                { kind: 'block', type: 'microbit_show_text' },
                { kind: 'block', type: 'microbit_set_led_color' },
                { kind: 'block', type: 'microbit_led_toggle' },
                { kind: 'block', type: 'microbit_set_pin' },
                { kind: 'block', type: 'microbit_set_motor' },
                { kind: 'block', type: 'microbit_set_servo' },
                { kind: 'block', type: 'microbit_play_tone' },
              ],
            },
            {
              kind: 'category',
              name: 'Sensors',
              colour: '#9966FF',
              cssConfig: {
                row: 'blocklyTreeRowCustom sensors-category'
              },
              contents: [
                { kind: 'block', type: 'microbit_ultrasonic_distance' },
                { kind: 'block', type: 'microbit_color_sensor' },
                { kind: 'block', type: 'microbit_light_sensor' },
                { kind: 'block', type: 'microbit_temperature_sensor' },
                { kind: 'block', type: 'microbit_humidity_sensor' },
                { kind: 'block', type: 'microbit_dht11' },
              ],
            },
            {
              kind: 'category',
              name: 'Sound',
              colour: '#0FBD8C',
              cssConfig: {
                row: 'blocklyTreeRowCustom sound-category'
              },
              contents: [
                { kind: 'block', type: 'microbit_play_tone' },
              ],
            },
            {
              kind: 'category',
              name: 'Control',
              colour: '#FFAB19',
              cssConfig: {
                row: 'blocklyTreeRowCustom control-category'
              },
              contents: [
                { kind: 'block', type: 'control_wait' },
                { kind: 'block', type: 'control_wait_until' },
                { kind: 'block', type: 'control_repeat' },
                { kind: 'block', type: 'control_forever' },
                { kind: 'block', type: 'control_if' },
                { kind: 'block', type: 'control_if_else' },
              ],
            },
            {
              kind: 'category',
              name: 'Operators',
              colour: '#59C059',
              cssConfig: {
                row: 'blocklyTreeRowCustom operators-category'
              },
              contents: [
                { kind: 'block', type: 'math_number' },
                { kind: 'block', type: 'logic_boolean' },
                {
                  kind: 'block',
                  type: 'operator_add',
                  inputs: {
                    NUM1: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
                    NUM2: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
                  },
                },
                {
                  kind: 'block',
                  type: 'operator_subtract',
                  inputs: {
                    NUM1: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
                    NUM2: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
                  },
                },
                {
                  kind: 'block',
                  type: 'operator_multiply',
                  inputs: {
                    NUM1: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
                    NUM2: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
                  },
                },
                {
                  kind: 'block',
                  type: 'operator_divide',
                  inputs: {
                    NUM1: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
                    NUM2: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
                  },
                },
                {
                  kind: 'block',
                  type: 'operator_random',
                  inputs: {
                    FROM: { shadow: { type: 'math_number', fields: { NUM: 1 } } },
                    TO: { shadow: { type: 'math_number', fields: { NUM: 10 } } },
                  },
                },
                {
                  kind: 'block',
                  type: 'operator_lt',
                  inputs: {
                    OP1: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
                    OP2: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
                  },
                },
                {
                  kind: 'block',
                  type: 'operator_equals',
                  inputs: {
                    OP1: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
                    OP2: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
                  },
                },
                {
                  kind: 'block',
                  type: 'operator_gt',
                  inputs: {
                    OP1: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
                    OP2: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
                  },
                },
                { kind: 'block', type: 'operator_and' },
                { kind: 'block', type: 'operator_or' },
                { kind: 'block', type: 'operator_not' },
              ],
            },
            {
              kind: 'category',
              name: 'Variables',
              colour: '#FF8C1A',
              custom: 'VARIABLE',
              cssConfig: {
                row: 'blocklyTreeRowCustom variables-category'
              },
            },
          ],
        } as any,
        grid: { spacing: 20, length: 3, colour: '#ccc', snap: true },
        move: { 
          scrollbars: false,
          drag: true, 
          wheel: true 
        },
        scrollbars: true,
        zoom: {
          controls: true,
          wheel: true,
          startScale: 1.0,
          maxScale: 3,
          minScale: 0.3,
          scaleSpeed: 1.2,
          pinch: true
        },
        trashcan: true,
        renderer: 'zelos',
        theme: Blockly.Themes.Zelos,
      });
    }

    return () => {
      if (workspace.current) {
        workspace.current.dispose();
        workspace.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (workspace.current) {
      // Small delay to allow CSS transitions to complete before resizing Blockly
      setTimeout(() => {
        if (workspace.current) {
          Blockly.svgResize(workspace.current);
        }
      }, 50);
    }
  }, [isSimulationExpanded]);

  const executionIdRef = useRef(0);

  const runCode = () => {
    if (workspace.current) {
      executionIdRef.current += 1;
      const currentExecutionId = executionIdRef.current;
      
      const checkStop = () => {
        if (executionIdRef.current !== currentExecutionId) {
          throw new Error('Execution stopped');
        }
      };

      const code = javascriptGenerator.workspaceToCode(workspace.current);
      console.log('Generated code:', code);
      
      const updateVars = (vars: any) => {
        setVariableValues(prev => {
          // Only update if values actually changed to avoid unnecessary re-renders
          const changed = Object.keys(vars).some(key => vars[key] !== prev[key]);
          return changed ? { ...prev, ...vars } : prev;
        });
      };

      try {
        boardRef.current?.clear();
        setVariableValues({}); // Reset variables on start
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        // eslint-disable-next-line no-new-func
        new AsyncFunction('boardRef', 'checkStop', 'updateVars', code)(boardRef, checkStop, updateVars);
        boardRef.current?.triggerGreenFlag();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const stopCode = () => {
    executionIdRef.current += 1;
    boardRef.current?.clear();
  };

  const handleNodeClick = (id: string) => {
    const existingWireIndex = wires.findIndex(w => w.from === id || w.to === id);

    if (!drawingWireFrom) {
      if (existingWireIndex !== -1) {
        // Disconnect existing wire
        const newWires = [...wires];
        newWires.splice(existingWireIndex, 1);
        setWires(newWires);
        setConnectionError(null);
      } else {
        // Start drawing a wire
        setDrawingWireFrom(id);
        setConnectionError(null);
      }
    } else {
      // Finish drawing a wire
      if (drawingWireFrom === id) {
        // Cancel drawing if clicking the same node
        setDrawingWireFrom(null);
        return;
      }

      if (existingWireIndex !== -1) {
        setConnectionError("This terminal is already connected.");
        setTimeout(() => setConnectionError(null), 3000);
        setDrawingWireFrom(null);
        return;
      }

      const isPort = (nodeId: string) => nodeId.startsWith('port-');
      const isComp = (nodeId: string) => nodeId.startsWith('comp-');

      // Rule: Cannot connect port to port, or component to component
      if ((isPort(drawingWireFrom) && isPort(id)) || (isComp(drawingWireFrom) && isComp(id))) {
        setConnectionError("Invalid connection: Must connect a port to a component.");
        setTimeout(() => setConnectionError(null), 3000);
        setDrawingWireFrom(null);
        return;
      }

      // Always route from Port to Component for consistent pathing
      let from = drawingWireFrom;
      let to = id;
      if (isComp(from) && isPort(to)) {
        from = id;
        to = drawingWireFrom;
      }

      // Rule: Servo motors can only connect to S1, S2, S3, S4
      // Rule: GeekServo can connect to S1-S4 OR M1-M4
      const isServoComp = to.includes('comp-servo');
      const isGeekServoComp = to.includes('comp-geekservo');
      const isSPort = from.includes('port-S');
      const isMPort = from.includes('port-M');
      
      if (isServoComp && !isSPort) {
        setConnectionError("Servo motors can only connect to S1, S2, S3, or S4.");
        setTimeout(() => setConnectionError(null), 3000);
        setDrawingWireFrom(null);
        return;
      }
      
      if (isGeekServoComp && !isSPort && !isMPort) {
        setConnectionError("Motor can only connect to S1-S4 or M1-M4.");
        setTimeout(() => setConnectionError(null), 3000);
        setDrawingWireFrom(null);
        return;
      }
      
      if (!isServoComp && !isGeekServoComp && isSPort) {
        setConnectionError("S1-S4 ports are reserved for Servo motors.");
        setTimeout(() => setConnectionError(null), 3000);
        setDrawingWireFrom(null);
        return;
      }

      setWires([...wires, { from, to }]);
      setDrawingWireFrom(null);
    }
  };

  const saveProject = () => {
    if (!workspace.current) return;
    const xml = Blockly.Xml.workspaceToDom(workspace.current);
    const xmlText = Blockly.Xml.domToText(xml);
    const projectData = {
      xml: xmlText,
      wires,
      droppedComponents
    };
    const blob = new Blob([JSON.stringify(projectData)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'stack-kidi-project.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const loadProject = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (re) => {
        try {
          const projectData = JSON.parse(re.target?.result as string);
          if (projectData.xml && workspace.current) {
            workspace.current.clear();
            const xml = Blockly.utils.xml.textToDom(projectData.xml);
            Blockly.Xml.domToWorkspace(xml, workspace.current);
          }
          if (projectData.wires) setWires(projectData.wires);
          if (projectData.droppedComponents) setDroppedComponents(projectData.droppedComponents);
        } catch (err) {
          console.error("Failed to load project", err);
          alert("קובץ לא תקין");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans overflow-hidden">
      {showMobileWarning && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-6 text-center">
          <div className="bg-white rounded-3xl p-8 max-w-md shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Desktop Only Experience</h2>
            <p className="text-slate-600 mb-8 leading-relaxed">
              This application is designed for desktop computers. 
              Please switch to a larger screen for the best experience.
            </p>
            <button 
              onClick={() => setShowMobileWarning(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95"
            >
              Continue Anyway
            </button>
          </div>
        </div>
      )}

      {showMissionsModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-blue-50/50">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 text-white p-2 rounded-xl">
                  <ClipboardList size={24} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">BITKIDI Missions</h2>
              </div>
              <button 
                onClick={() => setShowMissionsModal(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {missions.map((mission) => (
                <div key={mission.id} className="border border-slate-100 rounded-2xl p-5 hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      {mission.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-slate-900">{mission.title}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          mission.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                          mission.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {mission.difficulty}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">{mission.description}</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {mission.components.map((comp, i) => (
                          <span key={i} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                            {comp}
                          </span>
                        ))}
                      </div>
                      {(mission.id === 'nightlight' || mission.id === 'thermostat') && (
                        <button 
                          onClick={() => {
                            setHelpTab(mission.id === 'nightlight' ? 'nightlight' : 'thermostat');
                            setShowHelpModal(true);
                            setShowMissionsModal(false);
                          }}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                        >
                          <HelpCircle size={14} />
                          צפה במדריך המלא
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <p className="text-xs text-slate-400 italic">Complete missions to master BITKIDI!</p>
              <button 
                onClick={() => setShowMissionsModal(false)}
                className="bg-blue-600 text-white font-bold py-2 px-8 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Prompt Modal for Blockly */}
      {promptConfig?.visible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{promptConfig.message}</h3>
              <input
                type="text"
                autoFocus
                value={promptInputValue}
                onChange={(e) => setPromptInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    promptConfig.callback(promptInputValue);
                    setPromptConfig(null);
                  } else if (e.key === 'Escape') {
                    promptConfig.callback(null);
                    setPromptConfig(null);
                  }
                }}
                className="w-full px-4 py-2 border-2 border-blue-100 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  promptConfig.callback(null);
                  setPromptConfig(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  promptConfig.callback(promptInputValue);
                  setPromptConfig(null);
                }}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-md"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showHelpModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 text-blue-600 p-2 rounded-xl">
                  <HelpCircle size={24} />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {helpTab === 'components' ? 'Component Guide & Connection Table' : 
                     helpTab === 'nightlight' ? 'Automatic Night Light - מדריך משימה' : 
                     'Smart Fan - מדריך משימה'}
                  </h2>
                  <div className="flex gap-4 mt-1">
                    <button 
                      onClick={() => setHelpTab('components')}
                      className={`text-xs font-bold pb-1 border-b-2 transition-all ${helpTab === 'components' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                      Components
                    </button>
                    <button 
                      onClick={() => setHelpTab('nightlight')}
                      className={`text-xs font-bold pb-1 border-b-2 transition-all ${helpTab === 'nightlight' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                      Night Light Guide
                    </button>
                    <button 
                      onClick={() => setHelpTab('thermostat')}
                      className={`text-xs font-bold pb-1 border-b-2 transition-all ${helpTab === 'thermostat' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                      Smart Fan Guide
                    </button>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowHelpModal(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              {helpTab === 'components' ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 text-sm uppercase tracking-wider">
                      <th className="p-4 font-bold border-b border-slate-200">Category</th>
                      <th className="p-4 font-bold border-b border-slate-200">Component Name</th>
                      <th className="p-4 font-bold border-b border-slate-200">Primary Role</th>
                      <th className="p-4 font-bold border-b border-slate-200">Connection Port</th>
                      <th className="p-4 font-bold border-b border-slate-200">Technical Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {componentData.map((comp, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-sm font-medium">
                          <span className={`px-2 py-1 rounded-md text-xs font-bold ${comp.category === 'Input' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                            {comp.category}
                          </span>
                        </td>
                        <td className="p-4 text-sm font-bold text-slate-900">{comp.name}</td>
                        <td className="p-4 text-sm text-slate-600">{comp.role}</td>
                        <td className="p-4 text-sm font-mono text-blue-600 font-bold">{comp.port}</td>
                        <td className="p-4 text-sm text-slate-500 italic">{comp.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : helpTab === 'nightlight' ? (
                <div className="max-w-4xl mx-auto space-y-10 text-left py-4" dir="ltr">
                  <section className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                    <h3 className="text-2xl font-black text-blue-900 mb-4">Automatic Night Light</h3>
                    <p className="text-lg text-slate-700 leading-relaxed">
                      To create an automatic night light with the Micro:bit system, we need to build logic that constantly checks the ambient light level and responds accordingly.
                    </p>
                    <div className="mt-6 flex justify-center">
                      <img 
                        src="https://raw.githubusercontent.com/moshe1ch-kidi/bitkidssimulator/refs/heads/main/src/help/lightsensormodel.png" 
                        alt="Light Sensor Model" 
                        className="rounded-2xl shadow-lg max-w-full h-auto border-4 border-white"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 border-l-4 border-blue-500 pl-4">1. System Components</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <li className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-600 font-bold">1</div>
                        <span className="font-medium text-slate-700">Controller: Micro:bit</span>
                      </li>
                      <li className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-600 font-bold">2</div>
                        <span className="font-medium text-slate-700">Expansion Board: bitkidi Breakout Board</span>
                      </li>
                      <li className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-600 font-bold">3</div>
                        <span className="font-medium text-slate-700">Sensor: Analog Light Sensor (connected to port J1)</span>
                      </li>
                      <li className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-600 font-bold">4</div>
                        <span className="font-medium text-slate-700">Output: LED bulb or LED strip (connected to port J4)</span>
                      </li>
                    </ul>
                    <div className="flex justify-center mt-4">
                      <img 
                        src="https://raw.githubusercontent.com/moshe1ch-kidi/bitkidssimulator/refs/heads/main/src/help/lightsensorsimulation.png" 
                        alt="Simulation Setup" 
                        className="rounded-2xl shadow-md max-w-full h-auto border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 border-l-4 border-blue-500 pl-4">2. Code Logic (The Algorithm)</h3>
                    <p className="text-slate-600 leading-relaxed">
                      The code runs in an infinite loop (Forever) and performs a logical comparison:
                    </p>
                    <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 shrink-0"></div>
                        <p><span className="text-blue-400 font-bold">Data Reading:</span> The system samples the analog value from the sensor on port J1.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full mt-2 shrink-0"></div>
                        <p><span className="text-green-400 font-bold">Comparison (Threshold):</span> If the value is less than 300 (Light &lt; 300) - it means it's dark enough to turn on the light.</p>
                      </div>
                      <div className="flex items-start gap-3 ml-5">
                        <div className="w-2 h-2 bg-slate-500 rounded-full mt-2 shrink-0"></div>
                        <p>If the value is greater than or equal to 300 (Light ≥ 300) - it means there is enough light in the room and the bulb should remain off.</p>
                      </div>
                    </div>
                    <div className="flex justify-center mt-4">
                      <img 
                        src="https://raw.githubusercontent.com/moshe1ch-kidi/bitkidssimulator/refs/heads/main/src/help/lightsensorcode.png" 
                        alt="Code Logic" 
                        className="rounded-2xl shadow-md max-w-full h-auto border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 border-l-4 border-blue-500 pl-4">3. Analog Values Detail</h3>
                    <p className="text-slate-600 leading-relaxed">
                      The system translates light intensity into numbers ranging from 0 to 1023:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="bg-slate-800 p-6 rounded-2xl text-center">
                        <div className="text-3xl font-black text-white mb-2">0</div>
                        <div className="text-slate-400 text-sm">Minimum: Absolute Darkness</div>
                      </div>
                      <div className="bg-yellow-500 p-6 rounded-2xl text-center">
                        <div className="text-3xl font-black text-white mb-2">1023</div>
                        <div className="text-yellow-100 text-sm">Maximum: Very Strong Light</div>
                      </div>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-2xl border-l-4 border-blue-500">
                      <p className="text-blue-900 font-medium">
                        <span className="font-black">Why did we choose 300?</span> This is the "Threshold". At this value, the system decides to switch from "Day" mode to "Night" mode.
                      </p>
                    </div>
                  </section>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto space-y-10 text-left py-4" dir="ltr">
                  <section className="bg-orange-50 p-6 rounded-3xl border border-orange-100">
                    <h3 className="text-2xl font-black text-orange-900 mb-4">Smart Fan</h3>
                    <p className="text-lg text-slate-700 leading-relaxed">
                      When connecting an external thermistor to the Micro:bit, the Micro:bit does not "read" temperature directly. Instead, it performs an **Analog Read** of the voltage on the pin where the thermistor is connected. Since the thermistor's resistance changes with temperature, the measured voltage also changes. To obtain a temperature reading in degrees Celsius, the software must perform mathematical calculations on the raw analog value.
                    </p>
                    <div className="mt-6 flex justify-center">
                      <img 
                        src="https://raw.githubusercontent.com/moshe1ch-kidi/bitkidssimulator/refs/heads/main/src/help/hotmodel.png" 
                        alt="Smart Fan Model" 
                        className="rounded-2xl shadow-lg max-w-full h-auto border-4 border-white"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 border-l-4 border-orange-500 pl-4">1. System Components</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <li className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-orange-600 font-bold">1</div>
                        <span className="font-medium text-slate-700">Controller: Micro:bit</span>
                      </li>
                      <li className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-orange-600 font-bold">2</div>
                        <span className="font-medium text-slate-700">Expansion Board: bitkidi Breakout Board</span>
                      </li>
                      <li className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-orange-600 font-bold">3</div>
                        <span className="font-medium text-slate-700">Sensor: Temperature Sensor (connected to port J1)</span>
                      </li>
                      <li className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-orange-600 font-bold">4</div>
                        <span className="font-medium text-slate-700">Output 1: LED Light (connected to port J4)</span>
                      </li>
                      <li className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-orange-600 font-bold">5</div>
                        <span className="font-medium text-slate-700">Output 2: Fan Motor (connected to port M1)</span>
                      </li>
                    </ul>
                    <div className="flex justify-center mt-4">
                      <img 
                        src="https://raw.githubusercontent.com/moshe1ch-kidi/bitkidssimulator/refs/heads/main/src/help/hotSimulationBoard.png" 
                        alt="Simulation Setup" 
                        className="rounded-2xl shadow-md max-w-full h-auto border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 border-l-4 border-orange-500 pl-4">2. Code Logic (The Algorithm)</h3>
                    <p className="text-slate-600 leading-relaxed">
                      The system is designed to maintain a stable temperature around 30°C:
                    </p>
                    <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 shrink-0"></div>
                        <p><span className="text-orange-400 font-bold">Heating Mode:</span> If the temperature is <span className="text-orange-300 font-bold">below 30°C</span>, the LED turns ON to provide heat, and the Fan Motor stays at speed 0 (stopped).</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 shrink-0"></div>
                        <p><span className="text-blue-400 font-bold">Cooling Mode:</span> If the temperature reaches <span className="text-blue-300 font-bold">30°C or higher</span>, the Fan Motor starts spinning to cool the system, and the LED turns OFF.</p>
                      </div>
                    </div>
                    <div className="flex justify-center mt-4">
                      <img 
                        src="https://raw.githubusercontent.com/moshe1ch-kidi/bitkidssimulator/refs/heads/main/src/help/hotcode.png" 
                        alt="Code Logic" 
                        className="rounded-2xl shadow-md max-w-full h-auto border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 border-l-4 border-orange-500 pl-4">3. Analog to Temperature</h3>
                    <p className="text-slate-600 leading-relaxed">
                      The Micro:bit reads values from 0 to 1023. The code converts these raw numbers into actual temperature degrees using mathematical formulas based on the thermistor's characteristics.
                    </p>
                  </section>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button 
                onClick={() => setShowHelpModal(false)}
                className="bg-slate-900 text-white font-bold py-2 px-6 rounded-xl hover:bg-slate-800 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <header className="bg-[#5188c1] p-2 flex items-center gap-4 border-b border-blue-400 z-50 relative shadow-md">
        <div className="flex items-center gap-2 mr-4">
          <img src="https://raw.githubusercontent.com/moshe1ch-kidi/bitkidssimulator/refs/heads/main/src/logo/bitkidi.png" alt="BITKIDI" className="h-10 w-auto object-contain" referrerPolicy="no-referrer" />
          <h1 className="text-xl font-black text-white tracking-tighter hidden sm:block">BITKIDI</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={runCode} className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-xl shadow-lg border-b-4 border-green-700 active:border-b-0 active:translate-y-1 transition-all" title="Run Code">
            <Play size={24} fill="currentColor" />
          </button>
          <button onClick={stopCode} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-xl shadow-lg border-b-4 border-red-700 active:border-b-0 active:translate-y-1 transition-all" title="Stop Code">
            <Square size={24} fill="currentColor" />
          </button>
        </div>

        <div className="w-px h-8 bg-blue-400/50 mx-2"></div>

        <div className="flex items-center gap-2">
          <button onClick={saveProject} className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-xl transition-all" title="Save Project">
            <Save size={24} />
          </button>
          <button onClick={loadProject} className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-xl transition-all" title="Load Project">
            <FolderOpen size={24} />
          </button>
          <button onClick={() => setShowMissionsModal(true)} className="bg-blue-500/40 hover:bg-blue-500/60 text-white p-2 rounded-xl transition-all border border-blue-300/30" title="Missions">
            <ClipboardList size={24} />
          </button>
          <button 
            onClick={() => {
              if (window.confirm("האם אתה בטוח שברצונך לנקות את הכל?")) {
                setWires([]);
                setDroppedComponents([]);
                boardRef.current?.clear();
              }
            }} 
            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-xl transition-all"
            title="Clear Simulation"
          >
            <Trash2 size={24} />
          </button>
        </div>

        {connectionError ? (
          <div className="ml-auto text-sm font-bold text-white bg-red-500/80 px-4 py-2 rounded-full border border-red-400 shadow-sm animate-pulse">
            {connectionError}
          </div>
        ) : drawingWireFrom ? (
          <div className="ml-auto text-sm font-bold text-white bg-blue-400/50 px-4 py-2 rounded-full border border-blue-300 shadow-sm">
            לחץ על הדק נוסף לחיבור, או על אותו הדק לביטול
          </div>
        ) : (
          <div className="ml-auto text-sm font-bold text-white/90 bg-blue-900/20 px-4 py-2 rounded-full border border-blue-400/30">
            לחץ על הדק לחיבור חוט. לחץ על הדק מחובר להסרה.
          </div>
        )}
      </header>
      
      <main className={`flex-1 grid gap-4 p-4 relative h-full ${isSimulationExpanded ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
        <div className={`bg-white rounded-lg shadow-md h-full w-full z-10 relative no-scrollbar ${isSimulationExpanded ? 'hidden' : 'block'}`}>
          <div className="bg-[#f0f0f0] border-b border-gray-200 p-2 flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm overflow-hidden">
               <img src="https://img.icons8.com/color/48/000000/panda.png" alt="Panda" className="w-6 h-6" referrerPolicy="no-referrer" />
            </div>
            <span className="text-sm font-bold text-gray-600">Scripts for Micro:bit</span>
          </div>
          <div ref={blocklyDiv} className="h-[calc(100%-48px)] w-full"></div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md flex flex-row overflow-hidden relative z-0 h-full">
          <>
            <div className="flex flex-row w-full h-full p-4 relative z-10">
              {/* Left Side: Simulation Board */}
              <div id="simulation-container" className="flex-1 relative rounded-2xl shadow-inner border border-gray-200 overflow-hidden bg-gray-50">
                <WireCanvas wires={wires} drawingWireFrom={drawingWireFrom} mousePos={mousePos} resizeTrigger={resizeTrigger} />
                
                {/* Variable Watcher Overlay - Moved here to be independent of zoom */}
                {showVariableWatcher && (
                  <div 
                    id="variable-watcher-panel"
                    style={{ left: watcherPos.x, top: watcherPos.y }}
                    className="absolute bg-white/95 backdrop-blur-md border-2 border-blue-200 rounded-2xl shadow-2xl p-5 z-50 min-w-[240px] max-w-[320px] max-h-[450px] overflow-y-auto animate-in fade-in zoom-in duration-300 ring-4 ring-blue-500/5 cursor-default"
                  >
                    <div 
                      className="flex items-center justify-between gap-3 mb-4 border-b-2 border-blue-50 pb-2 cursor-move select-none"
                      onMouseDown={(e) => {
                        const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                        if (rect) {
                          setDragOffset({
                            x: e.clientX - rect.left,
                            y: e.clientY - rect.top
                          });
                          setIsDraggingWatcher(true);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2 pointer-events-none">
                        <div className="bg-blue-100 p-1.5 rounded-lg">
                          <ClipboardList size={18} className="text-blue-600" />
                        </div>
                        <span className="text-sm font-black text-blue-900 uppercase tracking-tight">Variable Watcher</span>
                      </div>
                      <button 
                        onClick={() => setShowVariableWatcher(false)}
                        className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="space-y-2.5">
                      {Object.keys(variableValues).length > 0 ? (
                        Object.entries(variableValues).map(([name, value]) => (
                          <div key={name} className="flex justify-between items-center gap-4 bg-slate-50 p-2 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors group">
                            <span className="text-xs font-bold text-slate-600 truncate max-w-[120px] group-hover:text-blue-700 transition-colors" title={name}>{name}</span>
                            <span className="text-xs font-mono font-black text-blue-700 bg-white border border-blue-100 px-2.5 py-1 rounded-lg shadow-sm">
                              {typeof value === 'boolean' ? (value ? 'true' : 'false') : 
                               value === undefined ? '?' : 
                               String(value)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                          <div className="bg-slate-100 p-3 rounded-full">
                            <Zap size={24} className="text-slate-300" />
                          </div>
                          <div className="text-xs text-slate-400 font-medium leading-relaxed">
                            No variables active yet.<br/>
                            <span className="text-[10px] opacity-75">Run your code to see values update!</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 overflow-y-auto overflow-x-hidden p-6 flex flex-col items-center">
                  {/* Grid Background */}
                  <div 
                    className="absolute inset-0 opacity-[0.05] pointer-events-none" 
                    style={{ 
                      backgroundImage: 'linear-gradient(to right, #000000 1px, transparent 1px), linear-gradient(to bottom, #000000 1px, transparent 1px)', 
                      backgroundSize: '24px 24px',
                      minHeight: '1200px'
                    }}
                  ></div>
                  <div className="w-full flex justify-between items-center z-20 mb-2 px-2 sticky top-0 bg-gray-50/90 backdrop-blur-sm py-2 rounded-lg shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-800 tracking-wide">Simulation Board</h2>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.1))} title="Zoom Out" className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors">
                        <ZoomOut size={18} />
                      </button>
                      <span className="text-xs font-medium text-gray-600 w-10 text-center select-none">{Math.round(zoomLevel * 100)}%</span>
                      <button onClick={() => setZoomLevel(z => Math.min(2, z + 0.1))} title="Zoom In" className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors">
                        <ZoomIn size={18} />
                      </button>
                      <button onClick={() => setZoomLevel(1)} title="Reset Zoom" className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors mr-2">
                        <RotateCcw size={16} />
                      </button>
                      <div className="w-px h-6 bg-gray-300 mx-1"></div>
                      <button
                        onClick={() => setShowVariableWatcher(!showVariableWatcher)}
                        className={`p-2 rounded-full transition-colors ml-1 ${showVariableWatcher ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200'}`}
                        title={showVariableWatcher ? "Hide Variables" : "Show Variables"}
                      >
                        <ClipboardList size={20} />
                      </button>
                      <button
                        onClick={() => setIsSimulationExpanded(!isSimulationExpanded)}
                        className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors ml-1"
                        title={isSimulationExpanded ? "Restore View" : "Maximize Simulation"}
                      >
                        {isSimulationExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                      </button>
                    </div>
                  </div>
                  <div className="w-full flex justify-center mt-2" style={{ 
                      transform: `scale(${zoomLevel * 0.623})`, 
                      transformOrigin: 'top center', 
                      transition: 'transform 0.2s ease-out' 
                    }}>
                    <div id="simulation-board-wrapper" className="z-10 relative">
                      <MicrobitBoard 
                        ref={boardRef} 
                        onPinClick={handleNodeClick} 
                        motorStates={motorStates}
                        onMotorChange={(port, direction, speed) => {
                          setMotorStates(prev => ({ ...prev, [port]: { direction, speed } }));
                        }}
                        servoStates={servoStates}
                        onServoChange={(port, angle) => {
                          setServoStates(prev => ({ ...prev, [port]: angle }));
                        }}
                        onPinChange={(port, value) => {
                          setPinStates(prev => ({ ...prev, [port]: value }));
                        }}
                        getUltrasonicDistance={getUltrasonicDistanceForPort}
                        getColor={getColorForPort}
                        getLightLevel={getLightLevelForPort}
                        getTemperature={getTemperatureForPort}
                        getHumidity={getHumidityForPort}
                      />

                      {droppedComponents.map(comp => (
                        <div key={comp.id} style={{ 
                          position: 'absolute', 
                          left: comp.x, 
                          top: comp.y,
                          transform: 'scale(1.42857)',
                          transformOrigin: 'center',
                          zIndex: 20
                        }}>
                          <DraggableComponent 
                            comp={{ ...comp.compBase, id: comp.id }} 
                            onComponentClick={handleNodeClick} 
                            isDropped={true} 
                            motorState={getMotorStateForComponent(comp.id)}
                            servoAngle={getServoAngleForComponent(comp.id)}
                            ultrasonicDistance={ultrasonicDistances[comp.id]}
                            onUltrasonicChange={(val) => {
                              setUltrasonicDistances(prev => ({ ...prev, [comp.id]: val }));
                            }}
                            ledColor={ledColors[comp.id] || '#ef4444'}
                            onLedColorChange={(color) => {
                              setLedColors(prev => ({ ...prev, [comp.id]: color }));
                            }}
                            ledOn={getLedStateForComponent(comp.id)}
                            colorValue={colorSensorValues[comp.id] || 'None'}
                            onColorValueChange={(val) => {
                              setColorSensorValues(prev => ({ ...prev, [comp.id]: val }));
                            }}
                            lightLevel={lightLevels[comp.id] || 0}
                            onLightLevelChange={(val) => {
                              setLightLevels(prev => ({ ...prev, [comp.id]: val }));
                            }}
                            temperature={temperatures[comp.id] || 25}
                            onTemperatureChange={(val) => {
                              setTemperatures(prev => ({ ...prev, [comp.id]: val }));
                            }}
                            dht11Data={dht11Data[comp.id] || { mode: 'hum', value: 45 }}
                            onDht11Change={(data) => {
                              setDht11Data(prev => ({ ...prev, [comp.id]: data }));
                            }}
                            onDelete={() => {
                              setDroppedComponents(prev => prev.filter(c => c.id !== comp.id));
                              setWires(prev => prev.filter(w => w.from !== comp.id && w.to !== comp.id));
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Divider */}
              <div className="w-px bg-gray-200 mx-4 shrink-0"></div>
              
              {/* Right Side: Components */}
              <div className="w-36 flex flex-col items-center shrink-0 p-2 overflow-y-auto relative z-20">
                <div className="flex items-center justify-center gap-2 mb-4 w-full">
                  <h2 className="text-lg font-semibold text-center">Components</h2>
                  <button 
                    onClick={() => setShowHelpModal(true)}
                    className="text-blue-500 hover:text-blue-700 transition-colors"
                    title="Component Help"
                  >
                    <HelpCircle size={20} />
                  </button>
                </div>
                <ElectronicComponents 
                  zoomLevel={zoomLevel * 0.623}
                  onComponentClick={handleNodeClick} 
                  onDropOnBoard={(compBase, id, x, y) => {
                    console.log('Drop on board detected:', compBase, id, x, y);
                    setDroppedComponents(prev => [...prev, { id, compBase, x, y }]);
                  }}
                />
              </div>
            </div>

            {drawingWireFrom && (
              <div id="mouse-tracker" style={{ position: 'fixed', left: mousePos.x, top: mousePos.y, width: 1, height: 1, pointerEvents: 'none', zIndex: 9999 }} />
            )}
          </>
        </div>
      </main>
    </div>
  );
}
