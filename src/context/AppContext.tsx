'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export type UserRole = 'Super Admin' | 'Finance Head' | 'Founder' | 'Committee Member' | 'Read Only';

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
  logout: () => Promise<void>;
  authLoading: boolean;
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

  // Derive role from user — default to Read Only if somehow no user
  const role: UserRole = (user?.role as UserRole) ?? 'Read Only';

  // Load current session from /api/auth/me
  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser({ userId: data.userId, username: data.username, role: data.role as UserRole });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
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
    } catch (e) {
      console.error('Failed to load notifications:', e);
    }
  }, []);

  useEffect(() => {
    fetchMe();

    const savedTheme = localStorage.getItem('cyberx_theme') as 'light' | 'dark';
    if (savedTheme) {
      setThemeState(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, [fetchMe]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchAlerts();
    }
  }, [authLoading, user, refreshTrigger, fetchAlerts]);

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
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
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
