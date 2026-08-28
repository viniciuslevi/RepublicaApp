import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import {
  initialResidents,
  initialTasks,
  initialExpenses,
  initialResidences,
  initialShoppingItems,
} from "../data/mock";
import {
  checkAndResetRecurringTasks,
  calculateNextDueDate,
  createNormalizedTask,
} from "../services/recurrenceService";

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const [residences, setResidences] = useState(initialResidences);
  const [activeResidence, setActiveResidence] = useState(initialResidences[0]);
  const [groupName, setGroupName] = useState(initialResidences[0]?.name || "");
  const [inviteCode] = useState("REP-4F2A");
  const [residents, setResidents] = useState(initialResidents);
  const [tasks, setTasks] = useState(initialTasks);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [shoppingItems, setShoppingItems] = useState(initialShoppingItems);

  // Executa verificação de ciclo de reset de tarefas recorrentes ao carregar o app
  useEffect(() => {
    setTasks((prevTasks) => {
      const { tasks: resetTasks, resetCount } = checkAndResetRecurringTasks(prevTasks);
      return resetCount > 0 ? resetTasks : prevTasks;
    });
  }, []);

  const residentById = useMemo(() => {
    const map = {};
    residents.forEach((r) => (map[r.id] = r));
    return map;
  }, [residents]);

  function selectResidence(residence) {
    setActiveResidence(residence);
    setGroupName(residence.name);
  }

  function createResidence(name, address = "") {
    const newCode = `REP-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newResidence = {
      id: `rep_${Date.now()}`,
      name: name.trim(),
      code: newCode,
      membersCount: 1,
      address: address.trim() || "Endereço não informado",
      description: "Nova residência criada",
      members: ["Você"],
      adminId: residents[0]?.id ?? null,
    };

    setResidences((prev) => [newResidence, ...prev]);
    setActiveResidence(newResidence);
    setGroupName(newResidence.name);
    return newResidence;
  }

  function joinResidence(code) {
    const cleanCode = (code || "").trim().toUpperCase();
    const found = residences.find((r) => r.code === cleanCode);

    if (found) {
      setActiveResidence(found);
      setGroupName(found.name);
      return { success: true, residence: found };
    }

    if (cleanCode === inviteCode) {
      const defaultRep = initialResidences[0];
      setActiveResidence(defaultRep);
      setGroupName(defaultRep.name);
      return { success: true, residence: defaultRep };
    }

    // Se for um código válido novo simulado
    if (cleanCode.startsWith("REP-") && cleanCode.length >= 7) {
      const joinedResidence = {
        id: `rep_${Date.now()}`,
        name: `Residência (${cleanCode})`,
        code: cleanCode,
        membersCount: 2,
        address: "República Compartilhada",
        description: "Entrou via código de convite",
        members: ["Você", "Outro morador"],
        adminId: residents[0]?.id ?? null,
      };
      setResidences((prev) => [joinedResidence, ...prev]);
      setActiveResidence(joinedResidence);
      setGroupName(joinedResidence.name);
      return { success: true, residence: joinedResidence };
    }

    return { success: false, error: "Código de convite inválido ou não encontrado." };
  }

  function removeResident(residentId) {
    if (residents.length <= 1) {
      return { success: false, error: "Não é possível remover o último morador da república." };
    }
    if (activeResidence?.adminId === residentId) {
      return { success: false, error: "O administrador da república não pode ser removido." };
    }

    setResidents((prev) => prev.filter((r) => r.id !== residentId));
    setTasks((prev) =>
      prev.map((t) => (t.assigneeId === residentId ? { ...t, assigneeId: null } : t))
    );
    return { success: true };
  }

  function toggleTaskDone(taskId) {
    const now = new Date();
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;

        const nextDone = !t.done;
        return {
          ...t,
          done: nextDone,
          lastCompletedAt: nextDone ? now.toISOString() : null,
          nextDueDate:
            nextDone && t.recurrence && t.recurrence !== "Única"
              ? calculateNextDueDate(t.recurrence, now)
              : t.nextDueDate || null,
        };
      })
    );
  }

  function assignTask(taskId, residentId) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, assigneeId: residentId } : t))
    );
  }

  function addTask(titleOrData, recurrence = "Única", assigneeId = null, description = "", priority = "Média") {
    let newTask;
    if (typeof titleOrData === "object" && titleOrData !== null) {
      newTask = createNormalizedTask(titleOrData);
    } else {
      newTask = createNormalizedTask({
        title: titleOrData,
        description,
        assigneeId,
        recurrence,
        priority,
      });
    }

    setTasks((prev) => [newTask, ...prev]);
    return newTask.id;
  }

  function updateTask(taskId, updatedData) {
    const now = new Date();
    let updatedTaskResult = null;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;

        const recurrenceChanged =
          updatedData.recurrence && updatedData.recurrence !== t.recurrence;
        const nextRecurrence = updatedData.recurrence || t.recurrence;
        const nextDueDate = recurrenceChanged
          ? nextRecurrence !== "Única"
            ? calculateNextDueDate(nextRecurrence, now)
            : null
          : t.nextDueDate;

        updatedTaskResult = {
          ...t,
          ...updatedData,
          title:
            updatedData.title !== undefined ? updatedData.title.trim() : t.title,
          description:
            updatedData.description !== undefined
              ? updatedData.description.trim()
              : t.description,
          assigneeId:
            updatedData.assigneeId !== undefined
              ? updatedData.assigneeId
              : t.assigneeId,
          recurrence: nextRecurrence,
          priority:
            updatedData.priority !== undefined
              ? updatedData.priority
              : (t.priority || "Média"),
          nextDueDate,
          updatedAt: now.toISOString(),
        };
        return updatedTaskResult;
      })
    );
    return updatedTaskResult;
  }

  function deleteTask(taskId) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    return true;
  }

  function deleteTasks(taskIds) {
    const idSet = new Set(taskIds);
    setTasks((prev) => prev.filter((t) => !idSet.has(t.id)));
    return true;
  }

  function resetRecurringTasksNow(referenceDate = new Date()) {
    setTasks((prevTasks) => {
      const { tasks: resetTasks } = checkAndResetRecurringTasks(prevTasks, referenceDate);
      return resetTasks;
    });
  }

  function addExpense(description, value, payerId, participantIds = null) {
    const id = `e${Date.now()}`;
    const cleanParticipantIds =
      participantIds && participantIds.length > 0
        ? participantIds
        : residents.map((r) => r.id);
    setExpenses((prev) => [
      { id, description, value, payerId, participantIds: cleanParticipantIds },
      ...prev,
    ]);
  }

  function addShoppingItem(name, quantity = "", addedById = null) {
    const id = `s${Date.now()}`;
    setShoppingItems((prev) => [
      { id, name: name.trim(), quantity: (quantity || "").trim(), addedById, purchased: false },
      ...prev,
    ]);
  }

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + e.value, 0),
    [expenses]
  );

  const balances = useMemo(() => {
    if (residents.length === 0) return [];
    const allResidentIds = residents.map((r) => r.id);

    return residents.map((r) => {
      const paid = expenses
        .filter((e) => e.payerId === r.id)
        .reduce((sum, e) => sum + e.value, 0);

      const share = expenses.reduce((sum, e) => {
        const participantIds =
          e.participantIds && e.participantIds.length > 0 ? e.participantIds : allResidentIds;
        if (!participantIds.includes(r.id)) return sum;
        return sum + e.value / participantIds.length;
      }, 0);

      return { resident: r, paid, share, balance: paid - share };
    });
  }, [residents, expenses, totalExpenses]);

  const value = {
    residences,
    activeResidence,
    selectResidence,
    createResidence,
    joinResidence,
    groupName,
    setGroupName,
    inviteCode,
    residents,
    residentById,
    removeResident,
    tasks,
    toggleTaskDone,
    assignTask,
    addTask,
    updateTask,
    deleteTask,
    deleteTasks,
    resetRecurringTasksNow,
    expenses,
    addExpense,
    totalExpenses,
    balances,
    shoppingItems,
    addShoppingItem,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}


export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
