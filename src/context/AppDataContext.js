import React, { createContext, useContext, useMemo, useState } from "react";
import { initialResidents, initialTasks, initialExpenses } from "../data/mock";

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const [groupName, setGroupName] = useState("");
  const [inviteCode] = useState("REP-4F2A");
  const [residents] = useState(initialResidents);
  const [tasks, setTasks] = useState(initialTasks);
  const [expenses, setExpenses] = useState(initialExpenses);

  const residentById = useMemo(() => {
    const map = {};
    residents.forEach((r) => (map[r.id] = r));
    return map;
  }, [residents]);

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

  function addTask(title, recurrence) {
    const id = `t${Date.now()}`;
    setTasks((prev) => [
      { id, title, assigneeId: null, recurrence: recurrence || "Sem recorrência", done: false },
      ...prev,
    ]);
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
