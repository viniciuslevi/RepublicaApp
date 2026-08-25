import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

export default function Avatar({ name, size = 32 }) {
  const initial = name ? name.trim().charAt(0).toUpperCase() : "?";
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.letter, { fontSize: size * 0.42 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  letter: {
    color: colors.white,
    fontWeight: "700",
  },
});
