import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from "react";
import { initialExpenses, initialShoppingItems } from "../data/mock";
import { residenceService } from "../services/residenceService";
import { taskApi } from "../services/taskApi";
import { expenseApi } from "../services/expenseApi";
import { useAuth } from "./AuthContext";

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const { isAuthenticated } = useAuth();

  const [residences, setResidences] = useState([]);
  const [activeResidence, setActiveResidence] = useState(null);
  const [residents, setResidents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isLoadingResidence, setIsLoadingResidence] = useState(false);

  const [expenses, setExpenses] = useState([]);
  const [shoppingItems, setShoppingItems] = useState(initialShoppingItems);

  // Ao logar, carrega a lista de residências do usuário; ao deslogar, limpa tudo
  useEffect(() => {
    if (!isAuthenticated) {
      setResidences([]);
      setActiveResidence(null);
      setResidents([]);
      setTasks([]);
      setExpenses([]);
      return;
    }
    residenceService.list().catch((error) => {
      console.warn("Falha ao carregar residências:", error.message);
      return [];
    }).then((list) => list && setResidences(list));
  }, [isAuthenticated]);

  const residentById = useMemo(() => {
    const map = {};
    residents.forEach((r) => (map[r.id] = r));
    return map;
  }, [residents]);

  const groupName = activeResidence?.name || "";

  const loadResidenceDetail = useCallback(async (residenceId) => {
    setIsLoadingResidence(true);
    try {
      const [{ residence, members }, fetchedTasks, fetchedExpenses] = await Promise.all([
        residenceService.getDetail(residenceId),
        taskApi.list(residenceId),
        expenseApi.list(residenceId).catch((error) => {
          console.warn("Falha ao carregar despesas:", error.message);
          return [];
        }),
      ]);
      setActiveResidence(residence);
      setResidents(members);
      setTasks(fetchedTasks);
      setExpenses(fetchedExpenses || []);
      return residence;
    } finally {
      setIsLoadingResidence(false);
    }
  }, []);

  function selectResidence(residence) {
    return loadResidenceDetail(residence.id);
  }

  async function createResidence(name, address = "") {
    const created = await residenceService.create(name, address);
    setResidences((prev) => [created, ...prev]);
    await loadResidenceDetail(created.id);
    return created;
  }

  async function joinResidence(code) {
    try {
      const joined = await residenceService.join(code);
      setResidences((prev) => (prev.some((r) => r.id === joined.id) ? prev : [joined, ...prev]));
      await loadResidenceDetail(joined.id);
      return { success: true, residence: joined };
    } catch (error) {
      return { success: false, error: error.message || "Código de convite inválido ou não encontrado." };
    }
  }

  async function removeResident(residentId) {
    if (!activeResidence) {
      return { success: false, error: "Nenhuma residência selecionada." };
    }
    try {
      await residenceService.removeMember(activeResidence.id, residentId);
      setResidents((prev) => prev.filter((r) => r.id !== residentId));
      setTasks((prev) =>
        prev.map((t) => (t.assigneeId === residentId ? { ...t, assigneeId: null } : t))
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || "Não foi possível remover o morador." };
    }
  }

  function toggleTaskDone(taskId) {
    if (!activeResidence) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const action = task.done ? taskApi.reopen : taskApi.complete;
    action(activeResidence.id, taskId)
      .then((updated) => setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t))))
      .catch((error) => console.warn("Falha ao atualizar tarefa:", error.message));
  }

  function assignTask(taskId, residentId) {
    updateTask(taskId, { assigneeId: residentId });
  }

  function addTask(titleOrData, recurrence = "Única", assigneeId = null, description = "", priority = "Média") {
    if (!activeResidence) return null;

    const input =
      typeof titleOrData === "object" && titleOrData !== null
        ? titleOrData
        : { title: titleOrData, description, assigneeId, recurrence, priority };

    taskApi
      .create(activeResidence.id, input)
      .then((created) => setTasks((prev) => [created, ...prev]))
      .catch((error) => console.warn("Falha ao criar tarefa:", error.message));
    return null;
  }

  function updateTask(taskId, updatedData) {
    if (!activeResidence) return null;

    // Atualização otimista: a UI responde na hora, e é reconciliada com a resposta do servidor
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updatedData } : t)));
    taskApi
      .update(activeResidence.id, taskId, updatedData)
      .then((updated) => setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t))))
      .catch((error) => console.warn("Falha ao atualizar tarefa:", error.message));
    return null;
  }

  function deleteTask(taskId) {
    if (!activeResidence) return true;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    taskApi.remove(activeResidence.id, taskId).catch((error) => console.warn("Falha ao excluir tarefa:", error.message));
    return true;
  }

  function deleteTasks(taskIds) {
    if (!activeResidence) return true;
    const idSet = new Set(taskIds);
    setTasks((prev) => prev.filter((t) => !idSet.has(t.id)));
    taskIds.forEach((id) =>
      taskApi.remove(activeResidence.id, id).catch((error) => console.warn("Falha ao excluir tarefa:", error.message))
    );
    return true;
  }

  function resetRecurringTasksNow() {
    if (!activeResidence) return;
    // O reset de recorrência é feito pelo backend a cada listagem — aqui só recarregamos.
    taskApi
      .list(activeResidence.id)
      .then(setTasks)
      .catch((error) => console.warn("Falha ao recarregar tarefas:", error.message));
  }

  async function addExpense(description, value, payerId, participantIds = null) {
    if (!activeResidence) return null;
    const cleanParticipantIds =
      participantIds && participantIds.length > 0
        ? participantIds
        : residents.map((r) => r.id);

    const created = await expenseApi.create(activeResidence.id, {
      description: description.trim(),
      value,
      payerId,
      participantIds: cleanParticipantIds,
    });
    setExpenses((prev) => [created, ...prev]);
    return created;
  }

  function addShoppingItem(name, quantity = "", addedById = null) {
    const id = `s${Date.now()}`;
    setShoppingItems((prev) => [
      { id, name: name.trim(), quantity: (quantity || "").trim(), addedById, purchased: false },
      ...prev,
    ]);
  }

  function toggleShoppingItemPurchased(itemId) {
    setShoppingItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, purchased: !item.purchased } : item
      )
    );
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
    isLoadingResidence,
    selectResidence,
    createResidence,
    joinResidence,
    groupName,
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
    toggleShoppingItemPurchased,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
