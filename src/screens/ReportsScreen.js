import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import SubScreenHeader from "../components/SubScreenHeader";
import Avatar from "../components/Avatar";
import PrimaryButton from "../components/PrimaryButton";
import { colors } from "../theme/colors";
import { useAppData } from "../context/AppDataContext";
import { reportApi } from "../services/reportApi";

let DateTimePickerAndroid = null;
try {
  const dtp = require("@react-native-community/datetimepicker");
  DateTimePickerAndroid = dtp.DateTimePickerAndroid || null;
} catch {
  DateTimePickerAndroid = null;
}

function formatCurrency(value) {
  const num = typeof value === "number" ? value : Number(value) || 0;
  return `R$ ${num.toFixed(2).replace(".", ",")}`;
}

function formatDateLabel(dateLike) {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  if (isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${d.getFullYear()}`;
}

const PRESET_PERIODS = [
  { id: "30d", label: "Últimos 30 dias", days: 30 },
  { id: "7d", label: "Últimos 7 dias", days: 7 },
  { id: "month", label: "Este mês" },
  { id: "all", label: "Tudo" },
];

export default function ReportsScreen() {
  const navigation = useNavigation();
  const { activeResidence, isPremium, residents, tasks, expenses } = useAppData();

  const [activePreset, setActivePreset] = useState("30d");
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [dateTo, setDateTo] = useState(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  });

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  function applyPreset(presetId) {
    setActivePreset(presetId);
    const now = new Date();

    if (presetId === "7d") {
      const start = new Date();
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      setDateFrom(start);
      setDateTo(now);
    } else if (presetId === "30d") {
      const start = new Date();
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      setDateFrom(start);
      setDateTo(now);
    } else if (presetId === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      setDateFrom(start);
      setDateTo(now);
    } else if (presetId === "all") {
      setDateFrom(null);
      setDateTo(null);
    }
  }

  const fetchReport = useCallback(async () => {
    if (!activeResidence || !isPremium) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const params = {};
      if (dateFrom) params.startDate = dateFrom.toISOString();
      if (dateTo) params.endDate = dateTo.toISOString();

      const data = await reportApi.getSummary(activeResidence.id, params);
      setReportData(data);
    } catch (err) {
      console.warn("Falha ao buscar relatório da API, usando cálculo local:", err.message);

      // Fallback: cálculo local a partir do contexto
      const filteredExpenses = (expenses || []).filter((e) => {
        const d = new Date(e.date || e.createdAt);
        if (isNaN(d.getTime())) return true;
        if (dateFrom && d < dateFrom) return false;
        if (dateTo && d > dateTo) return false;
        return true;
      });

      const filteredTasks = (tasks || []).filter((t) => {
        if (!t.done) return false;
        const d = new Date(t.lastCompletedAt || t.updatedAt || t.createdAt);
        if (isNaN(d.getTime())) return true;
        if (dateFrom && d < dateFrom) return false;
        if (dateTo && d > dateTo) return false;
        return true;
      });

      const totalExp = filteredExpenses.reduce((sum, e) => sum + e.value, 0);
      const allResidentIds = (residents || []).map((r) => r.id);

      const membersReport = (residents || []).map((r) => {
        const paid = filteredExpenses
          .filter((e) => e.payerId === r.id)
          .reduce((sum, e) => sum + e.value, 0);

        const share = filteredExpenses.reduce((sum, e) => {
          const parts = e.participantIds && e.participantIds.length > 0 ? e.participantIds : allResidentIds;
          if (!parts.includes(r.id)) return sum;
          return sum + e.value / parts.length;
        }, 0);

        const count = filteredTasks.filter((t) => t.assigneeId === r.id).length;

        return {
          resident: { id: r.id, name: r.name, email: r.email },
          totalExpensesPaid: paid,
          totalExpensesShare: share,
          completedTasksCount: count,
        };
      });

      setReportData({
        period: {
          startDate: dateFrom ? dateFrom.toISOString() : null,
          endDate: dateTo ? dateTo.toISOString() : null,
        },
        totalExpenses: totalExp,
        totalCompletedTasks: filteredTasks.length,
        membersReport,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeResidence, isPremium, dateFrom, dateTo, expenses, tasks, residents]);

  useEffect(() => {
    if (isPremium) {
      fetchReport();
    }
  }, [fetchReport, isPremium]);

  function onRefresh() {
    setRefreshing(true);
    fetchReport();
  }

  function openDatePicker(which) {
    if (Platform.OS !== "android" || !DateTimePickerAndroid) return;
    const current = which === "from" ? dateFrom || new Date() : dateTo || new Date();

    DateTimePickerAndroid.open({
      value: current,
      mode: "date",
      is24Hour: true,
      onValueChange: (_event, selectedDate) => {
        if (!selectedDate) return;
        setActivePreset("custom");
        if (which === "from") {
          selectedDate.setHours(0, 0, 0, 0);
          setDateFrom(selectedDate);
        } else {
          selectedDate.setHours(23, 59, 59, 999);
          setDateTo(selectedDate);
        }
      },
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <SubScreenHeader
        kicker="RELATÓRIOS"
        title="Relatório de Gastos e Tarefas"
        subtitle={activeResidence?.name}
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
              <Ionicons name="sparkles" size={36} color={colors.gold} />
            </View>
            <Text style={styles.lockTitle}>Recurso Exclusivo do Plano Premium</Text>
            <Text style={styles.lockSubtitle}>
              O relatório detalhado consolida totais de despesas pagas, rateios e quantidade de tarefas
              concluídas por morador em períodos personalizados.
            </Text>

            <View style={styles.featureHighlightList}>
              <View style={styles.featureHighlightRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                <Text style={styles.featureHighlightText}>
                  Totais de gastos desembolsados por morador
                </Text>
              </View>
              <View style={styles.featureHighlightRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                <Text style={styles.featureHighlightText}>
                  Contagem de tarefas concluídas por membro no período
                </Text>
              </View>
              <View style={styles.featureHighlightRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                <Text style={styles.featureHighlightText}>
                  Filtros flexíveis por data e intervalos customizados
                </Text>
              </View>
            </View>

            <PrimaryButton
              title="Fazer upgrade para Premium"
              onPress={() => navigation.navigate("PremiumUpgrade")}
              style={{ width: "100%", marginTop: 12 }}
            />
          </View>
        ) : (
          /* CONTEÚDO PREMIUM DESBLOQUEADO */
          <>
            {/* SELETOR DE PERÍODO */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>Período de Análise</Text>

              {/* Chips rápidos */}
              <View style={styles.chipsRow}>
                {PRESET_PERIODS.map((preset) => {
                  const selected = activePreset === preset.id;
                  return (
                    <Pressable
                      key={preset.id}
                      style={[styles.presetChip, selected && styles.presetChipActive]}
                      onPress={() => applyPreset(preset.id)}
                    >
                      <Text style={[styles.presetChipText, selected && styles.presetChipTextActive]}>
                        {preset.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Seletor de Datas */}
              <View style={styles.datePickerRow}>
                <Pressable
                  style={styles.dateBtn}
                  onPress={() => openDatePicker("from")}
                >
                  <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                  <View style={{ marginLeft: 6 }}>
                    <Text style={styles.dateBtnLabel}>De:</Text>
                    <Text style={styles.dateBtnValue}>
                      {dateFrom ? formatDateLabel(dateFrom) : "Início"}
                    </Text>
                  </View>
                </Pressable>

                <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />

                <Pressable
                  style={styles.dateBtn}
                  onPress={() => openDatePicker("to")}
                >
                  <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                  <View style={{ marginLeft: 6 }}>
                    <Text style={styles.dateBtnLabel}>Até:</Text>
                    <Text style={styles.dateBtnValue}>
                      {dateTo ? formatDateLabel(dateTo) : "Hoje"}
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>

            {loading && !refreshing ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Carregando relatório do grupo...</Text>
              </View>
            ) : reportData ? (
              <>
                {/* CARDS COM TOTAIS CONSOLIDADOS */}
                <View style={styles.metricsRow}>
                  <View style={styles.metricCard}>
                    <View style={styles.metricIconWrap}>
                      <Ionicons name="cash" size={20} color={colors.accent} />
                    </View>
                    <Text style={styles.metricLabel}>Total em Gastos</Text>
                    <Text style={styles.metricValue}>
                      {formatCurrency(reportData.totalExpenses)}
                    </Text>
                  </View>

                  <View style={styles.metricCard}>
                    <View style={[styles.metricIconWrap, { backgroundColor: "#E6F4EA" }]}>
                      <Ionicons name="checkmark-done" size={20} color={colors.primary} />
                    </View>
                    <Text style={styles.metricLabel}>Tarefas Concluídas</Text>
                    <Text style={styles.metricValue}>
                      {reportData.totalCompletedTasks}
                    </Text>
                  </View>
                </View>

                {/* DETALHAMENTO POR MORADOR */}
                <Text style={styles.groupSectionTitle}>Desempenho por Morador</Text>

                {reportData.membersReport && reportData.membersReport.length > 0 ? (
                  reportData.membersReport.map((m) => (
                    <View key={m.resident.id} style={styles.memberCard}>
                      <View style={styles.memberHeader}>
                        <Avatar name={m.resident.name} size={40} />
                        <View style={styles.memberInfo}>
                          <Text style={styles.memberName}>{m.resident.name}</Text>
                          <Text style={styles.memberEmail}>{m.resident.email}</Text>
                        </View>
                      </View>

                      <View style={styles.statsDivider} />

                      <View style={styles.memberStatsGrid}>
                        <View style={styles.memberStatCol}>
                          <Text style={styles.statLabel}>Despesas Pagas</Text>
                          <Text style={styles.statExpenseValue}>
                            {formatCurrency(m.totalExpensesPaid)}
                          </Text>
                        </View>

                        <View style={styles.memberStatCol}>
                          <Text style={styles.statLabel}>Cota no Rateio</Text>
                          <Text style={styles.statShareValue}>
                            {formatCurrency(m.totalExpensesShare)}
                          </Text>
                        </View>

                        <View style={styles.memberStatCol}>
                          <Text style={styles.statLabel}>Tarefas Feitas</Text>
                          <View style={styles.taskBadge}>
                            <Ionicons name="checkbox" size={14} color={colors.accent} />
                            <Text style={styles.taskBadgeText}>
                              {m.completedTasksCount}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>
                    Nenhum morador encontrado para esta moradia.
                  </Text>
                )}
              </>
            ) : null}
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

  // Bloqueio Free
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

  // Conteúdo Premium
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: "#E6ECE9",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textDark,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  presetChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#E2E8E4",
  },
  presetChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textDark,
  },
  presetChipTextActive: {
    color: colors.white,
  },
  datePickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    padding: 10,
    borderRadius: 12,
  },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  dateBtnLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "600",
  },
  dateBtnValue: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.primaryDark,
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

  metricsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#E6ECE9",
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  metricLabel: {
    fontSize: 11.5,
    color: colors.textMuted,
    fontWeight: "600",
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textDark,
    marginTop: 2,
  },

  groupSectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 10,
    marginTop: 4,
  },

  memberCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#E6ECE9",
  },
  memberHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberInfo: {
    marginLeft: 12,
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textDark,
  },
  memberEmail: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  statsDivider: {
    height: 1,
    backgroundColor: "#EEF2EF",
    marginVertical: 12,
  },
  memberStatsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  memberStatCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600",
    marginBottom: 4,
  },
  statExpenseValue: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textDark,
  },
  statShareValue: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textDark,
  },
  taskBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accentLight,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
    gap: 4,
  },
  taskBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  emptyText: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 20,
  },
});
