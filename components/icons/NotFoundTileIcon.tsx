import React from 'react';
import Svg, { Rect } from 'react-native-svg';

interface NotFoundTileIconProps {
  size?: number;
  /** Outer rounded-square card. */
  haloBackground?: string;
  /** Inner card fill - cut out to the screen behind it, not a solid tile. */
  cardBackground?: string;
  /** Dashed border + centered dash glyph. */
  accentColor?: string;
}

const NotFoundTileIcon: React.FC<NotFoundTileIconProps> = ({
  size = 80,
  haloBackground = '#FDF4E6',
  cardBackground = '#FFFFFF',
  accentColor = '#E8912A',
}) => (
  <Svg width={size} height={size} viewBox="0 0 80 80" fill="none">
    <Rect width={80} height={80} rx={22} fill={haloBackground} />
    <Rect x={15} y={15} width={50} height={50} rx={13} fill={cardBackground} stroke={accentColor} strokeWidth={2} strokeDasharray="6 5" />
    <Rect x={30} y={38.75} width={20} height={2.5} rx={1.25} fill={accentColor} />
  </Svg>
);

export default NotFoundTileIcon;
