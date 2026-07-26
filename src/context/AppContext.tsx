'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export type UserRole = 'Super Admin' | 'Co-Founder' | 'Founder' | 'Committee Member' | 'Read Only';

export interface AuthUser {
  userId: string;
  username: string;
  role: UserRole;
}

interface AppNotification {
  id: string;
  message: string;
  timestamp: string;
  status: 'Read' | 'Unread';
  type: string;
}

interface AppReminder {
  id: string;
  title: string;
  dueDate: string;
  amount: number;
  type: string;
  status: 'Active' | 'Resolved';
}

export const DEFAULT_MODULE_PERMISSIONS: Record<string, string[]> = {
  'Super Admin': ['dashboard', 'meetings', 'tasks', 'events', 'members', 'assets', 'documents', 'messages', 'ledger', 'people', 'organizations', 'reports', 'users', 'logs', 'settings'],
  'Co-Founder': ['dashboard', 'meetings', 'tasks', 'events', 'members', 'assets', 'documents', 'messages', 'ledger', 'people', 'organizations', 'reports', 'logs', 'settings'],
  'Founder': ['dashboard', 'meetings', 'tasks', 'events', 'members', 'assets', 'documents', 'messages', 'ledger', 'people', 'organizations', 'reports', 'logs'],
  'Committee Member': ['dashboard', 'meetings', 'tasks', 'events', 'members', 'assets', 'documents', 'messages', 'ledger'],
  'Read Only': ['dashboard', 'meetings', 'tasks', 'events', 'members', 'documents', 'messages'],
};

interface AppContextType {
  user: AuthUser | null;
  role: UserRole;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  reminders: AppReminder[];
  setReminders: React.Dispatch<React.SetStateAction<AppReminder[]>>;
  refreshData: () => void;
  refreshTrigger: number;
  triggerNotification: (message: string, type: string) => void;
  memberRegistered: boolean;
  setMemberRegistered: (registered: boolean) => void;
  logout: () => Promise<void>;
  authLoading: boolean;
  // Branding & Configuration
  logoUrl: string;
  iconUrl: string;
  faviconUrl: string;
  communityName: string;
  dbLogoUrl: string | null;
  dbIconUrl: string | null;
  dbFaviconUrl: string | null;
  envLogoUrl: string;
  envIconUrl: string;
  envFaviconUrl: string;
  fetchSettings: () => Promise<void>;
  // Module Permissions & Tab Visibility
  allowedTabs: string[];
  isTabAllowed: (tabId: string) => boolean;
  refreshPermissions: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [theme, setThemeState] = useState<'light' | 'dark'>('dark');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [reminders, setReminders] = useState<AppReminder[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [memberRegistered, setMemberRegistered] = useState<boolean>(true);

  // Branding states with default fallbacks
  const [logoUrl, setLogoUrl] = useState<string>(process.env.NEXT_PUBLIC_APP_LOGO_URL || '/cyberx-logo.webp');
  const [iconUrl, setIconUrl] = useState<string>(process.env.NEXT_PUBLIC_APP_ICON_URL || '/icon-192.png');
  const [faviconUrl, setFaviconUrl] = useState<string>(process.env.NEXT_PUBLIC_FAVICON_URL || '/favicon.ico');
  const [communityName, setCommunityName] = useState<string>(process.env.NEXT_PUBLIC_APP_NAME || 'CyberX');

  const [dbLogoUrl, setDbLogoUrl] = useState<string | null>(null);
  const [dbIconUrl, setDbIconUrl] = useState<string | null>(null);
  const [dbFaviconUrl, setDbFaviconUrl] = useState<string | null>(null);

  const [envLogoUrl, setEnvLogoUrl] = useState<string>(process.env.NEXT_PUBLIC_APP_LOGO_URL || '/cyberx-logo.webp');
  const [envIconUrl, setEnvIconUrl] = useState<string>(process.env.NEXT_PUBLIC_APP_ICON_URL || '/icon-192.png');
  const [envFaviconUrl, setEnvFaviconUrl] = useState<string>(process.env.NEXT_PUBLIC_FAVICON_URL || '/favicon.ico');

  // Derive role from user — default to Read Only if no user loaded yet
  const role: UserRole = (user?.role as UserRole) ?? 'Read Only';

  // Synchronously initialize allowedTabs from localStorage cache or default role matrix
  const [allowedTabs, setAllowedTabs] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('cyberx_allowed_tabs');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}
      }
    }
    return DEFAULT_MODULE_PERMISSIONS['Read Only'];
  });

  const fetchPermissions = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/permissions');
      if (res.ok) {
        const data = await res.json();
        if (data?.permissions) {
          const rolePerms = data.permissions[role] || DEFAULT_MODULE_PERMISSIONS[role] || DEFAULT_MODULE_PERMISSIONS['Read Only'];
          const finalTabs = role === 'Super Admin' ? DEFAULT_MODULE_PERMISSIONS['Super Admin'] : rolePerms;
          setAllowedTabs(finalTabs);
          if (typeof window !== 'undefined') {
            localStorage.setItem('cyberx_allowed_tabs', JSON.stringify(finalTabs));
          }
        }
      }
    } catch {
      // Quiet fallback
    }
  }, [role]);

  useEffect(() => {
    fetchPermissions();
  }, [role, fetchPermissions]);

  // Keep allowedTabs immediately updated when user role changes
  useEffect(() => {
    const defaultTabs = role === 'Super Admin'
      ? DEFAULT_MODULE_PERMISSIONS['Super Admin']
      : (DEFAULT_MODULE_PERMISSIONS[role] || DEFAULT_MODULE_PERMISSIONS['Read Only']);
    
    setAllowedTabs((prev) => {
      if (role === 'Super Admin') return defaultTabs;
      return prev.length === 0 ? defaultTabs : prev;
    });
  }, [role]);

  const isTabAllowed = useCallback((tabId: string) => {
    if (role === 'Super Admin') return true;
    return allowedTabs.includes(tabId);
  }, [role, allowedTabs]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.logoUrl) setLogoUrl(data.logoUrl);
        if (data.iconUrl) setIconUrl(data.iconUrl);
        if (data.faviconUrl) setFaviconUrl(data.faviconUrl);

        // Dynamically update browser head icon & favicon links in DOM
        if (typeof window !== 'undefined') {
          const activeFavicon = data.faviconUrl || data.iconUrl;
          const activeAppleIcon = data.iconUrl || data.faviconUrl;

          if (activeFavicon) {
            let faviconLink = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
            if (faviconLink) {
              faviconLink.href = activeFavicon;
            } else {
              faviconLink = document.createElement('link');
              faviconLink.rel = 'icon';
              faviconLink.href = activeFavicon;
              document.head.appendChild(faviconLink);
            }
          }

          if (activeAppleIcon) {
            let appleLink = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
            if (appleLink) {
              appleLink.href = activeAppleIcon;
            } else {
              appleLink = document.createElement('link');
              appleLink.rel = 'apple-touch-icon';
              appleLink.href = activeAppleIcon;
              document.head.appendChild(appleLink);
            }
          }
        }
        if (data.communityName) setCommunityName(data.communityName);

        setDbLogoUrl(data.dbLogoUrl ?? null);
        setDbIconUrl(data.dbIconUrl ?? null);
        setDbFaviconUrl(data.dbFaviconUrl ?? null);

        if (data.envLogoUrl) setEnvLogoUrl(data.envLogoUrl);
        if (data.envIconUrl) setEnvIconUrl(data.envIconUrl);
        if (data.envFaviconUrl) setEnvFaviconUrl(data.envFaviconUrl);
      }
    } catch {
      // Quiet fallback for branding settings
    }
  }, []);

  // Load current session from /api/auth/me
  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser({ userId: data.userId, username: data.username, role: data.role as UserRole });
        setMemberRegistered(!!data.memberRegistered);
      } else {
        setUser(null);
        setMemberRegistered(true);
      }
    } catch {
      setUser(null);
      setMemberRegistered(true);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setReminders(data.reminders || []);
      }
    } catch {
      // Quiet fallback if polling fails or server reloads
    }
  }, []);

  useEffect(() => {
    fetchMe();
    fetchSettings();

    const savedTheme = localStorage.getItem('cyberx_theme') as 'light' | 'dark';
    if (savedTheme) {
      setThemeState(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, [fetchMe, fetchSettings]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchAlerts();
      
      // Poll for new notifications every 15 seconds
      const intervalId = setInterval(() => {
        fetchAlerts();
      }, 15000);

      return () => clearInterval(intervalId);
    }
  }, [authLoading, user, refreshTrigger, fetchAlerts]);

  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchSettings();
      fetchPermissions();
    }
  }, [refreshTrigger, fetchSettings, fetchPermissions]);

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    localStorage.setItem('cyberx_theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const refreshData = () => setRefreshTrigger((prev) => prev + 1);

  const triggerNotification = async (message: string, type: string) => {
    const newNotif: AppNotification = {
      id: Math.random().toString(),
      message,
      timestamp: new Date().toISOString(),
      status: 'Unread',
      type,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    try {
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, type }),
      });
    } catch (e) {
      console.error('Failed to save notification:', e);
    }
  };

  const logout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cyberx_allowed_tabs');
    }
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setMemberRegistered(true);
    router.push('/');
  };

  return (
    <AppContext.Provider
      value={{
        user,
        role,
        theme,
        setTheme,
        notifications,
        setNotifications,
        reminders,
        setReminders,
        refreshData,
        refreshTrigger,
        triggerNotification,
        logout,
        authLoading,
        memberRegistered,
        setMemberRegistered,
        logoUrl,
        iconUrl,
        faviconUrl,
        communityName,
        dbLogoUrl,
        dbIconUrl,
        dbFaviconUrl,
        envLogoUrl,
        envIconUrl,
        envFaviconUrl,
        fetchSettings,
        allowedTabs,
        isTabAllowed,
        refreshPermissions: fetchPermissions,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
