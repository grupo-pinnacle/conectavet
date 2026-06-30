import type { Pet, Species } from '@/types';

export function calculateAge(birthDate: string): { years: number; months: number } {
  const birth = new Date(birthDate);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (now.getDate() < birth.getDate()) {
    months -= 1;
    if (months < 0) {
      years -= 1;
      months += 12;
    }
  }
  return { years: Math.max(0, years), months: Math.max(0, months) };
}

export function formatAge(birthDate: string): string {
  const { years, months } = calculateAge(birthDate);
  if (years === 0) return `${months} ${months === 1 ? 'mes' : 'meses'}`;
  if (months === 0) return `${years} ${years === 1 ? 'año' : 'años'}`;
  return `${years}a ${months}m`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

export function formatWaitTime(joinedAt: string): string {
  const joined = new Date(joinedAt).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - joined);
  const min = Math.floor(diff / 60000);
  const sec = Math.floor((diff % 60000) / 1000);
  if (min === 0) return `${sec}s`;
  return `${min}m ${sec.toString().padStart(2, '0')}s`;
}

export function initials(pet: Pet): string {
  return pet.name.charAt(0).toUpperCase();
}

export function speciesDisplay(species: Species): string {
  const labels: Record<Species, string> = {
    DOG: 'Perro',
    CAT: 'Gato',
    BIRD: 'Ave',
    REPTILE: 'Reptil',
    RODENT: 'Roedor',
    OTHER: 'Otra',
  };
  return labels[species];
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + '…';
}
