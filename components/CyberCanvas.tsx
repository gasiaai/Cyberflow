import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { VisualizerConfig, VisualStyle } from '../types';

interface CyberCanvasProps {
  config: VisualizerConfig;
  onRecordingStop: (url: string) => void;
}

export interface CyberCanvasHandle {
  startRecording: () => void;
  stopRecording: () => void;
  isRecording: boolean;
}

class Particle {
  x: number;
  y: number;
  z: number; // Depth
  vx: number;
  vy: number;
  size: number;
  
  // Vortex specific
  angle: number;
  radius: number;
  
  // Text morphing specific
  targetX: number | null = null;
  targetY: number | null = null;

  constructor(width: number, height: number, style: VisualStyle) {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.z = Math.random() * 2 + 0.5; 
    
    // Default size
    this.size = Math.random() * 2 + 0.5;

    // Vortex specific init
    const dx = this.x - width / 2;
    const dy = this.y - height / 2;
    this.angle = Math.atan2(dy, dx);
    this.radius = Math.sqrt(dx*dx + dy*dy);

    // Initial Velocity setup based on style
    this.vx = 0;
    this.vy = 0;
    this.resetVelocity(style);

    // Style overrides
    if (style === 'bokeh') {
        this.size = Math.random() * 15 + 5; // Much bigger
        this.z = Math.random() * 1.5 + 0.5; // Closer range
    }
  }

  resetVelocity(style: VisualStyle) {
    const direction = Math.random() > 0.5 ? 1 : -1;
    const baseSpeed = 0.5;

    if (style === 'network') {
        this.vx = (Math.random() * baseSpeed + 0.1) * direction;
        this.vy = (Math.random() * baseSpeed + 0.1) * direction;
    } else if (style === 'bokeh') {
        this.vx = (Math.random() * 0.2 - 0.1); 
        this.vy = (Math.random() * -0.5 - 0.2); // Float up
    } else if (style === 'matrix') {
        this.vx = 0;
        this.vy = (Math.random() * 5 + 2); // Fall down fast
    } else if (style === 'nova') {
        // Will be calculated relative to center in update, but basic random drift here
        this.vx = (Math.random() * 2 - 1);
        this.vy = (Math.random() * 2 - 1);
    }
  }

  update(width: number, height: number, speedMultiplier: number, scaleRatio: number, style: VisualStyle) {
    const effectiveSpeed = speedMultiplier * scaleRatio;

    // --- Text Morphing Logic ---
    if (this.targetX !== null && this.targetY !== null) {
        // Easing towards target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        
        // Use a spring-like ease
        this.x += dx * 0.05 * effectiveSpeed;
        this.y += dy * 0.05 * effectiveSpeed;

        // Add some jitter to keep it "alive" and looking like a particle cloud
        this.x += (Math.random() - 0.5) * 0.5 * scaleRatio;
        this.y += (Math.random() - 0.5) * 0.5 * scaleRatio;
        
        // Flatten Z for text readability usually, or keep depth?
        // Let's pull z slowly towards 1.0 (neutral depth)
        this.z += (1.0 - this.z) * 0.05;

        return; // Skip standard physics
    }

    // --- Standard Physics ---

    if (style === 'vortex') {
        // Vortex Logic
        this.angle += (0.005 * effectiveSpeed) / this.z;
        this.x = width / 2 + Math.cos(this.angle) * this.radius;
        this.y = height / 2 + Math.sin(this.angle) * this.radius;
    } else if (style === 'nova') {
        // Move away from center
        const dx = this.x - width / 2;
        const dy = this.y - height / 2;
        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
        
        this.vx = (dx / dist) * 2;
        this.vy = (dy / dist) * 2;

        this.x += this.vx * effectiveSpeed;
        this.y += this.vy * effectiveSpeed;

        // Reset if off screen
        if (this.x < -100 || this.x > width + 100 || this.y < -100 || this.y > height + 100) {
            this.x = width / 2 + (Math.random() * 20 - 10);
            this.y = height / 2 + (Math.random() * 20 - 10);
        }
    } else {
        // Standard Linear Motion (Network, Bokeh, Matrix)
        this.x += this.vx * effectiveSpeed;
        this.y += this.vy * effectiveSpeed;

        // Wrapping logic
        if (this.x < -50) this.x = width + 50;
        if (this.x > width + 50) this.x = -50;
        
        if (style === 'bokeh') {
             // Wrap bottom to top is standard, but bokeh goes up, so wrap top to bottom
             if (this.y < -50) this.y = height + 50;
        } else if (style === 'matrix') {
             if (this.y > height + 50) this.y = -50;
        } else {
             // Network default wrap
             if (this.y < -50) this.y = height + 50;
             if (this.y > height + 50) this.y = -50;
        }
    }
  }

  draw(ctx: CanvasRenderingContext2D, colorRgb: string, style: VisualStyle) {
    const opacity = (1 / this.z); // Standard depth opacity
    
    ctx.beginPath();
    
    if (style === 'bokeh') {
        // Soft, large, very transparent
        ctx.arc(this.x, this.y, this.size * (1/this.z), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${colorRgb}, ${opacity * 0.15})`;
        ctx.fill();
    } else if (style === 'matrix') {
        // Rectangular trails
        const trailLen = this.size * 10 * (1/this.z);
        ctx.fillStyle = `rgba(${colorRgb}, ${opacity * 0.8})`;
        ctx.fillRect(this.x, this.y - trailLen, this.size, trailLen);
    } else {
        // Standard dot with fake glow (faster than shadowBlur)
        const radius = this.size * (1/this.z);
        
        // 1. Glow (Large transparent circle)
        ctx.fillStyle = `rgba(${colorRgb}, ${opacity * 0.3})`;
        ctx.arc(this.x, this.y, radius * 4, 0, Math.PI * 2);
        ctx.fill();
        
        // 2. Core (Small solid circle)
        ctx.beginPath();
        ctx.fillStyle = `rgba(${colorRgb}, ${opacity})`;
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
  }
}

const CyberCanvas = forwardRef<CyberCanvasHandle, CyberCanvasProps>(({ config, onRecordingStop }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const textPointsRef = useRef<{x: number, y: number}[]>([]);
  
  // Recording State
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  // Initialize Particles
  const initParticles = (width: number, height: number) => {
    // If we already have particles, try to keep them to avoid full reset flicker,
    // just resizing array if needed
    const currentParticles = particlesRef.current;
    const targetCount = config.particleCount;
    
    if (currentParticles.length < targetCount) {
        // Add more
        for (let i = currentParticles.length; i < targetCount; i++) {
            currentParticles.push(new Particle(width, height, config.style));
        }
    } else if (currentParticles.length > targetCount) {
        // Remove excess
        currentParticles.length = targetCount;
    }
    
    // If array was empty (first load), init
    if (currentParticles.length === 0) {
        for (let i = 0; i < targetCount; i++) {
            currentParticles.push(new Particle(width, height, config.style));
        }
    }

    particlesRef.current = currentParticles;
  };

  // Process Text to Points
  useEffect(() => {
    if (!config.text || !canvasRef.current) {
        textPointsRef.current = [];
        return;
    }

    const processText = () => {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;

        // Dimensions for scanning (smaller than full res for performance)
        const scanWidth = 800;
        // Maintain aspect ratio
        const aspectRatio = config.resolution.width / config.resolution.height;
        const scanHeight = scanWidth / aspectRatio;
        
        tempCanvas.width = scanWidth;
        tempCanvas.height = scanHeight;

        // Draw Text
        tempCtx.fillStyle = '#ffffff';
        tempCtx.textAlign = 'center';
        tempCtx.textBaseline = 'middle';
        
        // --- Dynamic Font Sizing (Auto-scale) ---
        let fontSize = 250; // Start with a large base font
        tempCtx.font = `bold ${fontSize}px Inter, sans-serif`;
        
        const padding = 50; // Margin on sides
        const maxWidth = scanWidth - (padding * 2);
        const textMetrics = tempCtx.measureText(config.text);
        
        // If text is wider than screen, scale down
        if (textMetrics.width > maxWidth) {
            const ratio = maxWidth / textMetrics.width;
            fontSize = Math.floor(fontSize * ratio);
        }
        
        // Apply final font size
        tempCtx.font = `bold ${fontSize}px Inter, sans-serif`;
        // ------------------------------------------

        tempCtx.fillText(config.text, scanWidth / 2, scanHeight / 2);

        // Scan pixels
        const imageData = tempCtx.getImageData(0, 0, scanWidth, scanHeight).data;
        const points = [];
        
        // Sampling gap - adjust based on font size to keep density good for small text
        // If text is huge, gap 4 is fine. If text is tiny, we need finer detail (gap 2 or 1).
        const gap = Math.max(2, Math.floor(fontSize / 40));

        for (let y = 0; y < scanHeight; y += gap) {
            for (let x = 0; x < scanWidth; x += gap) {
                const index = (y * scanWidth + x) * 4;
                if (imageData[index + 3] > 128) { // If pixel is visible
                     // Map scan coordinates to real coordinates
                     points.push({
                         x: (x / scanWidth) * config.resolution.width,
                         y: (y / scanHeight) * config.resolution.height
                     });
                }
            }
        }
        
        // Shuffle points to avoid linear filling
        for (let i = points.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [points[i], points[j]] = [points[j], points[i]];
        }

        textPointsRef.current = points;
    };

    processText();

  }, [config.text, config.resolution]);

  useImperativeHandle(ref, () => ({
    isRecording,
    startRecording: () => {
      if (!canvasRef.current) return;
      
      const stream = canvasRef.current.captureStream(60); 
      
      const mimeTypes = [
        'video/mp4;codecs=h264,aac',
        'video/webm;codecs=h264',
        'video/webm;codecs=vp9',
        'video/webm'
      ];
      
      let selectedMimeType = '';
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          selectedMimeType = type;
          break;
        }
      }

      if (!selectedMimeType) {
        console.error("No supported MediaRecorder mimeType found.");
        return;
      }

      const recorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: 50000000 // 50 Mbps for high quality 4K
      });

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: selectedMimeType });
        const url = URL.createObjectURL(blob);
        onRecordingStop(url);
        setIsRecording(false);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    },
    stopRecording: () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Set actual canvas size based on resolution
    canvas.width = config.resolution.width;
    canvas.height = config.resolution.height;

    const scaleRatio = canvas.width / 1920;
    const effectiveConnectionDist = config.connectionDistance * scaleRatio;

    initParticles(canvas.width, canvas.height);

    const animate = () => {
      if (!ctx || !canvas) return;
      
      // 1. Clear with Trail Effect (Background Reset)
      let fadeAlpha = 0.3;
      if (config.style === 'matrix') fadeAlpha = 0.1;
      if (config.style === 'nova') fadeAlpha = 0.2;
      
      ctx.fillStyle = `rgba(5, 5, 10, ${fadeAlpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 3. Update and Draw Particles
      const particles = particlesRef.current;
      const textPoints = textPointsRef.current;
      
      ctx.shadowBlur = 0; 
      
      let textPIndex = 0;
      
      for (let i = 0; i < particles.length; i++) {
        // Default behavior: background movement
        let isBackground = true;

        if (textPoints.length > 0) {
            // Logic: Assign most particles to text, keep some for background
            // Reserve ~20% for background (indices 0, 5, 10...)
            // This ensures we always have some ambient motion
            if (i % 5 !== 0) {
                isBackground = false;
                const targetIndex = textPIndex % textPoints.length;
                particles[i].targetX = textPoints[targetIndex].x;
                particles[i].targetY = textPoints[targetIndex].y;
                textPIndex++;
            }
        }

        if (isBackground) {
            particles[i].targetX = null;
            particles[i].targetY = null;
        }

        particles[i].update(canvas.width, canvas.height, config.speed, scaleRatio, config.style);
        particles[i].draw(ctx, config.theme.glow, config.style);
      }

      // 4. Draw Connections (Network style OR if Text is active to show wireframe)
      // If Text is active, we almost always want connections to visualize the mesh.
      if (config.style === 'network' || config.text) {
        ctx.lineWidth = 1 * scaleRatio;
        
        for (let i = 0; i < particles.length; i++) {
            if (particles[i].z > 1.8) continue; 

            for (let j = i + 1; j < particles.length; j++) {
            // Optimization for text: only connect if close, but also limit checks?
            // Since all particles cluster on text, we get MANY connections.
            // We might need to reduce connection distance for text mode to avoid a solid blob.
            
            let distLimit = effectiveConnectionDist;
            if (config.text) distLimit = effectiveConnectionDist * 0.6; // Slightly relaxed to allow some BG connections

            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            
            if (Math.abs(dx) > distLimit || Math.abs(dy) > distLimit) continue;

            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < distLimit) {
                const opacity = 1 - (distance / distLimit);
                ctx.beginPath();
                ctx.strokeStyle = `rgba(${config.theme.glow}, ${opacity * 0.25})`;
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
            }
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [config, config.seed]); 

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black/50 overflow-hidden shadow-2xl border border-white/10 rounded-lg">
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full object-contain"
        style={{ aspectRatio: `${config.resolution.width}/${config.resolution.height}` }}
      />
      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs text-white/50 border border-white/10 pointer-events-none z-20">
        {config.resolution.width}x{config.resolution.height} @ 60FPS
      </div>
    </div>
  );
});

export default CyberCanvas;