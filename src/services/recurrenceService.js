/**
 * Serviço de Gerenciamento e Reset de Tarefas Recorrentes
 *
 * Esta camada foi arquitetada para ser 100% portável para o backend (ex.: Cron Job no Node.js,
 * Supabase Edge Functions, triggers agendados no Firebase ou workers de segundo plano).
 */

function parseDueTime(dueTime) {
  if (!dueTime) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(dueTime.trim());
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

function clampDayOfMonth(year, month, day) {
  const maxDay = new Date(year, month + 1, 0).getDate();
  return Math.min(Math.max(1, day), maxDay);
}

function parseDateParts(dueDate) {
  if (dueDate instanceof Date) {
    if (isNaN(dueDate.getTime())) return null;
    return { year: dueDate.getFullYear(), month: dueDate.getMonth(), day: dueDate.getDate() };
  }
  if (typeof dueDate === "string") {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dueDate.trim());
    if (match) {
      return {
        year: parseInt(match[1], 10),
        month: parseInt(match[2], 10) - 1,
        day: parseInt(match[3], 10),
      };
    }
    const d = new Date(dueDate);
    if (isNaN(d.getTime())) return null;
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
  }
  return null;
}

/**
 * Calcula a próxima data de vencimento / reset de uma tarefa a partir de uma data base.
 * @param {"Única" | "Diária" | "Semanal" | "Mensal"} recurrence
 * @param {Date} [fromDate=new Date()]
 * @param {object} [details={}]
 * @returns {string | null} Data em formato ISO 8601 ou null para tarefas únicas sem data
 */
export function calculateNextDueDate(recurrence, fromDate = new Date(), details = {}) {
  const date = new Date(fromDate);
  const time = parseDueTime(details?.dueTime);
  const h = time ? time.hours : 0;
  const m = time ? time.minutes : 0;

  switch (recurrence) {
    case "Diária": {
      const target = new Date(date);
      target.setHours(h, m, 0, 0);
      if (time && target.getTime() > date.getTime()) {
        return target.toISOString();
      }
      target.setDate(target.getDate() + 1);
      return target.toISOString();
    }
    case "Semanal": {
      const target = new Date(date);
      target.setHours(h, m, 0, 0);

      if (details?.weekDay != null) {
        const desiredDay = Number(details.weekDay);
        let diff = (desiredDay - date.getDay() + 7) % 7;
        if (diff === 0 && target.getTime() <= date.getTime()) {
          diff = 7;
        }
        target.setDate(target.getDate() + diff);
        return target.toISOString();
      }

      target.setDate(target.getDate() + 7);
      return target.toISOString();
    }
    case "Mensal": {
      const target = new Date(date);
      target.setHours(h, m, 0, 0);

      if (details?.monthDay != null) {
        const desiredDay = Number(details.monthDay);
        const currentYear = target.getFullYear();
        const currentMonth = target.getMonth();
        const dayThisMonth = clampDayOfMonth(currentYear, currentMonth, desiredDay);

        target.setDate(dayThisMonth);
        if (target.getTime() <= date.getTime()) {
          const nextMonthDate = new Date(currentYear, currentMonth + 1, 1);
          const nextYear = nextMonthDate.getFullYear();
          const nextMonth = nextMonthDate.getMonth();
          const dayNextMonth = clampDayOfMonth(nextYear, nextMonth, desiredDay);
          target.setFullYear(nextYear, nextMonth, dayNextMonth);
        }
        return target.toISOString();
      }

      target.setMonth(target.getMonth() + 1);
      return target.toISOString();
    }
    case "Única": {
      if (details?.dueDate) {
        const parts = parseDateParts(details.dueDate);
        if (parts) {
          return new Date(parts.year, parts.month, parts.day, h, m, 0, 0).toISOString();
        }
      }
      return null;
    }
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
      const details = {
        dueTime: task.dueTime,
        weekDay: task.weekDay,
        monthDay: task.monthDay,
        dueDate: task.dueDate,
      };
      return {
        ...task,
        done: false,
        lastCompletedAt: null,
        nextDueDate: calculateNextDueDate(task.recurrence, now, details),
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

    const details = {
      dueTime: task.dueTime,
      weekDay: task.weekDay,
      monthDay: task.monthDay,
      dueDate: task.dueDate,
    };

    let anchor = new Date(task.nextDueDate || calculateNextDueDate(task.recurrence, now, details));
    if (isNaN(anchor.getTime())) return;

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
      const nextStr = calculateNextDueDate(task.recurrence, anchor, details);
      if (!nextStr) break;
      anchor = new Date(nextStr);
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
  const details = {
    dueTime: taskInput.dueTime ?? null,
    weekDay: taskInput.weekDay != null ? Number(taskInput.weekDay) : null,
    monthDay: taskInput.monthDay != null ? Number(taskInput.monthDay) : null,
    dueDate: taskInput.dueDate || null,
  };

  return {
    id: taskInput.id || `t_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: (taskInput.title || "").trim(),
    description: (taskInput.description || "").trim(),
    assigneeId: taskInput.assigneeId || null,
    recurrence: recurrence,
    priority: priority,
    dueDate: details.dueDate,
    dueTime: details.dueTime,
    weekDay: details.weekDay,
    monthDay: details.monthDay,
    done: false,
    createdAt: now.toISOString(),
    lastCompletedAt: null,
    nextDueDate: calculateNextDueDate(recurrence, now, details),
  };
}
