import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";
import PrimaryButton from "../components/PrimaryButton";
import Avatar from "../components/Avatar";
import { colors } from "../theme/colors";
import { useAppData } from "../context/AppDataContext";
import { useAuth } from "../context/AuthContext";

export default function WelcomeScreen({ navigation }) {
  const { setGroupName, inviteCode } = useAppData();
  const { user, logout } = useAuth();
  const [mode, setMode] = useState("create"); // "create" | "join"
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function handleCreate() {
    if (!name.trim()) {
      setError("Informe um nome para a residência.");
      return;
    }
    setGroupName(name.trim());
    setError("");
    navigation.replace("Main");
  }

  function handleJoin() {
    if (!code.trim()) {
      setError("Informe o código de convite.");
      return;
    }
    if (code.trim().toUpperCase() !== inviteCode) {
      setError("Código inválido ou expirado. Confira e tente novamente.");
      return;
    }
    setGroupName("República da Ana, Bruno e Carla");
    setError("");
    navigation.replace("Main");
  }

  function handleBackToLogin() {
    logout();
    navigation.replace("Login");
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.hero}>
          <View style={styles.heroHeader}>
            <Pressable
              onPress={handleBackToLogin}
              style={styles.backButton}
              hitSlop={8}
            >
              <Ionicons name="arrow-back" size={20} color={colors.white} />
              <Text style={styles.backButtonText}>Login</Text>
            </Pressable>
            {user ? (
              <View style={styles.userBadge}>
                <Avatar name={user.name} size={22} />
                <Text style={styles.userBadgeText}>{user.name}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.brand}>RepublicApp</Text>
          <Text style={styles.tagline}>
            Tarefas, despesas e responsabilidades da sua casa em um só lugar.
          </Text>
        </View>


        <View style={styles.card}>
          <View style={styles.tabs}>
            <Pressable
              style={[styles.tab, mode === "create" && styles.tabActive]}
              onPress={() => {
                setMode("create");
                setError("");
              }}
            >
              <Text style={[styles.tabText, mode === "create" && styles.tabTextActive]}>
                Criar residência
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, mode === "join" && styles.tabActive]}
              onPress={() => {
                setMode("join");
                setError("");
              }}
            >
              <Text style={[styles.tabText, mode === "join" && styles.tabTextActive]}>
                Entrar com código
              </Text>
            </Pressable>
          </View>

          {mode === "create" ? (
            <View>
              <Text style={styles.label}>Nome da residência</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex.: República Beira-Rio"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <PrimaryButton title="Criar residência" onPress={handleCreate} style={styles.button} />
            </View>
          ) : (
            <View>
              <Text style={styles.label}>Código de convite</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex.: REP-4F2A"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                value={code}
                onChangeText={setCode}
              />
              <Text style={styles.hint}>Dica (protótipo): use o código {inviteCode}</Text>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <PrimaryButton title="Entrar" onPress={handleJoin} style={styles.button} />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  flex: { flex: 1 },
  hero: { paddingHorizontal: 28, paddingTop: 20, paddingBottom: 20 },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  backButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 4,
  },
  userBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
    gap: 6,
  },
  userBadgeText: {
    color: colors.accentLight,
    fontSize: 12.5,
    fontWeight: "700",
  },
  brand: { color: colors.white, fontSize: 34, fontWeight: "800" },
  tagline: { color: colors.accentLight, fontSize: 15, marginTop: 8, lineHeight: 21 },
  card: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  tabActive: { backgroundColor: colors.accent },
  tabText: { color: colors.textMuted, fontWeight: "600", fontSize: 13 },
  tabTextActive: { color: colors.white },
  label: { color: colors.textDark, fontWeight: "700", marginBottom: 8, fontSize: 14 },
  input: {
    borderWidth: 1,
    borderColor: colors.surface,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textDark,
  },
  hint: { color: colors.textMuted, fontSize: 12, marginTop: 8, fontStyle: "italic" },
  error: { color: colors.danger, marginTop: 10, fontSize: 13 },
  button: { marginTop: 20 },
});
