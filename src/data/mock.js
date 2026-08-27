export const initialResidences = [
  {
    id: "rep-1",
    name: "República da Ana, Bruno e Carla",
    code: "REP-4F2A",
    membersCount: 3,
    address: "Rua Universitária, 120",
    description: "Moradia compartilhada padrão do app",
    members: ["Ana", "Bruno", "Carla"],
  },
];

export const initialResidents = [
  { id: "1", name: "Ana", email: "ana@republica.com" },
  { id: "2", name: "Bruno", email: "bruno@republica.com" },
  { id: "3", name: "Carla", email: "carla@republica.com" },
];

export const initialTasks = [
  { id: "t1", title: "Lavar a louça", description: "Lavar e secar a louça acumulada da pia da cozinha", assigneeId: "1", recurrence: "Diária", done: false },
  { id: "t2", title: "Tirar o lixo", description: "Colocar os sacos de lixo orgânico e reciclável na calçada", assigneeId: "2", recurrence: "Semanal", done: true },
  { id: "t3", title: "Limpar o banheiro", description: "Higienizar vaso sanitário, box e repor toalhas", assigneeId: null, recurrence: "Semanal", done: false },
  { id: "t4", title: "Comprar produtos de limpeza", description: "Comprar detergente, esponjas e desinfetante no mercado", assigneeId: "3", recurrence: "Mensal", done: false },
];

export const initialExpenses = [
  { id: "e1", description: "Conta de luz", value: 210.5, payerId: "1" },
  { id: "e2", description: "Mercado da semana", value: 180.0, payerId: "2" },
  { id: "e3", description: "Internet", value: 120.0, payerId: "3" },
];


