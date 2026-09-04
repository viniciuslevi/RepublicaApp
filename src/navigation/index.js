import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import SelectResidenceScreen from "../screens/SelectResidenceScreen";
import TasksScreen from "../screens/TasksScreen";
import ExpensesScreen from "../screens/ExpensesScreen";
import SummaryScreen from "../screens/SummaryScreen";
import MembersScreen from "../screens/MembersScreen";
import UpcomingOccurrencesScreen from "../screens/UpcomingOccurrencesScreen";
import ShoppingListScreen from "../screens/ShoppingListScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Tarefas: "checkbox-outline",
  Compras: "cart-outline",
  Despesas: "cash-outline",
  Saldos: "pie-chart-outline",
};

function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        // A altura/padding customizados fazem a lib ignorar seu próprio cálculo de
        // inset, então somamos insets.bottom manualmente para não ficar atrás da
        // barra de navegação do Android (gestual ou com os 3 botões).
        tabBarStyle: {
          paddingBottom: 6 + insets.bottom,
          paddingTop: 6,
          height: 60 + insets.bottom,
        },
        tabBarLabelStyle: { fontSize: 11.5, fontWeight: "600" },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Tarefas" component={TasksScreen} />
      <Tab.Screen name="Compras" component={ShoppingListScreen} />
      <Tab.Screen name="Despesas" component={ExpensesScreen} />
      <Tab.Screen name="Saldos" component={SummaryScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  // Enquanto verifica se há uma sessão salva (token no AsyncStorage), evita
  // piscar a tela de Login antes de redirecionar quem já está autenticado.
  if (isBootstrapping) {
    return (
      <View style={styles.bootstrapContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={isAuthenticated ? "SelectResidence" : "Login"}
        key={isAuthenticated ? "authenticated" : "guest"}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="SelectResidence" component={SelectResidenceScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Members" component={MembersScreen} />
        <Stack.Screen name="UpcomingOccurrences" component={UpcomingOccurrencesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  bootstrapContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
});


