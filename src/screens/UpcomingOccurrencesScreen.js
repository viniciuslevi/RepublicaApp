import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import SubScreenHeader from "../components/SubScreenHeader";
import Avatar from "../components/Avatar";
import { colors } from "../theme/colors";
import { useAppData } from "../context/AppDataContext";
import { getUpcomingOccurrences } from "../services/recurrenceService";

const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const MONTHS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

const RECURRENCE_LABEL = {
  Diária: "Diária",
  Semanal: "Semanal",
  Mensal: "Mensal",
};

const STATUS_CONFIG = {
  atrasada: { label: "Atrasada", color: colors.danger, bg: "#FDE8E8" },
  hoje: { label: "Hoje", color: colors.accent, bg: colors.accentLight },
  futura: { label: "Futura", color: colors.textMuted, bg: colors.surface },
};

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dayKey(date) {
  return startOfDay(date).toISOString();
}

function getStatus(date, today) {
  const day = startOfDay(date).getTime();
  if (day < today.getTime()) return "atrasada";
  if (day === today.getTime()) return "hoje";
  return "futura";
}

function formatDayLabel(date, status) {
  if (status === "hoje") return "Hoje";
  const weekday = WEEKDAYS[date.getDay()];
  return `${weekday}, ${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

export default function UpcomingOccurrencesScreen() {
  const { tasks, residentById } = useAppData();

  const groups = useMemo(() => {
    const today = startOfDay(new Date());
    const occurrences = getUpcomingOccurrences(tasks, { horizonDays: 30, occurrencesPerTask: 6, now: new Date() });

    const map = new Map();
    occurrences.forEach((occ) => {
      const date = new Date(occ.date);
      const key = dayKey(date);
      const status = getStatus(date, today);
      if (!map.has(key)) {
        map.set(key, { date, status, items: [] });
      }
      map.get(key).items.push(occ);
    });

    return Array.from(map.values()).sort((a, b) => a.date - b.date);
  }, [tasks]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <SubScreenHeader
        kicker="TAREFAS"
        title="Próximas ocorrências"
        subtitle="Projeção das tarefas recorrentes da casa"
      />

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {groups.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-clear-outline" size={36} color="#BDD0C6" />
            <Text style={styles.emptyText}>
              Nenhuma tarefa recorrente cadastrada no momento.
            </Text>
          </View>
        ) : (
          groups.map((group) => {
            const statusConfig = STATUS_CONFIG[group.status];
            return (
              <View key={group.date.toISOString()} style={styles.groupBlock}>
                <View style={styles.groupHeaderRow}>
                  <Text style={styles.groupDateLabel}>
                    {formatDayLabel(group.date, group.status)}
                  </Text>
                  <View style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
                    <Text style={[styles.statusPillText, { color: statusConfig.color }]}>
                      {statusConfig.label.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {group.items.map((occ, index) => {
                  const assignee = occ.assigneeId ? residentById[occ.assigneeId] : null;
                  return (
                    <View key={`${occ.taskId}_${index}`} style={styles.occurrenceCard}>
                      <View style={styles.occurrenceIconWrap}>
                        <Ionicons name="repeat" size={16} color={colors.primary} />
                      </View>
                      <View style={styles.occurrenceInfo}>
                        <Text style={styles.occurrenceTitle} numberOfLines={2}>
                          {occ.title}
                        </Text>
                        <Text style={styles.occurrenceMeta}>
                          Recorrência {RECURRENCE_LABEL[occ.recurrence] || occ.recurrence}
                        </Text>
                      </View>

                      {assignee ? (
                        <View style={styles.assigneePill}>
                          <Avatar name={assignee.name} size={20} />
                          <Text style={styles.assigneeName} numberOfLines={1}>
                            {assignee.name}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.unassignedPill}>
                          <Text style={styles.unassignedText}>Sem responsável</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  body: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 16, paddingBottom: 40 },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 13.5,
    color: colors.textMuted,
    marginTop: 10,
    textAlign: "center",
    lineHeight: 19,
  },
  groupBlock: { marginBottom: 18 },
  groupHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  groupDateLabel: {
    fontSize: 14.5,
    fontWeight: "800",
    color: colors.primary,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 5,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.4 },
  occurrenceCard: {
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
  occurrenceIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  occurrenceInfo: { flex: 1, marginRight: 8 },
  occurrenceTitle: { fontSize: 14, fontWeight: "700", color: colors.textDark, lineHeight: 18 },
  occurrenceMeta: { fontSize: 11.5, color: colors.textMuted, marginTop: 2 },
  assigneePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 14,
    gap: 5,
    maxWidth: 100,
  },
  assigneeName: { fontSize: 11, color: colors.textDark, fontWeight: "700" },
  unassignedPill: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#D2DFD8",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  unassignedText: { color: colors.textMuted, fontWeight: "600", fontSize: 10.5 },
});
