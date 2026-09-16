import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import SubScreenHeader from "../components/SubScreenHeader";
import PrimaryButton from "../components/PrimaryButton";
import Avatar from "../components/Avatar";
import { colors } from "../theme/colors";
import { useAppData } from "../context/AppDataContext";
import { taskApi } from "../services/taskApi";

const WINDOW_HOURS = 48;

const RECURRENCE_LABEL = {
  Diária: "Diária",
  Semanal: "Semanal",
  Mensal: "Mensal",
};

const STATUS_CONFIG = {
  atrasada: { label: "Atrasada", color: colors.danger, bg: "#FDE8E8" },
  hoje: { label: "Hoje", color: colors.accent, bg: colors.accentLight },
  em_breve: { label: "Em breve", color: colors.textMuted, bg: colors.surface },
};

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function reminderStatus(dueDate, overdue, now) {
  if (overdue) return "atrasada";
  return startOfDay(dueDate).getTime() === startOfDay(now).getTime() ? "hoje" : "em_breve";
}

function formatDueLabel(dueDateStr, overdue) {
  const d = new Date(dueDateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return overdue ? `Venceu em ${day}/${month} às ${time}` : `Vence em ${day}/${month} às ${time}`;
}

/** Fallback usado se a API de lembretes falhar: recalcula a partir das tarefas já carregadas no contexto. */
function computeLocalReminders(tasks, windowHours, now) {
  const horizonMs = now.getTime() + windowHours * 60 * 60 * 1000;

  return tasks
    .filter((t) => !t.done && t.recurrence && t.recurrence !== "Única" && t.nextDueDate)
    .map((t) => ({ ...t, dueDateObj: new Date(t.nextDueDate) }))
    .filter((t) => !isNaN(t.dueDateObj.getTime()) && t.dueDateObj.getTime() <= horizonMs)
    .map((t) => ({
      taskId: t.id,
      title: t.title,
      assigneeId: t.assigneeId,
      recurrence: t.recurrence,
      dueDate: t.dueDateObj.toISOString(),
      minutesUntilDue: Math.round((t.dueDateObj.getTime() - now.getTime()) / 60000),
      overdue: t.dueDateObj.getTime() <= now.getTime(),
    }))
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

export default function TaskRemindersScreen() {
  const navigation = useNavigation();
  const { activeResidence, isPremium, tasks, residentById } = useAppData();

  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReminders = useCallback(async () => {
    if (!activeResidence || !isPremium) return;

    setLoading(true);
    try {
      const data = await taskApi.getReminders(activeResidence.id, { windowHours: WINDOW_HOURS });
      setReminders(data);
    } catch (err) {
      console.warn("Falha ao buscar lembretes da API, usando cálculo local:", err.message);
      setReminders(computeLocalReminders(tasks, WINDOW_HOURS, new Date()));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeResidence, isPremium, tasks]);

  useEffect(() => {
    if (isPremium) {
      fetchReminders();
    }
  }, [fetchReminders, isPremium]);

  function onRefresh() {
    setRefreshing(true);
    fetchReminders();
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <SubScreenHeader
        kicker="TAREFAS"
        title="Lembretes automáticos"
        subtitle={isPremium ? "Avisos de tarefas recorrentes perto do vencimento" : "Disponível no plano Premium"}
      />

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          isPremium ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          ) : undefined
        }
      >
        {/* BLOQUEIO PARA PLANO FREE */}
        {!isPremium ? (
          <View style={styles.lockContainer}>
            <View style={styles.lockIconWrap}>
              <Ionicons name="notifications" size={36} color={colors.gold} />
            </View>
            <Text style={styles.lockTitle}>Recurso Exclusivo do Plano Premium</Text>
            <Text style={styles.lockSubtitle}>
              A automação de lembretes avisa dentro do app quando uma tarefa recorrente está
              atrasada ou perto de vencer, sem precisar checar o app manualmente.
            </Text>

            <View style={styles.featureHighlightList}>
              <View style={styles.featureHighlightRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                <Text style={styles.featureHighlightText}>Lembretes automáticos de tarefas atrasadas</Text>
              </View>
              <View style={styles.featureHighlightRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                <Text style={styles.featureHighlightText}>
                  Avisos das próximas {WINDOW_HOURS} horas, ordenados por urgência
                </Text>
              </View>
            </View>

            <PrimaryButton
              title="Fazer upgrade para Premium"
              onPress={() => navigation.navigate("PremiumUpgrade")}
              style={{ width: "100%", marginTop: 12 }}
            />
          </View>
        ) : loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Verificando tarefas recorrentes...</Text>
          </View>
        ) : reminders.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="checkmark-done-circle-outline" size={36} color="#BDD0C6" />
            <Text style={styles.emptyText}>
              Nenhuma tarefa recorrente atrasada ou perto do vencimento nas próximas {WINDOW_HOURS} horas.
            </Text>
          </View>
        ) : (
          reminders.map((reminder) => {
            const status = reminderStatus(new Date(reminder.dueDate), reminder.overdue, new Date());
            const statusConfig = STATUS_CONFIG[status];
            const assignee = reminder.assigneeId ? residentById[reminder.assigneeId] : null;

            return (
              <View key={reminder.taskId} style={styles.reminderCard}>
                <View style={styles.reminderHeaderRow}>
                  <View style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
                    <Text style={[styles.statusPillText, { color: statusConfig.color }]}>
                      {statusConfig.label.toUpperCase()}
                    </Text>
                  </View>
                  <Ionicons name="notifications-outline" size={16} color={colors.textMuted} />
                </View>

                <Text style={styles.reminderTitle} numberOfLines={2}>
                  {reminder.title}
                </Text>
                <Text style={styles.reminderMeta}>
                  {RECURRENCE_LABEL[reminder.recurrence] || reminder.recurrence} •{" "}
                  {formatDueLabel(reminder.dueDate, reminder.overdue)}
                </Text>

                {assignee ? (
                  <View style={styles.assigneeRow}>
                    <Avatar name={assignee.name} size={20} />
                    <Text style={styles.assigneeName} numberOfLines={1}>
                      {assignee.name}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.unassignedText}>Sem responsável</Text>
                )}
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

  // Bloqueio Free (mesmo padrão visual de ReportsScreen)
  lockContainer: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: "#E6ECE9",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  lockIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#FEF7E6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  lockTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  lockSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 20,
  },
  featureHighlightList: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  featureHighlightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureHighlightText: {
    fontSize: 13,
    color: colors.textDark,
    fontWeight: "600",
    flex: 1,
  },

  loadingBox: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 10,
  },

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

  reminderCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "#E6ECE9",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  reminderHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
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

  reminderTitle: { fontSize: 14.5, fontWeight: "700", color: colors.textDark, lineHeight: 19 },
  reminderMeta: { fontSize: 11.5, color: colors.textMuted, marginTop: 3 },

  assigneeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  assigneeName: { fontSize: 11.5, color: colors.textDark, fontWeight: "700" },
  unassignedText: { fontSize: 11, color: colors.textMuted, fontWeight: "600", marginTop: 10 },
});
