import { ComponentType, CSSProperties, Ref } from 'react';

export interface ModelViewerProps {
  url: string;
  width?: number | string;
  height?: number | string;
  environment?: string;
  environmentIntensity?: number;
  exposure?: number;
  intro?: 'rise' | 'spin' | 'fade' | 'none';
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  autoRotateDelay?: number;
  dragRotate?: boolean;
  turntable?: boolean;
  zoom?: boolean;
  minZoom?: number;
  maxZoom?: number;
  hoverTilt?: number;
  float?: number;
  shadow?: boolean;
  shadowOpacity?: number;
  fit?: number;
  offsetX?: number;
  offsetY?: number;
  startAngle?: number;
  tilt?: number;
  resetOnDoubleClick?: boolean;
  onModelLoaded?: () => void;
  className?: string;
  style?: CSSProperties;
  ref?: Ref<{ capture: (type?: string) => string | null }>;
}

declare const ModelViewer: ComponentType<ModelViewerProps>;
export default ModelViewer;
