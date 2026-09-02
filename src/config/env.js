/**
 * URL base da API.
 *
 * Padrão: o backend em produção (Render), para o app funcionar out-of-the-box
 * (Expo Go, APK do EAS, etc.) sem precisar de nenhum setup local.
 *
 * Para desenvolver contra um backend local, sobrescreva com EXPO_PUBLIC_API_URL
 * num arquivo `.env` na raiz do projeto (ver `.env.example`) — necessário
 * também para testar num dispositivo físico na mesma rede, onde "localhost"
 * apontaria para o próprio celular, não para o computador que roda o backend.
 */
const PRODUCTION_API_URL = "https://republica-backend-bo50.onrender.com";

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || PRODUCTION_API_URL;
