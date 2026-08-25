import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import WelcomeScreen from "../screens/WelcomeScreen";
import TasksScreen from "../screens/TasksScreen";
import ExpensesScreen from "../screens/ExpensesScreen";
import SummaryScreen from "../screens/SummaryScreen";
import { colors } from "../theme/colors";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Tarefas: "checkbox-outline",
  Despesas: "cash-outline",
  Saldos: "pie-chart-outline",
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { paddingBottom: 6, paddingTop: 6, height: 60 },
        tabBarLabelStyle: { fontSize: 11.5, fontWeight: "600" },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Tarefas" component={TasksScreen} />
      <Tab.Screen name="Despesas" component={ExpensesScreen} />
      <Tab.Screen name="Saldos" component={SummaryScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
