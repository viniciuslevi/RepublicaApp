export const initialResidents = [
  { id: "1", name: "Ana", email: "ana@republica.com" },
  { id: "2", name: "Bruno", email: "bruno@republica.com" },
  { id: "3", name: "Carla", email: "carla@republica.com" },
];

export const initialTasks = [
  { id: "t1", title: "Lavar a louça", assigneeId: "1", recurrence: "Diária", done: false },
  { id: "t2", title: "Tirar o lixo", assigneeId: "2", recurrence: "Semanal", done: true },
  { id: "t3", title: "Limpar o banheiro", assigneeId: null, recurrence: "Semanal", done: false },
  { id: "t4", title: "Comprar produtos de limpeza", assigneeId: "3", recurrence: "Mensal", done: false },
];

export const initialExpenses = [
  { id: "e1", description: "Conta de luz", value: 210.5, payerId: "1" },
  { id: "e2", description: "Mercado da semana", value: 180.0, payerId: "2" },
  { id: "e3", description: "Internet", value: 120.0, payerId: "3" },
];

