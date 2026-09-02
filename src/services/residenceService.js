import { apiRequest } from "./apiClient";

function normalizeResidence(raw) {
  if (!raw) return raw;
  return {
    id: raw._id,
    name: raw.name,
    code: raw.code,
    address: raw.address || "",
    description: raw.description || "",
    adminId: typeof raw.adminId === "object" && raw.adminId ? raw.adminId._id : raw.adminId,
    membersCount: Array.isArray(raw.members) ? raw.members.length : raw.membersCount,
    plan: raw.plan,
  };
}

function normalizeMember(raw) {
  if (typeof raw === "string") return { id: raw, name: "", email: "" };
  return { id: raw._id, name: raw.name, email: raw.email };
}

export const residenceService = {
  async list() {
    const data = await apiRequest("/residences");
    return data.map(normalizeResidence);
  },

  async create(name, address, description) {
    const data = await apiRequest("/residences", {
      method: "POST",
      body: { name, address: address || undefined, description: description || undefined },
    });
    return normalizeResidence(data);
  },

  async join(code) {
    const data = await apiRequest("/residences/join", { method: "POST", body: { code } });
    return normalizeResidence(data);
  },

  /** Detalhe da residência com os moradores já normalizados ({id, name, email}). */
  async getDetail(residenceId) {
    const data = await apiRequest(`/residences/${residenceId}`);
    return {
      residence: normalizeResidence(data),
      members: (data.members || []).map(normalizeMember),
    };
  },

  async removeMember(residenceId, memberId) {
    const data = await apiRequest(`/residences/${residenceId}/members/${memberId}`, { method: "DELETE" });
    return normalizeResidence(data);
  },
};
