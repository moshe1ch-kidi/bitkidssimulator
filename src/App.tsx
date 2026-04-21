import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, useDragControls, AnimatePresence } from 'motion/react';
import * as Blockly from 'blockly';
import './blockly/blocks'; // Register blocks
import './blockly/generators'; // Register generators
import { javascriptGenerator } from './blockly/generators';
import { pythonGenerator } from './blockly/python_generators';
import { Play, Square, Trash2, Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw, Save, FolderOpen, Monitor, HelpCircle, X, ClipboardList, List, Lightbulb, ShieldAlert, Thermometer, Droplets, Palette, Move, Zap, Code, ShieldCheck, ArrowRight } from 'lucide-react';
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
      
      const newPaths: {id: string, d: string, color: string, isDashed: boolean, label?: string, labelPos?: {x: number, y: number}}[] = [];
      
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
        
        return { d, endX, endY };
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
        const res = calcPath(wire.from, wire.to, false);
        if (res) {
          const label = wire.from.replace('port-', '');
          newPaths.push({ 
            id: `wire-${i}`, 
            d: res.d, 
            color: getColor(wire.from, wire.to), 
            isDashed: false,
            label,
            labelPos: { x: res.endX, y: res.endY - 25 }
          });
        }
      });
      
      if (drawingWireFrom) {
        const res = calcPath(drawingWireFrom, 'mouse-tracker', true);
        if (res) {
          newPaths.push({ id: 'wire-drawing', d: res.d, color: getColor(drawingWireFrom, 'mouse-tracker'), isDashed: true });
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
        <React.Fragment key={p.id}>
          <path
            d={p.d}
            fill="none"
            stroke={p.color}
            strokeWidth={4}
            strokeDasharray={p.isDashed ? "8,8" : "none"}
            className={p.isDashed ? "animate-dash" : ""}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {p.label && p.labelPos && (
            <g transform={`translate(${p.labelPos.x}, ${p.labelPos.y})`}>
              <circle r="10" fill="white" stroke={p.color} strokeWidth="2" />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="10"
                fontWeight="bold"
                fill={p.color}
              >
                {p.label}
              </text>
            </g>
          )}
        </React.Fragment>
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
  const simulationContainerRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const [promptConfig, setPromptConfig] = useState<{
    visible: boolean;
    message: string;
    defaultValue: string;
    callback: (value: string | null) => void;
  } | null>(null);
  const [promptInputValue, setPromptInputValue] = useState('');
  const [helpTab, setHelpTab] = useState<'components' | 'nightlight' | 'thermostat' | 'visual_thermometer' | 'planet_monitor' | 'alarm' | 'fan_speed' | 'security_gate' | 'color_sorter'>('components');
  const [showPythonModal, setShowPythonModal] = useState(false);
  const [pythonCode, setPythonCode] = useState('');

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
      id: 'security_gate',
      title: 'Security Gate',
      description: 'Build an automated security gate that opens when a car approaches and stays open until it passes safely.',
      icon: <ShieldCheck className="text-emerald-500" />,
      difficulty: 'Hard',
      components: ['Micro:bit', '2x Ultrasonic Sensor', 'Servo Motor', '2x LED']
    },
    {
      id: 'fan_speed',
      title: 'Variable Speed Fan',
      description: 'In this project, we will learn how to control the rotation speed of a motor (fan) using a component called a potentiometer.',
      icon: <RotateCcw className="text-blue-500" />,
      difficulty: 'Medium',
      components: ['Micro:bit', 'Potentiometer', 'DC Motor']
    },
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
      title: 'DISTANCE ALARM',
      description: 'The Naughty Hedgehog: Building a "Smart Fence" to keep him safe! 🦔🚩',
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
      id: 'planet_monitor',
      title: 'Planet Monitor',
      description: 'Create a smart plant monitoring system. Measure soil moisture and display the status using LEDs and icons.',
      icon: <Droplets className="text-cyan-500" />,
      difficulty: 'Medium',
      components: ['Micro:bit', 'Soil Moisture Sensor', 'LEDs']
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
      id: 'visual_thermometer',
      title: 'Visual Thermometer',
      description: 'Build a visual temperature alert system using a DHT11 sensor and three LEDs (Green, Yellow, Red) to display the heat level.',
      icon: <Thermometer className="text-blue-500" />,
      difficulty: 'Hard',
      components: ['Micro:bit', 'DHT11 Sensor', '3x LED']
    },
    {
      id: 'color_sorter',
      title: 'Color Sorter',
      description: 'A classic engineering project combining control, sensing, and automation. The machine identifies the brick color, and the servo motor tilts the platform so the brick slides exactly into the correct bin.',
      icon: <Palette className="text-purple-500" />,
      difficulty: 'Hard',
      components: ['Micro:bit', 'Color Sensor (I1)', 'Servo Motor (S1)', 'Red LED (J4)', 'Green LED (J3)']
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
  const [soilMoistures, setSoilMoistures] = useState<{ [compId: string]: number }>({});
  const [potentiometerValues, setPotentiometerValues] = useState<{ [compId: string]: number }>({});
  const [tm1637States, setTm1637States] = useState<{ [key: string]: string | number }>({});

  // Use a ref to store the latest state for the simulation loop to avoid closure issues
  const latestStateRef = useRef({
    wires,
    ultrasonicDistances,
    colorSensorValues,
    lightLevels,
    temperatures,
    dht11Data,
    soilMoistures,
    potentiometerValues,
    pinStates,
    motorStates,
    servoStates,
    tm1637States
  });

  // Update the ref synchronously during render to ensure it's always up to date
  latestStateRef.current = {
    wires,
    ultrasonicDistances,
    colorSensorValues,
    lightLevels,
    temperatures,
    dht11Data,
    soilMoistures,
    potentiometerValues,
    pinStates,
    motorStates,
    servoStates,
    tm1637States
  };

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

  const getTM1637ValueForComponent = (compId: string) => {
    const wire = wires.find(w => 
      (w.from === compId && w.to.startsWith('port-J')) || 
      (w.to === compId && w.from.startsWith('port-J'))
    );
    if (wire) {
      const portId = wire.from.startsWith('port-J') ? wire.from : wire.to;
      const portName = portId.replace('port-', '');
      return tm1637States[portName];
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

  const getUltrasonicDistanceForPort = useCallback(async (port: string) => {
    const portId = `port-${port}`;
    const wire = latestStateRef.current.wires.find(w => w.from === portId || w.to === portId);
    if (wire) {
      const compId = wire.from === portId ? wire.to : wire.from;
      return latestStateRef.current.ultrasonicDistances[compId] || 100;
    }
    return 0;
  }, []);
  
  const getColorForPort = useCallback(async (port: string) => {
    const portId = `port-${port}`;
    const wire = latestStateRef.current.wires.find(w => w.from === portId || w.to === portId);
    if (wire) {
      const compId = wire.from === portId ? wire.to : wire.from;
      return latestStateRef.current.colorSensorValues[compId] || 'None';
    }
    return 'None';
  }, []);

  const getLightLevelForPort = useCallback(async (port: string) => {
    const portId = `port-${port}`;
    const wire = latestStateRef.current.wires.find(w => w.from === portId || w.to === portId);
    if (wire) {
      const compId = wire.from === portId ? wire.to : wire.from;
      return latestStateRef.current.lightLevels[compId] || 0;
    }
    return 0;
  }, []);

  const getTemperatureForPort = useCallback(async (port: string) => {
    const portId = `port-${port}`;
    const wire = latestStateRef.current.wires.find(w => w.from === portId || w.to === portId);
    if (wire) {
      const compId = wire.from === portId ? wire.to : wire.from;
      if (latestStateRef.current.temperatures[compId] !== undefined) return latestStateRef.current.temperatures[compId];
      const dhtData = latestStateRef.current.dht11Data[compId];
      if (dhtData && dhtData.mode === 'temp') return dhtData.value;
    }
    return 25;
  }, []);

  const getHumidityForPort = useCallback(async (port: string) => {
    const portId = `port-${port}`;
    const wire = latestStateRef.current.wires.find(w => w.from === portId || w.to === portId);
    if (wire) {
      const compId = wire.from === portId ? wire.to : wire.from;
      const dhtData = latestStateRef.current.dht11Data[compId];
      if (dhtData && dhtData.mode === 'hum') return dhtData.value;
    }
    return 0;
  }, []);

  const getSoilMoistureForPort = useCallback(async (port: string) => {
    const portId = `port-${port}`;
    const wire = latestStateRef.current.wires.find(w => w.from === portId || w.to === portId);
    if (wire) {
      const compId = wire.from === portId ? wire.to : wire.from;
      return latestStateRef.current.soilMoistures[compId] || 45;
    }
    return 0;
  }, []);

  const getPotentiometerForPort = useCallback(async (port: string) => {
    const portId = `port-${port}`;
    const wire = latestStateRef.current.wires.find(w => w.from === portId || w.to === portId);
    if (wire) {
      const compId = wire.from === portId ? wire.to : wire.from;
      return latestStateRef.current.potentiometerValues[compId] || 0;
    }
    return 0;
  }, []);

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
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [drawingWireFrom]);

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
                { kind: 'block', type: 'event_broadcast' },
                { kind: 'block', type: 'event_when_received' },
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
                { kind: 'block', type: 'microbit_show_leds' },
                { kind: 'block', type: 'microbit_show_text' },
                {
                  kind: 'block',
                  type: 'microbit_ledgraph',
                  inputs: {
                    VALUE: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
                    MAX: { shadow: { type: 'math_number', fields: { NUM: 100 } } },
                  },
                },
                { kind: 'block', type: 'microbit_set_led_color' },
                { kind: 'block', type: 'microbit_led_pin' },
                { kind: 'block', type: 'microbit_blink_led' },
                {
                  kind: 'block',
                  type: 'microbit_set_pin',
                  inputs: {
                    VALUE: { shadow: { type: 'math_number', fields: { NUM: 1 } } },
                  },
                },
                {
                  kind: 'block',
                  type: 'microbit_tm1637_show_number',
                  inputs: {
                    VALUE: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
                  },
                },
                {
                  kind: 'block',
                  type: 'microbit_set_motor',
                  inputs: {
                    SPEED: { shadow: { type: 'math_number', fields: { NUM: 50 } } },
                  },
                },
                { kind: 'block', type: 'microbit_stop_motor' },
                {
                  kind: 'block',
                  type: 'microbit_set_servo',
                  inputs: {
                    ANGLE: { shadow: { type: 'math_number', fields: { NUM: 90 } } },
                  },
                },
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
                { kind: 'block', type: 'microbit_dht11' },
                { kind: 'block', type: 'microbit_soil_moisture' },
                { kind: 'block', type: 'microbit_potentiometer' },
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
                { kind: 'block', type: 'logic_boolean' },
                { kind: 'block', type: 'operator_not' },
                { kind: 'block', type: 'operator_and' },
                { kind: 'block', type: 'operator_or' },
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
                { kind: 'block', type: 'math_number' },
                { kind: 'block', type: 'text' },
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
            {
              kind: 'category',
              name: 'My Blocks',
              colour: '#FF6680',
              custom: 'MY_BLOCKS_CUSTOM',
              cssConfig: {
                row: 'blocklyTreeRowCustom myblocks-category'
              }
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

      // Register the custom category callback for My Blocks
      workspace.current.registerToolboxCategoryCallback('MY_BLOCKS_CUSTOM', (ws: any) => {
        const xmlList = [];
        
        try {
          if (!ws || (typeof ws.isDisposed === 'function' && ws.isDisposed()) || typeof ws.getAllBlocks !== 'function') {
            return xmlList;
          }

          // 1. Add the "Make a Block" button
          const button = document.createElement('button');
          button.setAttribute('text', 'Make a Block');
          button.setAttribute('callbackKey', 'MAKE_A_BLOCK');
          xmlList.push(button);
          
          // 2. Add all existing procedure call blocks
          if (Blockly.Procedures && typeof Blockly.Procedures.allProcedures === 'function') {
            const procedures = Blockly.Procedures.allProcedures(ws);
            if (procedures && procedures[0]) {
              for (let i = 0; i < procedures[0].length; i++) {
                const name = procedures[0][i][0];
                const callBlock = document.createElement('block');
                callBlock.setAttribute('type', 'procedures_callnoreturn');
                const mutation = document.createElement('mutation');
                mutation.setAttribute('name', name);
                callBlock.appendChild(mutation);
                xmlList.push(callBlock);
              }
            }
          }
        } catch (e) {
          console.error('Error in MY_BLOCKS_CUSTOM callback:', e);
        }
        
        return xmlList;
      });

      // Register the button callback
      workspace.current.registerButtonCallback('MAKE_A_BLOCK', () => {
        const ws = workspace.current;
        if (ws && (typeof ws.isDisposed !== 'function' || !ws.isDisposed())) {
          try {
            // Find a legal name manually to avoid potential internal getAllBlocks issues
            let name = 'my block';
            let n = 1;
            const existingNames = Blockly.Procedures.allProcedures(ws)[0].map(p => p[0]);
            while (existingNames.includes(name)) {
              name = 'my block' + (n++);
            }

            const block = ws.newBlock('procedures_defnoreturn');
            block.setFieldValue(name, 'NAME');
            block.initSvg();
            block.render();
            // Position it nicely
            const metrics = ws.getMetrics();
            block.moveBy(metrics.viewLeft + 50, metrics.viewTop + 50);
            ws.centerOnBlock(block.id);
          } catch (e) {
            console.error('Error creating procedure:', e);
          }
        }
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
        console.log('Updating variables:', vars);
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
        const result = new AsyncFunction('boardRef', 'checkStop', 'updateVars', code)(boardRef, checkStop, updateVars);
        if (result instanceof Promise) {
          result.catch((e: any) => {
            if (e?.message !== 'Execution stopped') console.error(e);
          });
        }
        boardRef.current?.triggerGreenFlag();
      } catch (e: any) {
        if (e?.message !== 'Execution stopped') console.error(e);
      }
    }
  };

  const stopCode = () => {
    executionIdRef.current += 1;
    boardRef.current?.clear();
    setPinStates({});
    setMotorStates({});
    setServoStates({ 'S1': 90, 'S2': 90, 'S3': 90, 'S4': 90 });
  };

  const translateToPython = () => {
    if (workspace.current) {
      const code = pythonGenerator.workspaceToCode(workspace.current);
      setPythonCode(code);
      setShowPythonModal(true);
    }
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
      const isColorComp = to.includes('comp-color');
      const isSPort = from.includes('port-S');
      const isMPort = from.includes('port-M');
      const isIPort = from.includes('port-I');
      
      if (isColorComp && !isIPort) {
        setConnectionError("Color Sensor must connect to I1, I2, I3, or I4 (I2C ports).");
        setTimeout(() => setConnectionError(null), 3000);
        setDrawingWireFrom(null);
        return;
      }

      if (!isColorComp && isIPort) {
        setConnectionError("I1-I4 ports are reserved for I2C components (like Color Sensor).");
        setTimeout(() => setConnectionError(null), 3000);
        setDrawingWireFrom(null);
        return;
      }

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
          alert("Invalid file");
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
                <button 
                  key={mission.id} 
                  onClick={() => {
                    if (mission.id !== 'lamp') {
                      setHelpTab(mission.id as any);
                      setShowHelpModal(true);
                      setShowMissionsModal(false);
                    }
                  }}
                  className={`text-left border border-slate-100 rounded-3xl p-6 transition-all group focus:outline-none focus:ring-4 focus:ring-blue-100 relative overflow-hidden ${
                    mission.id !== 'lamp' 
                      ? 'bg-white hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-100/50 hover:-translate-y-1.5 cursor-pointer active:scale-95' 
                      : 'bg-slate-50 opacity-60 cursor-default'
                  }`}
                >
                  {/* Subtle background glow on hover */}
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-400/5 rounded-full blur-2xl group-hover:bg-blue-400/10 transition-colors" />
                  
                  <div className="flex items-start gap-5 relative z-10">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl shadow-sm flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-blue-50 transition-all duration-300">
                      {mission.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{mission.title}</h3>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                          mission.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                          mission.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {mission.difficulty}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mb-4 leading-relaxed">{mission.description}</p>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {mission.components.map((comp, i) => (
                          <span key={i} className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200/50">
                            {comp}
                          </span>
                        ))}
                      </div>
                      {mission.id !== 'lamp' && (
                        <div className="text-xs font-bold text-blue-600 flex items-center gap-1.5 transition-all group-hover:translate-x-1">
                          <HelpCircle size={16} />
                          <span>View Full Guide</span>
                          <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
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

      {/* Python Code Modal */}
      <AnimatePresence>
        {showPythonModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl">
                    <Code size={24} />
                  </div>
                  <h2 className="text-2xl font-bold">Python Code</h2>
                </div>
                <button 
                  onClick={() => setShowPythonModal(false)}
                  className="hover:bg-white/20 p-2 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto bg-slate-900 flex-1">
                <pre className="text-blue-400 font-mono text-sm leading-relaxed text-left" dir="ltr">
                  {pythonCode || "# No code to display"}
                </pre>
              </div>

              <div className="p-4 bg-slate-100 border-t flex justify-end gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(pythonCode);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg"
                >
                  Copy Code
                </button>
                <button
                  onClick={() => setShowPythonModal(false)}
                  className="px-6 py-2 bg-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                     helpTab === 'nightlight' ? 'Automatic Night Light - Mission Guide' : 
                     helpTab === 'thermostat' ? 'Smart Fan - Mission Guide' :
                     helpTab === 'planet_monitor' ? 'Planet Monitor - Mission Guide' :
                     helpTab === 'fan_speed' ? 'Variable Speed Fan - Mission Guide' :
                     helpTab === 'alarm' ? 'Distance Alarm - Mission Guide' :
                     helpTab === 'security_gate' ? 'Security Gate - Mission Guide' :
                     helpTab === 'color_sorter' ? 'Color Sorter - Mission Guide' :
                     'Visual Thermometer - Mission Guide'}
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
                      onClick={() => setHelpTab('planet_monitor')}
                      className={`text-xs font-bold pb-1 border-b-2 transition-all ${helpTab === 'planet_monitor' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                      Planet Monitor
                    </button>
                    <button 
                      onClick={() => setHelpTab('thermostat')}
                      className={`text-xs font-bold pb-1 border-b-2 transition-all ${helpTab === 'thermostat' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                      Smart Fan Guide
                    </button>
                    <button 
                      onClick={() => setHelpTab('visual_thermometer')}
                      className={`text-xs font-bold pb-1 border-b-2 transition-all ${helpTab === 'visual_thermometer' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                      Visual Thermometer
                    </button>
                    <button 
                      onClick={() => setHelpTab('fan_speed')}
                      className={`text-xs font-bold pb-1 border-b-2 transition-all ${helpTab === 'fan_speed' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                      Variable Fan
                    </button>
                    <button 
                      onClick={() => setHelpTab('alarm')}
                      className={`text-xs font-bold pb-1 border-b-2 transition-all ${helpTab === 'alarm' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                      Distance Alarm
                    </button>
                    <button 
                      onClick={() => setHelpTab('security_gate')}
                      className={`text-xs font-bold pb-1 border-b-2 transition-all ${helpTab === 'security_gate' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                      Security Gate
                    </button>
                    <button 
                      onClick={() => setHelpTab('color_sorter')}
                      className={`text-xs font-bold pb-1 border-b-2 transition-all ${helpTab === 'color_sorter' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                      Color Sorter
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
              ) : helpTab === 'planet_monitor' ? (
                <div className="max-w-4xl mx-auto space-y-10 text-left py-4" dir="ltr">
                  <section className="bg-cyan-50 p-6 rounded-3xl border border-cyan-100">
                    <h3 className="text-2xl font-black text-cyan-900 mb-4">Planet Monitor (Smart Plant Pot)</h3>
                    <p className="text-lg text-slate-700 leading-relaxed">
                      Create a system that measures soil moisture levels using Micro:bit (BitKIDI), displays the status using control lights (LEDs), and allows real-time monitoring.
                    </p>
                    <div className="mt-6 flex justify-center">
                      <img 
                        src="https://raw.githubusercontent.com/moshe1ch-kidi/bitkidssimulator/refs/heads/main/src/help/SoilMoisturemodel.png" 
                        alt="Soil Moisture Model" 
                        className="rounded-2xl shadow-lg max-w-full h-auto border-4 border-white"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 border-l-4 border-cyan-500 pl-4">🔍 Technical Background: Soil Moisture Sensor</h3>
                    <p className="text-slate-600 leading-relaxed">
                      The sensor is an electronic component that measures the amount of water in the soil.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <h4 className="font-bold text-cyan-700 mb-2">Structure</h4>
                        <p className="text-sm text-slate-600">Consists of two electrodes ("forks") that are inserted into the soil.</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <h4 className="font-bold text-cyan-700 mb-2">Operating Principle</h4>
                        <p className="text-sm text-slate-600">Based on electrical resistance. Water conducts electricity; therefore, the wetter the soil, the lower the resistance and the more easily current passes.</p>
                      </div>
                    </div>
                    <div className="bg-cyan-50 p-6 rounded-2xl border-l-4 border-cyan-500">
                      <p className="text-cyan-900 font-medium">
                        <span className="font-black">Values:</span> The Micro:bit receives values in the range of 0 (completely dry) to 1023 (very wet). These values can be converted to percentages (0-100%).
                      </p>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 border-l-4 border-cyan-500 pl-4">🛠️ Components List</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <li className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-cyan-600 font-bold">1</div>
                        <span className="font-medium text-slate-700">Controller: BitKIDI (Micro:bit)</span>
                      </li>
                      <li className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-cyan-600 font-bold">2</div>
                        <span className="font-medium text-slate-700">Sensor: Soil Moisture Sensor</span>
                      </li>
                      <li className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-cyan-600 font-bold">3</div>
                        <span className="font-medium text-slate-700">Lights: 2 LEDs (Red and Green)</span>
                      </li>
                      <li className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-cyan-600 font-bold">4</div>
                        <span className="font-medium text-slate-700">Cables: 3 RJ11 cables</span>
                      </li>
                    </ul>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 border-l-4 border-cyan-500 pl-4">🔌 Connection Diagram</h3>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-slate-400 text-xs uppercase">
                            <th className="pb-4">Component</th>
                            <th className="pb-4">Port</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          <tr>
                            <td className="py-3 font-bold text-slate-900">Moisture Sensor</td>
                            <td className="py-3 font-mono text-blue-600 font-bold">J1</td>
                          </tr>
                          <tr>
                            <td className="py-3 font-bold text-slate-900">Green LED</td>
                            <td className="py-3 font-mono text-blue-600 font-bold">J2</td>
                          </tr>
                          <tr>
                            <td className="py-3 font-bold text-slate-900">Red LED</td>
                            <td className="py-3 font-mono text-blue-600 font-bold">J3</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="flex justify-center mt-4">
                      <img 
                        src="https://raw.githubusercontent.com/moshe1ch-kidi/bitkidssimulator/refs/heads/main/src/help/SoilMoisturesimulation.png" 
                        alt="Connection Diagram" 
                        className="rounded-2xl shadow-md max-w-full h-auto border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 border-l-4 border-cyan-500 pl-4">💻 Code Logic (Algorithm)</h3>
                    <p className="text-slate-600 leading-relaxed">
                      The code is based on reading data from the sensor and making a decision based on a "Threshold" of 50% (analog value ~500).
                    </p>
                    <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full mt-2 shrink-0"></div>
                        <p><span className="text-green-400 font-bold">Moist Soil (&gt; 50%):</span> Turn ON Green LED (J2), Turn OFF Red LED (J3), and show a "Happy" icon.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-red-400 rounded-full mt-2 shrink-0"></div>
                        <p><span className="text-red-400 font-bold">Dry Soil (&lt; 50%):</span> Turn OFF Green LED (J2), Turn ON Red LED (J3), and show a "Sad" icon or alert.</p>
                      </div>
                    </div>
                    <div className="flex justify-center mt-4">
                      <img 
                        src="https://raw.githubusercontent.com/moshe1ch-kidi/bitkidssimulator/refs/heads/main/src/help/SoilMoisturecode.png" 
                        alt="Code Logic" 
                        className="rounded-2xl shadow-md max-w-full h-auto border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </section>
                </div>
              ) : helpTab === 'thermostat' ? (
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
              ) : helpTab === 'security_gate' ? (
                <div className="space-y-12 pb-12 text-left" dir="ltr">
                  <section className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 border-l-4 border-emerald-500 pl-4">Security Gate 🛡️</h3>
                    <p className="text-slate-600 leading-relaxed">
                      This model presents a classic automation system based on sensor feedback (Input) and motor response (Output). The system operates in a closed loop to allow safe entry for the car.
                    </p>
                    <div className="flex justify-center mt-4">
                      <img 
                        src="https://raw.githubusercontent.com/moshe1ch-kidi/bitkidssimulator/refs/heads/main/src/help/gatemodel.png" 
                        alt="Security Gate Model" 
                        className="rounded-2xl shadow-md max-w-full h-auto border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 border-l-4 border-emerald-500 pl-4">How the Gate Works ⚙️</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-3">
                        <h4 className="font-bold text-emerald-700">1. Detection (Input)</h4>
                        <p className="text-sm text-slate-600">
                          The ultrasonic sensor at the top works like a bat: it sends high-frequency sound waves. It calculates distance based on the time it takes for waves to return.
                        </p>
                      </div>
                      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-3">
                        <h4 className="font-bold text-emerald-700">2. Decision (Logic)</h4>
                        <p className="text-sm text-slate-600">
                          The controller runs code checking if distance is less than 200 cm. If an object is detected, it triggers the opening sequence.
                        </p>
                      </div>
                      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-3">
                        <h4 className="font-bold text-emerald-700">3. Activation (Output)</h4>
                        <p className="text-sm text-slate-600">
                          When a car is detected, current is sent to the motor. Gears convert the motor's speed into torque to lift the red gate arm.
                        </p>
                      </div>
                      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-3">
                        <h4 className="font-bold text-emerald-700">4. Safety Closing</h4>
                        <p className="text-sm text-slate-600">
                          After the car passes, the system waits for the sensors to clear before lowering the arm safely to prevent hitting the vehicle.
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 border-l-4 border-emerald-500 pl-4">Component Connections 🛠️</h3>
                    <div className="overflow-hidden rounded-2xl border border-slate-200">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-700 font-bold">
                          <tr>
                            <th className="px-4 py-3">Component</th>
                            <th className="px-4 py-3">Port</th>
                            <th className="px-4 py-3">Role</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          <tr>
                            <td className="px-4 py-3 font-medium">Ultrasonic 1</td>
                            <td className="px-4 py-3 text-blue-600 font-bold">J1</td>
                            <td className="px-4 py-3 text-slate-600">Detects entry/exit distance</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 font-medium">Ultrasonic 2</td>
                            <td className="px-4 py-3 text-blue-600 font-bold">J2</td>
                            <td className="px-4 py-3 text-slate-600">Detects entry/exit distance</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 font-medium">Green LED</td>
                            <td className="px-4 py-3 text-blue-600 font-bold">J3</td>
                            <td className="px-4 py-3 text-slate-600">ON when gate is OPEN</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 font-medium">Red LED</td>
                            <td className="px-4 py-3 text-blue-600 font-bold">J4</td>
                            <td className="px-4 py-3 text-slate-600">ON when gate is CLOSED</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 font-medium">Servo Motor</td>
                            <td className="px-4 py-3 text-blue-600 font-bold">S1</td>
                            <td className="px-4 py-3 text-slate-600">Gate Arm (90° Closed, 270° Open)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="flex justify-center mt-4">
                      <img 
                        src="https://raw.githubusercontent.com/moshe1ch-kidi/bitkidssimulator/refs/heads/main/src/help/gatesim.png" 
                        alt="Simulator Connections" 
                        className="rounded-2xl shadow-md max-w-full h-auto border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 border-l-4 border-emerald-500 pl-4">The Code 💻</h3>
                    <div className="flex justify-center mt-4">
                      <img 
                        src="https://raw.githubusercontent.com/moshe1ch-kidi/bitkidssimulator/refs/heads/main/src/help/gatecode.png" 
                        alt="Mission Code" 
                        className="rounded-2xl shadow-md max-w-full h-auto border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4">
                      <h4 className="font-bold text-emerald-400">Code Logic Analysis:</h4>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 shrink-0"></div>
                        <p><span className="text-emerald-400 font-bold">Initial State:</span> The code starts by setting the Red LED to ON, Green LED to OFF, and the Servo to 90 degrees (Closed).</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 shrink-0"></div>
                        <p><span className="text-blue-400 font-bold">Detection (OR):</span> The condition <code>200 &gt; distance</code> checks if EITHER sensor J1 or J2 detects an object. This allows detection from both sides.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 shrink-0"></div>
                        <p><span className="text-yellow-400 font-bold">Opening:</span> Once detected, the LEDs swap states and the Servo moves to 270 degrees (Open).</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-red-400 rounded-full mt-2 shrink-0"></div>
                        <p><span className="text-red-400 font-bold">Safety Wait:</span> The <code>while not</code> loop acts as a barrier, keeping the gate open until BOTH sensors confirm the car has passed (distance &gt; 200).</p>
                      </div>
                    </div>
                  </section>
                </div>
              ) : helpTab === 'fan_speed' ? (
                <div className="space-y-12 pb-12 text-left" dir="ltr">
                  <section className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 border-l-4 border-blue-500 pl-4">Variable Speed Fan 🌬️</h3>
                    <p className="text-slate-600 leading-relaxed">
                      In this project, we will learn how to control the rotation speed of a motor (fan) using a component called a potentiometer. The combination of the two allows us to create a convenient interface where turning a physical knob changes the wind intensity.
                    </p>
                    <div className="flex justify-center mt-4">
                      <img 
                        src="https://raw.githubusercontent.com/moshe1ch-kidi/bitkidssimulator/refs/heads/main/src/help/vendpotz.png" 
                        alt="Fan Model" 
                        className="rounded-2xl shadow-md max-w-full h-auto border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 border-l-4 border-blue-500 pl-4">What is a Potentiometer? 🎚️</h3>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                      <p className="text-slate-600">
                        A potentiometer is an electronic component used as a variable resistor. Unlike a regular resistor that has a fixed value, the resistance of a potentiometer can be changed by turning a dial or moving a handle.
                      </p>
                      <p className="text-slate-600">
                        <strong>How does it work?</strong> Imagine a water faucet: as you open the faucet more, more water flows. The potentiometer works similarly with electric current. When we turn the knob, we change the length of the path the electricity has to travel within the component, thereby changing the amount of current or voltage that passes through.
                      </p>
                      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                        <h4 className="font-bold text-blue-700 mb-2">Common Uses:</h4>
                        <p className="text-sm text-slate-600">Volume knobs on radios, light dimmers, and controllers for various electrical appliances.</p>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 border-l-4 border-blue-500 pl-4">Component List 🛠️</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <li className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-600 font-bold">1</div>
                        <span className="font-medium text-slate-700">Micro:bit Microcontroller</span>
                      </li>
                      <li className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-600 font-bold">2</div>
                        <span className="font-medium text-slate-700">Potentiometer (J1)</span>
                      </li>
                      <li className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-600 font-bold">3</div>
                        <span className="font-medium text-slate-700">DC Motor (M3)</span>
                      </li>
                    </ul>
                    <div className="flex justify-center mt-4">
                      <img 
                        src="https://raw.githubusercontent.com/moshe1ch-kidi/bitkidssimulator/refs/heads/main/src/help/ventpotz.png" 
                        alt="Simulator Connections" 
                        className="rounded-2xl shadow-md max-w-full h-auto border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 border-l-4 border-blue-500 pl-4">How does the code work? 🧠</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <h4 className="font-bold text-blue-700 mb-2">1. Reading Value</h4>
                        <p className="text-sm text-slate-600">The microcontroller reads the state of the potentiometer. In our simulator, the value is already converted to a range of 0-100.</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <h4 className="font-bold text-blue-700 mb-2">2. Mapping</h4>
                        <p className="text-sm text-slate-600">We use the value we received directly as the motor's speed intensity.</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <h4 className="font-bold text-blue-700 mb-2">3. Output (PWM)</h4>
                        <p className="text-sm text-slate-600">The microcontroller sends a command to the motor to rotate at the selected speed in real-time.</p>
                      </div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100">
                      <p className="text-sm text-yellow-800">
                        <strong>Important Tip:</strong> Remember that the potentiometer is connected to an Analog Input, as it provides a continuous range of values rather than just "on" or "off".
                      </p>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 border-l-4 border-blue-500 pl-4">The Code 💻</h3>
                    <div className="flex justify-center mt-4">
                      <img 
                        src="https://raw.githubusercontent.com/moshe1ch-kidi/bitkidssimulator/refs/heads/main/src/help/ventcode.png" 
                        alt="Mission Code" 
                        className="rounded-2xl shadow-md max-w-full h-auto border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4">
                      <h4 className="font-bold text-blue-400">Code Explanation:</h4>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 shrink-0"></div>
                        <p><span className="text-blue-400 font-bold">"Forever" Loop (while True):</span> The code checks the potentiometer state constantly, so every small movement of the knob will have an immediate effect.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full mt-2 shrink-0"></div>
                        <p><span className="text-green-400 font-bold">Reading the Potentiometer:</span> The command <code>get_potentiometer('J1')</code> returns the current position of the dial.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 shrink-0"></div>
                        <p><span className="text-orange-400 font-bold">Activating the Motor:</span> The command <code>set_motor('M3', 'FORWARD', ...)</code> takes the value we read and runs the motor at that intensity.</p>
                      </div>
                    </div>
                  </section>
                </div>
              ) : helpTab === 'alarm' ? (
                <div className="max-w-4xl mx-auto space-y-10 text-left py-4" dir="ltr">
                  <section className="bg-red-50 p-6 rounded-3xl border border-red-100">
                    <h3 className="text-2xl font-black text-red-900 mb-4">The Naughty Hedgehog: Building a "Smart Fence" to keep him safe! 🦔🚩</h3>
                    <p className="text-lg text-slate-700 leading-relaxed">
                      Hi friends! In our picture, we see a cute little hedgehog trying to leave his area on the Lego board. To make sure he stays safe and doesn't get lost in the house, we're building him a smart alert system.
                      Instead of a burglar alarm, this time the system is like an "invisible fence" that keeps the hedgehog inside.
                    </p>
                    <div className="mt-6 flex justify-center">
                      <img 
                        src="https://raw.githubusercontent.com/moshe1ch-kidi/bitkidssimulator/refs/heads/main/src/help/ultrasonicmodel.png" 
                        alt="System Model" 
                        className="rounded-2xl shadow-lg max-w-full h-auto border-4 border-white"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 border-l-4 border-red-500 pl-4">How does the system keep the hedgehog safe? ⚙️</h3>
                    <p className="text-slate-600 leading-relaxed">The system acts like a guard standing at the entrance and watching the way:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <h4 className="font-bold text-red-700 mb-2">The Eyes (Ultrasonic Sensor)</h4>
                        <p className="text-sm text-slate-600">The sensor is installed right at the edge of the hedgehog's area. It sends invisible sound waves and "scans" the area in front of it.</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <h4 className="font-bold text-red-700 mb-2">Detection</h4>
                        <p className="text-sm text-slate-600">As long as the path is clear, everything is quiet. But as soon as the hedgehog approaches the exit (distance of less than 20 cm from the sensor), the sensor feels that something is "blocking" it.</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <h4 className="font-bold text-red-700 mb-2">Reporting</h4>
                        <p className="text-sm text-slate-600">The sensor runs to tell the brain (Micro:bit): "Hey! The hedgehog reached the edge! He's about to go out!".</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <h4 className="font-bold text-red-700 mb-2">Warning</h4>
                        <p className="text-sm text-slate-600">The Micro:bit immediately gives a command to the buzzer (Buzzer) to start beeping! 🔊 The beep tells us: "Pay attention, the hedgehog is trying to leave!".</p>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 border-l-4 border-red-500 pl-4">How does the sensor work? 🔍</h3>
                    <p className="text-slate-600 leading-relaxed">
                      An ultrasonic sensor (Ultrasonic Sensor) is one of the most popular and impressive accessories that can be connected to the Micro:bit. It allows the board to "see" its environment by measuring distance from objects, just as bats or dolphins do.
                    </p>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                      <h4 className="font-bold text-slate-900">The sensor works on the principle of "Echo" (Sonar):</h4>
                      <ul className="space-y-2 text-sm text-slate-600">
                        <li><span className="font-bold text-red-600">Transmission:</span> The sensor sends a very high-frequency sound wave (ultrasonic), which is not audible to the human ear.</li>
                        <li><span className="font-bold text-red-600">Impact:</span> The sound wave hits an object in front and returns back towards the sensor.</li>
                        <li><span className="font-bold text-red-600">Calculation:</span> The sensor measures the time that passed from the moment of transmission to the moment of reception. Since the speed of sound is known, the Micro:bit can calculate the distance.</li>
                      </ul>
                    </div>
                    <div className="flex justify-center mt-4">
                      <img 
                        src="https://raw.githubusercontent.com/moshe1ch-kidi/bitkidssimulator/refs/heads/main/src/help/ultrasonicsensor.png" 
                        alt="Ultrasonic Sensor" 
                        className="rounded-2xl shadow-md max-w-full h-auto border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 border-l-4 border-red-500 pl-4">Who participates in the system? 🛠️</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <li className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-red-600 font-bold">1</div>
                        <span className="font-medium text-slate-700">Ultrasonic Sensor: Connected to port <span className="text-blue-600 font-bold">J1</span>.</span>
                      </li>
                      <li className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-red-600 font-bold">2</div>
                        <span className="font-medium text-slate-700">Buzzer: Connected to port <span className="text-blue-600 font-bold">J3</span>.</span>
                      </li>
                      <li className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-red-600 font-bold">3</div>
                        <span className="font-medium text-slate-700">LED Light: Connected to port <span className="text-blue-600 font-bold">J4</span>.</span>
                      </li>
                      <li className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-red-600 font-bold">4</div>
                        <span className="font-medium text-slate-700">Micro:bit: The brain that manages everything.</span>
                      </li>
                    </ul>
                    <div className="flex justify-center mt-4">
                      <img 
                        src="https://raw.githubusercontent.com/moshe1ch-kidi/bitkidssimulator/refs/heads/main/src/help/ultrasonicsimulation.png" 
                        alt="Simulation Setup" 
                        className="rounded-2xl shadow-md max-w-full h-auto border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 border-l-4 border-red-500 pl-4">The Code 💻</h3>
                    <div className="flex justify-center mt-4">
                      <img 
                        src="https://raw.githubusercontent.com/moshe1ch-kidi/bitkidssimulator/refs/heads/main/src/help/ultrasoniccode.png" 
                        alt="Code" 
                        className="rounded-2xl shadow-md max-w-full h-auto border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 border-l-4 border-red-500 pl-4">Code Explanation 🧠</h3>
                    <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-red-400 rounded-full mt-2 shrink-0"></div>
                        <p><span className="text-red-400 font-bold">"Forever" Loop:</span> The code checks the distance all the time without stopping, so we don't miss the hedgehog.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 shrink-0"></div>
                        <p><span className="text-blue-400 font-bold">Distance Check:</span> We use the "distance from ultrasonic sensor" block connected to J1.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 shrink-0"></div>
                        <p><span className="text-yellow-400 font-bold">Condition (If):</span> If the distance is less than 20 cm:</p>
                      </div>
                      <div className="flex items-start gap-3 ml-6">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 shrink-0"></div>
                        <p>Turn ON port <span className="text-blue-300 font-bold">J4</span> (LED turns on).</p>
                      </div>
                      <div className="flex items-start gap-3 ml-6">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 shrink-0"></div>
                        <p>Turn ON port <span className="text-blue-300 font-bold">J3</span> (Buzzer beeps).</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full mt-2 shrink-0"></div>
                        <p><span className="text-green-400 font-bold">Else:</span> If the distance is greater than 20 cm (everything is fine):</p>
                      </div>
                      <div className="flex items-start gap-3 ml-6">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 shrink-0"></div>
                        <p>Turn OFF port <span className="text-blue-300 font-bold">J4</span>.</p>
                      </div>
                      <div className="flex items-start gap-3 ml-6">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 shrink-0"></div>
                        <p>Turn OFF port <span className="text-blue-300 font-bold">J3</span>.</p>
                      </div>
                    </div>
                  </section>
                </div>
              ) : helpTab === 'color_sorter' ? (
                <div className="max-w-4xl mx-auto space-y-10 text-left py-4" dir="ltr">
                  <section className="bg-purple-50 p-6 rounded-3xl border border-purple-100">
                    <h3 className="text-2xl font-black text-purple-900 mb-4">Color Sorter</h3>
                    <p className="text-lg text-slate-700 leading-relaxed">
                      Build an engineering project that combines control, sensing, and automation. In this machine, the color sensor identifies the brick, and the servo motor tilts the platform, causing the brick to slide precisely into the correct sorting bin.
                    </p>
                    <div className="mt-6 flex justify-center">
                      <img 
                        src="https://raw.githubusercontent.com/moshe1ch-kidi/bitkidssimulator/main/src/help/colormachinmodel.png" 
                        alt="Color Sorter Model" 
                        className="rounded-2xl shadow-lg max-w-full h-auto border-4 border-white"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 border-l-4 border-purple-500 pl-4">1. Structure & Components</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-purple-600 font-bold">1</div>
                        <span className="font-medium text-slate-700">Color Sensor (Port I1): Detects the brick color.</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-purple-600 font-bold">2</div>
                        <span className="font-medium text-slate-700">Servo Motor (Port S1): Rotates to the correct sorting angle.</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-purple-600 font-bold">3</div>
                        <span className="font-medium text-slate-700">Green LED (Port J3): Status indicator.</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-purple-600 font-bold">4</div>
                        <span className="font-medium text-slate-700">Red LED (Port J4): Status indicator.</span>
                      </div>
                    </div>
                    <div className="flex justify-center mt-4">
                      <img 
                        src="https://raw.githubusercontent.com/moshe1ch-kidi/bitkidssimulator/main/src/help/colormachinsim.png" 
                        alt="Color Sorter Simulation" 
                        className="rounded-2xl shadow-md max-w-full h-auto border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 border-l-4 border-purple-500 pl-4">2. Operating Logic</h3>
                    <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 shrink-0"></div>
                        <p><span className="text-purple-400 font-bold">Idle State:</span> Servo at 90°, both LEDs OFF. Waiting for a brick.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-red-400 rounded-full mt-2 shrink-0"></div>
                        <p><span className="text-red-400 font-bold">Red Brick Detected:</span> Blink Red LED (J4), move Servo to 180°.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full mt-2 shrink-0"></div>
                        <p><span className="text-green-400 font-bold">Green Brick Detected:</span> Blink Green LED (J3), move Servo to 0°.</p>
                      </div>
                    </div>
                    <div className="flex justify-center mt-4">
                      <img 
                        src="https://raw.githubusercontent.com/moshe1ch-kidi/bitkidssimulator/main/src/help/clormachincode.png" 
                        alt="Color Sorter Code" 
                        className="rounded-2xl shadow-md max-w-full h-auto border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 border-l-4 border-purple-500 pl-4">3. Code Analysis</h3>
                    <div className="space-y-8" dir="ltr">
                      <div className="bg-white p-6 rounded-3xl shadow-sm border border-purple-100">
                        <h4 className="font-bold text-purple-700 mb-3 text-lg">1. Defining the Blink Function</h4>
                        <p className="text-slate-600 mb-2">An external function is defined to perform a quick blink:</p>
                        <ul className="list-disc list-inside text-sm text-slate-500 space-y-1">
                          <li>It turns on the LEDs at J3 and J4.</li>
                          <li>Waits 0.3 seconds.</li>
                          <li>Turns both off.</li>
                          <li>The goal: to create a quick visual indication that the machine is in standby mode.</li>
                        </ul>
                      </div>

                      <div className="bg-white p-6 rounded-3xl shadow-sm border border-purple-100">
                        <h4 className="font-bold text-purple-700 mb-3 text-lg">2. Initialization Phase (When Green Flag Clicked)</h4>
                        <p className="text-slate-600 mb-2">The first blocks reset the system:</p>
                        <ul className="list-disc list-inside text-sm text-slate-500 space-y-1">
                          <li>Turn off the LEDs (J3, J4).</li>
                          <li>Move the servo (S1) to a 90-degree angle (straight horizontal position).</li>
                        </ul>
                      </div>

                      <div className="bg-white p-6 rounded-3xl shadow-sm border border-purple-100">
                        <h4 className="font-bold text-purple-700 mb-3 text-lg">3. The Main Loop (Forever)</h4>
                        <div className="space-y-4">
                          <div className="bg-slate-50 p-4 rounded-xl">
                            <span className="font-bold text-slate-900 mr-2">A. Color Detection:</span>
                            <p className="text-sm text-slate-600 mt-1">Reading data from the color sensor at I1 and saving the value in the 'color' variable.</p>
                          </div>
                          <div className="bg-red-50 p-4 rounded-xl">
                            <span className="font-bold text-red-900 mr-2">B. Red Brick Scenario (If color = "Red"):</span>
                            <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                              <li>LEDs: Turns off J3 and turns on J4.</li>
                              <li>Sorting: Tilts the servo to 180 degrees.</li>
                              <li>Operating Time: Waits one second to allow the brick to slide.</li>
                            </ul>
                          </div>
                          <div className="bg-green-50 p-4 rounded-xl">
                            <span className="font-bold text-green-900 mr-2">C. Green Brick Scenario (If color = "Green"):</span>
                            <ul className="text-sm text-green-700 mt-1 list-disc list-inside">
                              <li>LEDs: Turns off J4 and turns on J3.</li>
                              <li>Sorting: Tilts the servo to 0 degrees.</li>
                              <li>Operating Time: Waits one second.</li>
                            </ul>
                          </div>
                          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <span className="font-bold text-blue-900 mr-2">D. "No Brick" / Other Color Scenario:</span>
                            <p className="text-sm text-blue-700 mt-1">
                              If the sensor doesn't see red and doesn't see green (not color = Green or Red):
                            </p>
                            <ul className="text-sm text-blue-700 mt-1 list-disc list-inside">
                              <li>Reset: The servo returns to 90 degrees.</li>
                              <li>Wait: Waits one second.</li>
                              <li>Indication: Activates the blink function defined earlier.</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto space-y-10 text-left py-4" dir="ltr">
                  <section className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                    <h3 className="text-2xl font-black text-blue-900 mb-4">Visual Thermometer</h3>
                    <p className="text-lg text-slate-700 leading-relaxed">
                      The DHT11 is one of the most popular and common sensors in the maker world (Arduino, Raspberry Pi, and Micro:bit), mainly due to its low cost and simplicity of operation. It is used to measure temperature and relative humidity.
                    </p>
                    <div className="mt-6 flex justify-center">
                      <img 
                        src="https://raw.githubusercontent.com/moshe1ch-kidi/bitkidssimulator/refs/heads/main/src/help/humiditymodel.png" 
                        alt="Visual Thermometer Model" 
                        className="rounded-2xl shadow-lg max-w-full h-auto border-4 border-white"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 border-l-4 border-blue-500 pl-4">1. How does it work?</h3>
                    <p className="text-slate-600 leading-relaxed">
                      The sensor consists of two main parts for measurement:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <h4 className="font-bold text-blue-700 mb-2">Capacitive Humidity Sensor</h4>
                        <p className="text-sm text-slate-600">Consists of two electrodes with a polymer layer between them that stores moisture. As humidity changes, the electrical conductivity changes.</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <h4 className="font-bold text-blue-700 mb-2">Thermistor (NTC)</h4>
                        <p className="text-sm text-slate-600">A resistor that changes its resistance according to the temperature.</p>
                      </div>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Inside the blue casing, there is also a small controller that converts the analog measurements into a digital signal, making it very simple for external controllers to read.
                    </p>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 border-l-4 border-blue-500 pl-4">2. System Connection</h3>
                    <p className="text-slate-600 leading-relaxed">
                      According to the diagram, the system is connected using four digital communication channels (J1-J4):
                    </p>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black">J1</div>
                        <div>
                          <h4 className="font-bold text-slate-900">DHT11 Sensor (Input)</h4>
                          <p className="text-sm text-slate-500">Sends digital data about temperature and humidity to the controller.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center font-black">J2</div>
                        <div>
                          <h4 className="font-bold text-slate-900">Green LED (Output)</h4>
                          <p className="text-sm text-slate-500">Low temperature range (2°C-18°C).</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center font-black">J3</div>
                        <div>
                          <h4 className="font-bold text-slate-900">Yellow LED (Output)</h4>
                          <p className="text-sm text-slate-500">Medium temperature range (21°C-39°C).</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center font-black">J4</div>
                        <div>
                          <h4 className="font-bold text-slate-900">Red LED (Output)</h4>
                          <p className="text-sm text-slate-500">High temperature (above 40°C).</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-center mt-4">
                      <img 
                        src="https://raw.githubusercontent.com/moshe1ch-kidi/bitkidssimulator/refs/heads/main/src/help/hotsensorsimulation.png" 
                        alt="Connection Diagram" 
                        className="rounded-2xl shadow-md max-w-full h-auto border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 border-l-4 border-blue-500 pl-4">3. Code Logic (The Algorithm)</h3>
                    <p className="text-slate-600 leading-relaxed">
                      The code continuously reads temperature data from the DHT11 sensor connected to J1, and activates the LEDs according to the following ranges:
                    </p>
                    <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full mt-2 shrink-0"></div>
                        <p><span className="text-green-400 font-bold">Low Temperature (2°C-18°C):</span> The Green LED (J2) turns ON, others stay OFF.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 shrink-0"></div>
                        <p><span className="text-yellow-400 font-bold">Pleasant Temperature (21°C-39°C):</span> The Yellow LED (J3) turns ON, others stay OFF.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-red-400 rounded-full mt-2 shrink-0"></div>
                        <p><span className="text-red-400 font-bold">High Temperature (above 40°C):</span> The Red LED (J4) turns ON, others stay OFF.</p>
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
          <button onClick={translateToPython} className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-xl shadow-lg border-b-4 border-blue-700 active:border-b-0 active:translate-y-1 transition-all" title="Translate to Python">
            <Code size={24} />
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
          <button 
            onClick={() => {
            if (window.confirm("Are you sure you want to clear everything?")) {
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
            Click another terminal to connect, or the same terminal to cancel.
          </div>
        ) : (
          <div className="ml-auto text-sm font-bold text-white/90 bg-blue-900/20 px-4 py-2 rounded-full border border-blue-400/30">
            Click a terminal to connect a wire. Click a connected terminal to remove.
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
              <div id="simulation-container" ref={simulationContainerRef} className="flex-1 relative rounded-2xl shadow-inner border border-gray-200 overflow-hidden bg-gray-50">
                <WireCanvas wires={wires} drawingWireFrom={drawingWireFrom} mousePos={mousePos} resizeTrigger={resizeTrigger} />
                
                {/* Variable Watcher Overlay - Using motion for smooth dragging */}
                <AnimatePresence>
                  {showVariableWatcher && (
                    <motion.div 
                      layout
                      drag
                      dragControls={dragControls}
                      dragListener={false}
                      dragConstraints={simulationContainerRef}
                      dragMomentum={false}
                      initial={{ x: 24, y: 24, opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      id="variable-watcher-panel"
                      className="absolute bg-white/95 backdrop-blur-md border-2 border-blue-200 rounded-2xl shadow-2xl p-5 z-50 min-w-[240px] max-w-[320px] max-h-[450px] overflow-y-auto ring-4 ring-blue-500/5 cursor-default"
                    >
                      <motion.div 
                        onPointerDown={(e) => dragControls.start(e)}
                        whileHover={{ backgroundColor: 'rgba(239, 246, 255, 0.5)' }}
                        className="flex items-center justify-between gap-3 mb-4 border-b-2 border-blue-50 pb-2 cursor-grab active:cursor-grabbing select-none rounded-t-lg -m-2 p-2"
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
                      </motion.div>
                      <div className="space-y-2.5">
                        {Object.keys(variableValues).length > 0 ? (
                          Object.entries(variableValues).map(([name, value]) => (
                            <motion.div 
                              layout
                              key={name} 
                              className="flex justify-between items-center gap-4 bg-slate-50 p-2 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors group"
                            >
                              <span className="text-xs font-bold text-slate-600 truncate max-w-[120px] group-hover:text-blue-700 transition-colors" title={name}>{name}</span>
                              <span className="text-xs font-mono font-black text-blue-700 bg-white border border-blue-100 px-2.5 py-1 rounded-lg shadow-sm">
                                {typeof value === 'boolean' ? (value ? 'true' : 'false') : 
                                 value === undefined || value === null ? '?' : 
                                 String(value)}
                              </span>
                            </motion.div>
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
                    </motion.div>
                  )}
                </AnimatePresence>

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
                        <List size={20} />
                      </button>
                      <button
                        onClick={() => setShowMissionsModal(true)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full transition-colors ml-1"
                        title="Missions"
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
                          setMotorStates(prev => {
                            const current = prev[port];
                            // Use loose equality for speed to handle potential string/number mismatches
                            if (current && current.direction === direction && Number(current.speed) === Number(speed)) return prev;
                            return { ...prev, [port]: { direction, speed: Number(speed) } };
                          });
                        }}
                        servoStates={servoStates}
                        onServoChange={(port, angle) => {
                          setServoStates(prev => {
                            if (prev[port] === angle) return prev;
                            return { ...prev, [port]: angle };
                          });
                        }}
                        onPinChange={(port, value) => {
                          setPinStates(prev => {
                            if (prev[port] === value) return prev;
                            return { ...prev, [port]: value };
                          });
                        }}
                        tm1637States={tm1637States}
                        onTM1637Change={(port, value) => {
                          setTm1637States(prev => {
                            if (prev[port] === value) return prev;
                            return { ...prev, [port]: value };
                          });
                        }}
                        getUltrasonicDistance={getUltrasonicDistanceForPort}
                        getColor={getColorForPort}
                        getLightLevel={getLightLevelForPort}
                        getTemperature={getTemperatureForPort}
                        getHumidity={getHumidityForPort}
                        getSoilMoisture={getSoilMoistureForPort}
                        getPotentiometer={getPotentiometerForPort}
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
                            tm1637Value={getTM1637ValueForComponent(comp.id)}
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
                            soilMoisture={soilMoistures[comp.id] || 45}
                            onSoilMoistureChange={(val) => {
                              setSoilMoistures(prev => ({ ...prev, [comp.id]: val }));
                            }}
                            potentiometerValue={potentiometerValues[comp.id] || 0}
                            onPotentiometerChange={(val) => {
                              setPotentiometerValues(prev => ({ ...prev, [comp.id]: val }));
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
