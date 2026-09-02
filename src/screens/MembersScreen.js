import React, { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import SubScreenHeader from "../components/SubScreenHeader";
import Avatar from "../components/Avatar";
import PrimaryButton from "../components/PrimaryButton";
import { colors } from "../theme/colors";
import { useAppData } from "../context/AppDataContext";
import { useAuth } from "../context/AuthContext";

export default function MembersScreen() {
  const { user } = useAuth();
  const { residents, activeResidence, removeResident } = useAppData();
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const [error, setError] = useState("");
  const [isRemoving, setIsRemoving] = useState(false);

  const currentResidentId = useMemo(() => {
    if (!user) return null;
    const match = residents.find(
      (r) =>
        r.id === user.id ||
        (r.email && user.email && r.email.toLowerCase() === user.email.toLowerCase()) ||
        (r.name && user.name && r.name.toLowerCase() === user.name.toLowerCase())
    );
    return match?.id ?? null;
  }, [residents, user]);

  const adminId = activeResidence?.adminId ?? null;
  const isCurrentUserAdmin = !!adminId && adminId === currentResidentId;
  const canRemoveAnyone = isCurrentUserAdmin && residents.length > 1;

  async function handleConfirmRemoval() {
    if (!pendingRemoval) return;
    setIsRemoving(true);
    try {
      const result = await removeResident(pendingRemoval.id);
      if (!result.success) {
        setError(result.error);
      } else {
        setError("");
      }
    } finally {
      setIsRemoving(false);
      setPendingRemoval(null);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <SubScreenHeader
        kicker="RESIDÊNCIA"
        title="Moradores"
        subtitle={activeResidence?.name}
      />

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.noticeBox}>
          <Ionicons name="people-outline" size={16} color={colors.textMuted} />
          <Text style={styles.noticeText}>
            {isCurrentUserAdmin
              ? "Como administrador(a), você pode remover moradores desta república."
              : "Apenas o administrador da república pode remover moradores."}
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {residents.map((r) => {
          const isAdminRow = r.id === adminId;
          const isMe = r.id === currentResidentId;
          const canRemoveThis = canRemoveAnyone && !isAdminRow;

          return (
            <View key={r.id} style={styles.memberCard}>
              <Avatar name={r.name} size={40} />
              <View style={styles.memberInfo}>
                <View style={styles.memberNameRow}>
                  <Text style={styles.memberName}>
                    {r.name} {isMe ? "(Você)" : ""}
                  </Text>
                  {isAdminRow ? (
                    <View style={styles.adminBadge}>
                      <Ionicons name="shield-checkmark" size={11} color={colors.gold} />
                      <Text style={styles.adminBadgeText}>ADMIN</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.memberEmail}>{r.email}</Text>
              </View>

              {canRemoveThis ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.removeBtn,
                    pressed && { opacity: 0.75 },
                  ]}
                  onPress={() => setPendingRemoval(r)}
                  hitSlop={6}
                >
                  <Ionicons name="person-remove-outline" size={18} color={colors.danger} />
                </Pressable>
              ) : null}
            </View>
          );
        })}

        {residents.length <= 1 ? (
          <View style={styles.hintBox}>
            <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
            <Text style={styles.hintText}>
              Esta é a última pessoa da república — não é possível removê-la.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {pendingRemoval ? (
        <View style={styles.confirmOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setPendingRemoval(null)}
          />
          <View style={styles.confirmCard}>
            <View style={styles.confirmIconWrap}>
              <Ionicons name="warning-outline" size={26} color={colors.danger} />
            </View>
            <Text style={styles.confirmTitle}>Remover morador?</Text>
            <Text style={styles.confirmText}>
              Tem certeza que deseja remover{" "}
              <Text style={styles.confirmTextBold}>{pendingRemoval.name}</Text> desta
              república? As tarefas atribuídas a ele(a) ficarão sem responsável.
            </Text>

            <PrimaryButton
              title="Remover morador"
              onPress={handleConfirmRemoval}
              loading={isRemoving}
              style={styles.confirmDeleteBtn}
            />
            <PrimaryButton
              title="Cancelar"
              variant="outline"
              onPress={() => setPendingRemoval(null)}
              style={{ marginTop: 10 }}
            />
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  body: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 16, paddingBottom: 40 },
  noticeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  noticeText: { color: colors.textMuted, fontSize: 12.5, flex: 1, lineHeight: 17 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDE8E8",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 14,
    gap: 6,
  },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: "600", flex: 1 },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "#E3ECE7",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  memberInfo: { flex: 1, marginLeft: 12 },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  memberName: { fontSize: 15, fontWeight: "700", color: colors.textDark },
  memberEmail: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.goldLight,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    gap: 3,
  },
  adminBadgeText: { color: colors.gold, fontSize: 9.5, fontWeight: "800" },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FDE8E8",
    alignItems: "center",
    justifyContent: "center",
  },
  hintBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accentLight,
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 4,
  },
  hintText: { color: colors.primaryDark, fontSize: 12.5, flex: 1, lineHeight: 17 },
  confirmOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(13, 41, 36, 0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  confirmCard: {
    width: "100%",
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 22,
    alignItems: "center",
  },
  confirmIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FDE8E8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  confirmTitle: { fontSize: 17, fontWeight: "800", color: colors.primary },
  confirmText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
  },
  confirmTextBold: { fontWeight: "800", color: colors.textDark },
  confirmDeleteBtn: { backgroundColor: colors.danger, marginTop: 18, width: "100%" },
});
