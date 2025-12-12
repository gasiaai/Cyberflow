import { Resolution, ColorTheme, VisualStyle } from './types';

export const RESOLUTIONS: Resolution[] = [
  { label: 'Full HD (1920x1080)', width: 1920, height: 1080 },
  { label: '2K Quad HD (2560x1440)', width: 2560, height: 1440 },
  { label: '4K Ultra HD (3840x2160)', width: 3840, height: 2160 },
  { label: 'Social Square (1080x1080)', width: 1080, height: 1080 },
  { label: 'Portrait (1080x1920)', width: 1080, height: 1920 },
];

export const THEMES: ColorTheme[] = [
  { 
    name: 'Cyber Cyan', 
    primary: '#06b6d4', 
    glow: '6, 182, 212', 
    accent: 'cyan-500' 
  },
  { 
    name: 'Neon Purple', 
    primary: '#a855f7', 
    glow: '168, 85, 247', 
    accent: 'purple-500' 
  },
  { 
    name: 'Matrix Green', 
    primary: '#10b981', 
    glow: '16, 185, 129', 
    accent: 'emerald-500' 
  },
  { 
    name: 'Plasma Orange', 
    primary: '#f97316', 
    glow: '249, 115, 22', 
    accent: 'orange-500' 
  },
  { 
    name: 'Ghost White', 
    primary: '#f8fafc', 
    glow: '248, 250, 252', 
    accent: 'slate-200' 
  },
  { 
    name: 'Crimson Red', 
    primary: '#ef4444', 
    glow: '239, 68, 68', 
    accent: 'red-500' 
  },
  { 
    name: 'Gold Dust', 
    primary: '#eab308', 
    glow: '234, 179, 8', 
    accent: 'yellow-500' 
  },
];

export const VISUAL_STYLES: { id: VisualStyle; label: string; description: string }[] = [
  { id: 'network', label: 'Cyber Network', description: 'Connected nodes flowing smoothly.' },
  { id: 'bokeh', label: 'Dreamy Bokeh', description: 'Large, soft floating particles.' },
  { id: 'matrix', label: 'Digital Rain', description: 'Vertical cascading data streams.' },
  { id: 'vortex', label: 'Quantum Vortex', description: 'Swirling orbital motion.' },
  { id: 'nova', label: 'Supernova', description: 'Explosive outward expansion.' },
];
