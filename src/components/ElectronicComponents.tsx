import React, { useState, useRef, useEffect } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { motion, useDragControls } from 'motion/react';
import { Thermometer, Droplet } from 'lucide-react';

export interface ElectronicComponentsProps {
  onComponentClick?: (id: string) => void;
  onDropOnBoard?: (compBase: any, id: string, x: number, y: number) => void;
  zoomLevel?: number;
}

const ButtonUI = () => (
  <div className="relative w-24 h-20 bg-red-500 rounded-xl shadow-lg border-b-[12px] border-red-700 flex flex-col items-center justify-center pt-1">
    <div className="w-12 h-12 bg-red-400 rounded-full border-4 border-red-600 shadow-inner flex items-center justify-center">
      <div className="w-6 h-6 bg-red-300 rounded-full shadow-inner"></div>
    </div>
  </div>
);

const UltrasonicUI = ({ distance = 100, onDistanceChange }: { distance?: number, onDistanceChange?: (val: number) => void }) => (
  <div className="relative w-28 h-24 bg-[#2b82d9] rounded-xl shadow-lg border-b-[12px] border-[#1a5b9e] flex flex-col items-center justify-start pt-1">
    <div className="absolute top-1 left-1 right-1 h-12 bg-[#f0f0f0] rounded-lg flex items-center justify-center gap-2 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] border border-gray-200">
       <div className="w-9 h-9 rounded-full bg-[#222] border-[4px] border-[#e0e0e0] shadow-[0_4px_4px_rgba(0,0,0,0.3)] flex items-center justify-center overflow-hidden relative">
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(#888 1px, transparent 1px)', backgroundSize: '3px 3px' }}></div>
          <div className="absolute inset-0 rounded-full shadow-[inset_0_4px_4px_rgba(255,255,255,0.4)]"></div>
       </div>
       <div className="w-9 h-9 rounded-full bg-[#222] border-[4px] border-[#e0e0e0] shadow-[0_4px_4px_rgba(0,0,0,0.3)] flex items-center justify-center overflow-hidden relative">
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(#888 1px, transparent 1px)', backgroundSize: '3px 3px' }}></div>
          <div className="absolute inset-0 rounded-full shadow-[inset_0_4px_4px_rgba(255,255,255,0.4)]"></div>
       </div>
       
       {/* Distance Badge */}
       <div className="absolute -top-2 -left-2 bg-blue-600 text-white text-[10px] font-mono px-1.5 py-0.5 rounded-full border border-blue-400 shadow-sm z-20">
         {distance}cm
       </div>
    </div>
    
    {/* Distance Slider for Simulation */}
    <div className="mt-auto mb-3 px-2 w-full flex flex-col items-center gap-0.5">
       <input 
         type="range" 
         min="2" 
         max="400" 
         value={distance} 
         onChange={(e) => onDistanceChange?.(parseInt(e.target.value))}
         className="w-full h-1.5 bg-blue-900 rounded-lg appearance-none cursor-pointer accent-white"
         onPointerDown={(e) => e.stopPropagation()} // Prevent dragging the component
       />
       <div className="text-[8px] font-black text-white tracking-widest uppercase drop-shadow-sm">ULTRASONIC</div>
    </div>

    <div className="absolute bottom-[-8px] left-0 right-0 flex justify-center gap-3">
       <div className="w-3 h-3 rounded-full bg-[#113d6b] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"></div>
       <div className="w-3 h-3 rounded-full bg-[#113d6b] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"></div>
       <div className="w-3 h-3 rounded-full bg-[#113d6b] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"></div>
       <div className="w-3 h-3 rounded-full bg-[#113d6b] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"></div>
    </div>
  </div>
);

const LedUI = ({ color = '#3b82f6', onColorChange, isOn = false }: { color?: string, onColorChange?: (color: string) => void, isOn?: boolean }) => {
  const colors = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'White', value: '#f8fafc' }
  ];

  return (
    <div className="relative w-24 h-24 bg-[#3b82f6] rounded-xl shadow-lg border-b-[12px] border-[#2563eb] flex flex-col items-center justify-start pt-1">
      <div className="absolute top-1 left-1 right-1 h-12 bg-white rounded-lg flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-blue-100">
         <div 
           className="w-10 h-10 rounded-full border-2 relative transition-all duration-300"
           style={{ 
             backgroundColor: isOn ? color : color, 
             opacity: isOn ? 1 : 0.7,
             borderColor: isOn ? `${color}cc` : `${color}88`,
             boxShadow: isOn 
               ? `0 0 25px ${color}, 0 0 45px ${color}66, inset 0 3px 6px rgba(255,255,255,0.8)` 
               : `inset 0 2px 4px rgba(0,0,0,0.2), inset 0 -2px 4px rgba(255,255,255,0.1)`
           }}
         >
           <div className={`absolute top-1.5 left-2 w-4 h-2 bg-white rounded-full opacity-50 rotate-[-45deg] ${isOn ? 'opacity-80' : 'opacity-40'}`}></div>
         </div>
      </div>
      
      {/* Color Selector */}
      <div className="mt-auto mb-3 flex gap-1 px-1">
        {onColorChange && colors.map(c => (
          <button
            key={c.value}
            onClick={(e) => {
              e.stopPropagation();
              onColorChange(c.value);
            }}
            className={`w-3.5 h-3.5 rounded-full border border-white shadow-sm transition-transform hover:scale-125 ${color === c.value ? 'ring-2 ring-sky-400 scale-110' : ''}`}
            style={{ backgroundColor: c.value }}
            title={c.name}
          />
        ))}
      </div>

      <div className="absolute bottom-[-8px] left-0 right-0 flex justify-center gap-3">
         <div className="w-3 h-3 rounded-full bg-blue-700 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"></div>
         <div className="w-3 h-3 rounded-full bg-blue-700 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"></div>
         <div className="w-3 h-3 rounded-full bg-blue-700 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"></div>
      </div>
    </div>
  );
};

const BuzzerUI = ({ isOn = false }: { isOn?: boolean }) => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (isOn) {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 tone
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.01);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      
      oscRef.current = osc;
      gainRef.current = gain;
    } else {
      if (oscRef.current && gainRef.current && audioCtxRef.current) {
        const ctx = audioCtxRef.current;
        const gain = gainRef.current;
        const osc = oscRef.current;
        
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.01);
        setTimeout(() => {
          osc.stop();
          osc.disconnect();
          gain.disconnect();
        }, 20);
        
        oscRef.current = null;
        gainRef.current = null;
      }
    }

    return () => {
      if (oscRef.current) {
        oscRef.current.stop();
        oscRef.current.disconnect();
      }
      if (gainRef.current) {
        gainRef.current.disconnect();
      }
    };
  }, [isOn]);

  return (
    <div className="relative w-24 h-20 bg-[#eab308] rounded-xl shadow-lg border-b-[12px] border-[#a16207] flex flex-col items-center justify-start pt-1">
      <div className="absolute top-1 left-1 right-1 h-12 bg-[#f0f0f0] rounded-lg flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] border border-gray-200">
         <div className={`w-10 h-10 rounded-full bg-[#111] border-2 border-[#333] shadow-[0_4px_4px_rgba(0,0,0,0.2)] flex items-center justify-center relative ${isOn ? 'animate-pulse' : ''}`}>
            <div className="w-2.5 h-2.5 rounded-full bg-[#000] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]"></div>
            {isOn && (
              <div className="absolute -inset-2 border-2 border-yellow-400 rounded-full animate-ping opacity-50"></div>
            )}
         </div>
      </div>
      <div className="absolute bottom-[-8px] left-0 right-0 flex justify-center gap-3">
         <div className="w-3 h-3 rounded-full bg-[#713f12] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"></div>
         <div className="w-3 h-3 rounded-full bg-[#713f12] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"></div>
         <div className="w-3 h-3 rounded-full bg-[#713f12] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"></div>
      </div>
    </div>
  );
};

const ServoUI = ({ angle = 90 }: { angle?: number }) => (
  <div className="relative w-24 h-24 bg-[#3b82f6] rounded-xl shadow-lg border-b-[12px] border-[#1d4ed8] flex flex-col items-center justify-start pt-2">
    <div className="absolute top-2 left-2 right-2 h-14 bg-[#f0f0f0] rounded-lg flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] border border-gray-200">
       {/* Rotating Dial */}
       <motion.div 
         className="w-12 h-12 rounded-full bg-white border-2 border-gray-300 shadow-md flex items-center justify-center relative"
         animate={{ rotate: angle - 90 }}
         transition={{ type: 'spring', stiffness: 200, damping: 25 }}
       >
          {/* The Cross */}
          <div className="absolute w-10 h-2 bg-gray-400 rounded-full"></div>
          <div className="absolute h-10 w-2 bg-gray-400 rounded-full"></div>
          <div className="w-4 h-4 rounded-full bg-gray-500 z-10 shadow-inner border border-gray-600 flex items-center justify-center">
             <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
          </div>
          
          {/* Direction Indicator */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-4 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.4)]"></div>
       </motion.div>
       
       {/* Angle Badge on component */}
       <div className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] font-mono px-1.5 py-0.5 rounded-full border border-blue-400 shadow-sm z-20">
         {angle}°
       </div>
    </div>
    <div className="mt-auto mb-2 text-[10px] font-black text-white tracking-widest uppercase drop-shadow-sm">SERVO</div>
    
    {/* Connection Pins at bottom */}
    <div className="absolute bottom-[-8px] left-0 right-0 flex justify-center gap-3">
       <div className="w-3 h-3 rounded-full bg-[#1e3a8a] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"></div>
       <div className="w-3 h-3 rounded-full bg-[#1e3a8a] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"></div>
       <div className="w-3 h-3 rounded-full bg-[#1e3a8a] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"></div>
    </div>
  </div>
);

const LightSensorLDRUI = ({ lightLevel = 0, onLightLevelChange }: { lightLevel?: number, onLightLevelChange?: (val: number) => void }) => (
  <div className="relative w-24 h-24 bg-[#8b5cf6] rounded-xl shadow-lg border-b-[12px] border-[#6d28d9] flex flex-col items-center justify-start pt-1">
    <div className="absolute top-1 left-1 right-1 h-12 bg-[#f0f0f0] rounded-lg flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] border border-gray-200">
       <div 
         className="w-10 h-10 rounded-full border-2 border-[#fbbf24] shadow-inner flex flex-col items-center justify-center gap-[2px] overflow-hidden transition-colors duration-300"
         style={{ backgroundColor: `rgb(252, 211, 77, ${0.3 + (lightLevel / 1023) * 0.7})` }}
       >
          <div className="w-8 h-0.5 bg-[#b45309]"></div>
          <div className="w-8 h-0.5 bg-[#b45309]"></div>
          <div className="w-8 h-0.5 bg-[#b45309]"></div>
          <div className="w-8 h-0.5 bg-[#b45309]"></div>
       </div>
       
       {/* Light Level Badge */}
       <div className="absolute -top-2 -left-2 bg-purple-600 text-white text-[10px] font-mono px-1.5 py-0.5 rounded-full border border-purple-400 shadow-sm z-20">
         {lightLevel}
       </div>
    </div>
    
    {/* Light Level Slider */}
    <div className="mt-auto mb-3 px-2 w-full flex flex-col items-center gap-0.5">
       <input 
         type="range" 
         min="0" 
         max="1023" 
         value={lightLevel} 
         onChange={(e) => onLightLevelChange?.(parseInt(e.target.value))}
         className="w-full h-1.5 bg-purple-900 rounded-lg appearance-none cursor-pointer accent-white"
         onPointerDown={(e) => e.stopPropagation()}
       />
       <div className="text-[8px] font-black text-white tracking-widest uppercase drop-shadow-sm">LIGHT SENSOR</div>
    </div>

    <div className="absolute bottom-[-8px] left-0 right-0 flex justify-center gap-3">
       <div className="w-3 h-3 rounded-full bg-[#4c1d95] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"></div>
       <div className="w-3 h-3 rounded-full bg-[#4c1d95] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"></div>
       <div className="w-3 h-3 rounded-full bg-[#4c1d95] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"></div>
    </div>
  </div>
);

const SoilMoistureUI = ({ moisture = 45, onMoistureChange }: { moisture?: number, onMoistureChange?: (val: number) => void }) => (
  <div className="relative w-24 h-28 bg-[#2b82d9] rounded-xl shadow-lg border-b-[12px] border-[#1a5b9e] flex flex-col items-center justify-start pt-1">
    <div className="absolute top-1 left-1 right-1 h-12 bg-white rounded-lg flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-blue-100">
       <div className="flex gap-4 items-end h-full pb-1">
          <div className="w-3 h-10 bg-slate-300 rounded-t-full border-x-2 border-slate-400"></div>
          <div className="w-3 h-10 bg-slate-300 rounded-t-full border-x-2 border-slate-400"></div>
       </div>
       
       {/* Moisture Badge */}
       <div className="absolute -top-2 -left-2 bg-cyan-600 text-white text-[10px] font-mono px-1.5 py-0.5 rounded-full border border-cyan-400 shadow-sm z-20">
         {moisture}%
       </div>
    </div>
    
    {/* Moisture Slider */}
    <div className="mt-auto mb-3 px-2 w-full flex flex-col items-center gap-0.5">
       <input 
         type="range" 
         min="0" 
         max="100" 
         value={moisture} 
         onChange={(e) => onMoistureChange?.(parseInt(e.target.value))}
         className="w-full h-1.5 bg-blue-900 rounded-lg appearance-none cursor-pointer accent-white"
         onPointerDown={(e) => e.stopPropagation()}
       />
       <div className="text-[8px] font-black text-white tracking-widest uppercase drop-shadow-sm">SOIL MOISTURE</div>
    </div>

    <div className="absolute bottom-[-8px] left-0 right-0 flex justify-center gap-3">
       <div className="w-3 h-3 rounded-full bg-[#113d6b] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"></div>
       <div className="w-3 h-3 rounded-full bg-[#113d6b] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"></div>
       <div className="w-3 h-3 rounded-full bg-[#113d6b] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"></div>
    </div>
  </div>
);

const PotentiometerUI = () => (
  <div className="relative w-24 h-20 bg-[#f97316] rounded-xl shadow-lg border-b-[12px] border-[#c2410c] flex flex-col items-center justify-start pt-1">
    <div className="absolute top-1 left-1 right-1 h-12 bg-[#f0f0f0] rounded-lg flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] border border-gray-200">
       <div className="w-10 h-10 rounded-full bg-[#333] border-2 border-[#111] shadow-[0_4px_4px_rgba(0,0,0,0.3),inset_0_0_4px_rgba(255,255,255,0.2)] flex items-center justify-center relative transform -rotate-45">
          <div className="absolute top-1 w-1.5 h-3 bg-white rounded-full shadow-sm"></div>
          <div className="absolute inset-1 rounded-full border-[3px] border-dashed border-[#555] opacity-50 pointer-events-none"></div>
       </div>
    </div>
    <div className="absolute bottom-[-8px] left-0 right-0 flex justify-center gap-3">
       <div className="w-3 h-3 rounded-full bg-[#7c2d12] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"></div>
       <div className="w-3 h-3 rounded-full bg-[#7c2d12] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"></div>
       <div className="w-3 h-3 rounded-full bg-[#7c2d12] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"></div>
    </div>
  </div>
);

const ColorSensorUI = ({ color = 'None', onColorChange }: { color?: string, onColorChange?: (val: string) => void }) => {
  const colors = [
    { name: 'Red', value: '#ef4444', label: 'Red' },
    { name: 'Green', value: '#22c55e', label: 'Green' },
    { name: 'Blue', value: '#3b82f6', label: 'Blue' },
    { name: 'Yellow', value: '#eab308', label: 'Yellow' },
    { name: 'White', value: '#ffffff', label: 'White' },
    { name: 'Black', value: '#000000', label: 'Black' },
    { name: 'None', value: 'transparent', label: 'None' }
  ];

  const currentColor = colors.find(c => c.label === color) || colors[6];

  return (
    <div className="relative w-24 h-24 bg-[#06b6d4] rounded-xl shadow-lg border-b-[12px] border-[#0e7490] flex flex-col items-center justify-start pt-1">
      <div className="absolute top-1 left-1 right-1 h-10 bg-[#f0f0f0] rounded-lg flex items-center justify-center gap-2 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] border border-gray-200">
         <div className="w-3 h-3 rounded-full bg-white border border-gray-300 shadow-[0_0_8px_rgba(255,255,255,1)]"></div>
         <div className="w-7 h-7 flex items-center justify-center relative overflow-hidden">
            <div 
              className="w-6 h-6 rounded-full transition-colors duration-300 border border-gray-300 shadow-sm" 
              style={{ backgroundColor: currentColor.value, opacity: color === 'None' ? 0.2 : 1 }}
            ></div>
            {color === 'None' && <div className="absolute inset-0 flex items-center justify-center text-[8px] text-gray-500 font-bold">?</div>}
         </div>
         
         {/* Color Badge */}
         <div className="absolute -top-1.5 -left-1.5 bg-cyan-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-cyan-400 shadow-sm z-20">
           {color}
         </div>
      </div>
      
      {/* Color Selector */}
      <div className="mt-12 mb-1 flex flex-wrap justify-center gap-1 px-1">
        {onColorChange && colors.map(c => (
          <button
            key={c.label}
            onClick={(e) => {
              e.stopPropagation();
              onColorChange(c.label);
            }}
            className={`w-3 h-3 rounded-full border border-white shadow-sm transition-transform hover:scale-125 ${color === c.label ? 'ring-2 ring-cyan-300 scale-110' : ''}`}
            style={{ backgroundColor: c.value === 'transparent' ? '#ccc' : c.value }}
            title={c.label}
          />
        ))}
      </div>

      <div className="absolute bottom-[-8px] left-0 right-0 flex justify-center gap-3">
         <div className="w-3 h-3 rounded-full bg-[#164e63] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"></div>
         <div className="w-3 h-3 rounded-full bg-[#164e63] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"></div>
         <div className="w-3 h-3 rounded-full bg-[#164e63] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"></div>
      </div>
    </div>
  );
};

const DHT11UI = ({ 
  mode = 'hum', 
  value = 45, 
  onModeChange, 
  onValueChange 
}: { 
  mode?: 'temp' | 'hum', 
  value?: number, 
  onModeChange?: (mode: 'temp' | 'hum') => void, 
  onValueChange?: (val: number) => void 
}) => {
  const isTemp = mode === 'temp';
  
  return (
    <div className={`relative w-24 h-32 rounded-xl shadow-lg border-b-[12px] flex flex-col items-center justify-start pt-1 transition-colors duration-500 ${isTemp ? 'bg-[#f43f5e] border-[#be123c]' : 'bg-[#14b8a6] border-[#0f766e]'}`}>
      <div className="absolute top-1 left-1 right-1 h-12 bg-[#f0f0f0] rounded-lg flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] border border-gray-200">
         {/* DHT11 Blue Body with Grid Mesh (Small Squares) */}
         <div className="w-10 h-10 bg-[#0ea5e9] rounded-sm border border-[#0284c7] shadow-sm p-1 grid grid-cols-4 grid-rows-4 gap-0.5">
            {[...Array(16)].map((_, i) => (
              <div key={i} className="bg-[#0c4a6e] opacity-40 rounded-[1px]"></div>
            ))}
         </div>
         
         {/* Mode Indicator Icon */}
         <div className="absolute -top-1 -right-1 bg-white p-1 rounded-full shadow-sm border border-gray-200">
           {isTemp ? <Thermometer size={10} className="text-red-500" /> : <Droplet size={10} className="text-blue-500" />}
         </div>
      </div>

      {/* Mode Selector Toggle */}
      <div className="mt-12 w-full px-2 flex justify-center gap-1">
        <button 
          onClick={(e) => { e.stopPropagation(); onModeChange?.('temp'); }}
          className={`px-1.5 py-0.5 rounded text-[8px] font-black transition-all ${isTemp ? 'bg-white text-red-600 shadow-sm' : 'bg-black/20 text-white/60 hover:bg-black/30'}`}
        >
          TEMP
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onModeChange?.('hum'); }}
          className={`px-1.5 py-0.5 rounded text-[8px] font-black transition-all ${!isTemp ? 'bg-white text-teal-600 shadow-sm' : 'bg-black/20 text-white/60 hover:bg-black/30'}`}
        >
          HUM
        </button>
      </div>
      
      {/* Value Slider */}
      <div className="mt-auto mb-2 px-2 w-full flex flex-col items-center gap-1">
         <input 
           type="range" 
           min={isTemp ? -10 : 0} 
           max={isTemp ? 60 : 100} 
           value={value} 
           onChange={(e) => onValueChange?.(parseInt(e.target.value))}
           className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-white ${isTemp ? 'bg-red-900' : 'bg-teal-900'}`}
           onPointerDown={(e) => e.stopPropagation()}
         />
         <div className="flex justify-between w-full px-0.5">
           <span className="text-[7px] font-bold text-white/80">{isTemp ? '-10°' : '0%'}</span>
           <span className="text-[9px] font-black text-white drop-shadow-sm">{value}{isTemp ? '°C' : '%'}</span>
           <span className="text-[7px] font-bold text-white/80">{isTemp ? '60°' : '100%'}</span>
         </div>
      </div>

      <div className="text-[10px] font-black text-white tracking-widest uppercase mb-1 drop-shadow-sm">DHT11</div>

      <div className="absolute bottom-[-8px] left-0 right-0 flex justify-center gap-3">
         <div className={`w-3 h-3 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] ${isTemp ? 'bg-[#881337]' : 'bg-[#134e4a]'}`}></div>
         <div className={`w-3 h-3 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] ${isTemp ? 'bg-[#881337]' : 'bg-[#134e4a]'}`}></div>
         <div className={`w-3 h-3 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] ${isTemp ? 'bg-[#881337]' : 'bg-[#134e4a]'}`}></div>
      </div>
    </div>
  );
};

const TemperatureUI = ({ temperature = 25, onTemperatureChange }: { temperature?: number, onTemperatureChange?: (val: number) => void }) => (
  <div className="relative w-24 h-28 bg-[#f43f5e] rounded-xl shadow-lg border-b-[12px] border-[#be123c] flex flex-col items-center justify-start pt-1">
    <div className="absolute top-1 left-1 right-1 h-14 bg-[#f0f0f0] rounded-lg flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] border border-gray-200">
       {/* NTC Thermistor Icon */}
       <div className="flex flex-col items-center mt-2">
          <div className="w-9 h-9 bg-[#222] rounded-full border-2 border-[#444] shadow-md flex flex-col items-center justify-center relative z-10">
             <div className="text-[6px] text-white font-black leading-none">NTC</div>
             <div className="text-[4px] text-gray-400 leading-none mt-0.5 uppercase font-bold">Thermistor</div>
          </div>
          <div className="flex gap-4 -mt-1">
             <div className="w-0.5 h-8 bg-gray-400"></div>
             <div className="w-0.5 h-8 bg-gray-400"></div>
          </div>
       </div>
       
       {/* Temperature Badge */}
       <div className="absolute -top-1 -left-1 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-full border border-red-400 shadow-md z-20">
         {temperature}°
       </div>
    </div>
    
    {/* Temperature Slider */}
    <div className="mt-auto mb-2 px-2 w-full flex flex-col items-center gap-1">
       <input 
         type="range" 
         min="-10" 
         max="60" 
         value={temperature} 
         onChange={(e) => onTemperatureChange?.(parseInt(e.target.value))}
         className="w-full h-2 bg-red-900 rounded-lg appearance-none cursor-pointer accent-white"
         onPointerDown={(e) => e.stopPropagation()}
       />
       <div className="text-[10px] font-black text-white tracking-tight uppercase drop-shadow-sm">TEMPERATURE</div>
    </div>

    <div className="absolute bottom-[-8px] left-0 right-0 flex justify-center gap-3">
       <div className="w-3 h-3 rounded-full bg-[#881337] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"></div>
       <div className="w-3 h-3 rounded-full bg-[#881337] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"></div>
       <div className="w-3 h-3 rounded-full bg-[#881337] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"></div>
    </div>
  </div>
);

const GeekServoUI = ({ motorState }: { motorState?: { direction: string, speed: number } }) => {
  const isActive = motorState && motorState.speed > 0;
  
  return (
    <div className="relative w-20 h-28 bg-[#f8fafc] rounded-md shadow-md border-2 border-gray-300 flex flex-col items-center justify-start overflow-hidden">
      {/* Blue band */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-[#0ea5e9] border-l border-gray-300"></div>
      {/* Top blue connector */}
      <div className="absolute top-0 right-0 w-8 h-6 bg-[#0284c7] flex justify-evenly items-center px-1 border-b border-[#0369a1]">
         <div className="w-2 h-2 rounded-full bg-[#082f49] shadow-inner"></div>
         <div className="w-2 h-2 rounded-full bg-[#082f49] shadow-inner"></div>
      </div>
      {/* Bottom blue connector */}
      <div className="absolute bottom-0 right-0 w-8 h-6 bg-[#0284c7] flex justify-evenly items-center px-1 border-t border-[#0369a1]">
         <div className="w-2 h-2 rounded-full bg-[#082f49] shadow-inner"></div>
         <div className="w-2 h-2 rounded-full bg-[#082f49] shadow-inner"></div>
      </div>
      {/* White Dial */}
      <motion.div 
        className="absolute top-4 left-1 w-12 h-12 bg-white rounded-full border-2 border-gray-300 shadow-sm flex items-center justify-center z-10"
        animate={isActive ? { rotate: motorState.direction === 'BACKWARD' ? -360 : 360 } : { rotate: 0 }}
        transition={isActive ? { 
          duration: Math.max(0.1, 2 - (motorState.speed / 50)), 
          repeat: Infinity, 
          ease: "linear" 
        } : { duration: 0.5 }}
      >
         {/* Cross hole */}
         <div className="relative w-3 h-3">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-700 -translate-y-1/2"></div>
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gray-700 -translate-x-1/2"></div>
         </div>
         {/* 4 holes */}
         <div className="absolute top-1.5 w-2 h-2 rounded-full bg-gray-200 shadow-inner"></div>
         <div className="absolute bottom-1.5 w-2 h-2 rounded-full bg-gray-200 shadow-inner"></div>
         <div className="absolute left-1.5 w-2 h-2 rounded-full bg-gray-200 shadow-inner"></div>
         <div className="absolute right-1.5 w-2 h-2 rounded-full bg-gray-200 shadow-inner"></div>
         
         {/* Direction Arrow Indicator */}
         <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-3 bg-red-500 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.5)]"></div>
      </motion.div>
      
      {/* Active Glow behind dial */}
      {isActive && (
        <div className="absolute top-4 left-1 w-12 h-12 rounded-full bg-blue-400 opacity-20 blur-md animate-pulse"></div>
      )}

      {/* Bottom left holes */}
      <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-gray-200 shadow-inner border border-gray-300"></div>
      <div className="absolute bottom-6 left-2 w-3 h-3 rounded-full bg-gray-200 shadow-inner border border-gray-300"></div>
      {/* Top left holes */}
      <div className="absolute top-1 left-2 w-3 h-3 rounded-full bg-gray-200 shadow-inner border border-gray-300"></div>
    </div>
  );
};

export const DraggableComponent: React.FC<{ 
  comp: any, 
  onComponentClick?: (id: string) => void, 
  onDragStart?: () => void, 
  onDragEnd?: (e: any, info: any) => void, 
  isDropped?: boolean, 
  disableDrag?: boolean,
  motorState?: { direction: string, speed: number },
  servoAngle?: number,
  ultrasonicDistance?: number,
  onUltrasonicChange?: (val: number) => void,
  ledColor?: string,
  onLedColorChange?: (color: string) => void,
  onLedOnChange?: (on: boolean) => void,
  ledOn?: boolean,
  colorValue?: string,
  onColorValueChange?: (val: string) => void,
  lightLevel?: number,
  onLightLevelChange?: (val: number) => void,
  temperature?: number,
  onTemperatureChange?: (val: number) => void,
  dht11Data?: { mode: 'temp' | 'hum', value: number },
  onDht11Change?: (data: { mode: 'temp' | 'hum', value: number }) => void,
  soilMoisture?: number,
  onSoilMoistureChange?: (val: number) => void,
  onDelete?: () => void
}> = ({ comp, onComponentClick, onDragStart, onDragEnd, isDropped, disableDrag, motorState, servoAngle, ultrasonicDistance, onUltrasonicChange, ledColor, onLedColorChange, ledOn, colorValue, onColorValueChange, lightLevel, onLightLevelChange, temperature, onTemperatureChange, dht11Data, onDht11Change, soilMoisture, onSoilMoistureChange, onDelete }) => {
  const [isDragging, setIsDragging] = useState(false);

  const renderUI = () => {
    switch (comp.type) {
      case 'ultrasonic': return <UltrasonicUI distance={ultrasonicDistance} onDistanceChange={onUltrasonicChange} />;
      case 'led': return <LedUI color={ledColor} onColorChange={onLedColorChange} isOn={ledOn} />;
      case 'buzzer': return <BuzzerUI isOn={ledOn} />;
      case 'servo': return <ServoUI angle={servoAngle} />;
      case 'photosensitive': return <LightSensorLDRUI lightLevel={lightLevel} onLightLevelChange={onLightLevelChange} />;
      case 'potentiometer': return <PotentiometerUI />;
      case 'color': return <ColorSensorUI color={colorValue} onColorChange={onColorValueChange} />;
      case 'humidity': return (
        <DHT11UI 
          mode={dht11Data?.mode} 
          value={dht11Data?.value} 
          onModeChange={(mode) => onDht11Change?.({ mode, value: dht11Data?.value || (mode === 'temp' ? 25 : 45) })}
          onValueChange={(value) => onDht11Change?.({ mode: dht11Data?.mode || 'hum', value })}
        />
      );
      case 'temperature': return <TemperatureUI temperature={temperature} onTemperatureChange={onTemperatureChange} />;
      case 'soilmoisture': return <SoilMoistureUI moisture={soilMoisture} onMoistureChange={onSoilMoistureChange} />;
      case 'geekservo': return <GeekServoUI motorState={motorState} />;
      case 'button': return <ButtonUI />;
      default: return null;
    }
  };

  return (
    <motion.div
      drag={!disableDrag}
      dragMomentum={false}
      onDragStart={() => {
        setIsDragging(true);
        onDragStart && onDragStart();
      }}
      onDragEnd={(e, info) => {
        setIsDragging(false);
        onDragEnd && onDragEnd(e, info);
      }}
      whileDrag={{ zIndex: 50 }}
      style={{ position: 'relative' }}
      className={`flex flex-col items-center ${isDropped ? 'cursor-move' : 'cursor-grab active:cursor-grabbing'} z-20`}
    >
      <div className="relative group/comp">
         {/* Connection Node */}
         <div
            id={comp.id}
            className="absolute -top-5 left-1/2 -translate-x-1/2 w-6 h-6 bg-gray-700 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform flex items-center justify-center z-30"
            title={`Connect to ${comp.name}`}
            onPointerDown={(e) => {
              e.stopPropagation(); // Prevent drag when interacting with the port
            }}
            onClick={(e) => {
              e.stopPropagation();
              onComponentClick && onComponentClick(comp.id);
            }}
          >
            <div className="w-2 h-2 bg-white rounded-full pointer-events-none"></div>
          </div>
          
          {/* Delete Button (Visible on hover if dropped) */}
          {isDropped && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete && onDelete();
              }}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/comp:opacity-100 transition-opacity z-40 shadow-sm hover:bg-red-600"
              title="Delete Component"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          )}

          {/* Component Body */}
          {renderUI()}
      </div>
      <span className="text-sm font-bold text-gray-700 select-none mt-2">{comp.name}</span>
    </motion.div>
  );
};

const ComponentDispenser = ({ compBase, onComponentClick, onDropOnBoard, zoomLevel = 1 }: { compBase: any, onComponentClick?: (id: string) => void, onDropOnBoard?: (compBase: any, id: string, x: number, y: number) => void, zoomLevel?: number, key?: string }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0, width: 0 });
  const [nextKey, setNextKey] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // Only left click
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      flushSync(() => {
        setDragStartPos({ x: rect.left, y: rect.top, width: rect.width });
        setIsDragging(true);
      });
      dragControls.start(e);
    }
  };

  const handleDragEnd = (e: any, info: any) => {
    console.log('Drag ended for:', compBase.id);
    
    try {
      // Get the container element (the whole simulation area)
      const container = document.getElementById('simulation-container');
      const board = document.getElementById('simulation-board-wrapper');
      
      console.log('Container found:', !!container);
      console.log('Board found:', !!board);
      
      if (container && board) {
        const containerRect = container.getBoundingClientRect();
        const boardRect = board.getBoundingClientRect();
        
        console.log('Container rect:', containerRect);
        console.log('Board rect:', boardRect);
        console.log('Comp point (clientX/Y):', e.clientX, e.clientY);
        
        // Check if dropped within the container's bounds (the whole gray area)
        if (
          e.clientX >= containerRect.left &&
          e.clientX <= containerRect.right &&
          e.clientY >= containerRect.top &&
          e.clientY <= containerRect.bottom
        ) {
          console.log('Dropped inside simulation container');
          
          // Calculate relative position to the board wrapper
          // We use the boardRect which is already scaled by zoomLevel
          const relativeX = (e.clientX - boardRect.left) / zoomLevel;
          const relativeY = (e.clientY - boardRect.top) / zoomLevel;
          
          console.log('Calculated relative pos:', relativeX, relativeY);
          
          const instanceId = `${compBase.id}-${nextKey}`;
          setNextKey(prev => prev + 1);
          
          if (onDropOnBoard) {
            onDropOnBoard(compBase, instanceId, relativeX, relativeY);
          }
        } else {
          console.log('Dropped outside simulation container');
        }
      } else {
        console.log('Container or Board not found');
      }
    } catch (err) {
      console.error("Error in handleDragEnd:", err);
    } finally {
      setIsDragging(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center w-full mb-6" ref={containerRef}>
      {/* Static item in the list */}
      <div onPointerDown={handlePointerDown} className="cursor-grab active:cursor-grabbing w-full flex justify-center">
        <DraggableComponent comp={{ ...compBase, id: `${compBase.id}-static` }} disableDrag={true} />
      </div>
      
      {/* Dragged clone in a portal */}
      {isDragging && createPortal(
        <motion.div
          id={`drag-clone-${compBase.id}`}
          drag
          dragControls={dragControls}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          style={{ 
            position: 'fixed', 
            left: dragStartPos.x, 
            top: dragStartPos.y, 
            width: dragStartPos.width, 
            zIndex: 9999, 
            margin: 0
          }}
          className="cursor-grabbing flex flex-col items-center"
        >
          <DraggableComponent comp={{ ...compBase, id: `${compBase.id}-drag` }} disableDrag={true} />
        </motion.div>,
        document.body
      )}
    </div>
  );
};

export const ElectronicComponents = ({ onComponentClick, onDropOnBoard, zoomLevel = 1 }: ElectronicComponentsProps) => {
  const components = [
    { id: 'comp-led', name: 'LED', type: 'led' },
    { id: 'comp-buzzer', name: 'Buzzer', type: 'buzzer' },
    { id: 'comp-servo', name: 'Servo Motor', type: 'servo' },
    { id: 'comp-geekservo', name: 'Motor', type: 'geekservo' },
    { id: 'comp-ultrasonic', name: 'Ultrasonic', type: 'ultrasonic' },
    { id: 'comp-photo', name: 'Light Sensor LDR', type: 'photosensitive' },
    { id: 'comp-pot', name: 'Potentiometer', type: 'potentiometer' },
    { id: 'comp-color', name: 'Color Sensor', type: 'color' },
    { id: 'comp-hum', name: 'DHT11 Sensor', type: 'humidity' },
    { id: 'comp-soil', name: 'Soil Moisture', type: 'soilmoisture' },
    { id: 'comp-temp', name: 'Temperature', type: 'temperature' },
    { id: 'comp-button', name: 'Button', type: 'button' },
  ];

  return (
    <div className="flex flex-col w-full items-center mt-2 pb-10">
      {components.map((comp) => (
        <ComponentDispenser key={comp.id} compBase={comp} onComponentClick={onComponentClick} onDropOnBoard={onDropOnBoard} zoomLevel={zoomLevel} />
      ))}
    </div>
  );
};
