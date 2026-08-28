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
 * Projeta as próximas ocorrências de tarefas recorrentes dentro de um horizonte de dias.
 * Tarefas "Única" são ignoradas, pois não possuem ciclo de repetição.
 * @param {Array} tasks
 * @param {{ horizonDays?: number, occurrencesPerTask?: number, now?: Date }} [options]
 * @returns {Array<{ taskId: string, title: string, assigneeId: string|null, recurrence: string, date: string }>}
 */
function startOfDayMs(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function getUpcomingOccurrences(tasks, options = {}) {
  const { horizonDays = 30, occurrencesPerTask = 6, now = new Date() } = options;
  const horizonMs = now.getTime() + horizonDays * 24 * 60 * 60 * 1000;
  const today = startOfDayMs(now);
  const occurrences = [];

  tasks.forEach((task) => {
    if (!task.recurrence || task.recurrence === "Única" || task.recurrence === "Sem recorrência") {
      return;
    }

    let anchor = new Date(task.nextDueDate || calculateNextDueDate(task.recurrence, now));
    if (isNaN(anchor.getTime())) return;

    // A primeira ocorrência sempre é exibida (pode estar atrasada). As seguintes só
    // entram quando já estiverem no futuro, evitando empilhar datas passadas de um
    // ciclo perdido (ex.: tarefa diária atrasada há vários dias).
    let isFirst = true;
    let pushed = 0;
    while (pushed < occurrencesPerTask && anchor.getTime() <= horizonMs) {
      if (isFirst || startOfDayMs(anchor) > today) {
        occurrences.push({
          taskId: task.id,
          title: task.title,
          assigneeId: task.assigneeId || null,
          recurrence: task.recurrence,
          date: anchor.toISOString(),
        });
        pushed += 1;
        isFirst = false;
      }
      anchor = new Date(calculateNextDueDate(task.recurrence, anchor));
    }
  });

  occurrences.sort((a, b) => new Date(a.date) - new Date(b.date));
  return occurrences;
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
