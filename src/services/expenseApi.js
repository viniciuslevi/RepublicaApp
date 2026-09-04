import { apiRequest } from "./apiClient";

function normalizeExpense(raw) {
  if (!raw) return raw;
  return {
    id: raw._id || raw.id,
    description: raw.description,
    value: typeof raw.value === "number" ? raw.value : Number(raw.value) || 0,
    payerId:
      typeof raw.payerId === "object" && raw.payerId?._id
        ? raw.payerId._id
        : raw.payerId?.toString() || "",
    participantIds: Array.isArray(raw.participantIds)
      ? raw.participantIds.map((p) =>
          typeof p === "object" && p?._id ? p._id : p?.toString() || ""
        )
      : [],
    date: raw.date || raw.createdAt,
    residenceId: raw.residenceId,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export const expenseApi = {
  async list(residenceId) {
    const data = await apiRequest(`/residences/${residenceId}/expenses`);
    return data.map(normalizeExpense);
  },

  async create(residenceId, input) {
    const data = await apiRequest(`/residences/${residenceId}/expenses`, {
      method: "POST",
      body: input,
    });
    return normalizeExpense(data);
  },

  async remove(residenceId, expenseId) {
    await apiRequest(`/residences/${residenceId}/expenses/${expenseId}`, {
      method: "DELETE",
    });
  },

  async getBalances(residenceId) {
    const data = await apiRequest(`/residences/${residenceId}/balances`);
    return {
      totalExpenses: typeof data.totalExpenses === "number" ? data.totalExpenses : 0,
      balances: Array.isArray(data.balances)
        ? data.balances.map((b) => ({
            resident: {
              id: b.resident?.id || b.resident?._id || "",
              name: b.resident?.name || "Morador",
              email: b.resident?.email || "",
            },
            paid: typeof b.paid === "number" ? b.paid : Number(b.paid) || 0,
            share: typeof b.share === "number" ? b.share : Number(b.share) || 0,
            balance: typeof b.balance === "number" ? b.balance : Number(b.balance) || 0,
          }))
        : [],
    };
  },
};
