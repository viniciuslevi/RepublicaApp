import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import SubScreenHeader from "../components/SubScreenHeader";
import PrimaryButton from "../components/PrimaryButton";
import { colors } from "../theme/colors";
import { useAppData } from "../context/AppDataContext";

const BENEFITS = [
  { label: "Moradores no grupo", free: "Até 6", premium: "Ilimitado" },
  { label: "Resumo básico de saldos", free: true, premium: true },
  { label: "Relatórios avançados de gastos e tarefas", free: false, premium: true },
  { label: "Lembretes automáticos de tarefas recorrentes", free: false, premium: true },
];

function BenefitCell({ value }) {
  if (typeof value === "string") {
    return <Text style={styles.benefitCellText}>{value}</Text>;
  }
  return value ? (
    <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
  ) : (
    <Ionicons name="close-circle" size={18} color="#C9D3CD" />
  );
}

export default function PremiumUpgradeScreen() {
  const { activeResidence, isPremium, upgradeToPremium, downgradeToFree } = useAppData();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleUpgrade() {
    try {
      setIsSubmitting(true);
      await upgradeToPremium();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDowngrade() {
    try {
      setIsSubmitting(true);
      await downgradeToFree();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <SubScreenHeader
        kicker="RESIDÊNCIA"
        title="Plano Premium"
        subtitle={activeResidence?.name || "Comparativo de Benefícios"}
      />

      <ScrollView style={styles.body} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.statusCard, isPremium && styles.statusCardPremium]}>
          <Ionicons
            name={isPremium ? "star" : "star-outline"}
            size={22}
            color={isPremium ? colors.gold : colors.accentLight}
          />
          <View style={styles.statusTextWrap}>
            <Text style={styles.statusLabel}>Plano atual</Text>
            <Text style={styles.statusValue}>{isPremium ? "Premium" : "Gratuito"}</Text>
          </View>
        </View>

        <View style={styles.noticeBox}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
          <Text style={styles.noticeText}>
            Simulação para validar a proposta de monetização — não há cobrança real nem
            integração com gateway de pagamento.
          </Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, styles.benefitLabelCol]}>Benefício</Text>
            <Text style={styles.tableHeaderCell}>Gratuito</Text>
            <Text style={[styles.tableHeaderCell, styles.premiumHeaderCell]}>Premium</Text>
          </View>
          {BENEFITS.map((b) => (
            <View key={b.label} style={styles.tableRow}>
              <Text style={[styles.benefitLabel, styles.benefitLabelCol]}>{b.label}</Text>
              <View style={styles.benefitCell}>
                <BenefitCell value={b.free} />
              </View>
              <View style={styles.benefitCell}>
                <BenefitCell value={b.premium} />
              </View>
            </View>
          ))}
        </View>

        {isPremium ? (
          <>
            <View style={styles.premiumActiveBox}>
              <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
              <Text style={styles.premiumActiveText}>
                Esta república já está no plano Premium (simulado).
              </Text>
            </View>
            <Pressable onPress={handleDowngrade} disabled={isSubmitting} style={styles.downgradeLink}>
              <Text style={styles.downgradeLinkText}>Voltar para o plano gratuito</Text>
            </Pressable>
          </>
        ) : (
          <PrimaryButton
            title={!activeResidence ? "Selecione uma república para assinar" : isSubmitting ? "Assinando..." : "Assinar Premium"}
            onPress={handleUpgrade}
            disabled={isSubmitting || !activeResidence}
            style={{ marginTop: 8 }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  body: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 16, paddingBottom: 40 },

  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
  },
  statusCardPremium: { backgroundColor: colors.primaryDark },
  statusTextWrap: { marginLeft: 12 },
  statusLabel: { color: colors.accentLight, fontSize: 12, fontWeight: "600" },
  statusValue: { color: colors.white, fontSize: 20, fontWeight: "800", marginTop: 2 },

  noticeBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  noticeText: { color: colors.textMuted, fontSize: 12, flex: 1, lineHeight: 17 },

  table: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E6ECE9",
    overflow: "hidden",
    marginBottom: 20,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: "700",
    color: colors.textMuted,
    textAlign: "center",
    textTransform: "uppercase",
  },
  premiumHeaderCell: { color: colors.gold },
  benefitLabelCol: { flex: 2, textAlign: "left" },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEF2EF",
  },
  benefitLabel: { fontSize: 13, color: colors.textDark, fontWeight: "600" },
  benefitCell: { flex: 1, alignItems: "center" },
  benefitCellText: { fontSize: 12.5, color: colors.textDark, fontWeight: "700" },

  premiumActiveBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accentLight,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  premiumActiveText: { color: colors.primary, fontSize: 13, fontWeight: "700", flex: 1 },
  downgradeLink: { alignItems: "center", marginTop: 14, padding: 6 },
  downgradeLinkText: { color: colors.textMuted, fontSize: 12.5, fontWeight: "600" },
});
