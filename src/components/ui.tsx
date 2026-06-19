import {
  useState,
  type CSSProperties,
  type ElementType,
  type ComponentPropsWithoutRef,
} from 'react';

interface DotProps {
  color: string;
  size?: number;
  /** rounded square (radius in px) instead of a circle */
  square?: number;
  style?: CSSProperties;
}

/** Small colored indicator used across the app. */
export function Dot({ color, size = 8, square, style }: DotProps) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: square != null ? square : '50%',
        background: color,
        flex: 'none',
        display: 'inline-block',
        ...style,
      }}
    />
  );
}

interface AvatarProps {
  name: string;
  size?: number;
}

/** Initial-in-a-circle avatar used for members/assignees. */
export function Avatar({ name, size = 22 }: AvatarProps) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg,#7C5CFF,#E5594D)',
        color: '#fff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: size * 0.42,
        flex: 'none',
      }}
      title={name}
    >
      {(name.trim()[0] || '?').toUpperCase()}
    </span>
  );
}

type HoverProps<T extends ElementType> = {
  as?: T;
  baseStyle: CSSProperties;
  hoverStyle?: CSSProperties;
} & Omit<ComponentPropsWithoutRef<T>, 'style'>;

/**
 * Renders an element that merges `hoverStyle` over `baseStyle` while hovered —
 * the inline-style equivalent of the design's `style-hover` attribute.
 */
export function Hover<T extends ElementType = 'div'>({
  as,
  baseStyle,
  hoverStyle,
  ...rest
}: HoverProps<T>) {
  const Tag = (as || 'div') as ElementType;
  const [hovered, setHovered] = useState(false);
  return (
    <Tag
      {...rest}
      style={hovered && hoverStyle ? { ...baseStyle, ...hoverStyle } : baseStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    />
  );
}
