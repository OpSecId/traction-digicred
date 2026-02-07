interface AppConfig {
  app: {
    name: string;
    shortName: string;
    description: string;
    domain: string;
    themeColor: string;
    backgroundColor: string;
    /** Icon URL for favicon, header logo. From VITE_MARKETPLACE_ICON or config.json */
    iconUrl?: string;
  };
  api: {
    baseUrl: string;
  };
  features: {
    offlineMode: boolean;
    pushNotifications: boolean;
  };
}

let config: AppConfig | null = null;

export async function loadConfig(): Promise<AppConfig> {
  if (config) {
    return config;
  }

  try {
    const response = await fetch('/config.json');
    if (!response.ok) {
      throw new Error('Failed to load config');
    }
    const loaded = (await response.json()) as AppConfig;
    config = {
      ...loaded,
      app: {
        ...loaded.app,
        iconUrl: loaded.app?.iconUrl ?? import.meta.env.VITE_MARKETPLACE_ICON ?? undefined,
      },
    };
    return config;
  } catch (error) {
    console.error('Error loading config:', error);
    // Return default config
    config = {
      app: {
        name: 'Apply Utopia',
        shortName: 'Apply Utopia',
        description: 'Discover jobs and manage your career',
        domain: window.location.origin,
        themeColor: '#003366',
        backgroundColor: '#F5F5F5',
        iconUrl: import.meta.env.VITE_MARKETPLACE_ICON ?? undefined,
      },
      api: {
        baseUrl: '/api',
      },
      features: {
        offlineMode: true,
        pushNotifications: false,
      },
    };
    return config;
  }
}

export function getConfig(): AppConfig | null {
  return config;
}

export function getApiBaseUrl(): string {
  return config?.api.baseUrl || '/api';
}

export function getAppDomain(): string {
  return config?.app.domain || window.location.origin;
}

export function getAppIconUrl(): string {
  return config?.app?.iconUrl ?? import.meta.env.VITE_MARKETPLACE_ICON ?? '/img/digicred/logo-marketplace.svg';
}
