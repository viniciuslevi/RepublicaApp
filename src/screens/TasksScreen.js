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
import { useIsFocused, useNavigation } from "@react-navigation/native";
import ScreenHeader from "../components/ScreenHeader";
import Avatar from "../components/Avatar";
import PrimaryButton from "../components/PrimaryButton";
import { colors } from "../theme/colors";
import { useAppData } from "../context/AppDataContext";
import { useAuth } from "../context/AuthContext";

let DateTimePickerAndroid = null;
try {
  const dtp = require("@react-native-community/datetimepicker");
  DateTimePickerAndroid = dtp.DateTimePickerAndroid || null;
} catch (e) {
  DateTimePickerAndroid = null;
}

/**
 * Definição das pastas de recorrência da moradia.
 */
const FOLDERS = [
  {
    id: "Única",
    label: "Tarefas Pontuais",
    description: "Demandas únicas e avulsas da moradia",
    icon: "pin",
    accentColor: colors.gold,
    bgColor: colors.goldLight,
  },
  {
    id: "Diária",
    label: "Tarefas Diárias",
    description: "Atividades essenciais do dia a dia",
    icon: "repeat",
    accentColor: colors.accent,
    bgColor: colors.accentLight,
  },
  {
    id: "Semanal",
    label: "Tarefas Semanais",
    description: "Limpezas e manutenções da semana",
    icon: "calendar",
    accentColor: colors.primary,
    bgColor: colors.surface,
  },
  {
    id: "Mensal",
    label: "Tarefas Mensais",
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

const WEEKDAY_NAMES = [
  { id: 1, label: "Segunda", short: "Seg" },
  { id: 2, label: "Terça", short: "Ter" },
  { id: 3, label: "Quarta", short: "Qua" },
  { id: 4, label: "Quinta", short: "Qui" },
  { id: 5, label: "Sexta", short: "Sex" },
  { id: 6, label: "Sábado", short: "Sáb" },
  { id: 0, label: "Domingo", short: "Dom" },
];

function formatDateToBR(dateStrOrObj) {
  if (!dateStrOrObj) return "";
  if (typeof dateStrOrObj === "string") {
    const cleanStr = dateStrOrObj.split("T")[0];
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(cleanStr);
    if (match) {
      return `${match[3]}/${match[2]}/${match[1]}`;
    }
  }
  const d = new Date(dateStrOrObj);
  if (isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function normalizeInputDate(val) {
  if (!val) return null;
  const str = String(val).trim();
  const brMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(str);
  if (brMatch) {
    const d = String(brMatch[1]).padStart(2, "0");
    const m = String(brMatch[2]).padStart(2, "0");
    const y = brMatch[3];
    return `${y}-${m}-${d}`;
  }
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(str);
  if (isoMatch) {
    return str;
  }
  return null;
}

function normalizeInputTime(val) {
  if (!val) return null;
  const str = String(val).trim();
  const match = /^(\d{1,2}):(\d{2})$/.exec(str);
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatInputDateMask(text) {
  const cleaned = text.replace(/\D/g, "").slice(0, 8);
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 4) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
  return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4)}`;
}

function formatInputTimeMask(text) {
  const cleaned = text.replace(/\D/g, "").slice(0, 4);
  if (cleaned.length <= 2) return cleaned;
  return `${cleaned.slice(0, 2)}:${cleaned.slice(2)}`;
}

function getTodayDateBR() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function getTomorrowDateBR() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function getIn7DaysDateBR() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function getScheduleBadgeInfo(item) {
  if (item.recurrence === "Única") {
    if (!item.dueDate && !item.dueTime) return null;
    const parts = [];
    if (item.dueDate) {
      parts.push(formatDateToBR(item.dueDate));
    }
    if (item.dueTime) {
      parts.push(`às ${item.dueTime}`);
    }
    return {
      icon: "calendar-outline",
      text: parts.join(" "),
      color: colors.gold,
      bgColor: colors.goldLight,
      borderColor: colors.gold,
    };
  }
  if (item.recurrence === "Diária") {
    if (!item.dueTime) return null;
    return {
      icon: "time-outline",
      text: `Todo dia às ${item.dueTime}`,
      color: colors.accent,
      bgColor: colors.accentLight,
      borderColor: colors.accent,
    };
  }
  if (item.recurrence === "Semanal") {
    const dayObj = WEEKDAY_NAMES.find((w) => w.id === item.weekDay);
    const prefix = item.weekDay === 0 || item.weekDay === 6 ? "Todo" : "Toda";
    const dayLabel = dayObj ? `${prefix} ${dayObj.label}` : "Toda semana";
    const text = item.dueTime ? `${dayLabel} às ${item.dueTime}` : dayLabel;
    return {
      icon: "calendar-outline",
      text,
      color: colors.primary,
      bgColor: colors.surface,
      borderColor: colors.primary,
    };
  }
  if (item.recurrence === "Mensal") {
    const dayLabel = item.monthDay ? `Todo dia ${item.monthDay}` : "Todo mês";
    const text = item.dueTime ? `${dayLabel} às ${item.dueTime}` : dayLabel;
    return {
      icon: "calendar-number-outline",
      text,
      color: "#3B6E8C",
      bgColor: "#E2EEF5",
      borderColor: "#3B6E8C",
    };
  }
  return null;
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
  const scheduleInfo = getScheduleBadgeInfo(item);

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

              {/* Badge de Agendamento/Recorrência (Data / Hora / Dia da Semana / Dia do Mês) */}
              {scheduleInfo ? (
                <View
                  style={[
                    styles.scheduleBadge,
                    {
                      backgroundColor: scheduleInfo.bgColor,
                      borderColor: scheduleInfo.borderColor,
                    },
                    item.done && styles.scheduleBadgeDone,
                  ]}
                >
                  <Ionicons
                    name={scheduleInfo.icon}
                    size={11}
                    color={scheduleInfo.color}
                  />
                  <Text
                    style={[
                      styles.scheduleBadgeText,
                      { color: scheduleInfo.color },
                      item.done && { opacity: 0.7 },
                    ]}
                  >
                    {scheduleInfo.text}
                  </Text>
                </View>
              ) : null}

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
  const navigation = useNavigation();
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
  const [formDueDate, setFormDueDate] = useState("");
  const [formDueTime, setFormDueTime] = useState("");
  const [formWeekDay, setFormWeekDay] = useState(null);
  const [formMonthDay, setFormMonthDay] = useState(null);
  const [formError, setFormError] = useState("");

  // Modal Fallback de Horário (para web ou quando o dialog nativo não estiver ativo)
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [tempHour, setTempHour] = useState("12");
  const [tempMinute, setTempMinute] = useState("00");

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
      setTimePickerVisible(false);
    }
  }, [isFocused]);

  function toggleFolder(folderId) {
    triggerSmoothLayoutAnimation();
    setOpenFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  }

  // Abre seletor de Horário nativo do Android ou modal interativo
  function handleOpenTimePicker() {
    if (Platform.OS === "android" && DateTimePickerAndroid) {
      let initialDate = new Date();
      if (formDueTime) {
        const parts = formDueTime.split(":");
        if (parts.length === 2) {
          initialDate.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
        }
      }
      DateTimePickerAndroid.open({
        value: initialDate,
        mode: "time",
        is24Hour: true,
        onValueChange: (_event, selectedDate) => {
          if (selectedDate) {
            const h = String(selectedDate.getHours()).padStart(2, "0");
            const m = String(selectedDate.getMinutes()).padStart(2, "0");
            setFormDueTime(`${h}:${m}`);
            if (formError) setFormError("");
          }
        },
        onDismiss: () => {},
      });
    } else {
      if (formDueTime) {
        const parts = formDueTime.split(":");
        if (parts.length === 2) {
          setTempHour(parts[0].padStart(2, "0"));
          setTempMinute(parts[1].padStart(2, "0"));
        }
      } else {
        const now = new Date();
        setTempHour(String(now.getHours()).padStart(2, "0"));
        setTempMinute("00");
      }
      setTimePickerVisible(true);
    }
  }

  // Abre seletor de Data nativo do Android
  function handleOpenDatePicker() {
    if (Platform.OS === "android" && DateTimePickerAndroid) {
      let initialDate = new Date();
      if (formDueDate) {
        const parts = formDueDate.split("/");
        if (parts.length === 3) {
          initialDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        }
      }
      DateTimePickerAndroid.open({
        value: initialDate,
        mode: "date",
        onValueChange: (_event, selectedDate) => {
          if (selectedDate) {
            const d = String(selectedDate.getDate()).padStart(2, "0");
            const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
            const y = selectedDate.getFullYear();
            setFormDueDate(`${d}/${m}/${y}`);
            if (formError) setFormError("");
          }
        },
        onDismiss: () => {},
      });
    }
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
    setFormDueDate("");
    setFormDueTime("");
    setFormWeekDay(null);
    setFormMonthDay(null);
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
    setFormDueDate(task.dueDate ? formatDateToBR(task.dueDate) : "");
    setFormDueTime(task.dueTime || "");
    setFormWeekDay(task.weekDay != null ? task.weekDay : null);
    setFormMonthDay(task.monthDay != null ? Number(task.monthDay) : null);
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
    setFormDueDate("");
    setFormDueTime("");
    setFormWeekDay(null);
    setFormMonthDay(null);
    setFormError("");
    setTimePickerVisible(false);
  }

  // Salva criação ou edição de tarefa
  function handleSaveTask() {
    if (!formTitle.trim()) {
      setFormError("Informe o nome da tarefa.");
      return;
    }

    let parsedDueDate = null;
    let parsedDueTime = null;
    let parsedWeekDay = null;
    let parsedMonthDay = null;

    if (formDueTime && formDueTime.trim()) {
      parsedDueTime = normalizeInputTime(formDueTime);
      if (!parsedDueTime) {
        setFormError("Horário inválido. Selecione um horário válido.");
        return;
      }
    }

    if (formRecurrence === "Única") {
      if (formDueDate && formDueDate.trim()) {
        parsedDueDate = normalizeInputDate(formDueDate);
        if (!parsedDueDate) {
          setFormError("Data inválida. Selecione uma data válida.");
          return;
        }
      }
    } else if (formRecurrence === "Diária") {
      // Horário opcional (já validado acima)
    } else if (formRecurrence === "Semanal") {
      if (formWeekDay === null || formWeekDay === undefined) {
        setFormError("Selecione o dia da semana para a tarefa semanal.");
        return;
      }
      parsedWeekDay = Number(formWeekDay);
    } else if (formRecurrence === "Mensal") {
      if (formMonthDay == null || isNaN(Number(formMonthDay))) {
        setFormError("Selecione o dia do mês (1 a 31) para a tarefa mensal.");
        return;
      }
      const dayNum = Number(formMonthDay);
      if (dayNum < 1 || dayNum > 31) {
        setFormError("Dia do mês deve ser entre 1 e 31.");
        return;
      }
      parsedMonthDay = dayNum;
    }

    triggerSmoothLayoutAnimation();

    const taskPayload = {
      title: formTitle.trim(),
      description: formDescription.trim(),
      assigneeId: formAssigneeId,
      recurrence: formRecurrence,
      priority: formPriority,
      dueDate: parsedDueDate,
      dueTime: parsedDueTime,
      weekDay: parsedWeekDay,
      monthDay: parsedMonthDay,
    };

    if (modalMode === "create") {
      addTask(taskPayload);

      // Abre a pasta correspondente para visualizar a tarefa criada
      setOpenFolders((prev) => ({
        ...prev,
        [formRecurrence]: true,
      }));
    } else if (modalMode === "edit" && editingTask) {
      updateTask(editingTask.id, taskPayload);

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

          {/* Atalho para a projeção de próximas ocorrências de tarefas recorrentes */}
          <Pressable
            style={({ pressed }) => [
              styles.upcomingShortcutBtn,
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => navigation.navigate("UpcomingOccurrences")}
          >
            <View style={styles.upcomingShortcutIconWrap}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.upcomingShortcutTextWrap}>
              <Text style={styles.upcomingShortcutTitle}>Ver próximas ocorrências</Text>
              <Text style={styles.upcomingShortcutSub}>
                Projeção das tarefas recorrentes por data
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>

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

                {/* Agendamento dinâmico baseado na Recorrência */}
                {formRecurrence === "Única" && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Agendamento (opcional)</Text>
                    <Text style={styles.fieldSubLabel}>
                      Defina a data e o horário para o cumprimento desta tarefa
                    </Text>

                    {/* Seletor Atraente de Data */}
                    <Pressable
                      style={({ pressed }) => [
                        styles.pickerTriggerCard,
                        formDueDate ? styles.pickerTriggerCardActiveDate : null,
                        pressed && { opacity: 0.85 },
                      ]}
                      onPress={handleOpenDatePicker}
                    >
                      <View style={styles.pickerTriggerContent}>
                        <View
                          style={[
                            styles.pickerTriggerIconWrap,
                            formDueDate && styles.pickerTriggerIconWrapActiveDate,
                          ]}
                        >
                          <Ionicons
                            name="calendar"
                            size={18}
                            color={formDueDate ? colors.gold : colors.textMuted}
                          />
                        </View>
                        <View style={styles.pickerTriggerTextWrap}>
                          <Text
                            style={[
                              styles.pickerTriggerValue,
                              formDueDate && styles.pickerTriggerValueActiveDate,
                            ]}
                          >
                            {formDueDate ? formDueDate : "Definir data da tarefa"}
                          </Text>
                          <Text style={styles.pickerTriggerHint}>
                            {formDueDate
                              ? "Data agendada • Toque para alterar"
                              : "Opcional • Toque para selecionar a data"}
                          </Text>
                        </View>
                      </View>

                      {formDueDate ? (
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            setFormDueDate("");
                          }}
                          hitSlop={12}
                          style={styles.pickerTriggerClearBtn}
                        >
                          <Ionicons name="close-circle" size={22} color={colors.textMuted} />
                        </Pressable>
                      ) : (
                        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                      )}
                    </Pressable>

                    {/* Seletor Atraente de Horário */}
                    <Pressable
                      style={({ pressed }) => [
                        styles.pickerTriggerCard,
                        { marginTop: 10 },
                        formDueTime ? styles.pickerTriggerCardActiveTime : null,
                        pressed && { opacity: 0.85 },
                      ]}
                      onPress={handleOpenTimePicker}
                    >
                      <View style={styles.pickerTriggerContent}>
                        <View
                          style={[
                            styles.pickerTriggerIconWrap,
                            formDueTime && styles.pickerTriggerIconWrapActiveTime,
                          ]}
                        >
                          <Ionicons
                            name="time"
                            size={18}
                            color={formDueTime ? colors.accent : colors.textMuted}
                          />
                        </View>
                        <View style={styles.pickerTriggerTextWrap}>
                          <Text
                            style={[
                              styles.pickerTriggerValue,
                              formDueTime && styles.pickerTriggerValueActiveTime,
                            ]}
                          >
                            {formDueTime ? `às ${formDueTime}` : "Definir horário (opcional)"}
                          </Text>
                          <Text style={styles.pickerTriggerHint}>
                            {formDueTime
                              ? "Horário agendado • Toque para alterar"
                              : "Opcional • Toque para selecionar o horário"}
                          </Text>
                        </View>
                      </View>

                      {formDueTime ? (
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            setFormDueTime("");
                          }}
                          hitSlop={12}
                          style={styles.pickerTriggerClearBtn}
                        >
                          <Ionicons name="close-circle" size={22} color={colors.textMuted} />
                        </Pressable>
                      ) : (
                        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                      )}
                    </Pressable>
                  </View>
                )}

                {formRecurrence === "Diária" && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Horário de cumprimento (opcional)</Text>
                    <Text style={styles.fieldSubLabel}>
                      Defina a hora recomendada para realizar esta rotina diária
                    </Text>

                    <Pressable
                      style={({ pressed }) => [
                        styles.pickerTriggerCard,
                        formDueTime ? styles.pickerTriggerCardActiveTime : null,
                        pressed && { opacity: 0.85 },
                      ]}
                      onPress={handleOpenTimePicker}
                    >
                      <View style={styles.pickerTriggerContent}>
                        <View
                          style={[
                            styles.pickerTriggerIconWrap,
                            formDueTime && styles.pickerTriggerIconWrapActiveTime,
                          ]}
                        >
                          <Ionicons
                            name="time"
                            size={18}
                            color={formDueTime ? colors.accent : colors.textMuted}
                          />
                        </View>
                        <View style={styles.pickerTriggerTextWrap}>
                          <Text
                            style={[
                              styles.pickerTriggerValue,
                              formDueTime && styles.pickerTriggerValueActiveTime,
                            ]}
                          >
                            {formDueTime ? `Todo dia às ${formDueTime}` : "Definir horário (opcional)"}
                          </Text>
                          <Text style={styles.pickerTriggerHint}>
                            {formDueTime
                              ? "Horário diário definido • Toque para alterar"
                              : "Opcional • Toque para selecionar o horário"}
                          </Text>
                        </View>
                      </View>

                      {formDueTime ? (
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            setFormDueTime("");
                          }}
                          hitSlop={12}
                          style={styles.pickerTriggerClearBtn}
                        >
                          <Ionicons name="close-circle" size={22} color={colors.textMuted} />
                        </Pressable>
                      ) : (
                        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                      )}
                    </Pressable>
                  </View>
                )}

                {formRecurrence === "Semanal" && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Dia da semana *</Text>
                    <Text style={styles.fieldSubLabel}>
                      Selecione em qual dia da semana a tarefa deve ocorrer
                    </Text>

                    {/* Seletor de dias da semana */}
                    <View style={styles.weekdayRow}>
                      {WEEKDAY_NAMES.map((w) => {
                        const isSelected = formWeekDay === w.id;
                        return (
                          <Pressable
                            key={w.id}
                            style={[
                              styles.weekdayChip,
                              isSelected && styles.weekdayChipActive,
                            ]}
                            onPress={() => {
                              setFormWeekDay(w.id);
                              if (formError) setFormError("");
                            }}
                          >
                            <Text
                              style={[
                                styles.weekdayChipShort,
                                isSelected && styles.weekdayChipShortActive,
                              ]}
                            >
                              {w.short}
                            </Text>
                            <Text
                              style={[
                                styles.weekdayChipFull,
                                isSelected && styles.weekdayChipFullActive,
                              ]}
                            >
                              {w.label.slice(0, 3)}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    {/* Seletor de Horário */}
                    <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Horário (opcional)</Text>
                    <Pressable
                      style={({ pressed }) => [
                        styles.pickerTriggerCard,
                        formDueTime ? styles.pickerTriggerCardActiveTime : null,
                        pressed && { opacity: 0.85 },
                      ]}
                      onPress={handleOpenTimePicker}
                    >
                      <View style={styles.pickerTriggerContent}>
                        <View
                          style={[
                            styles.pickerTriggerIconWrap,
                            formDueTime && styles.pickerTriggerIconWrapActiveTime,
                          ]}
                        >
                          <Ionicons
                            name="time"
                            size={18}
                            color={formDueTime ? colors.accent : colors.textMuted}
                          />
                        </View>
                        <View style={styles.pickerTriggerTextWrap}>
                          <Text
                            style={[
                              styles.pickerTriggerValue,
                              formDueTime && styles.pickerTriggerValueActiveTime,
                            ]}
                          >
                            {formDueTime ? `às ${formDueTime}` : "Definir horário (opcional)"}
                          </Text>
                          <Text style={styles.pickerTriggerHint}>
                            {formDueTime
                              ? "Horário semanal definido • Toque para alterar"
                              : "Opcional • Toque para selecionar o horário"}
                          </Text>
                        </View>
                      </View>

                      {formDueTime ? (
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            setFormDueTime("");
                          }}
                          hitSlop={12}
                          style={styles.pickerTriggerClearBtn}
                        >
                          <Ionicons name="close-circle" size={22} color={colors.textMuted} />
                        </Pressable>
                      ) : (
                        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                      )}
                    </Pressable>
                  </View>
                )}

                {formRecurrence === "Mensal" && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Dia do mês *</Text>
                    <Text style={styles.fieldSubLabel}>
                      Selecione o dia do mês para a execução da tarefa
                    </Text>

                    {/* Grade completa de 31 dias do mês (sem digitação) */}
                    <View style={styles.monthDayGrid}>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                        const isSelected = formMonthDay === day;
                        return (
                          <Pressable
                            key={day}
                            style={({ pressed }) => [
                              styles.monthDayChip,
                              isSelected && styles.monthDayChipActive,
                              pressed && { opacity: 0.75 },
                            ]}
                            onPress={() => {
                              setFormMonthDay(day);
                              if (formError) setFormError("");
                            }}
                          >
                            <Text
                              style={[
                                styles.monthDayChipText,
                                isSelected && styles.monthDayChipTextActive,
                              ]}
                            >
                              {day}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    {/* Seletor de Horário */}
                    <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Horário (opcional)</Text>
                    <Pressable
                      style={({ pressed }) => [
                        styles.pickerTriggerCard,
                        formDueTime ? styles.pickerTriggerCardActiveTime : null,
                        pressed && { opacity: 0.85 },
                      ]}
                      onPress={handleOpenTimePicker}
                    >
                      <View style={styles.pickerTriggerContent}>
                        <View
                          style={[
                            styles.pickerTriggerIconWrap,
                            formDueTime && styles.pickerTriggerIconWrapActiveTime,
                          ]}
                        >
                          <Ionicons
                            name="time"
                            size={18}
                            color={formDueTime ? colors.accent : colors.textMuted}
                          />
                        </View>
                        <View style={styles.pickerTriggerTextWrap}>
                          <Text
                            style={[
                              styles.pickerTriggerValue,
                              formDueTime && styles.pickerTriggerValueActiveTime,
                            ]}
                          >
                            {formDueTime ? `às ${formDueTime}` : "Definir horário (opcional)"}
                          </Text>
                          <Text style={styles.pickerTriggerHint}>
                            {formDueTime
                              ? "Horário mensal definido • Toque para alterar"
                              : "Opcional • Toque para selecionar o horário"}
                          </Text>
                        </View>
                      </View>

                      {formDueTime ? (
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            setFormDueTime("");
                          }}
                          hitSlop={12}
                          style={styles.pickerTriggerClearBtn}
                        >
                          <Ionicons name="close-circle" size={22} color={colors.textMuted} />
                        </Pressable>
                      ) : (
                        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                      )}
                    </Pressable>
                  </View>
                )}

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

      {/* Modal Fallback de Horário (Web / Plataformas alternativas) */}
      <Modal visible={timePickerVisible} transparent animationType="fade">
        <Pressable
          style={styles.timeModalOverlay}
          onPress={() => setTimePickerVisible(false)}
        >
          <Pressable
            style={styles.timeModalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.timeModalHeader}>
              <View style={styles.timeModalTitleRow}>
                <Ionicons name="time" size={20} color={colors.primary} />
                <Text style={styles.timeModalTitle}>Selecionar Horário</Text>
              </View>
              <Pressable
                onPress={() => setTimePickerVisible(false)}
                hitSlop={8}
              >
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </Pressable>
            </View>

            {/* Display do horário selecionado */}
            <View style={styles.timeDisplayCard}>
              <Text style={styles.timeDisplayHour}>{tempHour.padStart(2, "0")}</Text>
              <Text style={styles.timeDisplayColon}>:</Text>
              <Text style={styles.timeDisplayMinute}>{tempMinute.padStart(2, "0")}</Text>
            </View>

            {/* Seletor de Horas (00 a 23) */}
            <Text style={styles.timeSectionLabel}>HORA</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.timeScrollRow}
            >
              {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map((h) => {
                const isSelected = tempHour === h;
                return (
                  <Pressable
                    key={h}
                    style={[
                      styles.timeWheelChip,
                      isSelected && styles.timeWheelChipActive,
                    ]}
                    onPress={() => setTempHour(h)}
                  >
                    <Text
                      style={[
                        styles.timeWheelChipText,
                        isSelected && styles.timeWheelChipTextActive,
                      ]}
                    >
                      {h}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Seletor de Minutos (de 5 em 5) */}
            <Text style={[styles.timeSectionLabel, { marginTop: 14 }]}>MINUTOS</Text>
            <View style={styles.minuteGrid}>
              {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map((m) => {
                const isSelected = tempMinute === m;
                return (
                  <Pressable
                    key={m}
                    style={[
                      styles.minuteChip,
                      isSelected && styles.minuteChipActive,
                    ]}
                    onPress={() => setTempMinute(m)}
                  >
                    <Text
                      style={[
                        styles.minuteChipText,
                        isSelected && styles.minuteChipTextActive,
                      ]}
                    >
                      {m}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.timeModalActions}>
              <PrimaryButton
                title="Confirmar horário"
                onPress={() => {
                  const h = tempHour.padStart(2, "0");
                  const m = tempMinute.padStart(2, "0");
                  setFormDueTime(`${h}:${m}`);
                  setTimePickerVisible(false);
                  if (formError) setFormError("");
                }}
              />
              <Pressable
                style={styles.timeCancelBtn}
                onPress={() => setTimePickerVisible(false)}
              >
                <Text style={styles.timeCancelBtnText}>Cancelar</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
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
  upcomingShortcutBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: "#E3ECE7",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  upcomingShortcutIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  upcomingShortcutTextWrap: { flex: 1 },
  upcomingShortcutTitle: { fontSize: 13.5, fontWeight: "700", color: colors.primary },
  upcomingShortcutSub: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
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
  // Estilos de Agendamento e Badges
  scheduleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2.5,
    paddingHorizontal: 7,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  scheduleBadgeDone: {
    opacity: 0.65,
  },
  scheduleBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  fieldSubLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 8,
    marginTop: -2,
    lineHeight: 16,
  },

  // Interactive Picker Trigger Cards (Substitui inputs de texto e sugestões)
  pickerTriggerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: "#D2DFD8",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  pickerTriggerCardActiveTime: {
    backgroundColor: "rgba(15, 118, 110, 0.05)",
    borderColor: colors.accent,
  },
  pickerTriggerCardActiveDate: {
    backgroundColor: "rgba(10, 37, 64, 0.04)",
    borderColor: colors.primary,
  },
  pickerTriggerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  pickerTriggerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#E8EFF5",
    alignItems: "center",
    justifyContent: "center",
  },
  pickerTriggerIconWrapActiveTime: {
    backgroundColor: "rgba(15, 118, 110, 0.15)",
  },
  pickerTriggerIconWrapActiveDate: {
    backgroundColor: "rgba(10, 37, 64, 0.12)",
  },
  pickerTriggerTextWrap: {
    flex: 1,
  },
  pickerTriggerValue: {
    fontSize: 14.5,
    fontWeight: "600",
    color: colors.textDark,
  },
  pickerTriggerValueActiveTime: {
    color: colors.accent,
    fontWeight: "700",
  },
  pickerTriggerValueActiveDate: {
    color: colors.primary,
    fontWeight: "700",
  },
  pickerTriggerHint: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  pickerTriggerClearBtn: {
    padding: 6,
    marginLeft: 6,
  },

  // Seletor Semanal (Dias da semana)
  weekdayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 4,
    marginTop: 4,
  },
  weekdayChip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    paddingHorizontal: 2,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#D2DFD8",
    backgroundColor: colors.surface,
  },
  weekdayChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  weekdayChipShort: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textDark,
  },
  weekdayChipShortActive: {
    color: colors.white,
    fontWeight: "800",
  },
  weekdayChipFull: {
    fontSize: 8.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  weekdayChipFullActive: {
    color: "rgba(255, 255, 255, 0.8)",
  },

  // Grade de 31 dias do mês (Recorrência Mensal)
  monthDayGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  monthDayChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: "#D2DFD8",
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  monthDayChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  monthDayChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textDark,
  },
  monthDayChipTextActive: {
    color: colors.white,
    fontWeight: "800",
  },

  // Modal Fallback de Horário
  timeModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  timeModalContent: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  timeModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  timeModalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeModalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textDark,
  },
  timeDisplayCard: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(10, 37, 64, 0.05)",
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 16,
    gap: 4,
  },
  timeDisplayHour: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 1,
  },
  timeDisplayColon: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 4,
  },
  timeDisplayMinute: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 1,
  },
  timeSectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  timeScrollRow: {
    flexDirection: "row",
    gap: 6,
    paddingVertical: 2,
  },
  timeWheelChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#D2DFD8",
    backgroundColor: colors.surface,
    minWidth: 42,
    alignItems: "center",
  },
  timeWheelChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  timeWheelChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textDark,
  },
  timeWheelChipTextActive: {
    color: colors.white,
    fontWeight: "800",
  },
  minuteGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  minuteChip: {
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#D2DFD8",
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  minuteChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  minuteChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textDark,
  },
  minuteChipTextActive: {
    color: colors.white,
    fontWeight: "800",
  },
  timeModalActions: {
    marginTop: 20,
    gap: 8,
  },
  timeCancelBtn: {
    paddingVertical: 10,
    alignItems: "center",
  },
  timeCancelBtnText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: "600",
  },
});
