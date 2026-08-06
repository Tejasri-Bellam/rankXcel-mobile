import React, { useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";

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
  /** Print each point's value above its dot (single-series charts only). */
  showValues?: boolean;
  /** How a value is rendered when showValues is on — e.g. `${v}%`. */
  formatValue?: (value: number, index: number) => string;
  /** One x-axis caption per point; thinned automatically when they'd collide. */
  labels?: (string | null | undefined)[];
  /**
   * Card colour painted behind value captions so a line passing behind one
   * can't muddle it. Defaults to white, and to transparent on a filled chart
   * where a solid chip wouldn't match the tint underneath.
   */
  valueBackground?: string;
}

const VALUE_SPACE = 16; // headroom above the plot for the value captions
const LABEL_SPACE = 18; // strip below the plot for the x-axis captions
const CAPTION_W = 52; // widest a caption may get; narrowed to the point spacing
const MIN_CAPTION_W = 26; // never squeeze past what a short value needs

export default function MiniLineChart({
  data,
  color,
  series,
  fillColor,
  height = 120,
  lineWidth = 3,
  padRatio = 0.15,
  showValues = false,
  formatValue = (v) => String(v),
  labels,
  valueBackground,
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
  const captionBg = valueBackground ?? (fillColor ? "transparent" : "#FFFFFF");
  const hasLabels = Array.isArray(labels) && labels.some(Boolean);
  const valueSpace = showValues ? VALUE_SPACE : 0;
  const labelSpace = hasLabels ? LABEL_SPACE : 0;
  // Captions overhang the outermost dots, so inset the plot to keep them on-card.
  const padX = showValues || hasLabels ? 18 : 0;

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
    const plotW = Math.max(1, width - padX * 2);
    // Captions can sit either side of a dot, so keep headroom above *and* below.
    const usableH = height - dotR * 2 - valueSpace * 2;

    return allSeries.map((s) => {
      const stepX = s.data.length > 1 ? plotW / (s.data.length - 1) : 0;
      return s.data.map((v, i) => {
        const x = padX + (s.data.length > 1 ? i * stepX : plotW / 2);
        const norm = (v - lo) / span;
        const y = dotR + valueSpace + (1 - norm) * usableH;
        return { x, y };
      });
    });
  })();

  // Captions are centred on their dot, so a fixed width makes neighbouring ones
  // overlap once the points sit closer together than that. Cap it at the gap.
  const captionW = (() => {
    const longest = Math.max(...allSeries.map((s) => s.data.length), 0);
    if (width <= 0 || longest < 2) return CAPTION_W;
    const stepX = Math.max(1, width - padX * 2) / (longest - 1);
    return Math.max(MIN_CAPTION_W, Math.min(CAPTION_W, stepX - 2));
  })();

  // A caption goes above its dot by default, but drops below on a valley — the
  // space above a valley is exactly where the two rising lines run.
  const captionBelow = (points: { x: number; y: number }[], i: number) => {
    const self = points[i];
    let higher = 0;
    let lower = 0;
    for (const n of [points[i - 1], points[i + 1]]) {
      if (!n) continue;
      if (n.y < self.y - 1) higher += 1;
      else if (n.y > self.y + 1) lower += 1;
    }
    return higher > 0 && lower === 0;
  };

  // Only as many captions as fit are drawn — picked backwards from the latest
  // point so the most recent session is always labelled and spacing stays even.
  const labelIdx = (() => {
    const shown = new Set<number>();
    const n = labels?.length ?? 0;
    if (!n || width <= 0) return shown;
    const maxLabels = Math.max(2, Math.floor((width - padX * 2) / 56));
    const step = Math.max(1, Math.ceil(n / maxLabels));
    for (let i = n - 1; i >= 0; i -= step) shown.add(i);
    return shown;
  })();

  return (
    <View style={{ height: height + labelSpace }} onLayout={onLayout}>
      {fillColor && pointsFor.length > 0 ? (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height,
            backgroundColor: fillColor,
            borderRadius: 12,
            opacity: 0.5,
          }}
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

            {showValues
              ? points.map((p, i) => {
                  const below =
                    captionBelow(points, i) || p.y - dotR - VALUE_SPACE < 0;
                  return (
                    <View
                      key={`val-${si}-${i}`}
                      pointerEvents="none"
                      style={{
                        position: "absolute",
                        left: p.x - captionW / 2,
                        top: below
                          ? p.y + dotR + 2
                          : p.y - dotR - VALUE_SPACE,
                        width: captionW,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={[
                          styles.caption,
                          { color: s.color, backgroundColor: captionBg },
                        ]}
                        numberOfLines={1}
                      >
                        {formatValue(s.data[i], i)}
                      </Text>
                    </View>
                  );
                })
              : null}
          </React.Fragment>
        );
      })}

      {hasLabels
        ? (pointsFor[0] ?? []).map((p, i) => {
            const text = labels?.[i];
            if (!text || !labelIdx.has(i)) return null;
            return (
              <View
                key={`lbl-${i}`}
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: p.x - CAPTION_W / 2,
                  top: height + 2,
                  width: CAPTION_W,
                }}
              >
                <Text style={styles.axisLabel} numberOfLines={1}>
                  {text}
                </Text>
              </View>
            );
          })
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  caption: {
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
    // The chip hugs the text so a line passing behind never runs through digits.
    paddingHorizontal: 3,
    borderRadius: 4,
    overflow: "hidden",
  },
  axisLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: "#8A90A6",
    textAlign: "center",
  },
});