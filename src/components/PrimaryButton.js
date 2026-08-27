import React from "react";
import { Pressable, Text, StyleSheet, ActivityIndicator } from "react-native";
import { colors } from "../theme/colors";

export default function PrimaryButton({
  title,
  onPress,
  variant = "solid",
  style,
  loading = false,
  disabled = false,
}) {
  const isOutline = variant === "outline";
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        isOutline ? styles.outline : styles.solid,
        isDisabled && styles.disabled,
        pressed && !isDisabled && { opacity: 0.85 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isOutline ? colors.accent : colors.white}
        />
      ) : (
        <Text style={[styles.text, isOutline && styles.textOutline]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  solid: {
    backgroundColor: colors.accent,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  textOutline: {
    color: colors.accent,
  },
});

