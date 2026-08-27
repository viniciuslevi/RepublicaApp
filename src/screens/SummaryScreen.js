import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";
import ScreenHeader from "../components/ScreenHeader";
import Avatar from "../components/Avatar";
import { colors } from "../theme/colors";
import { useAppData } from "../context/AppDataContext";

function formatCurrency(value) {
  const sign = value < 0 ? "-" : "";
  return `${sign}R$ ${Math.abs(value).toFixed(2).replace(".", ",")}`;
}

export default function SummaryScreen() {
  const { balances, totalExpenses } = useAppData();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScreenHeader kicker="EPIC · DESPESAS" title="Resumo de saldos" />

      <View style={styles.body}>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total gasto pelo grupo</Text>
          <Text style={styles.totalValue}>{formatCurrency(totalExpenses)}</Text>
        </View>

        <View style={styles.noticeBox}>
          <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
          <Text style={styles.noticeText}>
            Resumo meramente informativo — não há integração bancária nem cobrança automática.
          </Text>
        </View>

        <FlatList
          data={balances}
          keyExtractor={(b) => b.resident.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>Nenhuma despesa registrada — sem saldos a mostrar.</Text>
          }
          renderItem={({ item }) => {
            const positive = item.balance >= 0;
            return (
              <View style={styles.row}>
                <Avatar name={item.resident.name} size={36} />
                <View style={styles.rowBody}>
                  <Text style={styles.residentName}>{item.resident.name}</Text>
                  <Text style={styles.residentMeta}>
                    Pagou {formatCurrency(item.paid)} · Cota {formatCurrency(item.share)}
                  </Text>
                </View>
                <View style={styles.balanceWrap}>
                  <Text style={[styles.balanceValue, { color: positive ? colors.accent : colors.danger }]}>
                    {formatCurrency(item.balance)}
                  </Text>
                  <Text style={styles.balanceHint}>{positive ? "a receber" : "a pagar"}</Text>
                </View>
              </View>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  body: { flex: 1, backgroundColor: colors.background },
  totalCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 20,
  },

  totalLabel: { color: colors.accentLight, fontSize: 13, fontWeight: "600" },
  totalValue: { color: colors.white, fontSize: 30, fontWeight: "800", marginTop: 6 },
  noticeBox: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
  },
  noticeText: { color: colors.textMuted, fontSize: 12.5, marginLeft: 8, flex: 1, lineHeight: 17 },
  list: { padding: 16, paddingTop: 8, paddingBottom: 40 },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 30 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  rowBody: { flex: 1, marginLeft: 12 },
  residentName: { fontSize: 15, fontWeight: "700", color: colors.textDark },
  residentMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  balanceWrap: { alignItems: "flex-end" },
  balanceValue: { fontSize: 15, fontWeight: "800" },
  balanceHint: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});
