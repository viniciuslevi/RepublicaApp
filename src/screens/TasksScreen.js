import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import ScreenHeader from "../components/ScreenHeader";
import Avatar from "../components/Avatar";
import PrimaryButton from "../components/PrimaryButton";
import { colors } from "../theme/colors";
import { useAppData } from "../context/AppDataContext";

export default function TasksScreen() {
  const { tasks, residents, residentById, toggleTaskDone, assignTask, addTask } = useAppData();
  const [assignModalTask, setAssignModalTask] = useState(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const isFocused = useIsFocused();

  // RN's Modal portals outside this screen's view, so it can keep floating
  // on top even after the bottom-tab navigator switches away from this tab.
  // Force-close any open modal when the screen loses focus.
  useEffect(() => {
    if (!isFocused) {
      setAssignModalTask(null);
      setAddModalVisible(false);
    }
  }, [isFocused]);

  function renderTask({ item }) {
    const assignee = item.assigneeId ? residentById[item.assigneeId] : null;
    return (
      <View style={styles.taskCard}>
        <Pressable onPress={() => toggleTaskDone(item.id)} style={styles.checkWrap}>
          <View style={[styles.checkbox, item.done && styles.checkboxDone]}>
            {item.done ? <Ionicons name="checkmark" size={16} color={colors.white} /> : null}
          </View>
        </Pressable>

        <View style={styles.taskBody}>
          <Text style={[styles.taskTitle, item.done && styles.taskTitleDone]}>{item.title}</Text>
          <Text style={styles.taskMeta}>Recorrência: {item.recurrence}</Text>
        </View>

        <Pressable style={styles.assignBtn} onPress={() => setAssignModalTask(item)}>
          {assignee ? (
            <View style={styles.assigneeRow}>
              <Avatar name={assignee.name} size={26} />
              <Text style={styles.assigneeName}>{assignee.name}</Text>
            </View>
          ) : (
            <Text style={styles.assignPlaceholder}>Atribuir</Text>
          )}
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader kicker="EPIC · TAREFAS" title="Tarefas da casa" />

      <FlatList
        data={tasks}
        keyExtractor={(t) => t.id}
        renderItem={renderTask}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhuma tarefa cadastrada ainda.</Text>
        }
      />

      <Pressable style={styles.fab} onPress={() => setAddModalVisible(true)}>
        <Ionicons name="add" size={28} color={colors.white} />
      </Pressable>

      {/* Modal: atribuir responsável */}
      <Modal visible={!!assignModalTask} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setAssignModalTask(null)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Atribuir a</Text>
            {residents.map((r) => (
              <Pressable
                key={r.id}
                style={styles.residentRow}
                onPress={() => {
                  assignTask(assignModalTask.id, r.id);
                  setAssignModalTask(null);
                }}
              >
                <Avatar name={r.name} size={30} />
                <Text style={styles.residentName}>{r.name}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Modal: nova tarefa */}
      <Modal visible={addModalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Nova tarefa</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex.: Regar as plantas"
              placeholderTextColor={colors.textMuted}
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <PrimaryButton
              title="Adicionar"
              onPress={() => {
                if (newTitle.trim()) {
                  addTask(newTitle.trim(), "Sem recorrência");
                  setNewTitle("");
                  setAddModalVisible(false);
                }
              }}
              style={{ marginTop: 16 }}
            />
            <PrimaryButton
              title="Cancelar"
              variant="outline"
              onPress={() => {
                setNewTitle("");
                setAddModalVisible(false);
              }}
              style={{ marginTop: 10 }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16, paddingBottom: 100 },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 40 },
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  checkWrap: { marginRight: 12 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxDone: { backgroundColor: colors.accent },
  taskBody: { flex: 1 },
  taskTitle: { fontSize: 15.5, fontWeight: "600", color: colors.textDark },
  taskTitleDone: { textDecorationLine: "line-through", color: colors.textMuted },
  taskMeta: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  assignBtn: { marginLeft: 8 },
  assigneeRow: { flexDirection: "row", alignItems: "center" },
  assigneeName: { marginLeft: 6, fontSize: 12.5, color: colors.textDark, fontWeight: "600" },
  assignPlaceholder: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 13,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(20,61,54,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 24,
  },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: colors.primary, marginBottom: 16 },
  residentRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  residentName: { marginLeft: 12, fontSize: 15, color: colors.textDark, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: colors.surface,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textDark,
  },
});
