import React, { useState, useImperativeHandle, forwardRef, useRef } from 'react';

interface MicrobitBoardProps {
  onPinClick: (pin: string) => void;
  onMotorChange?: (port: string, direction: string, speed: number) => void;
  motorStates?: { [key: string]: { direction: string, speed: number } };
  onServoChange?: (port: string, angle: number) => void;
  servoStates?: { [key: string]: number };
  onPinChange?: (port: string, value: number) => void;
  getUltrasonicDistance?: (port: string) => Promise<number>;
  getColor?: (port: string) => Promise<string>;
  getLightLevel?: (port: string) => Promise<number>;
  getTemperature?: (port: string) => Promise<number>;
  getHumidity?: (port: string) => Promise<number>;
}

const fontMap: { [key: string]: number[] } = {
  'A': [1, 2, 3, 5, 9, 10, 11, 12, 13, 14, 15, 19, 20, 24],
  'B': [0, 1, 2, 3, 5, 9, 10, 11, 12, 13, 15, 19, 20, 21, 22, 23],
  'C': [1, 2, 3, 5, 9, 10, 15, 21, 22, 23],
  'D': [0, 1, 2, 3, 5, 9, 10, 14, 15, 19, 20, 21, 22, 23],
  'E': [0, 1, 2, 3, 4, 5, 10, 11, 12, 15, 20, 21, 22, 23, 24],
  'F': [0, 1, 2, 3, 4, 5, 10, 11, 12, 15, 20],
  'G': [1, 2, 3, 5, 10, 13, 14, 15, 19, 21, 22, 23],
  'H': [0, 5, 10, 15, 20, 12, 4, 9, 14, 19, 24],
  'I': [0, 1, 2, 3, 4, 7, 12, 17, 20, 21, 22, 23, 24],
  'J': [4, 9, 14, 19, 20, 21, 22, 23, 15],
  'K': [0, 5, 10, 15, 20, 12, 2, 8, 18, 24],
  'L': [0, 5, 10, 15, 20, 21, 22, 23, 24],
  'M': [0, 5, 10, 15, 20, 6, 12, 8, 4, 9, 14, 19, 24],
  'N': [0, 5, 10, 15, 20, 6, 12, 18, 4, 9, 14, 19, 24],
  'O': [1, 2, 3, 5, 9, 10, 14, 15, 19, 21, 22, 23],
  'P': [0, 1, 2, 3, 5, 9, 10, 11, 12, 13, 15, 20],
  'Q': [1, 2, 3, 5, 9, 10, 14, 15, 18, 19, 21, 22, 24],
  'R': [0, 1, 2, 3, 5, 9, 10, 11, 12, 13, 15, 18, 20, 24],
  'S': [1, 2, 3, 4, 5, 11, 12, 13, 19, 20, 21, 22, 23],
  'T': [0, 1, 2, 3, 4, 7, 12, 17, 22],
  'U': [0, 5, 10, 15, 4, 9, 14, 19, 21, 22, 23],
  'V': [0, 5, 10, 15, 4, 9, 14, 19, 21, 23, 22],
  'W': [0, 5, 10, 15, 20, 21, 22, 23, 24, 4, 9, 14, 19, 12],
  'X': [0, 4, 6, 8, 12, 16, 18, 20, 24],
  'Y': [0, 4, 6, 8, 12, 17, 22],
  'Z': [0, 1, 2, 3, 4, 8, 12, 16, 20, 21, 22, 23, 24],
  '0': [1, 2, 3, 5, 9, 10, 14, 15, 19, 21, 22, 23],
  '1': [2, 6, 7, 12, 17, 21, 22, 23],
  '2': [1, 2, 3, 9, 13, 17, 20, 21, 22, 23, 24],
  '3': [1, 2, 3, 9, 12, 13, 19, 21, 22, 23],
  '4': [3, 7, 8, 11, 13, 15, 16, 17, 18, 19, 23],
  '5': [0, 1, 2, 3, 4, 5, 10, 11, 12, 13, 19, 21, 22, 23],
  '6': [1, 2, 3, 5, 10, 11, 12, 13, 15, 19, 21, 22, 23],
  '7': [0, 1, 2, 3, 4, 9, 13, 17, 22],
  '8': [1, 2, 3, 5, 9, 11, 12, 13, 15, 19, 21, 22, 23],
  '9': [1, 2, 3, 5, 9, 11, 12, 13, 14, 19, 21, 22, 23],
  ' ': []
};

export const MicrobitBoard = forwardRef(({ onPinClick, onMotorChange, motorStates = {}, onServoChange, servoStates = {}, onPinChange, getUltrasonicDistance, getColor, getLightLevel, getTemperature, getHumidity }: MicrobitBoardProps, ref) => {
  const [leds, setLeds] = useState(Array(25).fill(false));
  const [ledColor, setLedColor] = useState('#3b82f6'); // Default blue-500
  const scrollInterval = useRef<NodeJS.Timeout | null>(null);
  const buttonACallbacks = useRef<(() => void)[]>([]);
  const buttonBCallbacks = useRef<(() => void)[]>([]);
  const buttonABCallbacks = useRef<(() => void)[]>([]);
  const greenFlagCallbacks = useRef<(() => void)[]>([]);

  useImperativeHandle(ref, () => ({
    showIcon: (icon: string) => {
      if (scrollInterval.current) clearInterval(scrollInterval.current);
      const icons: { [key: string]: number[] } = {
        'HEART': [1, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18, 22],
        'SMILE': [1, 3, 11, 15, 17, 18, 19, 21],
        'SAD': [6, 8, 16, 18, 21, 22, 23],
        'HAPPY': [1, 3, 6, 8, 16, 17, 18, 20, 24],
        'ARROW_SE': [0, 6, 12, 14, 18, 19, 22, 23, 24],
        'ARROW_S': [2, 7, 10, 12, 14, 16, 17, 18, 22],
        'ARROW_SW': [4, 8, 10, 12, 15, 16, 20, 21, 22],
        'ARROW_W': [2, 6, 10, 11, 12, 13, 14, 16, 22],
        'ARROW_NW': [0, 1, 2, 5, 6, 10, 12, 18, 24]
      };
      
      const newLeds = Array(25).fill(false);
      const activeIndices = icons[icon] || [];
      activeIndices.forEach(i => newLeds[i] = true);
      setLeds(newLeds);
    },
    showText: (text: string) => {
      if (scrollInterval.current) clearInterval(scrollInterval.current);
      
      const strip: boolean[] = [];
      // Add initial blank screen
      for (let i = 0; i < 25; i++) strip.push(false);

      for (const char of text.toUpperCase()) {
        const charPixels = fontMap[char] || [];
        for (let col = 0; col < 5; col++) {
          for (let row = 0; row < 5; row++) {
            strip.push(charPixels.includes(row * 5 + col));
          }
        }
        // Add one blank column between characters
        for (let i = 0; i < 5; i++) strip.push(false);
      }

      // Add trailing blank screen
      for (let i = 0; i < 25; i++) strip.push(false);

      let offset = 0;
      const totalColumns = strip.length / 5;
      
      scrollInterval.current = setInterval(() => {
        const newLeds = Array(25).fill(false);
        for (let col = 0; col < 5; col++) {
          for (let row = 0; row < 5; row++) {
            const stripIndex = (offset + col) * 5 + row;
            if (stripIndex < strip.length) {
              newLeds[row * 5 + col] = strip[stripIndex];
            }
          }
        }
        setLeds(newLeds);
        offset++;
        if (offset >= totalColumns) {
          offset = 0;
        }
      }, 150);
    },
    clear: () => {
      if (scrollInterval.current) clearInterval(scrollInterval.current);
      setLeds(Array(25).fill(false));
      if (onMotorChange) {
        ['M1', 'M2', 'M3', 'M4'].forEach(port => onMotorChange(port, 'FD', 0));
      }
      if (onServoChange) {
        ['S1', 'S2', 'S3', 'S4'].forEach(port => onServoChange(port, 90));
      }
      buttonACallbacks.current = [];
      buttonBCallbacks.current = [];
      buttonABCallbacks.current = [];
      greenFlagCallbacks.current = [];
    },
    onButtonA: (callback: () => void) => {
      buttonACallbacks.current.push(callback);
    },
    onButtonB: (callback: () => void) => {
      buttonBCallbacks.current.push(callback);
    },
    onButtonAB: (callback: () => void) => {
      buttonABCallbacks.current.push(callback);
    },
    onGreenFlag: (callback: () => void) => {
      greenFlagCallbacks.current.push(callback);
    },
    triggerGreenFlag: () => {
      greenFlagCallbacks.current.forEach(cb => cb());
    },
    setLedColor: (color: string) => {
      setLedColor(color);
    },
    setMotor: (port: string, direction: string, speed: number) => {
      if (onMotorChange) onMotorChange(port, direction, speed);
      console.log(`Motor ${port} set to ${direction} at speed ${speed}%`);
    },
    setServo: (port: string, angle: number) => {
      if (onServoChange) onServoChange(port, angle);
      console.log(`Servo ${port} set to ${angle} degrees`);
    },
    setPin: (port: string, value: number) => {
      if (onPinChange) onPinChange(port, value);
      console.log(`Pin ${port} set to ${value}`);
    },
    playTone: (frequency: number) => {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5);
      } catch (e) {
        console.error('Web Audio API not supported or blocked', e);
      }
    },
    getUltrasonicDistance: async (port: string) => {
      if (getUltrasonicDistance) {
        return await getUltrasonicDistance(port);
      }
      return 0;
    },
    getColor: async (port: string) => {
      if (getColor) {
        return await getColor(port);
      }
      return 'None';
    },
    getLightLevel: async (port: string) => {
      if (getLightLevel) {
        return await getLightLevel(port);
      }
      return 0;
    },
    getTemperature: async (port: string) => {
      if (getTemperature) {
        return await getTemperature(port);
      }
      return 25; // Default room temperature
    }
  }));

  return (
    <div className="flex items-center justify-center px-12 pb-12 pt-24">
      <div className="relative">
        {/* Micro:bit Top Insert */}
        <div className="absolute -top-[75px] left-1/2 -translate-x-1/2 w-[310px] h-[90px] bg-[#111] rounded-t-2xl z-0 border-t-2 border-x-2 border-gray-800 shadow-lg">
          {/* USB Port */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-14 h-3 bg-gradient-to-b from-gray-300 to-gray-500 rounded-t-md border border-gray-600 flex justify-center items-end pb-[1px]">
            <div className="w-8 h-1 bg-black/40 rounded-sm"></div>
          </div>
          
          {/* Green Triangles (Top Left) */}
          <div className="absolute top-0 left-0 w-32 h-full overflow-hidden rounded-tl-2xl">
            <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polygon points="0,0 45,0 20,60 0,40" fill="#059669" />
              <polygon points="45,0 75,0 50,45" fill="#059669" />
              <polygon points="75,0 95,0 80,30" fill="#059669" />
            </svg>
          </div>

          {/* Small vias/dots */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-10">
            <div className="w-2 h-2 rounded-full border border-gray-500 bg-gray-800"></div>
            <div className="w-2 h-2 rounded-full border border-gray-500 bg-gray-800"></div>
          </div>

          {/* Gold Touch Logo */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-7 border-[3px] border-[#eab308] rounded-full flex items-center justify-center gap-2 z-10">
            <div className="w-2.5 h-2.5 bg-[#111] rounded-full border border-[#eab308]"></div>
            <div className="w-2.5 h-2.5 bg-[#111] rounded-full border border-[#eab308]"></div>
          </div>
        </div>

        {/* Main Device Body */}
        <div id="microbit-board-container" className="relative w-[380px] h-[460px] bg-white rounded-[32px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1)] border-b-[32px] border-[#5c636a] flex border-x-[3px] border-t-[3px] border-slate-300 z-10">
          
          {/* Left Ports (I1-I4 / IIC) */}
        <div className="absolute -left-6 top-6 bottom-6 flex flex-col justify-between w-10 z-0">
          {['I1', 'I2', 'I3', 'I4'].map((port) => (
            <div key={port} className="relative w-full h-12 bg-[#495057] rounded-l-lg flex flex-col items-center justify-center shadow-inner border-y border-l border-gray-600">
              <div className="w-4 h-1 bg-blue-500 rounded-full mb-1 shadow-[0_0_4px_rgba(59,130,246,0.8)]"></div>
              <span className="text-gray-300 text-[9px] font-bold">{port}</span>
              {/* Drag Connection Node */}
              <div
                id={`port-${port}`}
                className="absolute -left-5 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-500 rounded-full border-4 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform flex items-center justify-center group"
                title={`Connect to ${port}`}
                onClick={() => onPinClick(`port-${port}`)}
              >
                <div className="w-3 h-3 bg-white rounded-full group-hover:scale-75 transition-transform"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Ports (J1-J4) */}
        <div className="absolute -right-6 top-6 bottom-6 flex flex-col justify-between w-10 z-0">
          {['J1', 'J2', 'J3', 'J4'].map((port) => (
            <div key={port} className="relative w-full h-12 bg-[#495057] rounded-r-lg flex flex-col items-center justify-center shadow-inner border-y border-r border-gray-600">
              <span className="text-gray-300 text-[9px] font-bold mb-1">{port}</span>
              <div className="flex flex-col gap-0.5 items-center">
                <div className="w-4 h-1 bg-red-500 rounded-full shadow-[0_0_4px_rgba(239,68,68,0.8)]"></div>
                {(port === 'J1' || port === 'J2') && (
                  <div className="w-4 h-1 bg-yellow-400 rounded-full shadow-[0_0_4px_rgba(250,204,21,0.8)]"></div>
                )}
              </div>
              {/* Drag Connection Node */}
              <div
                id={`port-${port}`}
                className="absolute -right-5 top-1/2 -translate-y-1/2 w-8 h-8 bg-red-500 rounded-full border-4 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform flex items-center justify-center group"
                title={`Connect to ${port}`}
                onClick={() => onPinClick(`port-${port}`)}
              >
                <div className="w-3 h-3 bg-white rounded-full group-hover:scale-75 transition-transform"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Top Surface Content */}
        <div className="absolute inset-0 pt-4 px-8 pb-8 flex flex-col z-10">
          
          {/* Top Row: Buttons */}
          <div className="flex justify-between items-start">
            {/* Left Buttons (A and B) */}
            <div className="flex gap-2">
              <button 
                onClick={() => buttonACallbacks.current.forEach(cb => cb())}
                className="w-12 h-12 bg-[#f8f9fa] rounded-2xl shadow-[0_4px_6px_rgba(0,0,0,0.1),inset_0_-4px_4px_rgba(0,0,0,0.05)] border border-gray-200 flex items-center justify-center active:shadow-inner active:translate-y-1 transition-all"
              >
                <span className="text-gray-400 font-bold text-lg">A</span>
              </button>
              <button 
                onClick={() => buttonABCallbacks.current.forEach(cb => cb())}
                className="w-12 h-12 bg-[#f8f9fa] rounded-2xl shadow-[0_4px_6px_rgba(0,0,0,0.1),inset_0_-4px_4px_rgba(0,0,0,0.05)] border border-gray-200 flex items-center justify-center active:shadow-inner active:translate-y-1 transition-all"
              >
                <span className="text-gray-400 font-bold text-xs">A+B</span>
              </button>
              <button 
                onClick={() => buttonBCallbacks.current.forEach(cb => cb())}
                className="w-12 h-12 bg-[#f8f9fa] rounded-2xl shadow-[0_4px_6px_rgba(0,0,0,0.1),inset_0_-4px_4px_rgba(0,0,0,0.05)] border border-gray-200 flex items-center justify-center active:shadow-inner active:translate-y-1 transition-all"
              >
                <span className="text-gray-400 font-bold text-lg">B</span>
              </button>
            </div>

            {/* Right Red Button */}
            <button className="w-16 h-16 bg-[#f8f9fa] rounded-full shadow-[0_4px_6px_rgba(0,0,0,0.1),inset_0_-4px_4px_rgba(0,0,0,0.05)] border border-gray-200 flex items-center justify-center active:shadow-inner active:translate-y-1 transition-all">
              <div className="w-6 h-6 bg-red-500 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"></div>
            </button>
          </div>

          {/* Middle: SERVO connections */}
          <div className="flex justify-center gap-6 mt-2">
            {['S1', 'S2', 'S3', 'S4'].map(port => (
              <div key={port} className="flex flex-col items-center">
                <div className="flex flex-col items-center mb-1">
                  <span className="text-gray-400 text-[10px] font-bold">{port}</span>
                </div>
                <div className="relative w-6 bg-[#111] rounded-lg flex flex-col gap-[1px] p-[2px] shadow-inner border border-gray-600">
                  {/* Top Pin (Signal) */}
                  <div className="w-full aspect-square bg-[#787848] rounded-[4px] flex items-center justify-center shadow-inner border border-black/20">
                    <div className="w-1.5 h-1.5 bg-[#e5e7eb] rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] border border-[#a3a3a3]"></div>
                  </div>
                  {/* Middle Pin (VCC) */}
                  <div className="w-full aspect-square bg-[#6e3b3b] rounded-[4px] flex items-center justify-center shadow-inner border border-black/20">
                    <div className="w-1.5 h-1.5 bg-[#e5e7eb] rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] border border-[#a3a3a3]"></div>
                  </div>
                  {/* Bottom Pin (GND) */}
                  <div className="w-full aspect-square bg-[#333333] rounded-[4px] flex items-center justify-center shadow-inner border border-black/20">
                    <div className="w-1.5 h-1.5 bg-[#e5e7eb] rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] border border-[#a3a3a3]"></div>
                  </div>
                  
                  {/* Drag Connection Node */}
                  <div
                    id={`port-${port}`}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-yellow-500 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform flex items-center justify-center group z-20"
                    title={`Connect to ${port}`}
                    onClick={() => onPinClick(`port-${port}`)}
                  >
                    <div className="w-1.5 h-1.5 bg-white rounded-full group-hover:scale-75 transition-transform"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom: 5x5 LED Matrix (Speaker grill area) and Front Ports */}
          <div className="mt-auto flex flex-col items-center gap-4">
            <div className="grid grid-cols-5 gap-2.5 p-4 bg-gray-50 rounded-xl shadow-inner border border-gray-100">
              {leds.map((on, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-colors duration-75 ${
                    on ? '' : 'bg-gray-300 shadow-inner'
                  }`}
                  style={on ? { backgroundColor: ledColor, boxShadow: `0 0 8px ${ledColor}` } : {}}
                />
              ))}
            </div>

            {/* Front Ports (M1-M4) */}
            <div className="flex justify-center gap-6 w-full px-4">
              {['M1', 'M2', 'M3', 'M4'].map((port) => {
                const motor = motorStates[port];
                const isActive = motor && motor.speed > 0;
                return (
                  <div key={port} className="relative w-12 h-10 bg-[#495057] rounded-lg flex flex-col items-center justify-center shadow-inner border border-gray-600">
                    <span className="text-gray-300 text-[9px] font-bold mb-1">{port}</span>
                    <div 
                      className={`w-4 h-1 rounded-full transition-all duration-300 ${
                        isActive ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'bg-green-900 shadow-none'
                      }`}
                      style={isActive ? { opacity: 0.5 + (motor.speed / 200) } : {}}
                    ></div>
                    {/* Drag Connection Node */}
                    <div
                      id={`port-${port}`}
                      className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform flex items-center justify-center group"
                      title={`Connect to ${port}`}
                      onClick={() => onPinClick(`port-${port}`)}
                    >
                      <div className="w-2 h-2 bg-white rounded-full group-hover:scale-75 transition-transform"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
        </div>
      </div>
    </div>
  );
});
