import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import PrimaryButton from "../components/PrimaryButton";
import Avatar from "../components/Avatar";
import { colors } from "../theme/colors";
import { useAppData } from "../context/AppDataContext";
import { useAuth } from "../context/AuthContext";

export default function SelectResidenceScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { residences, selectResidence, createResidence, joinResidence } = useAppData();

  const [mode, setMode] = useState("list"); // "list" | "create" | "join"
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSelect(residence) {
    setIsSubmitting(true);
    try {
      await selectResidence(residence);
      navigation.replace("Main");
    } catch (err) {
      setError(err.message || "Não foi possível abrir esta moradia.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreate() {
    if (!newName.trim()) {
      setError("Informe um nome para a nova moradia.");
      return;
    }
    setIsSubmitting(true);
    try {
      await createResidence(newName, newAddress);
      setError("");
      setNewName("");
      setNewAddress("");
      navigation.replace("Main");
    } catch (err) {
      setError(err.message || "Não foi possível criar a moradia. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleJoin() {
    if (!code.trim()) {
      setError("Informe o código de convite.");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await joinResidence(code);
      if (!result.success) {
        setError(result.error || "Código inválido. Tente novamente.");
        return;
      }
      setError("");
      setCode("");
      navigation.replace("Main");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleLogout() {
    logout();
    navigation.replace("Login");
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Header */}
          <View style={styles.hero}>
            <View style={styles.heroTopRow}>
              <View style={styles.userInfo}>
                <Avatar name={user?.name || "Morador"} size={36} />
                <View style={styles.userTextWrap}>
                  <Text style={styles.greetingKicker}>CONECTADO COMO</Text>
                  <Text style={styles.userName}>{user?.name || "Morador"}</Text>
                </View>
              </View>
              <Pressable
                onPress={handleLogout}
                style={({ pressed }) => [
                  styles.logoutBtn,
                  pressed && { opacity: 0.75 },
                ]}
                hitSlop={8}
              >
                <Ionicons name="log-out-outline" size={18} color={colors.white} />
                <Text style={styles.logoutText}>Sair</Text>
              </Pressable>
            </View>

            <Text style={styles.brandTitle}>Moradias Compartilhadas</Text>
            <Text style={styles.tagline}>
              Selecione a república que deseja acessar ou crie/entre em um novo espaço.
            </Text>
          </View>

          {/* Main Card */}
          <View style={styles.card}>
            {/* Tabs for Navigation */}
            <View style={styles.tabs}>
              <Pressable
                style={[styles.tab, mode === "list" && styles.tabActive]}
                onPress={() => {
                  setMode("list");
                  setError("");
                }}
              >
                <Text style={[styles.tabText, mode === "list" && styles.tabTextActive]}>
                  Minhas Moradias ({residences.length})
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tab, mode === "create" && styles.tabActive]}
                onPress={() => {
                  setMode("create");
                  setError("");
                }}
              >
                <Text style={[styles.tabText, mode === "create" && styles.tabTextActive]}>
                  + Criar Nova
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
                  Entrar com Código
                </Text>
              </Pressable>
            </View>

            {/* Content for "list" mode */}
            {mode === "list" && (
              <View>
                <Text style={styles.sectionHeader}>Moradias Vinculadas</Text>
                <Text style={styles.sectionSub}>
                  Toque em uma moradia para abrir o painel de tarefas e despesas:
                </Text>

                {residences.map((rep) => (
                  <Pressable
                    key={rep.id}
                    style={({ pressed }) => [
                      styles.residenceCard,
                      pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
                    ]}
                    onPress={() => handleSelect(rep)}
                  >
                    <View style={styles.residenceHeader}>
                      <View style={styles.residenceIconWrap}>
                        <Ionicons name="home" size={22} color={colors.accent} />
                      </View>
                      <View style={styles.residenceInfo}>
                        <Text style={styles.residenceName}>{rep.name}</Text>
                        <Text style={styles.residenceAddress}>
                          {rep.address || "Endereço cadastrado"}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={22}
                        color={colors.accent}
                      />
                    </View>

                    <View style={styles.residenceMetaRow}>
                      <View style={styles.metaBadge}>
                        <Ionicons name="people-outline" size={14} color={colors.primary} />
                        <Text style={styles.metaBadgeText}>
                          {rep.membersCount || 3} moradores
                        </Text>
                      </View>
                      <View style={styles.metaBadge}>
                        <Ionicons name="key-outline" size={14} color={colors.primary} />
                        <Text style={styles.metaBadgeText}>Cód: {rep.code}</Text>
                      </View>
                    </View>

                    <View style={styles.cardEnterAction}>
                      <Text style={styles.cardEnterText}>Acessar painel da casa →</Text>
                    </View>
                  </Pressable>
                ))}

                {/* Quick Add Helper Button */}
                <View style={styles.quickAddBox}>
                  <Text style={styles.quickAddText}>
                    Quer gerenciar outra residência ou apartamento?
                  </Text>
                  <View style={styles.quickAddButtonsRow}>
                    <Pressable
                      style={styles.quickAddBtn}
                      onPress={() => {
                        setMode("create");
                        setError("");
                      }}
                    >
                      <Ionicons name="add-circle-outline" size={18} color={colors.accent} />
                      <Text style={styles.quickAddBtnText}>Criar nova moradia</Text>
                    </Pressable>
                    <Pressable
                      style={styles.quickAddBtn}
                      onPress={() => {
                        setMode("join");
                        setError("");
                      }}
                    >
                      <Ionicons name="enter-outline" size={18} color={colors.accent} />
                      <Text style={styles.quickAddBtnText}>Usar código de convite</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}

            {/* Content for "create" mode */}
            {mode === "create" && (
              <View>
                <Text style={styles.sectionHeader}>Criar Nova Moradia</Text>
                <Text style={styles.sectionSub}>
                  Cadastre sua república ou apartamento compartilhado para dividir tarefas e despesas.
                </Text>

                <Text style={styles.label}>Nome da moradia *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex.: República Solar ou Apê 402"
                  placeholderTextColor={colors.textMuted}
                  value={newName}
                  onChangeText={(t) => {
                    setNewName(t);
                    if (error) setError("");
                  }}
                />

                <Text style={styles.label}>Endereço ou Bairro (opcional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex.: Rua das Palmeiras, 45"
                  placeholderTextColor={colors.textMuted}
                  value={newAddress}
                  onChangeText={setNewAddress}
                />

                {error ? (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <PrimaryButton
                  title="Criar e Acessar Moradia"
                  onPress={handleCreate}
                  loading={isSubmitting}
                  style={styles.actionBtn}
                />

                <PrimaryButton
                  title="Voltar para Minhas Moradias"
                  variant="outline"
                  onPress={() => {
                    setMode("list");
                    setError("");
                  }}
                  style={{ marginTop: 10 }}
                />
              </View>
            )}

            {/* Content for "join" mode */}
            {mode === "join" && (
              <View>
                <Text style={styles.sectionHeader}>Entrar com Código de Convite</Text>
                <Text style={styles.sectionSub}>
                  Insira o código compartilhado pelos moradores da sua república.
                </Text>

                <Text style={styles.label}>Código de Convite *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex.: REP-4F2A"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="characters"
                  value={code}
                  onChangeText={(t) => {
                    setCode(t);
                    if (error) setError("");
                  }}
                />

                {error ? (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <PrimaryButton
                  title="Entrar na Moradia"
                  onPress={handleJoin}
                  loading={isSubmitting}
                  style={styles.actionBtn}
                />

                <PrimaryButton
                  title="Voltar para Minhas Moradias"
                  variant="outline"
                  onPress={() => {
                    setMode("list");
                    setError("");
                  }}
                  style={{ marginTop: 10 }}
                />
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userTextWrap: {
    marginLeft: 10,
  },
  greetingKicker: {
    color: colors.accentLight,
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  userName: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "800",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 4,
  },
  logoutText: {
    color: colors.white,
    fontSize: 12.5,
    fontWeight: "600",
  },
  brandTitle: {
    color: colors.white,
    fontSize: 26,
    fontWeight: "800",
  },
  tagline: {
    color: colors.accentLight,
    fontSize: 13.5,
    marginTop: 6,
    lineHeight: 19,
  },
  card: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 6,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  tabText: {
    color: colors.textMuted,
    fontWeight: "600",
    fontSize: 12,
  },
  tabTextActive: {
    color: colors.white,
    fontWeight: "700",
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.primary,
  },
  sectionSub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  residenceCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: "#E3ECE7",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  residenceHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  residenceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },
  residenceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  residenceName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textDark,
  },
  residenceAddress: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  residenceMetaRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 5,
  },
  metaBadgeText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
  },
  cardEnterAction: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F0F4F2",
  },
  cardEnterText: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 13,
  },
  quickAddBox: {
    marginTop: 10,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 14,
    alignItems: "center",
  },
  quickAddText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
  },
  quickAddButtonsRow: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
  },
  quickAddBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#D5E2DC",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 6,
  },
  quickAddBtnText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  label: {
    color: colors.textDark,
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 10,
    fontSize: 13.5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.surface,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.textDark,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDE8E8",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 12,
    gap: 6,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  actionBtn: {
    marginTop: 18,
  },
});
