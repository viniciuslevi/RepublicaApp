import React, { useState, useEffect, useMemo, useRef } from "react";
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
  Animated,
  LayoutAnimation,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import ScreenHeader from "../components/ScreenHeader";
import Avatar from "../components/Avatar";
import PrimaryButton from "../components/PrimaryButton";
import { colors } from "../theme/colors";
import { useAppData } from "../context/AppDataContext";
import { useAuth } from "../context/AuthContext";

/**
 * Definição das pastas de recorrência da moradia.
 */
const FOLDERS = [
  {
    id: "Única",
    label: "Tarefas Pontuais",
    tag: "Pontual",
    description: "Demandas únicas e avulsas da moradia",
    icon: "pin",
    accentColor: colors.gold,
    bgColor: colors.goldLight,
  },
  {
    id: "Diária",
    label: "Tarefas Diárias",
    tag: "Rotina",
    description: "Atividades essenciais do dia a dia",
    icon: "repeat",
    accentColor: colors.accent,
    bgColor: colors.accentLight,
  },
  {
    id: "Semanal",
    label: "Tarefas Semanais",
    tag: "Escala",
    description: "Limpezas e manutenções da semana",
    icon: "calendar",
    accentColor: colors.primary,
    bgColor: colors.surface,
  },
  {
    id: "Mensal",
    label: "Tarefas Mensais",
    tag: "Controle",
    description: "Compras e vistorias do mês",
    icon: "calendar-number",
    accentColor: "#3B6E8C",
    bgColor: "#E2EEF5",
  },
];

const RECURRENCE_OPTIONS = [
  { id: "Única", label: "Única", sub: "Sem recorrência", icon: "pin-outline" },
  { id: "Diária", label: "Diária", sub: "Todo dia", icon: "repeat-outline" },
  { id: "Semanal", label: "Semanal", sub: "Toda semana", icon: "calendar-outline" },
  { id: "Mensal", label: "Mensal", sub: "Todo mês", icon: "calendar-number-outline" },
];

/**
 * Sistema de prioridades atrelado a tarefas com identificação visual por retângulos
 */
const PRIORITY_OPTIONS = [
  {
    id: "Alta",
    label: "Alta",
    sub: "Urgente",
    icon: "alert-circle",
    color: "#C0392B",
    bgColor: "#FDE8E8",
    lightBg: "#FFF1F1",
    borderColor: "#E74C3C",
    tagBorder: "#F8B4B4",
    dotColor: "#C0392B",
  },
  {
    id: "Média",
    label: "Média",
    sub: "Moderada",
    icon: "remove-circle",
    color: "#B8860B",
    bgColor: "#FEF3C7",
    lightBg: "#FFFBEB",
    borderColor: "#D97706",
    tagBorder: "#FDE68A",
    dotColor: "#B8860B",
  },
  {
    id: "Baixa",
    label: "Baixa",
    sub: "Tranquila",
    icon: "arrow-down-circle",
    color: "#2D7D54",
    bgColor: "#E1F5EB",
    lightBg: "#F0FDF4",
    borderColor: "#3F9B6E",
    tagBorder: "#A7F3D0",
    dotColor: "#2D7D54",
  },
];

function getPriorityConfig(priority) {
  return (
    PRIORITY_OPTIONS.find((p) => p.id === priority) ||
    PRIORITY_OPTIONS[1] // Média como padrão
  );
}

/**
 * Helper para transições fluidas de layout
 */
function triggerSmoothLayoutAnimation() {
  try {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  } catch (e) {
    // Ignora silenciosamente se o ambiente não possuir suporte
  }
}

/**
 * Barra superior animada que desce fluidamente do header ao entrar em modo de seleção
 */
function AnimatedSelectionBar({
  visible,
  count,
  onDelete,
  onCancel,
}) {
  const [mounted, setMounted] = useState(visible);
  const slideAnim = useRef(new Animated.Value(visible ? 0 : -50)).current;
  const opacityAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 190,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 190,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 160,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  if (!mounted && !visible) return null;

  return (
    <Animated.View
      style={[
        styles.selectionBar,
        {
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.selectionInfo}>
        <View style={styles.selectionBadge}>
          <Text style={styles.selectionBadgeText}>{count}</Text>
        </View>
        <Text style={styles.selectionText}>
          {count === 1 ? "1 tarefa selecionada" : `${count} tarefas selecionadas`}
        </Text>
      </View>

      <View style={styles.selectionActions}>
        <Pressable
          style={({ pressed }) => [
            styles.deleteSelectedBtn,
            pressed && { opacity: 0.8 },
          ]}
          onPress={onDelete}
        >
          <Ionicons name="trash" size={16} color={colors.white} />
          <Text style={styles.deleteSelectedText}>Excluir</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.cancelSelectionBtn,
            pressed && { opacity: 0.8 },
          ]}
          onPress={onCancel}
        >
          <Ionicons name="close" size={20} color={colors.white} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

/**
 * Botão Flutuante (FAB) com animação suave de escala, rotação e opacidade (estilo Material/iOS)
 */
function AnimatedFAB({ visible, onPress }) {
  const scaleAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const opacityAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const rotateAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 85,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 160,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const animatedStyle = {
    opacity: opacityAnim,
    transform: [
      { scale: scaleAnim },
      {
        rotate: rotateAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ["-45deg", "0deg"],
        }),
      },
    ],
  };

  return (
    <Animated.View
      style={[styles.fabContainer, animatedStyle]}
      pointerEvents={visible ? "auto" : "none"}
    >
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          pressed && { transform: [{ scale: 0.92 }], opacity: 0.9 },
        ]}
        onPress={onPress}
        hitSlop={8}
      >
        <Ionicons name="add" size={30} color={colors.white} />
      </Pressable>
    </Animated.View>
  );
}

/**
 * Card individual de tarefa com micro-tremor sutil e colapso de altura fluido ao ser removido
 */
function TaskCardItem({
  item,
  assignee,
  isAssignedToMe,
  isMyPendingTask,
  isSelectedForDeletion,
  isDeleting,
  isSelectionMode,
  onPress,
  onLongPress,
  onToggleDone,
  onAssignPress,
}) {
  const microShakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const heightProgress = useRef(new Animated.Value(1)).current;
  const measuredHeight = useRef(null);

  // Micro-tremor super sutil quando selecionado
  useEffect(() => {
    if (isSelectedForDeletion) {
      const shakeLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(microShakeAnim, {
            toValue: -1,
            duration: 110,
            useNativeDriver: true,
          }),
          Animated.timing(microShakeAnim, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.timing(microShakeAnim, {
            toValue: 0,
            duration: 110,
            useNativeDriver: true,
          }),
        ])
      );
      shakeLoop.start();
      return () => shakeLoop.stop();
    } else {
      microShakeAnim.stopAnimation();
      microShakeAnim.setValue(0);
    }
  }, [isSelectedForDeletion]);

  // Transição fluida de desvanecimento e colapso vertical suave na exclusão
  useEffect(() => {
    if (isDeleting) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.94,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(heightProgress, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [isDeleting]);

  const animatedTransformStyle = {
    opacity: fadeAnim,
    transform: [
      { scale: scaleAnim },
      {
        rotate: microShakeAnim.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: ["-0.4deg", "0deg", "0.4deg"],
        }),
      },
      {
        translateX: microShakeAnim.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [-0.6, 0, 0.6],
        }),
      },
    ],
  };

  const collapseContainerStyle = measuredHeight.current
    ? {
        height: heightProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, measuredHeight.current],
        }),
        marginBottom: heightProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 10],
        }),
        overflow: "hidden",
      }
    : { marginBottom: 10 };

  const priorityConfig = getPriorityConfig(item.priority);

  return (
    <Animated.View
      style={collapseContainerStyle}
      onLayout={(e) => {
        if (!measuredHeight.current && e.nativeEvent.layout.height > 0) {
          measuredHeight.current = e.nativeEvent.layout.height;
        }
      }}
    >
      <Animated.View style={animatedTransformStyle}>
        <Pressable
          style={({ pressed }) => [
            styles.taskItem,
            isMyPendingTask && styles.taskItemMyPending,
            isSelectedForDeletion && styles.taskItemSelectedForDeletion,
            item.done && styles.taskItemDone,
            pressed && { opacity: 0.9 },
          ]}
          onPress={onPress}
          onLongPress={onLongPress}
          delayLongPress={300}
        >
          {/* Checkbox de Seleção no Modo de Exclusão OU Conclusão */}
          {isSelectionMode ? (
            <View
              style={[
                styles.selectionCircle,
                isSelectedForDeletion && styles.selectionCircleActive,
              ]}
            >
              {isSelectedForDeletion ? (
                <Ionicons name="trash" size={13} color={colors.white} />
              ) : (
                <View style={styles.selectionCircleEmpty} />
              )}
            </View>
          ) : (
            <Pressable
              onPress={onToggleDone}
              style={styles.checkWrap}
              hitSlop={8}
            >
              <View
                style={[
                  styles.checkbox,
                  isMyPendingTask && styles.checkboxMyPending,
                  item.done && styles.checkboxDone,
                ]}
              >
                {item.done ? (
                  <Ionicons name="checkmark" size={15} color={colors.white} />
                ) : null}
              </View>
            </Pressable>
          )}

          {/* Conteúdo textual da Tarefa com Retângulo de Prioridade */}
          <View style={styles.taskTextWrap}>
            <View style={styles.taskBadgesRow}>
              {/* Retângulo de Prioridade */}
              <View
                style={[
                  styles.priorityBadge,
                  {
                    backgroundColor: priorityConfig.bgColor,
                    borderColor: priorityConfig.tagBorder,
                  },
                  item.done && styles.priorityBadgeDone,
                ]}
              >
                <View
                  style={[
                    styles.priorityDot,
                    { backgroundColor: priorityConfig.dotColor },
                    item.done && { opacity: 0.5 },
                  ]}
                />
                <Text
                  style={[
                    styles.priorityBadgeText,
                    { color: priorityConfig.color },
                    item.done && { opacity: 0.7 },
                  ]}
                >
                  {priorityConfig.label.toUpperCase()}
                </Text>
              </View>

              {/* Destaque "SUA VEZ" para tarefas pendentes do morador atual */}
              {isMyPendingTask && !isSelectedForDeletion ? (
                <View style={styles.myTaskNoticeBadge}>
                  <Ionicons name="person" size={10} color={colors.white} />
                  <Text style={styles.myTaskNoticeBadgeText}>SUA VEZ</Text>
                </View>
              ) : null}
            </View>

            <Text
              style={[
                styles.taskTitle,
                isMyPendingTask && styles.taskTitleMyPending,
                isSelectedForDeletion && styles.taskTitleSelected,
                item.done && styles.taskTitleDone,
              ]}
            >
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
          </View>

          {/* Atribuição de Responsável */}
          {!isSelectionMode ? (
            <Pressable
              style={({ pressed }) => [
                styles.assignBtn,
                pressed && { opacity: 0.75 },
              ]}
              onPress={onAssignPress}
              hitSlop={6}
            >
              {assignee ? (
                <View
                  style={[
                    styles.assigneePill,
                    isMyPendingTask && styles.assigneePillMyPending,
                  ]}
                >
                  <Avatar name={assignee.name} size={22} />
                  <Text
                    style={[
                      styles.assigneeName,
                      isMyPendingTask && styles.assigneeNameMyPending,
                    ]}
                    numberOfLines={1}
                  >
                    {isAssignedToMe ? "Você" : assignee.name}
                  </Text>
                </View>
              ) : (
                <View style={styles.unassignedPill}>
                  <Ionicons
                    name="person-add-outline"
                    size={12}
                    color={colors.accent}
                  />
                  <Text style={styles.unassignedText}>Atribuir</Text>
                </View>
              )}
            </Pressable>
          ) : (
            <View style={styles.selectHintIcon}>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={
                  isSelectedForDeletion ? colors.danger : colors.textMuted
                }
              />
            </View>
          )}
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

export default function TasksScreen() {
  const { user } = useAuth();
  const {
    tasks,
    residents,
    residentById,
    toggleTaskDone,
    assignTask,
    addTask,
    updateTask,
    deleteTask,
    deleteTasks,
  } = useAppData();

  // Estados dos modais
  const [assignModalTask, setAssignModalTask] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" | "edit"
  const [editingTask, setEditingTask] = useState(null);

  // Modo de seleção múltipla para exclusão (ativado via Long Press)
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  // IDs das tarefas em animação de saída/exclusão
  const [deletingTaskIds, setDeletingTaskIds] = useState([]);

  // Controle de pastas abertas/fechadas: todas iniciam FECHADAS ao entrar na tela
  const [openFolders, setOpenFolders] = useState({
    Única: false,
    Diária: false,
    Semanal: false,
    Mensal: false,
  });

  // Estados do formulário de criação/edição de tarefas
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formRecurrence, setFormRecurrence] = useState("Única");
  const [formPriority, setFormPriority] = useState("Média");
  const [formAssigneeId, setFormAssigneeId] = useState(null);
  const [formError, setFormError] = useState("");

  const isFocused = useIsFocused();
  const isSelectionMode = selectedTaskIds.length > 0;

  // Identifica o perfil de morador vinculado ao usuário logado
  const currentResident = useMemo(() => {
    if (!user) return residents[0] || null;
    return (
      residents.find(
        (r) =>
          r.id === user.id ||
          (r.email && user.email && r.email.toLowerCase() === user.email.toLowerCase()) ||
          (r.name && user.name && r.name.toLowerCase() === user.name.toLowerCase())
      ) || residents[0]
    );
  }, [residents, user]);

  const currentResidentId = currentResident?.id;

  // Fecha modais e desativa seleção automaticamente ao perder foco de tela
  useEffect(() => {
    if (!isFocused) {
      setAssignModalTask(null);
      setModalVisible(false);
      setSelectedTaskIds([]);
      setDeletingTaskIds([]);
    }
  }, [isFocused]);

  function toggleFolder(folderId) {
    triggerSmoothLayoutAnimation();
    setOpenFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  }

  // Abre modal para Criar Nova Tarefa
  function handleOpenCreateModal(defaultRecurrence = "Única", defaultPriority = "Média") {
    setModalMode("create");
    setEditingTask(null);
    setFormTitle("");
    setFormDescription("");
    setFormRecurrence(defaultRecurrence || "Única");
    setFormPriority(defaultPriority || "Média");
    setFormAssigneeId(currentResidentId || null);
    setFormError("");
    setModalVisible(true);
  }

  // Abre modal para Editar Tarefa Existente (Toque simples na tarefa)
  function handleOpenEditModal(task) {
    if (isSelectionMode) {
      toggleSelectTask(task.id);
      return;
    }

    setModalMode("edit");
    setEditingTask(task);
    setFormTitle(task.title || "");
    setFormDescription(task.description || "");
    setFormRecurrence(
      task.recurrence === "Sem recorrência" || !task.recurrence
        ? "Única"
        : task.recurrence
    );
    setFormPriority(task.priority || "Média");
    setFormAssigneeId(task.assigneeId || null);
    setFormError("");
    setModalVisible(true);
  }

  function handleCloseModal() {
    setModalVisible(false);
    setEditingTask(null);
    setFormTitle("");
    setFormDescription("");
    setFormRecurrence("Única");
    setFormPriority("Média");
    setFormAssigneeId(null);
    setFormError("");
  }

  // Salva criação ou edição de tarefa
  function handleSaveTask() {
    if (!formTitle.trim()) {
      setFormError("Informe o nome da tarefa.");
      return;
    }

    triggerSmoothLayoutAnimation();

    if (modalMode === "create") {
      addTask({
        title: formTitle.trim(),
        description: formDescription.trim(),
        assigneeId: formAssigneeId,
        recurrence: formRecurrence,
        priority: formPriority,
      });

      // Abre a pasta correspondente para visualizar a tarefa criada
      setOpenFolders((prev) => ({
        ...prev,
        [formRecurrence]: true,
      }));
    } else if (modalMode === "edit" && editingTask) {
      updateTask(editingTask.id, {
        title: formTitle.trim(),
        description: formDescription.trim(),
        assigneeId: formAssigneeId,
        recurrence: formRecurrence,
        priority: formPriority,
      });

      // Abre a pasta para onde a tarefa foi destinada caso tenha mudado
      setOpenFolders((prev) => ({
        ...prev,
        [formRecurrence]: true,
      }));
    }

    handleCloseModal();
  }

  // Exclui tarefa individualmente a partir do modal de edição com animação suave e colapso vertical
  function handleDeleteSingleTaskFromModal() {
    if (!editingTask) return;

    const idToDelete = editingTask.id;
    handleCloseModal();

    // Engatilha animação de desvanecimento e colapso de altura
    setDeletingTaskIds([idToDelete]);

    setTimeout(() => {
      triggerSmoothLayoutAnimation();
      deleteTask(idToDelete);
      setDeletingTaskIds([]);
    }, 230);
  }

  // Ativa seleção com Long Press
  function handleLongPressTask(taskId) {
    if (selectedTaskIds.includes(taskId)) {
      setSelectedTaskIds((prev) => prev.filter((id) => id !== taskId));
    } else {
      setSelectedTaskIds((prev) => [...prev, taskId]);
    }
  }

  // Alterna seleção de tarefa quando em modo de seleção
  function toggleSelectTask(taskId) {
    if (selectedTaskIds.includes(taskId)) {
      setSelectedTaskIds((prev) => prev.filter((id) => id !== taskId));
    } else {
      setSelectedTaskIds((prev) => [...prev, taskId]);
    }
  }

  // Cancela o modo de seleção
  function handleCancelSelection() {
    setSelectedTaskIds([]);
  }

  // Exclui todas as tarefas selecionadas com transição fluida
  function handleDeleteSelectedTasks() {
    if (selectedTaskIds.length === 0) return;

    const idsToDelete = [...selectedTaskIds];
    setDeletingTaskIds(idsToDelete);

    setTimeout(() => {
      triggerSmoothLayoutAnimation();
      deleteTasks(idsToDelete);
      setSelectedTaskIds([]);
      setDeletingTaskIds([]);
    }, 230);
  }

  // Agrupamento e ordenação de tarefas por pasta de recorrência e nível de prioridade (Alta -> Média -> Baixa)
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

    const priorityWeight = { Alta: 1, Média: 2, Baixa: 3 };

    // Ordenação em cada pasta:
    // 1. Tarefas Pendentes primeiro (ordenadas de Alta -> Média -> Baixa)
    // 2. Tarefas Concluídas ao final (também ordenadas de Alta -> Média -> Baixa)
    Object.keys(map).forEach((key) => {
      map[key].sort((a, b) => {
        if (a.done !== b.done) {
          return a.done ? 1 : -1;
        }

        const pA = priorityWeight[a.priority] || 2;
        const pB = priorityWeight[b.priority] || 2;
        if (pA !== pB) {
          return pA - pB;
        }

        return (b.id || "").localeCompare(a.id || "");
      });
    });

    return map;
  }, [tasks]);

  // Contagem de tarefas pendentes designadas especificamente para o usuário logado por pasta
  const myPendingCountByFolder = useMemo(() => {
    const counts = { Única: 0, Diária: 0, Semanal: 0, Mensal: 0 };
    if (!currentResidentId) return counts;

    tasks.forEach((task) => {
      if (!task.done && task.assigneeId === currentResidentId) {
        const rec =
          task.recurrence === "Sem recorrência" || !task.recurrence
            ? "Única"
            : task.recurrence;

        if (counts[rec] !== undefined) {
          counts[rec] += 1;
        } else {
          counts.Única += 1;
        }
      }
    });

    return counts;
  }, [tasks, currentResidentId]);

  // Estatísticas gerais
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.done).length;
    const pending = total - completed;
    const myTotalPending = Object.values(myPendingCountByFolder).reduce(
      (acc, c) => acc + c,
      0
    );
    return { total, completed, pending, myTotalPending };
  }, [tasks, myPendingCountByFolder]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScreenHeader kicker="TAREFAS" title="Tarefas da casa" />

      {/* BARRA DE SELEÇÃO COM ANIMAÇÃO DE SLIDE DESCENDO SUAVEMENTE DO TOPO */}
      <AnimatedSelectionBar
        visible={isSelectionMode}
        count={selectedTaskIds.length}
        onDelete={handleDeleteSelectedTasks}
        onCancel={handleCancelSelection}
      />

      <View style={styles.body}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Card Resumo com Destaque do Morador Logado */}
          <View style={styles.overviewCard}>
            <View style={styles.overviewUserRow}>
              <Avatar name={currentResident?.name || "Morador"} size={36} />
              <View style={styles.overviewInfo}>
                <Text style={styles.overviewUserGreeting}>
                  Olá, {currentResident?.name || "Morador"}! 👋
                </Text>
                <Text style={styles.overviewSub}>
                  {stats.myTotalPending > 0
                    ? `Você tem ${stats.myTotalPending} tarefa(s) pendente(s) designada(s) a você.`
                    : "Você não tem nenhuma tarefa pendente! Tudo em dia 🎉"}
                </Text>
              </View>
            </View>

            {/* Barra de Progresso Geral */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width:
                        stats.total > 0
                          ? `${Math.round((stats.completed / stats.total) * 100)}%`
                          : "0%",
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {stats.completed}/{stats.total} concluídas (
                {stats.total > 0
                  ? `${Math.round((stats.completed / stats.total) * 100)}%`
                  : "0%"}
                )
              </Text>
            </View>
          </View>

          {/* Dica de navegação e atalhos */}
          <View style={styles.foldersNoticeRow}>
            <Ionicons name="information-circle-outline" size={15} color={colors.textMuted} />
            <Text style={styles.foldersNoticeText}>
              Toque para editar · Segure para selecionar e remover
            </Text>
          </View>

          {/* Renderização das Pastas em Ordem de Prioridade */}
          {FOLDERS.map((folder) => {
            const folderTasks = tasksByFolder[folder.id] || [];
            const folderTotal = folderTasks.length;
            const folderCompleted = folderTasks.filter((t) => t.done).length;
            const myPendingInThisFolder = myPendingCountByFolder[folder.id] || 0;
            const isOpen = !!openFolders[folder.id];

            return (
              <View
                key={folder.id}
                style={[
                  styles.folderCard,
                  myPendingInThisFolder > 0 && styles.folderCardWithMyTasks,
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
                  <View style={styles.folderIconContainer}>
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

                    {/* CÍRCULO VERDE DE AVISO (Aparece se o usuário logado tiver tarefas a fazer nessa pasta) */}
                    {myPendingInThisFolder > 0 ? (
                      <View style={styles.greenAlertBadge}>
                        <View style={styles.greenAlertDot} />
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.folderHeaderTextWrap}>
                    <View style={styles.folderTitleRow}>
                      <Text style={styles.folderTitle}>{folder.label}</Text>

                      {/* Tag de Recorrência / Tipo */}
                      {folder.tag ? (
                        <View style={styles.folderTag}>
                          <Text style={styles.folderTagText}>
                            {folder.tag}
                          </Text>
                        </View>
                      ) : null}

                      {/* Badge Verde de Tarefas do Usuário */}
                      {myPendingInThisFolder > 0 ? (
                        <View style={styles.myTasksPill}>
                          <Text style={styles.myTasksPillText}>
                            ● {myPendingInThisFolder} para você
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
                          onPress={() => handleOpenCreateModal(folder.id)}
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
                          const isAssignedToMe =
                            !!currentResidentId &&
                            item.assigneeId === currentResidentId;

                          // HIGHLIGHT: Ativo apenas enquanto a tarefa do usuário logado NÃO estiver concluída
                          const isMyPendingTask = isAssignedToMe && !item.done;

                          // SELEÇÃO PARA EXCLUSÃO (Long Press)
                          const isSelectedForDeletion = selectedTaskIds.includes(
                            item.id
                          );
                          const isDeleting = deletingTaskIds.includes(item.id);

                          return (
                            <TaskCardItem
                              key={item.id}
                              item={item}
                              assignee={assignee}
                              isAssignedToMe={isAssignedToMe}
                              isMyPendingTask={isMyPendingTask}
                              isSelectedForDeletion={isSelectedForDeletion}
                              isDeleting={isDeleting}
                              isSelectionMode={isSelectionMode}
                              onPress={() => handleOpenEditModal(item)}
                              onLongPress={() => handleLongPressTask(item.id)}
                              onToggleDone={() => toggleTaskDone(item.id)}
                              onAssignPress={() => setAssignModalTask(item)}
                            />
                          );
                        })}

                        {/* Botão para adicionar tarefa diretamente dentro da pasta */}
                        <Pressable
                          style={({ pressed }) => [
                            styles.addInsideFolderBtn,
                            pressed && { opacity: 0.75 },
                          ]}
                          onPress={() => handleOpenCreateModal(folder.id)}
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

        {/* FAB ANIMADO (com escala suave, rotação e opacidade estilo Material/iOS) */}
        <AnimatedFAB
          visible={!isSelectionMode}
          onPress={() => handleOpenCreateModal("Única")}
        />
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
              const isMe = r.id === currentResidentId;

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
                    {r.name} {isMe ? "(Você)" : ""}
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

      {/* Modal Unificado: Criação e Edição Completa de Tarefa */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable style={styles.overlay} onPress={handleCloseModal}>
            <Pressable
              style={styles.createSheet}
              onPress={(e) => e.stopPropagation()}
            >
              {/* Header do Modal */}
              <View style={styles.sheetHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetTitle}>
                    {modalMode === "edit" ? "Editar Tarefa" : "Nova Tarefa"}
                  </Text>
                  <Text style={styles.sheetSub}>
                    {modalMode === "edit"
                      ? "Atualize os detalhes, responsável ou periodicidade"
                      : "Defina os detalhes e o responsável pela tarefa"}
                  </Text>
                </View>
                <Pressable
                  onPress={handleCloseModal}
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
                      value={formTitle}
                      onChangeText={(t) => {
                        setFormTitle(t);
                        if (formError) setFormError("");
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
                      value={formDescription}
                      onChangeText={setFormDescription}
                    />
                  </View>
                </View>

                {/* Campo: Recorrência */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Recorrência / Pasta</Text>
                  <View style={styles.recurrenceGrid}>
                    {RECURRENCE_OPTIONS.map((opt) => {
                      const isSelected = formRecurrence === opt.id;
                      return (
                        <Pressable
                          key={opt.id}
                          style={[
                            styles.recurrenceCard,
                            isSelected && styles.recurrenceCardActive,
                          ]}
                          onPress={() => setFormRecurrence(opt.id)}
                        >
                          <Ionicons
                            name={opt.icon}
                            size={18}
                            color={
                              isSelected
                                ? colors.primary
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

                {/* Campo: Prioridade com identificação em retângulos coloridos */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Prioridade da tarefa</Text>
                  <View style={styles.priorityGrid}>
                    {PRIORITY_OPTIONS.map((opt) => {
                      const isSelected = formPriority === opt.id;
                      return (
                        <Pressable
                          key={opt.id}
                          style={[
                            styles.priorityOptionCard,
                            isSelected && {
                              backgroundColor: opt.lightBg,
                              borderColor: opt.borderColor,
                              borderWidth: 2,
                            },
                          ]}
                          onPress={() => setFormPriority(opt.id)}
                        >
                          <View
                            style={[
                              styles.priorityOptionDot,
                              { backgroundColor: opt.color },
                            ]}
                          />
                          <View style={styles.priorityOptionContent}>
                            <Text
                              style={[
                                styles.priorityOptionLabel,
                                isSelected && {
                                  color: opt.color,
                                  fontWeight: "800",
                                },
                              ]}
                            >
                              {opt.label}
                            </Text>
                            <Text style={styles.priorityOptionSub}>
                              {opt.sub}
                            </Text>
                          </View>
                          {isSelected ? (
                            <Ionicons
                              name="checkmark-circle"
                              size={16}
                              color={opt.color}
                            />
                          ) : null}
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
                        formAssigneeId === null && styles.memberChipActive,
                      ]}
                      onPress={() => setFormAssigneeId(null)}
                    >
                      <View
                        style={[
                          styles.memberChipIconWrap,
                          formAssigneeId === null &&
                            styles.memberChipIconWrapActive,
                        ]}
                      >
                        <Ionicons
                          name="people-outline"
                          size={16}
                          color={
                            formAssigneeId === null
                              ? colors.accent
                              : colors.textMuted
                          }
                        />
                      </View>
                      <Text
                        style={[
                          styles.memberChipText,
                          formAssigneeId === null &&
                            styles.memberChipTextActive,
                        ]}
                      >
                        Em aberto
                      </Text>
                    </Pressable>

                    {/* Moradores cadastrados */}
                    {residents.map((r) => {
                      const isSelected = formAssigneeId === r.id;
                      const isMe = r.id === currentResidentId;

                      return (
                        <Pressable
                          key={r.id}
                          style={[
                            styles.memberChip,
                            isSelected && styles.memberChipActive,
                          ]}
                          onPress={() => setFormAssigneeId(r.id)}
                        >
                          <Avatar name={r.name} size={24} />
                          <Text
                            style={[
                              styles.memberChipText,
                              isSelected && styles.memberChipTextActive,
                            ]}
                            numberOfLines={1}
                          >
                            {r.name} {isMe ? "(Você)" : ""}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Erro de validação */}
                {formError ? (
                  <View style={styles.errorContainer}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={18}
                      color={colors.danger}
                    />
                    <Text style={styles.errorText}>{formError}</Text>
                  </View>
                ) : null}

                {/* Botões de Ação */}
                <View style={styles.modalActions}>
                  <PrimaryButton
                    title={
                      modalMode === "edit"
                        ? "Salvar alterações"
                        : "Criar tarefa"
                    }
                    onPress={handleSaveTask}
                    style={styles.submitBtn}
                  />

                  {/* Opção de Exclusão direta no Modal de Edição */}
                  {modalMode === "edit" ? (
                    <Pressable
                      style={styles.deleteInModalBtn}
                      onPress={handleDeleteSingleTaskFromModal}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={17}
                        color={colors.danger}
                      />
                      <Text style={styles.deleteInModalText}>
                        Excluir esta tarefa
                      </Text>
                    </Pressable>
                  ) : null}

                  <PrimaryButton
                    title="Cancelar"
                    variant="outline"
                    onPress={handleCloseModal}
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
  // Barra Flutuante de Seleção com Transição Deslizante
  selectionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1B2A22",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2F4639",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    zIndex: 10,
  },
  selectionInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectionBadge: {
    backgroundColor: colors.danger,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  selectionBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "800",
  },
  selectionText: {
    color: colors.white,
    fontSize: 13.5,
    fontWeight: "700",
  },
  selectionActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deleteSelectedBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.danger,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 5,
  },
  deleteSelectedText: {
    color: colors.white,
    fontSize: 12.5,
    fontWeight: "700",
  },
  cancelSelectionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  overviewCard: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2EAE5",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  overviewUserRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  overviewInfo: {
    flex: 1,
    marginLeft: 12,
  },
  overviewUserGreeting: {
    fontSize: 15.5,
    fontWeight: "800",
    color: colors.primary,
  },
  overviewSub: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 17,
  },
  progressContainer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEF3F0",
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: colors.surface,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.accent,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11.5,
    color: colors.textMuted,
    fontWeight: "600",
    marginTop: 6,
    textAlign: "right",
  },
  foldersNoticeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    marginHorizontal: 4,
    gap: 6,
  },
  foldersNoticeText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "600",
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
  folderCardWithMyTasks: {
    borderColor: "rgba(63, 155, 110, 0.5)",
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
  folderIconContainer: {
    position: "relative",
  },
  folderIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  greenAlertBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  greenAlertDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.white,
  },
  folderHeaderTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  folderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
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
  folderTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  myTasksPill: {
    backgroundColor: colors.accentLight,
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  myTasksPillText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: colors.primaryDark,
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
    // Espaçamento vertical gerenciado individualmente com animação de colapso
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
    borderWidth: 1.5,
    borderColor: "#E6ECE9",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  // HIGHLIGHT PARA TAREFA PENDENTE DO USUÁRIO LOGADO
  taskItemMyPending: {
    backgroundColor: "#F0FAF5",
    borderWidth: 2,
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  // HIGHLIGHT LEVE VERMELHO PARA TAREFA SELECIONADA PARA REMOÇÃO (Long Press)
  taskItemSelectedForDeletion: {
    backgroundColor: "#FFF5F5",
    borderWidth: 2,
    borderColor: colors.danger,
    shadowColor: colors.danger,
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  taskItemDone: {
    backgroundColor: "#F4F7F5",
    borderColor: "#E0E8E3",
    opacity: 0.82,
  },
  selectionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D5DFD9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  selectionCircleActive: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  selectionCircleEmpty: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "transparent",
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
  checkboxMyPending: {
    borderColor: colors.accent,
    borderWidth: 2.5,
  },
  checkboxDone: {
    backgroundColor: colors.accent,
  },
  taskTextWrap: {
    flex: 1,
    marginRight: 8,
  },
  taskBadgesRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 5,
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2.5,
    paddingHorizontal: 7,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  priorityBadgeDone: {
    opacity: 0.75,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  myTaskNoticeBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.accent,
    paddingVertical: 2.5,
    paddingHorizontal: 6,
    borderRadius: 6,
    gap: 4,
  },
  myTaskNoticeBadgeText: {
    color: colors.white,
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  taskTitle: {
    fontSize: 14.5,
    fontWeight: "700",
    color: colors.textDark,
    lineHeight: 19,
  },
  taskTitleMyPending: {
    color: colors.primaryDark,
    fontWeight: "800",
  },
  taskTitleSelected: {
    color: colors.danger,
    fontWeight: "800",
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
    maxWidth: 110,
  },
  assigneePillMyPending: {
    backgroundColor: colors.accentLight,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  assigneeName: {
    fontSize: 11.5,
    color: colors.textDark,
    fontWeight: "700",
  },
  assigneeNameMyPending: {
    color: colors.primaryDark,
    fontWeight: "800",
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
  selectHintIcon: {
    padding: 4,
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
  fabContainer: {
    position: "absolute",
    right: 20,
    bottom: 24,
    zIndex: 20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.accent,
    shadowOpacity: 0.38,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
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
  priorityGrid: {
    flexDirection: "row",
    gap: 8,
  },
  priorityOptionCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  priorityOptionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 7,
  },
  priorityOptionContent: {
    flex: 1,
  },
  priorityOptionLabel: {
    fontSize: 12.5,
    color: colors.textDark,
    fontWeight: "700",
  },
  priorityOptionSub: {
    fontSize: 10,
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
  deleteInModalBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF2F2",
    borderWidth: 1.5,
    borderColor: "#F8D7D7",
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
    marginBottom: 2,
  },
  deleteInModalText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: "700",
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
