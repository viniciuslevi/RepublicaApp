import { initialResidents } from "../data/mock.js";

/**
 * MOCK DATABASE OF USERS
 * Em produção, essa camada será substituída por chamadas REST/GraphQL (ex.: Axios, Fetch, Supabase, Firebase).
 */
const MOCK_CREDENTIALS = {
  "ana@republica.com": { id: "1", name: "Ana", password: "123" },
  "bruno@republica.com": { id: "2", name: "Bruno", password: "123" },
  "carla@republica.com": { id: "3", name: "Carla", password: "123" },
};

/**
 * Simula a latência de rede de uma requisição de backend.
 */
function delay(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Validação básica de formato de e-mail.
 */
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

export const authService = {
  /**
   * Realiza login do usuário.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{success: boolean, user?: object, error?: string}>}
   */
  async login(email, password) {
    await delay(350);

    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPassword = (password || "").trim();

    if (!cleanEmail) {
      return { success: false, error: "Informe o seu e-mail." };
    }

    if (!isValidEmail(cleanEmail)) {
      return { success: false, error: "Informe um e-mail válido." };
    }

    if (!cleanPassword) {
      return { success: false, error: "Informe a sua senha." };
    }

    if (cleanPassword.length < 3) {
      return { success: false, error: "A senha deve ter pelo menos 3 caracteres." };
    }

    // Verifica credenciais mockadas existentes
    const foundUser = MOCK_CREDENTIALS[cleanEmail];
    if (foundUser) {
      if (foundUser.password !== cleanPassword) {
        return { success: false, error: "Senha incorreta. Tente novamente." };
      }
      return {
        success: true,
        user: {
          id: foundUser.id,
          name: foundUser.name,
          email: cleanEmail,
        },
      };
    }

    // Se for um novo usuário no protótipo, aceita login criando sessão simulada
    const residentMatch = initialResidents.find((r) => r.email === cleanEmail);
    const userName = residentMatch
      ? residentMatch.name
      : cleanEmail.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    return {
      success: true,
      user: {
        id: residentMatch ? residentMatch.id : `u_${Date.now()}`,
        name: userName,
        email: cleanEmail,
      },
    };
  },

  /**
   * Realiza cadastro de novo usuário.
   * @param {string} name
   * @param {string} email
   * @param {string} password
   * @param {string} [phone]
   * @returns {Promise<{success: boolean, user?: object, error?: string}>}
   */
  async register(name, email, password, phone = "") {
    await delay(350);

    const cleanName = (name || "").trim();
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPassword = (password || "").trim();
    const cleanPhone = (phone || "").trim();

    if (!cleanName) {
      return { success: false, error: "Informe o seu nome completo." };
    }

    if (cleanName.length < 2) {
      return { success: false, error: "O nome deve conter pelo menos 2 caracteres." };
    }

    if (!cleanEmail) {
      return { success: false, error: "Informe o seu e-mail." };
    }

    if (!isValidEmail(cleanEmail)) {
      return { success: false, error: "Informe um e-mail válido." };
    }

    if (MOCK_CREDENTIALS[cleanEmail]) {
      return {
        success: false,
        error: "Este e-mail já está cadastrado. Faça login ou use outro e-mail.",
      };
    }

    if (!cleanPassword) {
      return { success: false, error: "Informe a sua senha." };
    }

    if (cleanPassword.length < 3) {
      return { success: false, error: "A senha deve ter pelo menos 3 caracteres." };
    }

    const newUser = {
      id: `u_${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone || undefined,
    };

    // Salva na base mockada de credenciais para permitir login subsequente
    MOCK_CREDENTIALS[cleanEmail] = {
      id: newUser.id,
      name: newUser.name,
      password: cleanPassword,
      phone: cleanPhone,
    };

    return { success: true, user: newUser };
  },

  /**
   * Mock de recuperação de sessão salva.
   */
  async getStoredSession() {
    await delay(100);
    return null;
  },
};

