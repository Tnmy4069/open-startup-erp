'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type UserRole = 'Super Admin' | 'Finance Head' | 'Treasurer' | 'Committee Member' | 'Read Only';

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
  role: UserRole;
  setRole: (role: UserRole) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  reminders: AppReminder[];
  setReminders: React.Dispatch<React.SetStateAction<AppReminder[]>>;
  refreshData: () => void;
  refreshTrigger: number;
  triggerNotification: (message: string, type: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>('Super Admin');
  const [theme, setThemeState] = useState<'light' | 'dark'>('dark');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [reminders, setReminders] = useState<AppReminder[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setReminders(data.reminders || []);
      }
    } catch (e) {
      console.error('Failed to load notifications and reminders:', e);
    }
  }, []);

  // Read initial role & theme from localStorage if available
  useEffect(() => {
    const savedRole = localStorage.getItem('cyberx_role') as UserRole;
    if (savedRole) {
      setTimeout(() => setRoleState(savedRole), 0);
    }

    const savedTheme = localStorage.getItem('cyberx_theme') as 'light' | 'dark';
    if (savedTheme) {
      setTimeout(() => {
        setThemeState(savedTheme);
        document.documentElement.classList.toggle('dark', savedTheme === 'dark');
      }, 0);
    } else {
      document.documentElement.classList.add('dark');
    }

    setTimeout(() => {
      fetchAlerts();
    }, 0);
  }, [fetchAlerts, refreshTrigger]);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('cyberx_role', newRole);
    // Add audit log mock call or simple message
    triggerNotification(`Simulated session: Logged in as ${newRole}`, 'Login');
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    localStorage.setItem('cyberx_theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const triggerNotification = async (message: string, type: string) => {
    // Add to local state immediately
    const newNotif: AppNotification = {
      id: Math.random().toString(),
      message,
      timestamp: new Date().toISOString(),
      status: 'Unread',
      type,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    // Save to database
    try {
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, type }),
      });
    } catch (e) {
      console.error('Failed to save notification to DB:', e);
    }
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        theme,
        setTheme,
        notifications,
        setNotifications,
        reminders,
        setReminders,
        refreshData,
        refreshTrigger,
        triggerNotification,
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
