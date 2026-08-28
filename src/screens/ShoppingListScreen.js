import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import ScreenHeader from "../components/ScreenHeader";
import PrimaryButton from "../components/PrimaryButton";
import { colors } from "../theme/colors";
import { useAppData } from "../context/AppDataContext";
import { useAuth } from "../context/AuthContext";

function ShoppingItemCard({ item, addedBy, onToggle }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.itemCard,
        item.purchased && styles.itemCardPurchased,
        pressed && { opacity: 0.85 },
      ]}
      onPress={onToggle}
    >
      <View
        style={[styles.checkbox, item.purchased && styles.checkboxPurchased]}
      >
        {item.purchased ? (
          <Ionicons name="checkmark" size={15} color={colors.white} />
        ) : null}
      </View>
      <View style={styles.itemIconWrap}>
        <Ionicons
          name={item.purchased ? "cart" : "cart-outline"}
          size={18}
          color={item.purchased ? colors.textMuted : colors.accent}
        />
      </View>
      <View style={styles.itemBody}>
        <Text style={[styles.itemName, item.purchased && styles.itemNameDone]}>
          {item.name}
        </Text>
        <Text style={styles.itemMeta}>
          {addedBy ? `Adicionado por ${addedBy.name}` : "Adicionado por alguém da casa"}
        </Text>
      </View>
      {item.quantity ? (
        <View style={[styles.quantityBadge, item.purchased && styles.quantityBadgeDone]}>
          <Text style={styles.quantityBadgeText}>{item.quantity}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export default function ShoppingListScreen() {
  const { user } = useAuth();
  const {
    shoppingItems,
    residents,
    residentById,
    addShoppingItem,
    toggleShoppingItemPurchased,
  } = useAppData();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");

  const currentResidentId = useMemo(() => {
    if (!user) return residents[0]?.id ?? null;
    const match = residents.find(
      (r) =>
        r.id === user.id ||
        (r.email && user.email && r.email.toLowerCase() === user.email.toLowerCase()) ||
        (r.name && user.name && r.name.toLowerCase() === user.name.toLowerCase())
    );
    return match?.id ?? residents[0]?.id ?? null;
  }, [residents, user]);

  const pendingItems = useMemo(
    () => shoppingItems.filter((item) => !item.purchased),
    [shoppingItems]
  );
  const purchasedItems = useMemo(
    () => shoppingItems.filter((item) => item.purchased),
    [shoppingItems]
  );

  function handleAdd() {
    if (!name.trim()) {
      setError("Informe o nome do item.");
      return;
    }
    addShoppingItem(name, quantity, currentResidentId);
    setName("");
    setQuantity("");
    setError("");
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScreenHeader kicker="COMPRAS" title="Lista de compras" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <FlatList
          data={pendingItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={styles.form}>
              <Text style={styles.label}>Nome do item *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex.: Detergente"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  if (error) setError("");
                }}
              />
              <Text style={styles.label}>Quantidade (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex.: 2 unidades"
                placeholderTextColor={colors.textMuted}
                value={quantity}
                onChangeText={setQuantity}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <PrimaryButton title="Adicionar item" onPress={handleAdd} style={{ marginTop: 8 }} />
              <Text style={styles.sectionTitle}>Itens pendentes</Text>
            </View>
          }
          renderItem={({ item }) => (
            <ShoppingItemCard
              item={item}
              addedBy={item.addedById ? residentById[item.addedById] : null}
              onToggle={() => toggleShoppingItemPurchased(item.id)}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Nenhum item pendente na lista de compras.</Text>
          }
          ListFooterComponent={
            purchasedItems.length > 0 ? (
              <View style={styles.purchasedSection}>
                <Text style={styles.sectionTitle}>Comprados</Text>
                {purchasedItems.map((item) => (
                  <ShoppingItemCard
                    key={item.id}
                    item={item}
                    addedBy={item.addedById ? residentById[item.addedById] : null}
                    onToggle={() => toggleShoppingItemPurchased(item.id)}
                  />
                ))}
              </View>
            ) : null
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
  label: {
    color: colors.textDark,
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 12,
    fontSize: 13.5,
  },
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
  error: { color: colors.danger, marginTop: 10, fontSize: 13 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.primary,
    marginTop: 24,
    marginBottom: 8,
  },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 20 },
  purchasedSection: { marginTop: 8 },
  itemCard: {
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
  itemCardPurchased: {
    backgroundColor: "#F4F7F5",
    shadowOpacity: 0,
    elevation: 0,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  checkboxPurchased: {
    backgroundColor: colors.accent,
  },
  itemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemBody: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: "700", color: colors.textDark },
  itemNameDone: {
    textDecorationLine: "line-through",
    color: colors.textMuted,
  },
  itemMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  quantityBadge: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginLeft: 8,
  },
  quantityBadgeDone: { opacity: 0.7 },
  quantityBadgeText: { fontSize: 12, fontWeight: "700", color: colors.primary },
});
