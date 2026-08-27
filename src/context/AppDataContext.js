import React, { createContext, useContext, useMemo, useState } from "react";
import { initialResidents, initialTasks, initialExpenses, initialResidences } from "../data/mock";

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const [residences, setResidences] = useState(initialResidences);
  const [activeResidence, setActiveResidence] = useState(initialResidences[0]);
  const [groupName, setGroupName] = useState(initialResidences[0]?.name || "");
  const [inviteCode] = useState("REP-4F2A");
  const [residents, setResidents] = useState(initialResidents);
  const [tasks, setTasks] = useState(initialTasks);
  const [expenses, setExpenses] = useState(initialExpenses);

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
      };
      setResidences((prev) => [joinedResidence, ...prev]);
      setActiveResidence(joinedResidence);
      setGroupName(joinedResidence.name);
      return { success: true, residence: joinedResidence };
    }

    return { success: false, error: "Código de convite inválido ou não encontrado." };
  }

  function toggleTaskDone(taskId) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t))
    );
  }

  function assignTask(taskId, residentId) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, assigneeId: residentId } : t))
    );
  }

  function addTask(titleOrData, recurrence = "Semanal", assigneeId = null, description = "") {
    const id = `t${Date.now()}`;
    if (typeof titleOrData === "object" && titleOrData !== null) {
      const taskData = titleOrData;
      setTasks((prev) => [
        {
          id,
          title: (taskData.title || "").trim(),
          description: (taskData.description || "").trim(),
          assigneeId: taskData.assigneeId || null,
          recurrence: taskData.recurrence || "Semanal",
          done: false,
        },
        ...prev,
      ]);
      return id;
    }

    setTasks((prev) => [
      {
        id,
        title: (titleOrData || "").trim(),
        description: (description || "").trim(),
        assigneeId: assigneeId || null,
        recurrence: recurrence || "Semanal",
        done: false,
      },
      ...prev,
    ]);
    return id;
  }

  function addExpense(description, value, payerId) {
    const id = `e${Date.now()}`;
    setExpenses((prev) => [{ id, description, value, payerId }, ...prev]);
  }

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + e.value, 0),
    [expenses]
  );

  const balances = useMemo(() => {
    if (residents.length === 0) return [];
    const share = totalExpenses / residents.length;
    return residents.map((r) => {
      const paid = expenses
        .filter((e) => e.payerId === r.id)
        .reduce((sum, e) => sum + e.value, 0);
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
    tasks,
    toggleTaskDone,
    assignTask,
    addTask,
    expenses,
    addExpense,
    totalExpenses,
    balances,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}


export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
