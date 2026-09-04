import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config/env";

const STORAGE_KEYS = {
  accessToken: "@republicapp/accessToken",
  refreshToken: "@republicapp/refreshToken",
  user: "@republicapp/user",
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

let accessToken = null;
let refreshToken = null;

/**
 * Mantém os tokens em memória (acesso síncrono durante a sessão) e persistidos
 * no AsyncStorage (sobrevivem ao fechar o app).
 */
export const tokenStore = {
  async load() {
    const entries = await AsyncStorage.multiGet([STORAGE_KEYS.accessToken, STORAGE_KEYS.refreshToken]);
    accessToken = entries[0][1] || null;
    refreshToken = entries[1][1] || null;
    return { accessToken, refreshToken };
  },
  async save({ accessToken: at, refreshToken: rt }) {
    accessToken = at;
    refreshToken = rt;
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.accessToken, at],
      [STORAGE_KEYS.refreshToken, rt],
    ]);
  },
  async clear() {
    accessToken = null;
    refreshToken = null;
    await AsyncStorage.multiRemove([STORAGE_KEYS.accessToken, STORAGE_KEYS.refreshToken, STORAGE_KEYS.user]);
  },
  getAccessToken: () => accessToken,
  getRefreshToken: () => refreshToken,
};

export async function saveStoredUser(user) {
  await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
}

export async function getStoredUser() {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.user);
  return raw ? JSON.parse(raw) : null;
}

let sessionExpiredHandlers = [];

/** Chamado quando o refresh token também expira/é inválido — a sessão não pode mais ser renovada. */
export function onSessionExpired(handler) {
  sessionExpiredHandlers.push(handler);
  return () => {
    sessionExpiredHandlers = sessionExpiredHandlers.filter((h) => h !== handler);
  };
}

async function rawRequest(path, { method = "GET", body, token, headers = {} } = {}) {
  const requestHeaders = {
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const isJson = (response.headers.get("content-type") || "").includes("application/json");
  const data = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    throw new ApiError(data?.error || "Erro inesperado ao comunicar com o servidor.", response.status);
  }

  return data;
}

let refreshingPromise = null;

function refreshTokens() {
  if (!refreshingPromise) {
    refreshingPromise = rawRequest("/auth/refresh", {
      method: "POST",
      body: { refreshToken: tokenStore.getRefreshToken() },
    })
      .then(async (data) => {
        await tokenStore.save(data);
        return data;
      })
      .finally(() => {
        refreshingPromise = null;
      });
  }
  return refreshingPromise;
}

/**
 * Cliente HTTP central da API. Injeta o accessToken automaticamente e, se a
 * resposta vier 401, tenta renovar a sessão uma vez via refreshToken antes de
 * repetir a requisição original.
 */
export async function apiRequest(path, options = {}) {
  const { auth = true, ...rest } = options;
  const token = auth ? tokenStore.getAccessToken() : undefined;

  try {
    return await rawRequest(path, { ...rest, token });
  } catch (error) {
    if (auth && error instanceof ApiError && error.status === 401 && tokenStore.getRefreshToken()) {
      try {
        await refreshTokens();
      } catch (refreshError) {
        await tokenStore.clear();
        sessionExpiredHandlers.forEach((handler) => handler());
        throw refreshError;
      }
      return rawRequest(path, { ...rest, token: tokenStore.getAccessToken() });
    }
    throw error;
  }
}
