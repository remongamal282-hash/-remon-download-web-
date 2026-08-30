/**
 * Remon Download Web — Global TypeScript Types
 */

export type Language = 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';
export type Theme = 'dark';

export interface NavItem {
  key: string;
  path: string;
  i18nKey: string;
}

export type DownloadStatus =
  | 'queued'
  | 'analyzing'
  | 'downloading'
  | 'converting'
  | 'completed'
  | 'failed'
  | 'canceled';
