import { apiRequest } from "./apiClient";

/**
 * Normaliza um item de compra vindo do backend para o formato usado pelo app.
 * O backend usa campos em português (nome, quantidade, solicitante, isComprado).
 */
function normalizeShoppingItem(raw) {
  if (!raw) return raw;
  return {
    id: raw._id || raw.id,
    name: raw.nome,
    quantity: raw.quantidade != null ? String(raw.quantidade) : "",
    addedBy: raw.solicitante || "",
    purchased: raw.isComprado || false,
    residenceId: raw.residenceId || null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export const shoppingApi = {
  /**
   * Lista todos os itens de compras de uma residência.
   * @param {string} residenceId
   * @returns {Promise<Array>}
   */
  async list(residenceId) {
    const data = await apiRequest(
      `/compras?residenceId=${encodeURIComponent(residenceId)}`,
    );
    const items = Array.isArray(data) ? data : data?.dados || [];
    return items.map(normalizeShoppingItem);
  },

  /**
   * Adiciona um novo item à lista de compras.
   * @param {string} residenceId
   * @param {{ name: string, quantity?: string, addedBy?: string }} input
   * @returns {Promise<object>}
   */
  async create(residenceId, { name, quantity, addedBy }) {
    const data = await apiRequest("/compras", {
      method: "POST",
      body: {
        nome: name,
        quantidade: Number(quantity) || 1,
        solicitante: addedBy || "Morador",
        residenceId,
      },
    });
    return normalizeShoppingItem(data?.dados || data);
  },

  /**
   * Marca um item como comprado.
   * @param {string} itemId
   * @returns {Promise<object>}
   */
  async markAsPurchased(itemId) {
    const data = await apiRequest(`/compras/${itemId}/comprado`, {
      method: "PATCH",
    });
    return normalizeShoppingItem(data?.dados || data);
  },

  /**
   * Remove um item da lista de compras.
   * @param {string} itemId
   * @returns {Promise<void>}
   */
  async remove(itemId) {
    await apiRequest(`/compras/${itemId}`, { method: "DELETE" });
  },
};
