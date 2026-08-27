import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import ScreenHeader from "../components/ScreenHeader";
import Avatar from "../components/Avatar";
import PrimaryButton from "../components/PrimaryButton";
import { colors } from "../theme/colors";
import { useAppData } from "../context/AppDataContext";

const RECURRENCE_OPTIONS = [
  { id: "Diária", label: "Diária", icon: "repeat-outline" },
  { id: "Semanal", label: "Semanal", icon: "calendar-outline" },
  { id: "Mensal", label: "Mensal", icon: "calendar-number-outline" },
];

export default function TasksScreen() {
  const { tasks, residents, residentById, toggleTaskDone, assignTask, addTask } = useAppData();

  // Estados dos modais
  const [assignModalTask, setAssignModalTask] = useState(null);
  const [addModalVisible, setAddModalVisible] = useState(false);

  // Estados do formulário de criação de tarefas
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newRecurrence, setNewRecurrence] = useState("Semanal");
  const [newAssigneeId, setNewAssigneeId] = useState(null);
  const [addError, setAddError] = useState("");

  const isFocused = useIsFocused();

  // Fecha modais automaticamente ao perder foco de tela
  useEffect(() => {
    if (!isFocused) {
      setAssignModalTask(null);
      setAddModalVisible(false);
    }
  }, [isFocused]);

  function handleOpenAddModal() {
    setNewTitle("");
    setNewDescription("");
    setNewRecurrence("Semanal");
    setNewAssigneeId(null);
    setAddError("");
    setAddModalVisible(true);
  }

  function handleCloseAddModal() {
    setNewTitle("");
    setNewDescription("");
    setNewRecurrence("Semanal");
    setNewAssigneeId(null);
    setAddError("");
    setAddModalVisible(false);
  }

  function handleCreateTask() {
    if (!newTitle.trim()) {
      setAddError("Informe o nome da tarefa.");
      return;
    }

    addTask({
      title: newTitle.trim(),
      description: newDescription.trim(),
      assigneeId: newAssigneeId,
      recurrence: newRecurrence,
    });

    handleCloseAddModal();
  }

  function getRecurrenceIcon(recurrence) {
    switch (recurrence) {
      case "Diária":
        return "repeat-outline";
      case "Mensal":
        return "calendar-number-outline";
      case "Semanal":
      default:
        return "calendar-outline";
    }
  }

  function renderTask({ item }) {
    const assignee = item.assigneeId ? residentById[item.assigneeId] : null;
    const recurrenceIcon = getRecurrenceIcon(item.recurrence);

    return (
      <View style={[styles.taskCard, item.done && styles.taskCardDone]}>
        {/* Checkbox de conclusão */}
        <Pressable
          onPress={() => toggleTaskDone(item.id)}
          style={styles.checkWrap}
          hitSlop={8}
        >
          <View style={[styles.checkbox, item.done && styles.checkboxDone]}>
            {item.done ? <Ionicons name="checkmark" size={16} color={colors.white} /> : null}
          </View>
        </Pressable>

        {/* Informações da Tarefa */}
        <View style={styles.taskBody}>
          <Text style={[styles.taskTitle, item.done && styles.taskTitleDone]}>
            {item.title}
          </Text>

          {item.description ? (
            <Text
              style={[styles.taskDesc, item.done && styles.taskDescDone]}
              numberOfLines={2}
            >
              {item.description}
            </Text>
          ) : null}

          {/* Linha de Metadados: Recorrência */}
          <View style={styles.taskMetaRow}>
            <View style={styles.recurrenceBadge}>
              <Ionicons name={recurrenceIcon} size={12} color={colors.accent} />
              <Text style={styles.recurrenceBadgeText}>{item.recurrence}</Text>
            </View>
          </View>
        </View>

        {/* Botão / Indicador de Atribuição de Responsável */}
        <Pressable
          style={({ pressed }) => [
            styles.assignBtn,
            pressed && { opacity: 0.75 },
          ]}
          onPress={() => setAssignModalTask(item)}
          hitSlop={6}
        >
          {assignee ? (
            <View style={styles.assigneePill}>
              <Avatar name={assignee.name} size={24} />
              <Text style={styles.assigneeName} numberOfLines={1}>
                {assignee.name}
              </Text>
            </View>
          ) : (
            <View style={styles.unassignedPill}>
              <Ionicons name="person-add-outline" size={13} color={colors.accent} />
              <Text style={styles.unassignedText}>Atribuir</Text>
            </View>
          )}
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScreenHeader kicker="TAREFAS" title="Tarefas da casa" />

      <View style={styles.body}>
        <FlatList
          data={tasks}
          keyExtractor={(t) => t.id}
          renderItem={renderTask}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="checkbox-outline" size={48} color="#C4D4CC" />
              <Text style={styles.emptyTitle}>Nenhuma tarefa cadastrada</Text>
              <Text style={styles.emptySub}>
                Toque no botão abaixo para adicionar a primeira tarefa da moradia.
              </Text>
            </View>
          }
        />

        {/* FAB para abrir modal de criação */}
        <Pressable
          style={({ pressed }) => [
            styles.fab,
            pressed && { transform: [{ scale: 0.94 }], opacity: 0.9 },
          ]}
          onPress={handleOpenAddModal}
        >
          <Ionicons name="add" size={30} color={colors.white} />
        </Pressable>
      </View>

      {/* Modal: Atribuir ou Reatribuir Responsável */}
      <Modal visible={!!assignModalTask} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setAssignModalTask(null)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Atribuir Responsável</Text>
                <Text style={styles.sheetSub}>
                  Tarefa: <Text style={styles.sheetSubBold}>{assignModalTask?.title}</Text>
                </Text>
              </View>
              <Pressable
                onPress={() => setAssignModalTask(null)}
                style={styles.closeIconBtn}
                hitSlop={8}
              >
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </Pressable>
            </View>

            {/* Opção de Desatribuir */}
            <Pressable
              style={[
                styles.residentRow,
                assignModalTask?.assigneeId === null && styles.residentRowActive,
              ]}
              onPress={() => {
                assignTask(assignModalTask.id, null);
                setAssignModalTask(null);
              }}
            >
              <View style={styles.unassignAvatar}>
                <Ionicons name="person-remove-outline" size={16} color={colors.textMuted} />
              </View>
              <Text style={styles.residentName}>Deixar sem responsável</Text>
              {assignModalTask?.assigneeId === null ? (
                <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
              ) : null}
            </Pressable>

            {/* Lista de Moradores */}
            {residents.map((r) => {
              const isCurrentAssignee = assignModalTask?.assigneeId === r.id;
              return (
                <Pressable
                  key={r.id}
                  style={[
                    styles.residentRow,
                    isCurrentAssignee && styles.residentRowActive,
                  ]}
                  onPress={() => {
                    assignTask(assignModalTask.id, r.id);
                    setAssignModalTask(null);
                  }}
                >
                  <Avatar name={r.name} size={32} />
                  <Text style={[styles.residentName, isCurrentAssignee && styles.residentNameActive]}>
                    {r.name}
                  </Text>
                  {isCurrentAssignee ? (
                    <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
                  ) : null}
                </Pressable>
              );
            })}

            <PrimaryButton
              title="Fechar"
              variant="outline"
              onPress={() => setAssignModalTask(null)}
              style={{ marginTop: 14 }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal: Criação Completa e Robusta de Tarefa */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable style={styles.overlay} onPress={handleCloseAddModal}>
            <Pressable style={styles.createSheet} onPress={(e) => e.stopPropagation()}>
              {/* Header do Modal */}
              <View style={styles.sheetHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetTitle}>Nova Tarefa</Text>
                  <Text style={styles.sheetSub}>
                    Defina os detalhes e o responsável pela tarefa
                  </Text>
                </View>
                <Pressable
                  onPress={handleCloseAddModal}
                  style={styles.closeIconBtn}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={22} color={colors.textMuted} />
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.formScroll}
              >
                {/* Campo: Nome da Tarefa */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Nome da tarefa *</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons
                      name="checkbox-outline"
                      size={18}
                      color={colors.textMuted}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Ex.: Limpar o banheiro ou Lavar louça"
                      placeholderTextColor={colors.textMuted}
                      value={newTitle}
                      onChangeText={(t) => {
                        setNewTitle(t);
                        if (addError) setAddError("");
                      }}
                    />
                  </View>
                </View>

                {/* Campo: Descrição da Tarefa (Opcional) */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Descrição (opcional)</Text>
                  <View style={[styles.inputWrap, styles.inputWrapMultiline]}>
                    <Ionicons
                      name="document-text-outline"
                      size={18}
                      color={colors.textMuted}
                      style={[styles.inputIcon, { marginTop: 12 }]}
                    />
                    <TextInput
                      style={[styles.input, styles.inputMultiline]}
                      placeholder="Ex.: Lavar o box, trocar o lixo e repor sabonete..."
                      placeholderTextColor={colors.textMuted}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      value={newDescription}
                      onChangeText={setNewDescription}
                    />
                  </View>
                </View>

                {/* Campo: Recorrência */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Recorrência</Text>
                  <View style={styles.recurrenceRow}>
                    {RECURRENCE_OPTIONS.map((opt) => {
                      const isSelected = newRecurrence === opt.id;
                      return (
                        <Pressable
                          key={opt.id}
                          style={[
                            styles.recurrenceChip,
                            isSelected && styles.recurrenceChipActive,
                          ]}
                          onPress={() => setNewRecurrence(opt.id)}
                        >
                          <Ionicons
                            name={opt.icon}
                            size={16}
                            color={isSelected ? colors.primary : colors.textMuted}
                          />
                          <Text
                            style={[
                              styles.recurrenceChipText,
                              isSelected && styles.recurrenceChipTextActive,
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Campo: Atribuir a um Membro */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Designar responsável</Text>
                  <View style={styles.membersGrid}>
                    {/* Opção sem responsável */}
                    <Pressable
                      style={[
                        styles.memberChip,
                        newAssigneeId === null && styles.memberChipActive,
                      ]}
                      onPress={() => setNewAssigneeId(null)}
                    >
                      <View
                        style={[
                          styles.memberChipIconWrap,
                          newAssigneeId === null && styles.memberChipIconWrapActive,
                        ]}
                      >
                        <Ionicons
                          name="people-outline"
                          size={16}
                          color={newAssigneeId === null ? colors.accent : colors.textMuted}
                        />
                      </View>
                      <Text
                        style={[
                          styles.memberChipText,
                          newAssigneeId === null && styles.memberChipTextActive,
                        ]}
                      >
                        Em aberto
                      </Text>
                    </Pressable>

                    {/* Moradores cadastrados */}
                    {residents.map((r) => {
                      const isSelected = newAssigneeId === r.id;
                      return (
                        <Pressable
                          key={r.id}
                          style={[
                            styles.memberChip,
                            isSelected && styles.memberChipActive,
                          ]}
                          onPress={() => setNewAssigneeId(r.id)}
                        >
                          <Avatar name={r.name} size={24} />
                          <Text
                            style={[
                              styles.memberChipText,
                              isSelected && styles.memberChipTextActive,
                            ]}
                            numberOfLines={1}
                          >
                            {r.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Erro de validação */}
                {addError ? (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
                    <Text style={styles.errorText}>{addError}</Text>
                  </View>
                ) : null}

                {/* Botões de Ação */}
                <View style={styles.modalActions}>
                  <PrimaryButton
                    title="Criar tarefa"
                    onPress={handleCreateTask}
                    style={styles.submitBtn}
                  />
                  <PrimaryButton
                    title="Cancelar"
                    variant="outline"
                    onPress={handleCloseAddModal}
                  />
                </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  flex: {
    flex: 1,
  },
  body: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
    marginTop: 14,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E6ECE9",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  taskCardDone: {
    backgroundColor: "#F7FAF8",
    borderColor: "#E0EAE4",
    opacity: 0.85,
  },
  checkWrap: {
    marginRight: 12,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxDone: {
    backgroundColor: colors.accent,
  },
  taskBody: {
    flex: 1,
    marginRight: 8,
  },
  taskTitle: {
    fontSize: 15.5,
    fontWeight: "700",
    color: colors.textDark,
    lineHeight: 20,
  },
  taskTitleDone: {
    textDecorationLine: "line-through",
    color: colors.textMuted,
  },
  taskDesc: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 17,
  },
  taskDescDone: {
    textDecorationLine: "line-through",
    opacity: 0.7,
  },
  taskMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  recurrenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accentLight,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 6,
    gap: 4,
  },
  recurrenceBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  assignBtn: {
    alignSelf: "center",
  },
  assigneePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
    gap: 6,
    maxWidth: 110,
  },
  assigneeName: {
    fontSize: 12,
    color: colors.textDark,
    fontWeight: "700",
  },
  unassignedPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#D2DFD8",
    borderRadius: 14,
    paddingVertical: 5,
    paddingHorizontal: 9,
    gap: 5,
  },
  unassignedText: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 12,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(13, 41, 36, 0.65)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 22,
    paddingBottom: 32,
  },
  createSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 28,
    maxHeight: "88%",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: colors.primary,
  },
  sheetSub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  sheetSubBold: {
    fontWeight: "700",
    color: colors.textDark,
  },
  closeIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  formScroll: {
    paddingBottom: 16,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    color: colors.textDark,
    fontWeight: "700",
    fontSize: 13.5,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.surface,
    paddingHorizontal: 12,
  },
  inputWrapMultiline: {
    alignItems: "flex-start",
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14.5,
    color: colors.textDark,
  },
  inputMultiline: {
    minHeight: 70,
    paddingTop: 10,
    paddingBottom: 10,
  },
  recurrenceRow: {
    flexDirection: "row",
    gap: 8,
  },
  recurrenceChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 6,
  },
  recurrenceChipActive: {
    backgroundColor: colors.accentLight,
    borderColor: colors.accent,
  },
  recurrenceChipText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "600",
  },
  recurrenceChipTextActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  membersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  memberChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.surface,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 6,
  },
  memberChipActive: {
    backgroundColor: colors.accentLight,
    borderColor: colors.accent,
  },
  memberChipIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  memberChipIconWrapActive: {
    backgroundColor: colors.white,
  },
  memberChipText: {
    fontSize: 13,
    color: colors.textDark,
    fontWeight: "600",
  },
  memberChipTextActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDE8E8",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    marginLeft: 6,
    flex: 1,
    fontWeight: "600",
  },
  modalActions: {
    marginTop: 6,
    gap: 8,
  },
  submitBtn: {
    marginBottom: 2,
  },
  residentRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
  },
  residentRowActive: {
    backgroundColor: colors.accentLight,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  unassignAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  residentName: {
    marginLeft: 12,
    fontSize: 14.5,
    color: colors.textDark,
    fontWeight: "600",
    flex: 1,
  },
  residentNameActive: {
    color: colors.primary,
    fontWeight: "700",
  },
});

