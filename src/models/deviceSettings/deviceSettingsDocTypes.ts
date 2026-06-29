export const VIEWPORT_BANDS = [
  'mobile',
  'tabletPortrait',
  'tabletLandscape',
  'desktop',
] as const;

export type ViewportBand = (typeof VIEWPORT_BANDS)[number];

export type UserDeviceSettingsDoc = {
  providerId: string;
  provider: string;
  isGuest: boolean;
  viewportWidth: number;
  viewportHeight: number;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  viewportBand: ViewportBand;
  colorScheme?: 'light' | 'dark' | 'no-preference';
  timezone?: string;
  language?: string;
  maxTouchPoints?: number;
  prefersReducedMotion?: boolean;
  standalone?: boolean;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
};
