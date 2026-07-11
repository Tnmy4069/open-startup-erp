import { redirect } from 'next/navigation';

// /login is no longer used — login is now at /
export default function OldLoginRedirect() {
  redirect('/');
}
