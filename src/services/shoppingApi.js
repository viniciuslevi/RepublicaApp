import { apiRequest } from "./apiClient";

function normalizeShoppingItem(raw) {
  if (!raw) return raw;
  return {
    id: raw._id || raw.id,
    name: raw.name,
    quantity: raw.quantity || "",
    addedById:
      typeof raw.addedById === "object" && raw.addedById?._id
        ? raw.addedById._id
        : raw.addedById?.toString() || "",
    addedBy:
      typeof raw.addedById === "object" && raw.addedById?.name
        ? raw.addedById.name
        : raw.addedBy || "",
    purchased: !!raw.purchased,
    residenceId: raw.residenceId,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export const shoppingApi = {
  async list(residenceId) {
    const data = await apiRequest(`/residences/${residenceId}/shopping-items`);
    const items = Array.isArray(data) ? data : [];
    return items.map(normalizeShoppingItem);
  },

  async create(residenceId, input) {
    const data = await apiRequest(`/residences/${residenceId}/shopping-items`, {
      method: "POST",
      body: {
        name: input.name,
        quantity: input.quantity || undefined,
      },
    });
    return normalizeShoppingItem(data);
  },

  async setPurchased(residenceId, itemId, purchased = true) {
    const data = await apiRequest(`/residences/${residenceId}/shopping-items/${itemId}/purchased`, {
      method: "PATCH",
      body: { purchased },
    });
    return normalizeShoppingItem(data);
  },

  async remove(residenceId, itemId) {
    await apiRequest(`/residences/${residenceId}/shopping-items/${itemId}`, {
      method: "DELETE",
    });
  },
};
