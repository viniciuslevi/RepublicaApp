import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigator from "./src/navigation";
import { AppDataProvider } from "./src/context/AppDataContext";

export default function App() {
  return (
    <SafeAreaProvider>
      <AppDataProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </AppDataProvider>
    </SafeAreaProvider>
  );
}
