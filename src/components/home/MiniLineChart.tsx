import React, { useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";

interface SeriesConfig {
  data: number[];
  color: string;
  shape?: "circle" | "diamond";
}

interface Props {
  /** Legacy single-series mode — still works exactly as before. */
  data?: number[];
  color?: string;
  /** New: pass multiple series to draw them on one shared scale. */
  series?: SeriesConfig[];
  fillColor?: string;
  height?: number;
  lineWidth?: number;
  padRatio?: number;
}

export default function MiniLineChart({
  data,
  color,
  series,
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

  const allSeries: SeriesConfig[] =
    series && series.length > 0
      ? series
      : data
        ? [{ data, color: color ?? "#6C63FF", shape: "circle" }]
        : [];

  const dotR = lineWidth + 2;

  const pointsFor = (() => {
    if (width <= 0 || allSeries.length === 0) return [] as { x: number; y: number }[][];
    const combined = allSeries.flatMap((s) => s.data);
    if (combined.length === 0) return [];
    const min = Math.min(...combined);
    const max = Math.max(...combined);
    const pad = (max - min || 1) * padRatio;
    const lo = min - pad;
    const hi = max + pad;
    const span = hi - lo || 1;
    const usableH = height - dotR * 2;

    return allSeries.map((s) => {
      const stepX = s.data.length > 1 ? width / (s.data.length - 1) : 0;
      return s.data.map((v, i) => {
        const x = s.data.length > 1 ? i * stepX : width / 2;
        const norm = (v - lo) / span;
        const y = dotR + (1 - norm) * usableH;
        return { x, y };
      });
    });
  })();

  return (
    <View style={{ height }} onLayout={onLayout}>
      {fillColor && pointsFor.length > 0 ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: fillColor, borderRadius: 12, opacity: 0.5 },
          ]}
        />
      ) : null}

      {allSeries.map((s, si) => {
        const points = pointsFor[si] ?? [];
        const shape = s.shape ?? "circle";
        return (
          <React.Fragment key={`series-${si}`}>
            {points.map((p, i) => {
              if (i === points.length - 1) return null;
              const n = points[i + 1];
              const dx = n.x - p.x;
              const dy = n.y - p.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx);
              const cx = (p.x + n.x) / 2;
              const cy = (p.y + n.y) / 2;
              return (
                <View
                  key={`seg-${si}-${i}`}
                  style={{
                    position: "absolute",
                    left: cx - len / 2,
                    top: cy - lineWidth / 2,
                    width: len,
                    height: lineWidth,
                    backgroundColor: s.color,
                    borderRadius: lineWidth,
                    transform: [{ rotate: `${angle}rad` }],
                  }}
                />
              );
            })}

            {points.map((p, i) =>
              shape === "diamond" ? (
                <View
                  key={`dot-${si}-${i}`}
                  style={{
                    position: "absolute",
                    left: p.x - dotR,
                    top: p.y - dotR,
                    width: dotR * 2,
                    height: dotR * 2,
                    backgroundColor: s.color,
                    transform: [{ rotate: "45deg" }],
                  }}
                />
              ) : (
                <View
                  key={`dot-${si}-${i}`}
                  style={{
                    position: "absolute",
                    left: p.x - dotR,
                    top: p.y - dotR,
                    width: dotR * 2,
                    height: dotR * 2,
                    borderRadius: dotR,
                    backgroundColor: s.color,
                  }}
                />
              )
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}