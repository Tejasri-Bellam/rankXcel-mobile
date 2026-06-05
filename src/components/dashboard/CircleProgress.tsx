import React from "react";
import { View } from "react-native";

interface CircleProgressProps {
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
 * Lightweight circular (donut) progress indicator implemented without
 * react-native-svg. It draws a filled pie using two rotating half-disks and
 * punches a centre hole with `bgColor` to leave a ring.
 */
export default function CircleProgress({
  size = 130,
  strokeWidth = 12,
  progress = 0,
  color,
  trackColor,
  bgColor,
  children,
}: CircleProgressProps) {
  const radius = size / 2;
  const pct = Math.max(0, Math.min(100, progress));
  const deg = pct * 3.6;

  const firstRotate = pct > 50 ? 180 : deg;
  const secondRotate = pct > 50 ? deg - 180 : 0;

  const innerSize = size - strokeWidth * 2;

  // colored on the LEFT half — used in the right clip wrapper
  const halfDiskLeft = (rotate: number) => (
    <View
      style={{
        position: "absolute",
        left: -radius,
        top: 0,
        width: size,
        height: size,
        borderRadius: radius,
        transform: [{ rotateZ: `${rotate}deg` }],
      }}
    >
      <View
        style={{
          position: "absolute",
          left: 0,
          width: radius,
          height: size,
          backgroundColor: color,
          borderTopLeftRadius: radius,
          borderBottomLeftRadius: radius,
        }}
      />
    </View>
  );

  // colored on the RIGHT half — used in the left clip wrapper
  const halfDiskRight = (rotate: number) => (
    <View
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: size,
        height: size,
        borderRadius: radius,
        transform: [{ rotateZ: `${rotate}deg` }],
      }}
    >
      <View
        style={{
          position: "absolute",
          right: 0,
          width: radius,
          height: size,
          backgroundColor: color,
          borderTopRightRadius: radius,
          borderBottomRightRadius: radius,
        }}
      />
    </View>
  );

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: trackColor,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Right semicircle clip */}
      <View
        style={{
          position: "absolute",
          left: radius,
          top: 0,
          width: radius,
          height: size,
          overflow: "hidden",
        }}
      >
        {halfDiskLeft(firstRotate)}
      </View>

      {/* Left semicircle clip */}
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: radius,
          height: size,
          overflow: "hidden",
        }}
      >
        {halfDiskRight(secondRotate)}
      </View>

      {/* Centre hole */}
      <View
        style={{
          position: "absolute",
          width: innerSize,
          height: innerSize,
          borderRadius: innerSize / 2,
          backgroundColor: bgColor,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </View>
    </View>
  );
}
