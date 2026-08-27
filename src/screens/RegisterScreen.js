import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import PrimaryButton from "../components/PrimaryButton";
import { colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";

/**
 * Aplica máscara de telefone brasileiro: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 */
function formatPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length > 0 ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export default function RegisterScreen({ navigation }) {
  const { register, isLoading } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister() {
    setError("");

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanName) {
      setError("Informe o seu nome completo.");
      return;
    }

    if (cleanName.length < 2) {
      setError("O nome deve conter pelo menos 2 caracteres.");
      return;
    }

    if (!cleanEmail) {
      setError("Informe o seu e-mail.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError("Informe um formato de e-mail válido.");
      return;
    }

    if (!cleanPassword) {
      setError("Informe uma senha para a sua conta.");
      return;
    }

    if (cleanPassword.length < 3) {
      setError("A senha deve ter pelo menos 3 caracteres.");
      return;
    }

    if (cleanPassword !== cleanConfirm) {
      setError("As senhas não coincidem. Verifique e tente novamente.");
      return;
    }

    const result = await register(cleanName, cleanEmail, cleanPassword, phone);

    if (!result.success) {
      setError(result.error || "Não foi possível concluir o cadastro.");
      return;
    }

    // Após o cadastro bem-sucedido, o usuário já está autenticado no contexto
    // e é direcionado imediatamente para a seleção/criação de moradia.
    navigation.replace("SelectResidence");
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
          {/* Top Hero */}
          <View style={styles.hero}>
            <View style={styles.heroTopRow}>
              <Pressable
                onPress={() => navigation.goBack()}
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && { opacity: 0.75 },
                ]}
                hitSlop={8}
              >
                <Ionicons name="arrow-back" size={20} color={colors.white} />
                <Text style={styles.backButtonText}>Voltar</Text>
              </Pressable>

              <View style={styles.heroBadge}>
                <Ionicons name="person-add-outline" size={14} color={colors.accentLight} />
                <Text style={styles.heroBadgeText}>NOVO MORADOR</Text>
              </View>
            </View>

            <View style={styles.heroBrandRow}>
              <View style={styles.smallLogoContainer}>
                <Image
                  source={require("../../assets/logo-login.png")}
                  style={styles.logoImage}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.heroBrandTextWrap}>
                <Text style={styles.brandTitle}>RepublicApp</Text>
                <Text style={styles.brandSubtitle}>Crie sua conta em poucos passos</Text>
              </View>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>Criar nova conta</Text>
              <Text style={styles.subtitle}>
                Preencha os dados abaixo para organizar tarefas e despesas da sua república
              </Text>
            </View>

            {/* Name Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nome completo *</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Ex.: Mariana Silva"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="words"
                  autoCorrect={false}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (error) setError("");
                  }}
                />
              </View>
            </View>

            {/* Email Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>E-mail *</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="seuemail@exemplo.com"
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

            {/* Phone / WhatsApp Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>WhatsApp / Telefone (opcional)</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="logo-whatsapp"
                  size={20}
                  color={colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="(11) 99999-9999"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(formatPhone(text));
                    if (error) setError("");
                  }}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Senha *</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Mínimo de 3 caracteres"
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

            {/* Confirm Password Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Confirmar senha *</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color={colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Repita a mesma senha"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (error) setError("");
                  }}
                />
                <Pressable
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                  hitSlop={8}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.textMuted}
                  />
                </Pressable>
              </View>
            </View>

            {/* Info Hint Box */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
              <Text style={styles.infoText}>
                Após o cadastro, você entrará automaticamente no app para criar ou acessar a sua república.
              </Text>
            </View>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Submit Button */}
            <PrimaryButton
              title="Cadastrar e entrar"
              onPress={handleRegister}
              loading={isLoading}
              style={styles.submitButton}
            />

            {/* Login Link */}
            <View style={styles.loginSection}>
              <Pressable
                onPress={() => navigation.navigate("Login")}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={styles.loginText}>
                  Já possui uma conta?{" "}
                  <Text style={styles.loginTextAccent}>Fazer login!</Text>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 22,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 4,
  },
  backButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    gap: 6,
  },
  heroBadgeText: {
    color: colors.accentLight,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  heroBrandRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  smallLogoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(63, 155, 110, 0.45)",
    overflow: "hidden",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  heroBrandTextWrap: {
    marginLeft: 14,
    flex: 1,
  },
  brandTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    color: colors.accentLight,
    fontSize: 13,
    marginTop: 2,
  },
  card: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 36,
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
    lineHeight: 19,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    color: colors.textDark,
    fontWeight: "700",
    marginBottom: 7,
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
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textDark,
  },
  eyeButton: {
    padding: 6,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accentLight,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 14,
    gap: 8,
  },
  infoText: {
    fontSize: 12.5,
    color: colors.primaryDark,
    flex: 1,
    lineHeight: 17,
    fontWeight: "500",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDE8E8",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    marginLeft: 6,
    flex: 1,
    fontWeight: "600",
  },
  submitButton: {
    marginTop: 4,
  },
  loginSection: {
    marginTop: 20,
    alignItems: "center",
  },
  loginText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: "center",
  },
  loginTextAccent: {
    color: colors.accent,
    fontWeight: "700",
  },
});
