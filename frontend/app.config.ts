import fs from "node:fs";
import path from "node:path";

import type { ExpoConfig } from "expo/config";

const localGoogleServicesPath = path.join(__dirname, "google-services.json");
const envGoogleServicesPath = process.env.GOOGLE_SERVICES_JSON;
const googleServicesPath =
  envGoogleServicesPath && fs.existsSync(envGoogleServicesPath)
    ? envGoogleServicesPath
    : fs.existsSync(localGoogleServicesPath)
      ? "./google-services.json"
      : undefined;

const config: ExpoConfig = {
  name: "frontend",
  slug: "frontend",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "frontend",
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
    package: "com.emm3000.fortressfinance",
    ...(googleServicesPath
      ? { googleServicesFile: googleServicesPath }
      : {}),
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
    "expo-sqlite",
    "expo-secure-store",
    "expo-notifications",
    "expo-web-browser",
    "expo-font",
    "@sentry/react-native",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: "c0f025de-5a47-40dd-8cd6-76edb7572479",
    },
  },
};

export default config;
