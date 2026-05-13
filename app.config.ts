import { ConfigContext, ExpoConfig } from "@expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const appName = process.env.APP_NAME || "rankXcel-mobile";
  const packageName =
    process.env.APP_PACKAGE_NAME || "com.rankxcelmobile.dev";
  const appVersion = process.env.EXPO_PUBLIC_APP_VERSION || "1.0.0";
  const appVersionCode = parseInt(process.env.APP_VERSION_CODE || "1");
  const appScheme = process.env.APP_SCHEME || "rankxcelmobile-dev";
  const deepLinkDomain =
    process.env.EXPO_PUBLIC_DEEP_LINK_DOMAIN || "eventsui.wmlit.com";

  return {
    name: appName,
    slug: "rankXcel-mobile",
    version: appVersion,
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: appScheme,
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    ios: {
      supportsTablet: true,
    },

    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.tejasribellam.rankXcelmobile",
      versionCode: appVersionCode,
    },

    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },

    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
    ],

    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },

    extra: {
      deepLinkDomain,
    },
  };
};
 