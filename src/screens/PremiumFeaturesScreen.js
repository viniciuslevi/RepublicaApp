import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import SubScreenHeader from "../components/SubScreenHeader";
import PrimaryButton from "../components/PrimaryButton";
import { colors } from "../theme/colors";
import { useAppData } from "../context/AppDataContext";

const FEATURES = [
  {
    icon: "stats-chart",
    title: "Relatórios avançados",
    description: "Totais de gastos e tarefas concluídas por morador em um período.",
    route: "Reports",
  },
  {
    icon: "notifications",
    title: "Automação de lembretes",
    description: "Avisos automáticos próximo ao vencimento de tarefas recorrentes.",
  },
  {
    icon: "people",
    title: "Suporte a grupos maiores",
    description: "Remove o limite de moradores por república do plano gratuito.",
  },
];

export default function PremiumFeaturesScreen() {
  const navigation = useNavigation();
  const { isPremium } = useAppData();

  function handleFeaturePress(feature) {
    if (feature.route) {
      navigation.navigate(feature.route);
    } else if (!isPremium) {
      navigation.navigate("PremiumUpgrade");
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <SubScreenHeader
        kicker="RESIDÊNCIA"
        title="Recursos Premium"
        subtitle={isPremium ? "Todos os recursos desbloqueados" : "Disponíveis no plano Premium"}
      />

      <ScrollView style={styles.body} contentContainerStyle={styles.scrollContent}>
        {FEATURES.map((f) => (
          <Pressable
            key={f.title}
            style={({ pressed }) => [
              styles.featureCard,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => handleFeaturePress(f)}
          >
            <View
              style={[
                styles.featureIconWrap,
                { backgroundColor: isPremium ? colors.accentLight : colors.surface },
              ]}
            >
              <Ionicons
                name={f.icon}
                size={20}
                color={isPremium ? colors.accent : colors.textMuted}
              />
            </View>
            <View style={styles.featureBody}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDescription}>{f.description}</Text>
              {f.route && isPremium ? (
                <Text style={styles.featureLinkText}>Toque para abrir relatório →</Text>
              ) : null}
            </View>
            <Ionicons
              name={isPremium ? (f.route ? "chevron-forward" : "checkmark-circle") : "lock-closed"}
              size={18}
              color={isPremium ? colors.accent : colors.textMuted}
            />
          </Pressable>
        ))}

        {isPremium ? (
          <>
            <View style={styles.unlockedBox}>
              <Ionicons name="star" size={18} color={colors.gold} />
              <Text style={styles.unlockedText}>
                Esta república é Premium (simulado) — você tem acesso aos relatórios completos
                por período e todos os recursos avançados.
              </Text>
            </View>

            <PrimaryButton
              title="Acessar Relatório de Gastos e Tarefas"
              onPress={() => navigation.navigate("Reports")}
              style={{ marginTop: 12 }}
            />
          </>
        ) : (
          <>
            <View style={styles.lockedBox}>
              <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} />
              <Text style={styles.lockedText}>
                Estes recursos ficam disponíveis apenas para grupos no plano Premium.
              </Text>
            </View>
            <PrimaryButton
              title="Fazer upgrade"
              onPress={() => navigation.navigate("PremiumUpgrade")}
              style={{ marginTop: 8 }}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  body: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 16, paddingBottom: 40 },

  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "#E6ECE9",
  },
  featureIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  featureBody: { flex: 1, marginRight: 8 },
  featureTitle: { fontSize: 14.5, fontWeight: "700", color: colors.textDark },
  featureDescription: { fontSize: 12, color: colors.textMuted, marginTop: 2, lineHeight: 16 },
  featureLinkText: { fontSize: 12, color: colors.accent, fontWeight: "700", marginTop: 6 },

  lockedBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
    marginBottom: 16,
    gap: 8,
  },
  lockedText: { color: colors.textMuted, fontSize: 12.5, flex: 1, lineHeight: 17 },

  unlockedBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accentLight,
    borderRadius: 12,
    padding: 14,
    marginTop: 6,
    gap: 8,
  },
  unlockedText: { color: colors.primary, fontSize: 12.5, flex: 1, lineHeight: 17, fontWeight: "600" },
});
