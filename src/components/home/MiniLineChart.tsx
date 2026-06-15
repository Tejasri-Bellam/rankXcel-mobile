import React, { useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";

interface Props {
  /** Y-values in chronological order (oldest → newest). */
  data: number[];
  color: string;
  /** Translucent tint drawn beneath the line as a pseudo "area". */
  fillColor?: string;
  height?: number;
  lineWidth?: number;
  /** Pad the value range so the line never hugs the very top/bottom edge. */
  padRatio?: number;
}

/**
 * Lightweight line chart drawn with plain Views (no react-native-svg, matching
 * the rest of the app — see CircleProgress). Each segment between two points is
 * a thin rotated View; points are small dots. Width is measured via onLayout.
 */
export default function MiniLineChart({
  data,
  color,
  fillColor,
  height = 120,
  lineWidth = 3,
  padRatio = 0.15,
}: Props) {
  const [width, setWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w && w !== width) setWidth(w);
  };

  const points = (() => {
    if (width <= 0 || data.length === 0) return [] as { x: number; y: number }[];
    const min = Math.min(...data);
    const max = Math.max(...data);
    const pad = (max - min || 1) * padRatio;
    const lo = min - pad;
    const hi = max + pad;
    const span = hi - lo || 1;
    const dotR = lineWidth + 1;
    const usableH = height - dotR * 2;
    const stepX = data.length > 1 ? width / (data.length - 1) : 0;
    return data.map((v, i) => {
      const x = data.length > 1 ? i * stepX : width / 2;
      const norm = (v - lo) / span; // 0 (bottom) … 1 (top)
      const y = dotR + (1 - norm) * usableH;
      return { x, y };
    });
  })();

  const dotR = lineWidth + 2;

  return (
    <View style={{ height }} onLayout={onLayout}>
      {/* Baseline tint to suggest an area chart. */}
      {fillColor && points.length > 0 ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: fillColor, borderRadius: 12, opacity: 0.5 },
          ]}
        />
      ) : null}

      {/* Connecting segments. */}
      {points.map((p, i) => {
        if (i === points.length - 1) return null;
        const n = points[i + 1];
        const dx = n.x - p.x;
        const dy = n.y - p.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx); // radians
        const cx = (p.x + n.x) / 2;
        const cy = (p.y + n.y) / 2;
        return (
          <View
            key={`seg-${i}`}
            style={{
              position: "absolute",
              left: cx - len / 2,
              top: cy - lineWidth / 2,
              width: len,
              height: lineWidth,
              backgroundColor: color,
              borderRadius: lineWidth,
              transform: [{ rotate: `${angle}rad` }],
            }}
          />
        );
      })}

      {/* Points. */}
      {points.map((p, i) => (
        <View
          key={`dot-${i}`}
          style={{
            position: "absolute",
            left: p.x - dotR,
            top: p.y - dotR,
            width: dotR * 2,
            height: dotR * 2,
            borderRadius: dotR,
            backgroundColor: color,
          }}
        />
      ))}
    </View>
  );
}
