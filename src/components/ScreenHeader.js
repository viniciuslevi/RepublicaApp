import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Modal } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Avatar from "./Avatar";
import PrimaryButton from "./PrimaryButton";
import { colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../context/AppDataContext";

export default function ScreenHeader({
  kicker,
  title,
  showUserMenu = true,
}) {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const { groupName } = useAppData();
  const [modalVisible, setModalVisible] = useState(false);

  function handleLogout() {
    setModalVisible(false);
    logout();
    navigation.replace("Login");
  }

  function handleSwitchResidence() {
    setModalVisible(false);
    navigation.replace("SelectResidence");
  }

  function handleManageMembers() {
    setModalVisible(false);
    navigation.navigate("Members");
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <View style={styles.kickerWrap}>
          {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
        </View>

        {showUserMenu ? (
          <Pressable
            style={({ pressed }) => [
              styles.userPill,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => setModalVisible(true)}
            hitSlop={6}
          >
            <Avatar name={user?.name || "Morador"} size={22} />
            <Text style={styles.userPillText}>{user?.name || "Morador"}</Text>
            <Ionicons name="log-out-outline" size={15} color={colors.accentLight} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
      </View>

      {groupName ? (
        <Pressable
          style={styles.residenceBadge}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="home-outline" size={13} color={colors.accentLight} />
          <Text style={styles.residenceBadgeText} numberOfLines={1}>
            {groupName}
          </Text>
        </Pressable>
      ) : null}

      {/* Modal / Action Sheet de Sessão e Logout */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalUserHeader}>
              <Avatar name={user?.name || "Morador"} size={48} />
              <View style={styles.modalUserInfo}>
                <Text style={styles.modalUserName}>{user?.name || "Morador"}</Text>
                <Text style={styles.modalUserEmail}>
                  {user?.email || "morador@republica.com"}
                </Text>
              </View>
            </View>

            {groupName ? (
              <View style={styles.modalResidenceBox}>
                <Ionicons name="home" size={16} color={colors.accent} />
                <View style={{ marginLeft: 8, flex: 1 }}>
                  <Text style={styles.modalResidenceLabel}>Moradia atual:</Text>
                  <Text style={styles.modalResidenceName}>{groupName}</Text>
                </View>
              </View>
            ) : null}

            <View style={styles.modalActions}>
              <Pressable
                style={styles.menuOption}
                onPress={handleManageMembers}
              >
                <View style={styles.menuIconWrap}>
                  <Ionicons name="people" size={20} color={colors.primary} />
                </View>
                <View style={styles.menuTextWrap}>
                  <Text style={styles.menuTitle}>Gerenciar Moradores</Text>
                  <Text style={styles.menuSub}>Ver ou remover moradores da república</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>

              <Pressable
                style={styles.menuOption}
                onPress={handleSwitchResidence}
              >
                <View style={styles.menuIconWrap}>
                  <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
                </View>
                <View style={styles.menuTextWrap}>
                  <Text style={styles.menuTitle}>Trocar de Moradia</Text>
                  <Text style={styles.menuSub}>Selecionar ou cadastrar outra república</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>

              <Pressable
                style={[styles.menuOption, styles.menuOptionDanger]}
                onPress={handleLogout}
              >
                <View style={[styles.menuIconWrap, styles.menuIconWrapDanger]}>
                  <Ionicons name="log-out" size={20} color={colors.danger} />
                </View>
                <View style={styles.menuTextWrap}>
                  <Text style={styles.menuTitleDanger}>Sair da Conta (Logout)</Text>
                  <Text style={styles.menuSub}>Voltar para a tela de login</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.danger} />
              </Pressable>
            </View>

            <PrimaryButton
              title="Fechar"
              variant="outline"
              onPress={() => setModalVisible(false)}
              style={{ marginTop: 16 }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.primary,
    paddingTop: 14,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  kickerWrap: {
    flex: 1,
  },
  kicker: {
    color: colors.accentLight,
    fontSize: 11.5,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  userPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
    gap: 6,
  },
  userPillText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: colors.white,
    fontSize: 23,
    fontWeight: "800",
  },
  residenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 5,
  },
  residenceBadgeText: {
    color: colors.accentLight,
    fontSize: 12.5,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(13, 41, 36, 0.65)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 32,
  },
  modalUserHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  modalUserInfo: {
    marginLeft: 14,
    flex: 1,
  },
  modalUserName: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.primary,
  },
  modalUserEmail: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  modalResidenceBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  modalResidenceLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  modalResidenceName: {
    fontSize: 13.5,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  modalActions: {
    gap: 10,
  },
  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 14,
  },
  menuOptionDanger: {
    backgroundColor: "#FDF2F2",
  },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  menuIconWrapDanger: {
    backgroundColor: "#FDE8E8",
  },
  menuTextWrap: {
    marginLeft: 12,
    flex: 1,
  },
  menuTitle: {
    fontSize: 14.5,
    fontWeight: "700",
    color: colors.textDark,
  },
  menuTitleDanger: {
    fontSize: 14.5,
    fontWeight: "700",
    color: colors.danger,
  },
  menuSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
});

