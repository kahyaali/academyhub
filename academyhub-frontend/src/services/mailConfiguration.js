// src/services/mailConfiguration.js
import api from './api';

const MAIL_CONFIG_URL = '/api/v1/mailconfiguration';

export const mailConfigurationService = {
  // Konfigürasyonu getir
  getConfiguration: async () => {
    const response = await api.get(MAIL_CONFIG_URL);
    return response.data;
  },

  // Aktif konfigürasyonu getir
  getActiveConfiguration: async () => {
    const response = await api.get(`${MAIL_CONFIG_URL}/active`);
    return response.data;
  },

  // Yeni konfigürasyon oluştur
  createConfiguration: async (data) => {
    const response = await api.post(MAIL_CONFIG_URL, data);
    return response.data;
  },

  // Konfigürasyonu güncelle
  updateConfiguration: async (data) => {
    const response = await api.put(MAIL_CONFIG_URL, data);
    return response.data;
  },

  // Test maili gönder
  sendTestEmail: async (testEmail) => {
    const response = await api.post(`${MAIL_CONFIG_URL}/test`, { testEmail });
    return response.data;
  },

  // Konfigürasyonu doğrula
  validateConfiguration: async (data) => {
    const response = await api.post(`${MAIL_CONFIG_URL}/validate`, data);
    return response.data;
  }
};