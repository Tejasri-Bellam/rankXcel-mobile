import { ConfigContext, ExpoConfig } from "@expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const appName = process.env.APP_NAME || "RankXcel Dev";
  const packageName = process.env.APP_PACKAGE_NAME || "com.rankxcel.mobile.dev";
  const appVersion = process.env.EXPO_PUBLIC_APP_VERSION || "1.0.0";
  const appVersionCode = parseInt(process.env.APP_VERSION_CODE || "1");
  const appScheme = process.env.APP_SCHEME || "rankxcel-mobile-dev";
  const deepLinkDomain =
    process.env.EXPO_PUBLIC_DEEP_LINK_DOMAIN || "mockexams.wmlit.com";
  // Reversed iOS OAuth client id (e.g. com.googleusercontent.apps.<id>). The
  // google-signin config plugin registers it as a CFBundleURLScheme so iOS can
  // hand the OAuth callback back to the app.
  const googleIosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME?.trim();

  return {
    ...config,
    name: appName,
    slug: "rankXcel-mobile",
    version: appVersion,
    orientation: "portrait",
    icon: "./assets/images/image.png",
    scheme: appScheme,
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    ios: {
      supportsTablet: true,
      bundleIdentifier: packageName,
      buildNumber: String(appVersionCode),
      // Enables the "Sign in with Apple" capability on the iOS app. Required for
      // AppleAuthentication.signInAsync() — without it the native sheet errors.
      usesAppleSignIn: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        CFBundleDisplayName: appName,
        CFBundleName: appName,
      },
    },

    android: {
      package: packageName,
      versionCode: appVersionCode,
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/image.png",
        backgroundImage: "./assets/images/image.png",
        monochromeImage: "./assets/images/image.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: "https",
            host: deepLinkDomain,
            pathPrefix: "/",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
      permissions: ["INTERNET"],
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
          image: "./assets/images/image.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
      // Registers the iOS URL scheme Google Sign-In needs for its OAuth
      // callback. Only added when the reversed client id is configured.
      ...(googleIosUrlScheme
        ? [
            [
              "@react-native-google-signin/google-signin",
              { iosUrlScheme: googleIosUrlScheme },
            ] as [string, any],
          ]
        : []),
      // Adds the Sign in with Apple entitlement to the native iOS project.
      "expo-apple-authentication",
    ],

    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      deepLinkDomain,
      eas: {
        projectId: "7071fa32-b257-4efc-b8e1-ccfe3c45fd0c"
      }
    },
    owner: "wmlit"
  };
};
