import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
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

/**
 * Definição das pastas de recorrência em ordem de prioridade.
 * As tarefas pontuais (sem recorrência) ficam no topo por terem prioridade imediata.
 */
const FOLDERS = [
  {
    id: "Única",
    label: "Tarefas Pontuais",
    tag: "Alta Prioridade",
    description: "Demandas únicas e urgentes da moradia",
    icon: "pin",
    accentColor: colors.gold,
    bgColor: colors.goldLight,
    isPriority: true,
  },
  {
    id: "Diária",
    label: "Tarefas Diárias",
    tag: "Rotina",
    description: "Atividades essenciais do dia a dia",
    icon: "repeat",
    accentColor: colors.accent,
    bgColor: colors.accentLight,
    isPriority: false,
  },
  {
    id: "Semanal",
    label: "Tarefas Semanais",
    tag: "Escala",
    description: "Limpezas e manutenções da semana",
    icon: "calendar",
    accentColor: colors.primary,
    bgColor: colors.surface,
    isPriority: false,
  },
  {
    id: "Mensal",
    label: "Tarefas Mensais",
    tag: "Controle",
    description: "Compras e vistorias do mês",
    icon: "calendar-number",
    accentColor: "#3B6E8C",
    bgColor: "#E2EEF5",
    isPriority: false,
  },
];

const RECURRENCE_OPTIONS = [
  { id: "Única", label: "Única", sub: "Sem recorrência", icon: "pin-outline" },
  { id: "Diária", label: "Diária", sub: "Todo dia", icon: "repeat-outline" },
  { id: "Semanal", label: "Semanal", sub: "Toda semana", icon: "calendar-outline" },
  { id: "Mensal", label: "Mensal", sub: "Todo mês", icon: "calendar-number-outline" },
];

export default function TasksScreen() {
  const { tasks, residents, residentById, toggleTaskDone, assignTask, addTask } = useAppData();

  // Estados dos modais
  const [assignModalTask, setAssignModalTask] = useState(null);
  const [addModalVisible, setAddModalVisible] = useState(false);

  // Controle de pastas abertas/fechadas (Tarefas Pontuais e Diárias iniciam abertas)
  const [openFolders, setOpenFolders] = useState({
    Única: true,
    Diária: true,
    Semanal: false,
    Mensal: false,
  });

  // Estados do formulário de criação de tarefas
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newRecurrence, setNewRecurrence] = useState("Única");
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

  function toggleFolder(folderId) {
    setOpenFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  }

  function handleOpenAddModal(defaultRecurrence = "Única") {
    setNewTitle("");
    setNewDescription("");
    setNewRecurrence(defaultRecurrence || "Única");
    setNewAssigneeId(null);
    setAddError("");
    setAddModalVisible(true);
  }

  function handleCloseAddModal() {
    setNewTitle("");
    setNewDescription("");
    setNewRecurrence("Única");
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

  // Agrupamento de tarefas por pasta de recorrência (preparado para backend flat list)
  const tasksByFolder = useMemo(() => {
    const map = {
      Única: [],
      Diária: [],
      Semanal: [],
      Mensal: [],
    };

    tasks.forEach((task) => {
      const rec =
        task.recurrence === "Sem recorrência" || !task.recurrence
          ? "Única"
          : task.recurrence;

      if (map[rec]) {
        map[rec].push(task);
      } else {
        map.Única.push(task);
      }
    });

    return map;
  }, [tasks]);

  // Estatísticas gerais
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.done).length;
    const pending = total - completed;
    return { total, completed, pending };
  }, [tasks]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScreenHeader kicker="TAREFAS" title="Tarefas da casa" />

      <View style={styles.body}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Card Resumo de Progresso das Tarefas */}
          <View style={styles.overviewCard}>
            <View style={styles.overviewInfo}>
              <Text style={styles.overviewTitle}>Painel de Tarefas</Text>
              <Text style={styles.overviewSub}>
                {stats.pending > 0
                  ? `${stats.pending} tarefa(s) pendente(s) · ${stats.completed} concluída(s)`
                  : "Todas as tarefas da casa estão em dia! 🎉"}
              </Text>
            </View>
            <View style={styles.overviewBadge}>
              <Ionicons name="checkbox" size={16} color={colors.accent} />
              <Text style={styles.overviewBadgeText}>
                {stats.total > 0
                  ? `${Math.round((stats.completed / stats.total) * 100)}%`
                  : "0%"}
              </Text>
            </View>
          </View>

          {/* Renderização das Pastas em Ordem de Prioridade */}
          {FOLDERS.map((folder) => {
            const folderTasks = tasksByFolder[folder.id] || [];
            const folderTotal = folderTasks.length;
            const folderCompleted = folderTasks.filter((t) => t.done).length;
            const isOpen = !!openFolders[folder.id];

            return (
              <View
                key={folder.id}
                style={[
                  styles.folderCard,
                  folder.isPriority && styles.folderCardPriority,
                ]}
              >
                {/* Cabeçalho da Pasta (Clicável para expandir/recolher) */}
                <Pressable
                  style={({ pressed }) => [
                    styles.folderHeader,
                    isOpen && styles.folderHeaderOpen,
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={() => toggleFolder(folder.id)}
                >
                  <View
                    style={[
                      styles.folderIconWrap,
                      { backgroundColor: folder.bgColor },
                    ]}
                  >
                    <Ionicons
                      name={isOpen ? "folder-open" : folder.icon}
                      size={20}
                      color={folder.accentColor}
                    />
                  </View>

                  <View style={styles.folderHeaderTextWrap}>
                    <View style={styles.folderTitleRow}>
                      <Text style={styles.folderTitle}>{folder.label}</Text>
                      {folder.tag ? (
                        <View
                          style={[
                            styles.folderTag,
                            folder.isPriority && styles.folderTagPriority,
                          ]}
                        >
                          <Text
                            style={[
                              styles.folderTagText,
                              folder.isPriority && styles.folderTagTextPriority,
                            ]}
                          >
                            {folder.tag}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.folderSub} numberOfLines={1}>
                      {folderTotal === 0
                        ? "Nenhuma tarefa nesta pasta"
                        : `${folderTotal} tarefa(s) · ${folderCompleted} feita(s)`}
                    </Text>
                  </View>

                  <View style={styles.folderChevronWrap}>
                    <Ionicons
                      name={isOpen ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={colors.textMuted}
                    />
                  </View>
                </Pressable>

                {/* Conteúdo da Pasta (Lista de Tarefas) */}
                {isOpen ? (
                  <View style={styles.folderBody}>
                    {folderTasks.length === 0 ? (
                      <View style={styles.emptyFolderBox}>
                        <Ionicons
                          name="folder-open-outline"
                          size={32}
                          color="#BDD0C6"
                        />
                        <Text style={styles.emptyFolderText}>
                          Nenhuma tarefa nesta pasta ainda.
                        </Text>
                        <Pressable
                          style={styles.emptyFolderBtn}
                          onPress={() => handleOpenAddModal(folder.id)}
                        >
                          <Ionicons
                            name="add-circle"
                            size={16}
                            color={colors.accent}
                          />
                          <Text style={styles.emptyFolderBtnText}>
                            Adicionar {folder.label.toLowerCase()}
                          </Text>
                        </Pressable>
                      </View>
                    ) : (
                      <View style={styles.tasksListWrap}>
                        {folderTasks.map((item) => {
                          const assignee = item.assigneeId
                            ? residentById[item.assigneeId]
                            : null;

                          return (
                            <View
                              key={item.id}
                              style={[
                                styles.taskItem,
                                item.done && styles.taskItemDone,
                              ]}
                            >
                              {/* Checkbox de Conclusão */}
                              <Pressable
                                onPress={() => toggleTaskDone(item.id)}
                                style={styles.checkWrap}
                                hitSlop={8}
                              >
                                <View
                                  style={[
                                    styles.checkbox,
                                    item.done && styles.checkboxDone,
                                  ]}
                                >
                                  {item.done ? (
                                    <Ionicons
                                      name="checkmark"
                                      size={15}
                                      color={colors.white}
                                    />
                                  ) : null}
                                </View>
                              </Pressable>

                              {/* Conteúdo textual da Tarefa */}
                              <View style={styles.taskTextWrap}>
                                <Text
                                  style={[
                                    styles.taskTitle,
                                    item.done && styles.taskTitleDone,
                                  ]}
                                >
                                  {item.title}
                                </Text>
                                {item.description ? (
                                  <Text
                                    style={[
                                      styles.taskDesc,
                                      item.done && styles.taskDescDone,
                                    ]}
                                    numberOfLines={2}
                                  >
                                    {item.description}
                                  </Text>
                                ) : null}
                              </View>

                              {/* Atribuição de Responsável */}
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
                                    <Avatar name={assignee.name} size={22} />
                                    <Text
                                      style={styles.assigneeName}
                                      numberOfLines={1}
                                    >
                                      {assignee.name}
                                    </Text>
                                  </View>
                                ) : (
                                  <View style={styles.unassignedPill}>
                                    <Ionicons
                                      name="person-add-outline"
                                      size={12}
                                      color={colors.accent}
                                    />
                                    <Text style={styles.unassignedText}>
                                      Atribuir
                                    </Text>
                                  </View>
                                )}
                              </Pressable>
                            </View>
                          );
                        })}

                        {/* Botão para adicionar tarefa diretamente dentro da pasta */}
                        <Pressable
                          style={({ pressed }) => [
                            styles.addInsideFolderBtn,
                            pressed && { opacity: 0.75 },
                          ]}
                          onPress={() => handleOpenAddModal(folder.id)}
                        >
                          <Ionicons
                            name="add"
                            size={16}
                            color={colors.accent}
                          />
                          <Text style={styles.addInsideFolderText}>
                            Adicionar em {folder.label}
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                ) : null}
              </View>
            );
          })}
        </ScrollView>

        {/* FAB para abrir modal de criação global */}
        <Pressable
          style={({ pressed }) => [
            styles.fab,
            pressed && { transform: [{ scale: 0.94 }], opacity: 0.9 },
          ]}
          onPress={() => handleOpenAddModal("Única")}
        >
          <Ionicons name="add" size={30} color={colors.white} />
        </Pressable>
      </View>

      {/* Modal: Atribuir ou Reatribuir Responsável */}
      <Modal visible={!!assignModalTask} transparent animationType="fade">
        <Pressable
          style={styles.overlay}
          onPress={() => setAssignModalTask(null)}
        >
          <Pressable
            style={styles.sheet}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>Atribuir Responsável</Text>
                <Text style={styles.sheetSub}>
                  Tarefa:{" "}
                  <Text style={styles.sheetSubBold}>
                    {assignModalTask?.title}
                  </Text>
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
                assignModalTask?.assigneeId === null &&
                  styles.residentRowActive,
              ]}
              onPress={() => {
                assignTask(assignModalTask.id, null);
                setAssignModalTask(null);
              }}
            >
              <View style={styles.unassignAvatar}>
                <Ionicons
                  name="person-remove-outline"
                  size={16}
                  color={colors.textMuted}
                />
              </View>
              <Text style={styles.residentName}>Deixar sem responsável</Text>
              {assignModalTask?.assigneeId === null ? (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.accent}
                />
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
                  <Text
                    style={[
                      styles.residentName,
                      isCurrentAssignee && styles.residentNameActive,
                    ]}
                  >
                    {r.name}
                  </Text>
                  {isCurrentAssignee ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.accent}
                    />
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
            <Pressable
              style={styles.createSheet}
              onPress={(e) => e.stopPropagation()}
            >
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
                      placeholder="Ex.: Trocar lâmpada ou Limpar banheiro"
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
                      placeholder="Ex.: Comprar lâmpada LED no depósito e trocar..."
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
                  <View style={styles.fieldHeaderRow}>
                    <Text style={styles.fieldLabel}>Recorrência / Pasta</Text>
                    {newRecurrence === "Única" ? (
                      <Text style={styles.priorityHint}>
                        ⚡ Ficará no topo (Alta prioridade)
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.recurrenceGrid}>
                    {RECURRENCE_OPTIONS.map((opt) => {
                      const isSelected = newRecurrence === opt.id;
                      return (
                        <Pressable
                          key={opt.id}
                          style={[
                            styles.recurrenceCard,
                            isSelected && styles.recurrenceCardActive,
                            opt.id === "Única" &&
                              isSelected &&
                              styles.recurrenceCardPriorityActive,
                          ]}
                          onPress={() => setNewRecurrence(opt.id)}
                        >
                          <Ionicons
                            name={opt.icon}
                            size={18}
                            color={
                              isSelected
                                ? opt.id === "Única"
                                  ? colors.gold
                                  : colors.primary
                                : colors.textMuted
                            }
                          />
                          <View style={{ marginLeft: 6 }}>
                            <Text
                              style={[
                                styles.recurrenceCardLabel,
                                isSelected && styles.recurrenceCardLabelActive,
                              ]}
                            >
                              {opt.label}
                            </Text>
                            <Text style={styles.recurrenceCardSub}>
                              {opt.sub}
                            </Text>
                          </View>
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
                          newAssigneeId === null &&
                            styles.memberChipIconWrapActive,
                        ]}
                      >
                        <Ionicons
                          name="people-outline"
                          size={16}
                          color={
                            newAssigneeId === null
                              ? colors.accent
                              : colors.textMuted
                          }
                        />
                      </View>
                      <Text
                        style={[
                          styles.memberChipText,
                          newAssigneeId === null &&
                            styles.memberChipTextActive,
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
                    <Ionicons
                      name="alert-circle-outline"
                      size={18}
                      color={colors.danger}
                    />
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
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  overviewCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5ECE8",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  overviewInfo: {
    flex: 1,
  },
  overviewTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.primary,
  },
  overviewSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  overviewBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accentLight,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 12,
    gap: 4,
  },
  overviewBadgeText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: colors.primary,
  },
  folderCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: "#E3ECE7",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    overflow: "hidden",
  },
  folderCardPriority: {
    borderColor: "rgba(184, 134, 11, 0.4)",
  },
  folderHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: colors.white,
  },
  folderHeaderOpen: {
    borderBottomWidth: 1,
    borderBottomColor: "#EEF3F0",
    backgroundColor: "#FCFDFC",
  },
  folderIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  folderHeaderTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  folderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  folderTitle: {
    fontSize: 15.5,
    fontWeight: "800",
    color: colors.primary,
  },
  folderTag: {
    backgroundColor: colors.surface,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  folderTagPriority: {
    backgroundColor: colors.goldLight,
  },
  folderTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  folderTagTextPriority: {
    color: colors.gold,
  },
  folderSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  folderChevronWrap: {
    marginLeft: 8,
    padding: 4,
  },
  folderBody: {
    padding: 12,
    backgroundColor: "#F9FAF9",
  },
  tasksListWrap: {
    gap: 8,
  },
  emptyFolderBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  emptyFolderText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 8,
    textAlign: "center",
  },
  emptyFolderBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#D2E0D8",
    gap: 5,
  },
  emptyFolderBtnText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E6ECE9",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  taskItemDone: {
    backgroundColor: "#F4F7F5",
    borderColor: "#E0E8E3",
    opacity: 0.85,
  },
  checkWrap: {
    marginRight: 10,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxDone: {
    backgroundColor: colors.accent,
  },
  taskTextWrap: {
    flex: 1,
    marginRight: 8,
  },
  taskTitle: {
    fontSize: 14.5,
    fontWeight: "700",
    color: colors.textDark,
    lineHeight: 19,
  },
  taskTitleDone: {
    textDecorationLine: "line-through",
    color: colors.textMuted,
  },
  taskDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 3,
    lineHeight: 16,
  },
  taskDescDone: {
    textDecorationLine: "line-through",
    opacity: 0.65,
  },
  assignBtn: {
    alignSelf: "center",
  },
  assigneePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 14,
    gap: 5,
    maxWidth: 105,
  },
  assigneeName: {
    fontSize: 11.5,
    color: colors.textDark,
    fontWeight: "700",
  },
  unassignedPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#D2DFD8",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 4,
  },
  unassignedText: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 11.5,
  },
  addInsideFolderBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#DCE6E0",
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginTop: 4,
    gap: 5,
  },
  addInsideFolderText: {
    color: colors.primary,
    fontSize: 12.5,
    fontWeight: "700",
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
  fieldHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  fieldLabel: {
    color: colors.textDark,
    fontWeight: "700",
    fontSize: 13.5,
    marginBottom: 8,
  },
  priorityHint: {
    fontSize: 11,
    color: colors.gold,
    fontWeight: "700",
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
  recurrenceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  recurrenceCard: {
    flexBasis: "48%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  recurrenceCardActive: {
    backgroundColor: colors.accentLight,
    borderColor: colors.accent,
  },
  recurrenceCardPriorityActive: {
    backgroundColor: colors.goldLight,
    borderColor: colors.gold,
  },
  recurrenceCardLabel: {
    fontSize: 13,
    color: colors.textDark,
    fontWeight: "700",
  },
  recurrenceCardLabelActive: {
    color: colors.primary,
  },
  recurrenceCardSub: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 1,
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
