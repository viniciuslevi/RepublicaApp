import React, { useMemo } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import SubScreenHeader from "../components/SubScreenHeader";
import { colors } from "../theme/colors";
import { useAppData } from "../context/AppDataContext";

function formatDateLabel(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${d.getFullYear()}`;
}

function formatCurrency(value) {
  const num = typeof value === "number" ? value : Number(value) || 0;
  return `R$ ${num.toFixed(2).replace(".", ",")}`;
}

/** Combina tarefas concluídas e despesas em uma única linha do tempo, ordenada
 * por data (mais recente primeiro). Tarefas usam lastCompletedAt como data de
 * referência (fallback para updatedAt/createdAt); despesas usam seu próprio date. */
export function buildHistoryEntries(tasks, expenses) {
  const taskEntries = (tasks || [])
    .filter((t) => t.done)
    .map((t) => ({
      type: "task",
      id: `task_${t.id}`,
      title: t.title,
      date: t.lastCompletedAt || t.updatedAt || t.createdAt,
      personId: t.assigneeId || null,
    }));

  const expenseEntries = (expenses || []).map((e) => ({
    type: "expense",
    id: `expense_${e.id}`,
    title: e.description,
    date: e.date || e.createdAt,
    personId: e.payerId || null,
    value: e.value,
  }));

  return [...taskEntries, ...expenseEntries]
    .filter((entry) => entry.date && !isNaN(new Date(entry.date).getTime()))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

export default function HistoryScreen() {
  const { tasks, expenses, residentById } = useAppData();

  const entries = useMemo(() => buildHistoryEntries(tasks, expenses), [tasks, expenses]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <SubScreenHeader
        kicker="RESIDÊNCIA"
        title="Histórico"
        subtitle="Tarefas concluídas e despesas registradas"
      />

      <FlatList
        style={styles.body}
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="time-outline" size={36} color="#BDD0C6" />
            <Text style={styles.emptyText}>Sem histórico por enquanto.</Text>
            <Text style={styles.emptySubtext}>
              Tarefas concluídas e despesas registradas vão aparecer aqui.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const person = item.personId ? residentById[item.personId] : null;
          const isTask = item.type === "task";
          return (
            <View style={styles.entryCard}>
              <View
                style={[
                  styles.entryIconWrap,
                  { backgroundColor: isTask ? colors.accentLight : colors.goldLight },
                ]}
              >
                <Ionicons
                  name={isTask ? "checkmark-circle" : "cash"}
                  size={17}
                  color={isTask ? colors.accent : colors.gold}
                />
              </View>
              <View style={styles.entryInfo}>
                <Text style={styles.entryTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.entryMeta}>
                  {isTask ? "Tarefa concluída" : "Despesa"}
                  {person ? ` · ${isTask ? "por" : "pago por"} ${person.name}` : ""}
                  {" · "}
                  {formatDateLabel(item.date)}
                </Text>
              </View>
              {!isTask ? (
                <Text style={styles.entryValue}>{formatCurrency(item.value)}</Text>
              ) : null}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  body: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: 16, paddingBottom: 40 },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 14.5,
    fontWeight: "700",
    color: colors.textDark,
    marginTop: 10,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: "center",
    lineHeight: 18,
  },
  entryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: "#E6ECE9",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  entryIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  entryInfo: { flex: 1, marginRight: 8 },
  entryTitle: { fontSize: 14, fontWeight: "700", color: colors.textDark, lineHeight: 18 },
  entryMeta: { fontSize: 11.5, color: colors.textMuted, marginTop: 2 },
  entryValue: { fontSize: 14, fontWeight: "800", color: colors.primary },
});
