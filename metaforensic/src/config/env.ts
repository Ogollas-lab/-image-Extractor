export const env = {
  APP_TITLE: import.meta.env.VITE_APP_TITLE || 'Metaforensic',
  MAX_FILE_SIZE_MB: Number(import.meta.env.VITE_MAX_FILE_SIZE_MB) || 10,
};
