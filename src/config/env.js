import { Platform } from "react-native";

/**
 * URL base da API. Pode ser sobrescrita definindo EXPO_PUBLIC_API_URL (ex.: num
 * arquivo .env na raiz do projeto) — necessário para testar num dispositivo físico
 * na mesma rede, onde "localhost" aponta para o próprio celular, não para o
 * computador que roda o backend.
 *
 * Padrão por plataforma quando a variável não é definida:
 * - Android (emulador): 10.0.2.2 é o alias do host da máquina dentro do emulador.
 * - iOS (simulador) e Web: localhost funciona normalmente.
 */
function resolveDefaultApiUrl() {
  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000";
  }
  return "http://localhost:3000";
}

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || resolveDefaultApiUrl();
