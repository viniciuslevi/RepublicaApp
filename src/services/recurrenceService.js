/**
 * Serviço de Gerenciamento e Reset de Tarefas Recorrentes
 *
 * Esta camada foi arquitetada para ser 100% portável para o backend (ex.: Cron Job no Node.js,
 * Supabase Edge Functions, triggers agendados no Firebase ou workers de segundo plano).
 */

/**
 * Calcula a próxima data de vencimento / reset de uma tarefa a partir de uma data base.
 * @param {"Única" | "Diária" | "Semanal" | "Mensal"} recurrence
 * @param {Date} [fromDate=new Date()]
 * @returns {string | null} Data em formato ISO 8601 ou null para tarefas únicas
 */
export function calculateNextDueDate(recurrence, fromDate = new Date()) {
  const date = new Date(fromDate);

  switch (recurrence) {
    case "Diária": {
      // Próximo dia às 00:00
      date.setDate(date.getDate() + 1);
      date.setHours(0, 0, 0, 0);
      return date.toISOString();
    }
    case "Semanal": {
      // 7 dias à frente às 00:00
      date.setDate(date.getDate() + 7);
      date.setHours(0, 0, 0, 0);
      return date.toISOString();
    }
    case "Mensal": {
      // Próximo mês no mesmo dia às 00:00
      date.setMonth(date.getMonth() + 1);
      date.setHours(0, 0, 0, 0);
      return date.toISOString();
    }
    case "Única":
    default:
      return null;
  }
}

/**
 * Avalia se uma tarefa concluída já atingiu o ciclo de reset com base no intervalo e última conclusão.
 * @param {object} task
 * @param {Date} [now=new Date()]
 * @returns {boolean}
 */
export function shouldResetTask(task, now = new Date()) {
  // Tarefas não concluídas ou sem recorrência ("Única") nunca são resetadas automaticamente
  if (!task.done || !task.recurrence || task.recurrence === "Única" || task.recurrence === "Sem recorrência") {
    return false;
  }

  // Se tiver nextDueDate registrado e já tiver passado da data/hora atual
  if (task.nextDueDate) {
    const dueDate = new Date(task.nextDueDate);
    if (!isNaN(dueDate.getTime()) && now >= dueDate) {
      return true;
    }
  }

  // Fallback baseado em lastCompletedAt
  if (!task.lastCompletedAt) {
    return false;
  }

  const completedDate = new Date(task.lastCompletedAt);
  if (isNaN(completedDate.getTime())) {
    return false;
  }

  const diffMs = now.getTime() - completedDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  switch (task.recurrence) {
    case "Diária":
      // Reset se completada em dia diferente ou há mais de 1 dia
      return completedDate.getDate() !== now.getDate() || diffDays >= 1;

    case "Semanal":
      // Reset se passou 7 dias ou mais
      return diffDays >= 7;

    case "Mensal":
      // Reset se completada em mês anterior ou há mais de 30 dias
      return completedDate.getMonth() !== now.getMonth() || diffDays >= 30;

    default:
      return false;
  }
}

/**
 * Processa a lista de tarefas e reseta o status 'done' daquelas cujo ciclo recorrente expirou.
 * @param {Array} tasks
 * @param {Date} [now=new Date()]
 * @returns {{ tasks: Array, resetCount: number }}
 */
export function checkAndResetRecurringTasks(tasks, now = new Date()) {
  let resetCount = 0;

  const updatedTasks = tasks.map((task) => {
    if (shouldResetTask(task, now)) {
      resetCount += 1;
      return {
        ...task,
        done: false,
        lastCompletedAt: null,
        nextDueDate: calculateNextDueDate(task.recurrence, now),
        updatedAt: now.toISOString(),
      };
    }
    return task;
  });

  return { tasks: updatedTasks, resetCount };
}

/**
 * Cria payload inicial normalizado para novas tarefas.
 * @param {object} taskInput
 * @returns {object}
 */
export function createNormalizedTask(taskInput) {
  const now = new Date();
  const recurrence = taskInput.recurrence || "Única";
  const priority = taskInput.priority || "Média";

  return {
    id: taskInput.id || `t_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: (taskInput.title || "").trim(),
    description: (taskInput.description || "").trim(),
    assigneeId: taskInput.assigneeId || null,
    recurrence: recurrence,
    priority: priority,
    done: false,
    createdAt: now.toISOString(),
    lastCompletedAt: null,
    nextDueDate: recurrence !== "Única" ? calculateNextDueDate(recurrence, now) : null,
  };
}
