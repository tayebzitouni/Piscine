export type SubStatus = 'active' | 'expiring' | 'expired';

export function subscriptionStatus(endDate?: string): SubStatus {
  if (!endDate) return 'active';
  const today = new Date(); today.setHours(0,0,0,0);
  const end = new Date(endDate);
  const diffDays = Math.ceil((end.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return 'expired';
  if (diffDays <= 7) return 'expiring';
  return 'active';
}

export const STATUS_LABEL: Record<SubStatus, string> = {
  active: 'ساري',
  expiring: 'يقترب الإنتهاء',
  expired: 'منتهي',
};

export const STATUS_CLASS: Record<SubStatus, string> = {
  active: 'bg-green-100 text-green-700',
  expiring: 'bg-amber-100 text-amber-700',
  expired: 'bg-red-100 text-red-700',
};

export function toCSV(rows: Record<string, any>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = (v: any) => {
    const s = v == null ? '' : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '\uFEFF' + [headers.join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))].join('\n');
}

export function downloadFile(name: string, content: string, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}
