import { apiRequest, tokenStore, saveStoredUser, getStoredUser } from "./apiClient";

function mapApiError(error) {
  return error?.message || "Não foi possível completar a operação. Tente novamente.";
}

export const authService = {
  /**
   * Realiza login do usuário contra o backend real.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{success: boolean, user?: object, error?: string}>}
   */
  async login(email, password) {
    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        auth: false,
        body: { email: (email || "").trim().toLowerCase(), password: (password || "").trim() },
      });
      await tokenStore.save(data);
      await saveStoredUser(data.user);
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: mapApiError(error) };
    }
  },

  /**
   * Realiza cadastro de novo usuário e já autentica (login automático).
   * @param {string} name
   * @param {string} email
   * @param {string} password
   * @param {string} [phone]
   * @returns {Promise<{success: boolean, user?: object, error?: string}>}
   */
  async register(name, email, password, phone = "") {
    try {
      const data = await apiRequest("/auth/register", {
        method: "POST",
        auth: false,
        body: {
          name: (name || "").trim(),
          email: (email || "").trim().toLowerCase(),
          password: (password || "").trim(),
          phone: (phone || "").trim() || undefined,
        },
      });
      await tokenStore.save(data);
      await saveStoredUser(data.user);
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: mapApiError(error) };
    }
  },

  /**
   * Recupera a sessão salva ao reabrir o app. Considera a sessão válida enquanto
   * houver refreshToken salvo (o accessToken de vida curta é renovado sob demanda
   * pelo apiClient na primeira requisição autenticada).
   */
  async getStoredSession() {
    const { refreshToken } = await tokenStore.load();
    if (!refreshToken) return null;

    const user = await getStoredUser();
    return user ? { user } : null;
  },

  async logout() {
    await tokenStore.clear();
  },
};
