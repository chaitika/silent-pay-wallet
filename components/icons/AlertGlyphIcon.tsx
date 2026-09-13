import React from 'react';
import Svg, { Circle, Rect } from 'react-native-svg';
import { IconProps } from './types';

const AlertGlyphIcon: React.FC<IconProps> = ({ color = '#754CE8', size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={10} y={2} width={4} height={14} rx={2} fill={color} />
    <Circle cx={12} cy={21} r={3} fill={color} />
  </Svg>
);

export default AlertGlyphIcon;
