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
};
