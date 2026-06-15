import React from "react";
import { View } from "react-native";

interface Props {
  size?: number;
  strokeWidth?: number;
  /** 0 - 100 */
  progress?: number;
  color: string;
  trackColor: string;
  /** color used to punch the centre hole (should match the card background) */
  bgColor: string;
  children?: React.ReactNode;
}

/**
 * Lightweight 180° (semicircle) gauge — a half-donut that fills left → right
 * across the top. Built with plain Views (no react-native-svg), mirroring the
 * rotating half-disk technique in CircleProgress. The arc occupies the top half
 * only; the bottom half is clipped away.
 */
export default function HalfCircleProgress({
  size = 200,
  strokeWidth = 16,
  progress = 0,
  color,
  trackColor,
  bgColor,
  children,
}: Props) {
  const radius = size / 2;
  const pct = Math.max(0, Math.min(100, progress));
  // 0% → bottom half coloured (nothing visible on top); 100% → top half full.
  const deg = pct * 1.8;
  const innerSize = size - strokeWidth * 2;

  return (
    <View style={{ width: size, height: radius }}>
      {/* Top-half clip: only the upper semicircle of everything below shows. */}
      <View style={{ width: size, height: radius, overflow: "hidden" }}>
        {/* Track ring (full circle; bottom half clipped). */}
        <View
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: trackColor,
          }}
        />

        {/* Progress: a half-disk coloured on its bottom half, rotated clockwise
            about the gauge centre so the sweep grows from the left. */}
        <View
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: size,
            height: size,
            borderRadius: radius,
            transform: [{ rotateZ: `${deg}deg` }],
          }}
        >
          <View
            style={{
              position: "absolute",
              top: radius,
              left: 0,
              width: size,
              height: radius,
              backgroundColor: color,
              borderBottomLeftRadius: radius,
              borderBottomRightRadius: radius,
            }}
          />
        </View>

        {/* Centre hole punches the ring out, leaving a stroke-wide arc. */}
        <View
          style={{
            position: "absolute",
            left: strokeWidth,
            top: strokeWidth,
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            backgroundColor: bgColor,
          }}
        />
      </View>

      {/* Centred content (e.g. the percentage), sitting in the lower middle. */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          alignItems: "center",
          justifyContent: "flex-end",
          paddingBottom: radius * 0.08,
        }}
        pointerEvents="none"
      >
        {children}
      </View>
    </View>
  );
}
