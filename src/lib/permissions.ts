/**
 * CYBERX RBAC Permission Matrix
 *
 * Role              | View | Create | Edit | Delete | Settings | Users
 * ─────────────────────────────────────────────────────────────────────
 * Super Admin       |  ✅  |   ✅   |  ✅  |   ✅   |    ✅    |  ✅
 * Co-Founder        |  ✅  |   ✅   |  ✅  |   ❌   |    ✅    |  ❌
 * Founder           |  ✅  |   ✅   |  ✅  |   ❌   |    ❌    |  ❌
 * Committee Member  |  ✅  |   ✅   |  ❌  |   ❌   |    ❌    |  ❌
 * Read Only         |  ✅  |   ❌   |  ❌  |   ❌   |    ❌    |  ❌
 */

import { NextResponse } from 'next/server';
import { getSession } from './session';

export type Role = 'Super Admin' | 'Co-Founder' | 'Founder' | 'Committee Member' | 'Read Only';

// ── Role hierarchy helpers ────────────────────────────────────────────────────

/** Can CREATE records (transactions, orgs, people) */
export function canCreate(role: string): boolean {
  return ['Super Admin', 'Co-Founder', 'Founder', 'Committee Member'].includes(role);
}

/** Can EDIT / UPDATE records */
export function canEdit(role: string): boolean {
  return ['Super Admin', 'Co-Founder', 'Founder'].includes(role);
}

/** Can DELETE records */
export function canDelete(role: string): boolean {
  return role === 'Super Admin';
}

/** Can access and edit Settings */
export function canEditSettings(role: string): boolean {
  return ['Super Admin', 'Co-Founder'].includes(role);
}

/** Can manage system Users (CRUD) */
export function canManageUsers(role: string): boolean {
  return role === 'Super Admin';
}

// ── HTTP guard helpers (server-side, for API routes) ─────────────────────────

function forbidden(message: string) {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function guardCreate(): Promise<NextResponse | null> {
  const session = await getSession();
  const role = session?.role || '';
  if (!canCreate(role)) return forbidden('Access denied: you do not have permission to create records.');
  return null;
}

export async function guardEdit(): Promise<NextResponse | null> {
  const session = await getSession();
  const role = session?.role || '';
  if (!canEdit(role)) return forbidden('Access denied: you do not have permission to edit records.');
  return null;
}

export async function guardDelete(): Promise<NextResponse | null> {
  const session = await getSession();
  const role = session?.role || '';
  if (!canDelete(role)) return forbidden('Access denied: only Super Admin can delete records.');
  return null;
}

export async function guardSettings(): Promise<NextResponse | null> {
  const session = await getSession();
  const role = session?.role || '';
  if (!canEditSettings(role)) return forbidden('Access denied: only Co-Founder and above can modify settings.');
  return null;
}

export async function guardUsers(): Promise<NextResponse | null> {
  const session = await getSession();
  const role = session?.role || '';
  if (!canManageUsers(role)) return forbidden('Access denied: Super Admin only.');
  return null;
}
