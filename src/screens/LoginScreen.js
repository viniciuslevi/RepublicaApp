import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Image,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PrimaryButton from "../components/PrimaryButton";
import Avatar from "../components/Avatar";
import { colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../context/AppDataContext";
import { initialResidents } from "../data/mock";

export default function LoginScreen({ navigation }) {
  const { login, isLoading } = useAuth();
  const { setGroupName } = useAppData();

  const [email, setEmail] = useState("ana@republica.com");
  const [password, setPassword] = useState("123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setError("");
    const result = await login(email, password);

    if (!result.success) {
      setError(result.error || "Não foi possível realizar o login.");
      return;
    }

    // Se for morador mockado, define a república padrão e vai direto para a tela inicial
    const isDefaultResident = initialResidents.some(
      (r) => r.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (isDefaultResident) {
      setGroupName("República da Ana, Bruno e Carla");
      navigation.replace("Main");
    } else {
      // Novo usuário: direciona para o onboarding de criar ou entrar em residência
      navigation.replace("Welcome");
    }
  }

  function handleQuickFill(resident) {
    setEmail(resident.email);
    setPassword("123");
    setError("");
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
          {/* Top Hero with Logo */}
          <View style={styles.hero}>
            <View style={styles.logoContainer}>
              <Image
                source={require("../../assets/android-icon-foreground.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brand}>RepublicApp</Text>
            <Text style={styles.tagline}>
              Gestão inteligente e simples para sua moradia compartilhada.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>Acessar conta</Text>
              <Text style={styles.subtitle}>
                Entre com seu e-mail e senha para continuar
              </Text>
            </View>

            {/* Email Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>E-mail</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="seuemail@republica.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError("");
                  }}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Senha</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Informe sua senha"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (error) setError("");
                  }}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  hitSlop={8}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.textMuted}
                  />
                </Pressable>
              </View>
            </View>

            {/* Error Display */}
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Submit Button */}
            <PrimaryButton
              title="Entrar na conta"
              onPress={handleLogin}
              loading={isLoading}
              style={styles.loginButton}
            />

            {/* Quick Login Helper for Prototype */}
            <View style={styles.quickAccessSection}>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou teste rápido como morador</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.residentsRow}>
                {initialResidents.map((resident) => {
                  const isSelected = email.toLowerCase() === resident.email.toLowerCase();
                  return (
                    <Pressable
                      key={resident.id}
                      style={[
                        styles.residentChip,
                        isSelected && styles.residentChipSelected,
                      ]}
                      onPress={() => handleQuickFill(resident)}
                    >
                      <Avatar name={resident.name} size={24} />
                      <Text
                        style={[
                          styles.residentChipText,
                          isSelected && styles.residentChipTextSelected,
                        ]}
                      >
                        {resident.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Footer / Guest Entry */}
            <View style={styles.footer}>
              <Pressable
                onPress={() => navigation.navigate("Welcome")}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={styles.footerLink}>
                  Ainda não tem residência? <Text style={styles.footerLinkBold}>Criar ou entrar com código</Text>
                </Text>
              </Pressable>
            </View>
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
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 24,
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "rgba(223, 241, 230, 0.25)",
  },
  logoImage: {
    width: 72,
    height: 72,
  },
  brand: {
    color: colors.white,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  tagline: {
    color: colors.accentLight,
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
  card: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 6,
  },
  cardHeader: {
    marginBottom: 20,
  },
  title: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13.5,
    marginTop: 4,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    color: colors.textDark,
    fontWeight: "700",
    marginBottom: 8,
    fontSize: 13.5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.surface,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.textDark,
  },
  eyeButton: {
    padding: 6,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDE8E8",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    marginLeft: 6,
    flex: 1,
    fontWeight: "600",
  },
  loginButton: {
    marginTop: 6,
  },
  quickAccessSection: {
    marginTop: 22,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8E5",
  },
  dividerText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 10,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  residentsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  residentChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#D9E3DE",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  residentChipSelected: {
    backgroundColor: colors.accentLight,
    borderColor: colors.accent,
  },
  residentChipText: {
    marginLeft: 6,
    fontSize: 13,
    color: colors.textDark,
    fontWeight: "600",
  },
  residentChipTextSelected: {
    color: colors.primary,
    fontWeight: "700",
  },
  footer: {
    marginTop: 24,
    alignItems: "center",
  },
  footerLink: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
  },
  footerLinkBold: {
    color: colors.accent,
    fontWeight: "700",
  },
});
