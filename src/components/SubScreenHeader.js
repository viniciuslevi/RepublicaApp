import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

export default function SubScreenHeader({ kicker, title, subtitle }) {
  const navigation = useNavigation();

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.75 }]}
          onPress={() => navigation.goBack()}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={22} color={colors.white} />
        </Pressable>
        {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
      </View>

      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
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
    marginBottom: 6,
    gap: 10,
  },
  backBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  kicker: {
    color: colors.accentLight,
    fontSize: 11.5,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  title: {
    color: colors.white,
    fontSize: 23,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.accentLight,
    fontSize: 12.5,
    fontWeight: "600",
    marginTop: 4,
  },
});
