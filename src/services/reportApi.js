import { apiRequest } from "./apiClient";

export const reportApi = {
  async getSummary(residenceId, { startDate, endDate } = {}) {
    const params = [];
    if (startDate) params.push(`startDate=${encodeURIComponent(startDate)}`);
    if (endDate) params.push(`endDate=${encodeURIComponent(endDate)}`);
    const queryStr = params.length > 0 ? `?${params.join("&")}` : "";
    return apiRequest(`/residences/${residenceId}/reports/summary${queryStr}`);
  },
};
