export interface Resolution {
  label: string;
  width: number;
  height: number;
}

export interface ColorTheme {
  name: string;
  primary: string;   // Hex for UI
  glow: string;      // RGB for Canvas (e.g., "0, 255, 255")
  accent: string;    // Tailwind color class for borders
}

export type VisualStyle = 'network' | 'bokeh' | 'matrix' | 'vortex' | 'nova';

export interface VisualizerConfig {
  resolution: Resolution;
  theme: ColorTheme;
  style: VisualStyle;
  particleCount: number;
  speed: number;
  connectionDistance: number;
  seed: number; // For randomization
  text: string; // Text overlay
}