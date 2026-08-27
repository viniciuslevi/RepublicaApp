import React, { useState } from "react";
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

import ScreenHeader from "../components/ScreenHeader";
import Avatar from "../components/Avatar";
import PrimaryButton from "../components/PrimaryButton";
import { colors } from "../theme/colors";
import { useAppData } from "../context/AppDataContext";

function formatCurrency(value) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

export default function ExpensesScreen() {
  const { expenses, residents, residentById, addExpense } = useAppData();
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [payerId, setPayerId] = useState(residents[0]?.id ?? null);
  const [error, setError] = useState("");

  function handleAdd() {
    const numeric = Number(value.replace(",", "."));
    if (!description.trim()) {
      setError("Informe uma descrição para a despesa.");
      return;
    }
    if (!numeric || numeric <= 0) {
      setError("Informe um valor numérico maior que zero.");
      return;
    }
    addExpense(description.trim(), numeric, payerId);
    setDescription("");
    setValue("");
    setError("");
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScreenHeader kicker="EPIC · DESPESAS" title="Despesas do grupo" />
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
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <PrimaryButton title="Registrar despesa" onPress={handleAdd} style={{ marginTop: 8 }} />
              <Text style={styles.sectionTitle}>Histórico</Text>
            </View>
          }
          renderItem={({ item }) => {
            const payer = residentById[item.payerId];
            return (
              <View style={styles.expenseCard}>
                <Avatar name={payer?.name} size={34} />
                <View style={styles.expenseBody}>
                  <Text style={styles.expenseDesc}>{item.description}</Text>
                  <Text style={styles.expensePayer}>Pago por {payer?.name ?? "—"}</Text>
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
  expenseValue: { fontSize: 15, fontWeight: "800", color: colors.primary },
});
