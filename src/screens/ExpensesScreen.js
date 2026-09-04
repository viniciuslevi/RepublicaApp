import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import ScreenHeader from "../components/ScreenHeader";
import Avatar from "../components/Avatar";
import PrimaryButton from "../components/PrimaryButton";
import { colors } from "../theme/colors";
import { useAppData } from "../context/AppDataContext";

function formatCurrency(value) {
  const num = typeof value === "number" ? value : Number(value) || 0;
  return `R$ ${num.toFixed(2).replace(".", ",")}`;
}

export default function ExpensesScreen() {
  const { expenses, residents, residentById, addExpense } = useAppData();
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [payerId, setPayerId] = useState(residents[0]?.id ?? null);
  const [participantIds, setParticipantIds] = useState(residents.map((r) => r.id));
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!payerId && residents.length > 0) {
      setPayerId(residents[0].id);
    }
  }, [residents, payerId]);

  useEffect(() => {
    if (participantIds.length === 0 && residents.length > 0) {
      setParticipantIds(residents.map((r) => r.id));
    }
  }, [residents]);

  function toggleParticipant(residentId) {
    setParticipantIds((prev) =>
      prev.includes(residentId)
        ? prev.filter((id) => id !== residentId)
        : [...prev, residentId]
    );
    if (error) setError("");
  }

  async function handleAdd() {
    const rawClean = value.trim().replace(/\s/g, "").replace(",", ".");
    const numeric = Number(rawClean);

    if (!description.trim()) {
      setError("Informe uma descrição para a despesa.");
      return;
    }
    if (isNaN(numeric) || numeric <= 0) {
      setError("Informe um valor numérico positivo maior que zero.");
      return;
    }
    const currentPayerId = payerId || residents[0]?.id;
    if (!currentPayerId) {
      setError("Informe quem pagou a despesa.");
      return;
    }
    if (participantIds.length === 0) {
      setError("Selecione ao menos um participante da divisão.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await addExpense(description.trim(), numeric, currentPayerId, participantIds);
      setDescription("");
      setValue("");
      setParticipantIds(residents.map((r) => r.id));
    } catch (err) {
      setError(err.message || "Erro ao registrar despesa no servidor.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScreenHeader kicker="DESPESAS" title="Despesas do grupo" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <FlatList
          data={expenses}
          keyExtractor={(e) => e.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.form}>
              <Text style={styles.label}>Descrição</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex.: Conta de água"
                placeholderTextColor={colors.textMuted}
                value={description}
                onChangeText={setDescription}
              />
              <Text style={styles.label}>Valor (R$)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex.: 95,00"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                value={value}
                onChangeText={setValue}
              />
              <Text style={styles.label}>Quem pagou</Text>
              <View style={styles.payerRow}>
                {residents.map((r) => (
                  <Pressable
                    key={r.id}
                    style={[styles.payerChip, payerId === r.id && styles.payerChipActive]}
                    onPress={() => setPayerId(r.id)}
                  >
                    <Avatar name={r.name} size={22} />
                    <Text
                      style={[
                        styles.payerChipText,
                        payerId === r.id && styles.payerChipTextActive,
                      ]}
                    >
                      {r.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.label}>Dividir entre</Text>
              <View style={styles.participantsList}>
                {residents.map((r) => {
                  const isSelected = participantIds.includes(r.id);
                  return (
                    <Pressable
                      key={r.id}
                      style={[styles.participantRow, isSelected && styles.participantRowActive]}
                      onPress={() => toggleParticipant(r.id)}
                    >
                      <View
                        style={[
                          styles.participantCheckbox,
                          isSelected && styles.participantCheckboxActive,
                        ]}
                      >
                        {isSelected ? (
                          <Ionicons name="checkmark" size={13} color={colors.white} />
                        ) : null}
                      </View>
                      <Avatar name={r.name} size={26} />
                      <Text
                        style={[
                          styles.participantName,
                          isSelected && styles.participantNameActive,
                        ]}
                      >
                        {r.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <PrimaryButton
                title={isSubmitting ? "Registrando..." : "Registrar despesa"}
                onPress={handleAdd}
                disabled={isSubmitting}
                style={{ marginTop: 8 }}
              />
              <Text style={styles.sectionTitle}>Histórico</Text>
            </View>
          }
          renderItem={({ item }) => {
            const payer = residentById[item.payerId] || (typeof item.payerId === "object" ? item.payerId : null);
            const participants = (item.participantIds && item.participantIds.length > 0 ? item.participantIds : residents.map((r) => r.id))
              .map((id) => residentById[id]?.name || id)
              .filter(Boolean);
            const splitAll = residents.length > 0 && participants.length === residents.length;

            return (
              <View style={styles.expenseCard}>
                <Avatar name={payer?.name || "Morador"} size={34} />
                <View style={styles.expenseBody}>
                  <Text style={styles.expenseDesc}>{item.description}</Text>
                  <Text style={styles.expensePayer}>Pago por {payer?.name ?? "—"}</Text>
                  <Text style={styles.expenseSplit} numberOfLines={1}>
                    {splitAll
                      ? "Dividido entre todos"
                      : `Dividido com ${participants.join(", ")}`}
                  </Text>
                </View>
                <Text style={styles.expenseValue}>{formatCurrency(item.value)}</Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>Nenhuma despesa registrada ainda.</Text>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  flex: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16, paddingBottom: 40 },

  form: { marginBottom: 8 },
  label: { color: colors.textDark, fontWeight: "700", marginBottom: 6, marginTop: 12, fontSize: 13.5 },
  input: {
    borderWidth: 1,
    borderColor: colors.surface,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textDark,
  },
  payerRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  payerChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  payerChipActive: { backgroundColor: colors.accentLight, borderWidth: 1, borderColor: colors.accent },
  payerChipText: { marginLeft: 6, fontSize: 13, color: colors.textMuted, fontWeight: "600" },
  payerChipTextActive: { color: colors.primary },
  participantsList: { gap: 8 },
  participantRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.surface,
    paddingVertical: 9,
    paddingHorizontal: 10,
    gap: 10,
  },
  participantRowActive: {
    backgroundColor: colors.accentLight,
    borderColor: colors.accent,
  },
  participantCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  participantCheckboxActive: {
    backgroundColor: colors.accent,
  },
  participantName: { fontSize: 13.5, color: colors.textMuted, fontWeight: "600" },
  participantNameActive: { color: colors.primary, fontWeight: "700" },
  error: { color: colors.danger, marginTop: 10, fontSize: 13 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: colors.primary, marginTop: 24, marginBottom: 8 },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 20 },
  expenseCard: {
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
  expenseBody: { flex: 1, marginLeft: 12 },
  expenseDesc: { fontSize: 15, fontWeight: "600", color: colors.textDark },
  expensePayer: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  expenseSplit: { fontSize: 11.5, color: colors.accent, marginTop: 2, fontWeight: "600" },
  expenseValue: { fontSize: 15, fontWeight: "800", color: colors.primary },
});
