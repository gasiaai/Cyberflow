import React, { useState, useRef } from 'react';
import { Settings, Download, Play, Square, Video, Zap, Activity, Monitor, Layers, Shuffle, Type } from 'lucide-react';
import CyberCanvas, { CyberCanvasHandle } from './components/CyberCanvas';
import { RESOLUTIONS, THEMES, VISUAL_STYLES } from './constants';
import { VisualizerConfig, ColorTheme, Resolution, VisualStyle } from './types';

function App() {
  const canvasRef = useRef<CyberCanvasHandle>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const [config, setConfig] = useState<VisualizerConfig>({
    resolution: RESOLUTIONS[0], // Default 1080p
    theme: THEMES[0], // Default Cyan
    style: 'network',
    particleCount: 200, // Increased default for better text resolution
    speed: 1,
    connectionDistance: 120,
    seed: 1,
    text: '',
  });

  const handleResolutionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const res = RESOLUTIONS.find(r => r.label === e.target.value) || RESOLUTIONS[0];
    
    // Auto-adjust particle count for performance/density balance
    const baseParticles = 150;
    const pixelRatio = (res.width * res.height) / (1920 * 1080);
    // Use sqrt to scale density linearly with dimensions, not area, to save performance
    let newCount = Math.floor(baseParticles * Math.sqrt(pixelRatio));
    
    // Style specific caps
    if (config.style === 'bokeh') newCount = Math.min(newCount * 0.5, 100); 
    else newCount = Math.min(newCount, 400); 

    // If text is active, we might want more particles to define the shape
    if (config.text) {
        newCount = Math.min(newCount * 1.5, 600);
    }

    setConfig(prev => ({
      ...prev,
      resolution: res,
      particleCount: Math.floor(newCount)
    }));
  };

  const handleThemeChange = (theme: ColorTheme) => {
    setConfig(prev => ({ ...prev, theme }));
  };
  
  const handleStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const style = e.target.value as VisualStyle;
    // Adjust defaults for style
    let newSpeed = config.speed;
    const newDist = config.connectionDistance;
    
    if (style === 'matrix') { newSpeed = 2; }
    if (style === 'bokeh') { newSpeed = 0.5; }

    setConfig(prev => ({ ...prev, style, speed: newSpeed, connectionDistance: newDist }));
  };

  const randomize = () => {
    setConfig(prev => ({
        ...prev,
        seed: Math.random(),
    }));
  };

  const toggleRecording = () => {
    if (canvasRef.current) {
      if (isRecording) {
        canvasRef.current.stopRecording();
      } else {
        setDownloadUrl(null);
        canvasRef.current.startRecording();
        setIsRecording(true);
      }
    }
  };

  const handleRecordingStop = (url: string) => {
    setDownloadUrl(url);
    setIsRecording(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 flex flex-col md:flex-row font-sans selection:bg-cyan-500/30">
      
      {/* Sidebar / Controls */}
      <aside className="w-full md:w-80 bg-[#0a0a0f] border-r border-white/5 flex flex-col p-6 z-10 shrink-0 h-screen md:h-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2 rounded-lg bg-${config.theme.accent}/10 border border-${config.theme.accent}/20 transition-colors duration-500`}>
            <Activity className={`w-6 h-6 text-${config.theme.accent}`} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">CyberFlow</h1>
            <p className="text-xs text-gray-500">Visual Generator Engine</p>
          </div>
        </div>

        <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
          
          {/* Resolution Settings */}
          <section>
            <div className="flex items-center gap-2 mb-2 text-xs uppercase tracking-wider font-semibold text-gray-500">
              <Monitor className="w-3 h-3" />
              <span>Canvas Size</span>
            </div>
            <select
              value={config.resolution.label}
              onChange={handleResolutionChange}
              className="w-full bg-[#15151b] border border-white/10 rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
            >
              {RESOLUTIONS.map((res) => (
                <option key={res.label} value={res.label}>{res.label}</option>
              ))}
            </select>
          </section>

          {/* Style Settings */}
          <section>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-gray-500">
                    <Layers className="w-3 h-3" />
                    <span>Visual Style</span>
                </div>
                <button onClick={randomize} className="text-xs flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors" title="Randomize Seeds">
                    <Shuffle className="w-3 h-3" /> Mix
                </button>
            </div>
            <select
              value={config.style}
              onChange={handleStyleChange}
              className="w-full bg-[#15151b] border border-white/10 rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all mb-2"
            >
              {VISUAL_STYLES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
             <p className="text-[10px] text-gray-500 h-4">
                {VISUAL_STYLES.find(s => s.id === config.style)?.description}
             </p>
          </section>

          {/* Text Input */}
          <section>
             <div className="flex items-center gap-2 mb-2 text-xs uppercase tracking-wider font-semibold text-gray-500">
              <Type className="w-3 h-3" />
              <span>Text Morph (Beta)</span>
            </div>
            <input 
                type="text" 
                placeholder="Enter text..."
                value={config.text}
                onChange={(e) => setConfig({...config, text: e.target.value})}
                maxLength={20}
                className="w-full bg-[#15151b] border border-white/10 rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-gray-700"
            />
             <p className="text-[10px] text-gray-500 mt-1">
                Particles will rearrange to form this text.
             </p>
          </section>

          {/* Theme Settings */}
          <section>
            <div className="flex items-center gap-2 mb-2 text-xs uppercase tracking-wider font-semibold text-gray-500">
              <Zap className="w-3 h-3" />
              <span>Color Theme</span>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {THEMES.map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => handleThemeChange(theme)}
                  className={`w-full aspect-square rounded-md border transition-all duration-200 ${
                    config.theme.name === theme.name 
                      ? `border-white scale-110 shadow-[0_0_10px_${theme.primary}] z-10` 
                      : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
                  }`}
                  style={{ backgroundColor: theme.primary }}
                  title={theme.name}
                />
              ))}
            </div>
          </section>

          {/* Sliders */}
          <section className="space-y-5 bg-white/5 p-4 rounded-lg border border-white/5">
            <div>
              <div className="flex justify-between text-xs mb-2 text-gray-400">
                <span>Motion Speed</span>
                <span className="font-mono">{config.speed.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={config.speed}
                onChange={(e) => setConfig({ ...config, speed: parseFloat(e.target.value) })}
                className={`w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-${config.theme.accent}`}
              />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-2 text-gray-400">
                <span>Particle Count</span>
                <span className="font-mono">{config.particleCount}</span>
              </div>
              <input
                type="range"
                min="20"
                max="1000"
                step="10"
                value={config.particleCount}
                onChange={(e) => setConfig({ ...config, particleCount: parseInt(e.target.value) })}
                className={`w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-${config.theme.accent}`}
              />
            </div>
            
            {/* Conditional control: Connection distance only relevant for network */}
            {config.style === 'network' && (
                <div>
                <div className="flex justify-between text-xs mb-2 text-gray-400">
                    <span>Link Distance</span>
                    <span className="font-mono">{config.connectionDistance}px</span>
                </div>
                <input
                    type="range"
                    min="50"
                    max="300"
                    step="10"
                    value={config.connectionDistance}
                    onChange={(e) => setConfig({ ...config, connectionDistance: parseInt(e.target.value) })}
                    className={`w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-${config.theme.accent}`}
                />
                </div>
            )}
          </section>

          {/* Action Area */}
          <div className="pt-2 space-y-3">
             <button
              onClick={toggleRecording}
              className={`w-full py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
                isRecording 
                  ? 'bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                  : `bg-gradient-to-r from-${config.theme.accent.split('-')[0]}-600/80 to-${config.theme.accent.split('-')[0]}-800/80 hover:brightness-110 text-white border border-white/10 shadow-lg`
              }`}
            >
              {isRecording ? (
                <>
                  <Square className="w-4 h-4 fill-current" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Video className="w-4 h-4" />
                  Start Rendering (REC)
                </>
              )}
            </button>

            {downloadUrl && !isRecording && (
              <a
                href={downloadUrl}
                download={`cyberflow_${config.resolution.width}x${config.resolution.height}_${config.style}_${Date.now()}.mp4`}
                className={`w-full py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all`}
              >
                <Download className="w-4 h-4" />
                Download Video
              </a>
            )}
            
            {isRecording && (
               <div className="flex items-center justify-center gap-2 text-xs text-red-400 animate-pulse">
                 <span className="w-2 h-2 rounded-full bg-red-500"></span>
                 Recording 4K... do not close tab.
               </div>
            )}
          </div>

        </div>
      </aside>

      {/* Main Canvas Area */}
      <main className="flex-1 p-4 md:p-8 bg-[#020205] relative flex flex-col items-center justify-center overflow-hidden">
        {/* Background Grid/Noise */}
        <div className="absolute inset-0 bg-[url('https://assets.codepen.io/13471/noise.png')] opacity-20 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-${config.theme.accent}/5 pointer-events-none"></div>

        
        {/* Header inside canvas area */}
        <div className="absolute top-6 left-8 z-10 hidden md:block">
           <h2 className="text-white/30 text-xs uppercase tracking-[0.2em] font-light">Render Preview Output</h2>
        </div>

        <div className="z-10 w-full h-full flex flex-col items-center justify-center">
            {/* Wrapper for canvas to maintain aspect ratio visually without stretching */}
          <CyberCanvas 
            ref={canvasRef}
            config={config} 
            onRecordingStop={handleRecordingStop}
          />
        </div>

        {/* Floating status */}
        <div className="absolute bottom-6 right-8 text-right z-10 hidden md:block text-white/20 text-xs font-mono">
          <p>MODE: {config.style.toUpperCase()}</p>
          <p>RES: {config.resolution.label}</p>
          {config.text && <p>TEXT: ACTIVE</p>}
        </div>
      </main>

    </div>
  );
}

export default App;