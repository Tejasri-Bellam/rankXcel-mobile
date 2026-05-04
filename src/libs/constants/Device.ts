import { DeviceType, deviceType } from "expo-device";

export const isTablet = deviceType !== null && deviceType === DeviceType.TABLET;
export const isTv = deviceType !== null && deviceType === DeviceType.TV;
export const isWeb = deviceType !== null && deviceType === DeviceType.DESKTOP;
export const isMobile = deviceType !== null && deviceType === DeviceType.PHONE;
