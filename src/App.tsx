import React, { useState, useRef, useEffect } from 'react';
import * as Blockly from 'blockly';
import './blockly/blocks'; // Register blocks
import './blockly/generators'; // Register generators
import { javascriptGenerator } from './blockly/generators';
import { Play, Square, Trash2 } from 'lucide-react';
import { MicrobitBoard } from './components/MicrobitBoard';
import { ElectronicComponents } from './components/ElectronicComponents';
import { BlocklyWorkspace } from './components/BlocklyWorkspace';

const WireCanvas = ({ wires, drawingWireFrom, mousePos }: { wires: any[], drawingWireFrom: string | null, mousePos: {x: number, y: number} }) => {
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
        
        if (!startEl || !endEl) return null;
        
        const startRect = startEl.getBoundingClientRect();
        const endRect = endEl.getBoundingClientRect();
        
        const isM = startId.includes('port-M');
        const isS = startId.includes('port-S');
        
        let startX = startRect.left + startRect.width / 2;
        let startY = startRect.top + startRect.height / 2;
        
        if (isM) startX = startRect.right;
        if (isS) startX = startRect.left;
        
        let endX = endRect.left + endRect.width / 2;
        let endY = endRect.top;
        if (isDrawing) {
          endX = endRect.left;
          endY = endRect.top;
        }
        
        let d = `M ${startX} ${startY} `;
        
        const padding = 40;
        const boardBottom = boardRect.bottom + padding;
        
        if (isM) {
          const rightEdge = Math.max(boardRect.right + padding, startX + padding);
          d += `L ${rightEdge} ${startY} `;
          const midY = endY - 20;
          
          if (endX > rightEdge) {
             d += `L ${rightEdge} ${midY} `;
             d += `L ${endX} ${midY} `;
          } else {
             const safeY = Math.max(boardBottom, midY);
             d += `L ${rightEdge} ${safeY} `;
             d += `L ${endX} ${safeY} `;
             if (safeY !== midY) {
                d += `L ${endX} ${midY} `;
             }
          }
          d += `L ${endX} ${endY}`;
        } else if (isS) {
          const leftEdge = Math.min(boardRect.left - padding, startX - padding);
          d += `L ${leftEdge} ${startY} `;
          const midY = endY - 20;
          
          if (endX < leftEdge) {
             d += `L ${leftEdge} ${midY} `;
             d += `L ${endX} ${midY} `;
          } else {
             const safeY = Math.max(boardBottom, midY);
             d += `L ${leftEdge} ${safeY} `;
             d += `L ${endX} ${safeY} `;
             if (safeY !== midY) {
                d += `L ${endX} ${midY} `;
             }
          }
          d += `L ${endX} ${endY}`;
        } else {
          d += `L ${endX} ${startY} L ${endX} ${endY}`;
        }
        
        return d;
      };

      wires.forEach((wire, i) => {
        const d = calcPath(wire.from, wire.to, false);
        if (d) {
          newPaths.push({ id: `wire-${i}`, d, color: '#475569', isDashed: false });
        }
      });
      
      if (drawingWireFrom) {
        const d = calcPath(drawingWireFrom, 'mouse-tracker', true);
        if (d) {
          newPaths.push({ id: 'wire-drawing', d, color: '#ef4444', isDashed: true });
        }
      }
      
      setPaths(newPaths);
      frameId = requestAnimationFrame(updatePaths);
    };
    
    frameId = requestAnimationFrame(updatePaths);
    return () => cancelAnimationFrame(frameId);
  }, [wires, drawingWireFrom]);

  return (
    <svg className="fixed inset-0 w-full h-full pointer-events-none z-50">
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

  // Wire drawing state
  const [wires, setWires] = useState<{ from: string; to: string }[]>([]);
  const [drawingWireFrom, setDrawingWireFrom] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (drawingWireFrom) {
        setMousePos({ x: e.clientX, y: e.clientY });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [drawingWireFrom]);

  useEffect(() => {
    if (blocklyDiv.current && !workspace.current) {
      workspace.current = Blockly.inject(blocklyDiv.current, {
        toolbox: {
          kind: 'categoryToolbox',
          contents: [
            {
              kind: 'category',
              name: 'Events',
              colour: '#FFBF00',
              contents: [
                { kind: 'block', type: 'event_when_green_flag_clicked' },
                { kind: 'block', type: 'microbit_button_pressed' },
              ],
            },
            {
              kind: 'category',
              name: 'Micro:bit',
              colour: '#0FBD8C',
              contents: [
                { kind: 'block', type: 'microbit_show_icon' },
                { kind: 'block', type: 'microbit_show_text' },
                { kind: 'block', type: 'microbit_set_led_color' },
                { kind: 'block', type: 'microbit_set_pin' },
                { kind: 'block', type: 'microbit_play_tone' },
              ],
            },
            {
              kind: 'category',
              name: 'Control',
              colour: '#FFAB19',
              contents: [
                { kind: 'block', type: 'control_wait' },
                { kind: 'block', type: 'control_wait_until' },
                { kind: 'block', type: 'control_repeat' },
                { kind: 'block', type: 'control_forever' },
                { kind: 'block', type: 'controls_if' },
              ],
            },
          ],
        },
        grid: { spacing: 20, length: 3, colour: '#ccc', snap: true },
        move: { scrollbars: true, drag: true, wheel: true },
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

  const runCode = () => {
    if (workspace.current) {
      const code = javascriptGenerator.workspaceToCode(workspace.current);
      console.log('Generated code:', code);
      try {
        boardRef.current?.clear();
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        // eslint-disable-next-line no-new-func
        new AsyncFunction('boardRef', code)(boardRef);
        boardRef.current?.triggerGreenFlag();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const stopCode = () => {
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

      setWires([...wires, { from, to }]);
      setDrawingWireFrom(null);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans overflow-hidden">
      <header className="bg-white p-4 flex items-center gap-4 border-b border-gray-200 z-50 relative">
        <h1 className="text-xl font-bold text-gray-800 mr-4">Stack Kidi - Micro:bit</h1>
        <button onClick={runCode} className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full shadow-md">
          <Play size={24} fill="currentColor" />
        </button>
        <button onClick={stopCode} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-md">
          <Square size={24} fill="currentColor" />
        </button>
        {connectionError ? (
          <div className="ml-auto text-sm font-semibold text-red-600 bg-red-50 px-4 py-2 rounded-full border border-red-200">
            {connectionError}
          </div>
        ) : drawingWireFrom ? (
          <div className="ml-auto text-sm font-semibold text-blue-600 bg-blue-50 px-4 py-2 rounded-full border border-blue-200">
            Click another node to connect, or click the same node to cancel.
          </div>
        ) : (
          <div className="ml-auto text-sm font-semibold text-gray-600 bg-gray-100 px-4 py-2 rounded-full border border-gray-200">
            Click a terminal to connect. Click a connected terminal to remove wire.
          </div>
        )}
      </header>
      
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 relative h-full">
        <div ref={blocklyDiv} className="bg-white rounded-lg shadow-md overflow-hidden h-full w-full z-10 relative">
        </div>
        
        <div className="bg-white rounded-lg shadow-md flex flex-col overflow-y-auto relative z-0 h-full">
          <>
            <WireCanvas wires={wires} drawingWireFrom={drawingWireFrom} mousePos={mousePos} />
            <div className="flex flex-row w-full min-h-max p-4 relative z-10">
              {/* Left Side: Simulation Board */}
              <div className="flex-1 flex flex-col items-center p-2">
                <h2 className="text-lg font-semibold mb-4">Simulation Board</h2>
                <MicrobitBoard ref={boardRef} onPinClick={handleNodeClick} />
              </div>
              
              {/* Divider */}
              <div className="w-px bg-gray-200 mx-4 shrink-0"></div>
              
              {/* Right Side: Components */}
              <div className="w-36 flex flex-col items-center shrink-0 p-2">
                <h2 className="text-lg font-semibold mb-4 text-center">Components</h2>
                <ElectronicComponents onComponentClick={handleNodeClick} />
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
