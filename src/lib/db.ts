import Dexie, { Table } from 'dexie';

export type Category = 'men' | 'women' | 'children';
export type Duration = '1m' | '2m' | '3m' | '6m' | 'season';

export interface Member {
  id?: number;
  cardNumber: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  category: Category;
  startDate: string;
  endDate: string;
  duration: Duration;
  sessionFrom: string;
  sessionTo: string;
  receiptNumber: string;
  amount: number;
  photo?: string;
  sessionId?: number; // linked session
  createdAt: number;
}

export interface Association {
  id?: number;
  cardNumber: string;
  associationName: string;
  type: 'club' | 'company' | 'security' | 'disabled';
  level?: 'level0' | 'school' | 'competitive';
  firstName: string;
  lastName: string;
  birthDate: string;
  startDate: string;
  endDate: string;
  amount: number;
  photo?: string;
  sessionId?: number;
  createdAt: number;
}

export interface Setting {
  key: string;
  value: string;
}

export interface Session {
  id?: number;
  day: string;       // e.g. 'السبت'
  slot: string;      // e.g. '07-08'
  label: string;     // e.g. 'رجال'
  color?: string;    // tailwind class
  capacity?: number;
  createdAt: number;
}

export interface TariffRow {
  id?: number;
  scope: 'member' | 'association';
  key: string;
  label: string;
  amount: number;
}

export interface Payment {
  id?: number;
  subjectType: 'member' | 'association';
  subjectId: number;
  cardNumber: string;
  fullName: string;
  amount: number;
  receiptNumber: string;
  kind: 'subscription' | 'renewal' | 'adjustment';
  periodStart: string;
  periodEnd: string;
  note?: string;
  createdAt: number;
}

class PoolDB extends Dexie {
  members!: Table<Member, number>;
  associations!: Table<Association, number>;
  settings!: Table<Setting, string>;
  sessions!: Table<Session, number>;
  tariffs!: Table<TariffRow, number>;
  payments!: Table<Payment, number>;

  constructor() {
    super('OlympicPool1945');
    this.version(1).stores({
      members: '++id, cardNumber, category, createdAt',
      associations: '++id, cardNumber, type, associationName, createdAt',
      settings: 'key',
    });
    this.version(2).stores({
      members: '++id, cardNumber, category, sessionId, createdAt',
      associations: '++id, cardNumber, type, associationName, sessionId, createdAt',
      settings: 'key',
      sessions: '++id, day, slot',
      tariffs: '++id, &[scope+key]',
    }).upgrade(async tx => {
      const t = tx.table('tariffs');
      for (const [cat, durs] of Object.entries(DEFAULT_TARIFFS)) {
        for (const [d, amount] of Object.entries(durs)) {
          await t.add({ scope: 'member', key: `${cat}_${d}`, label: `${CATEGORY_LABEL[cat as Category]} - ${DURATION_LABEL[d as Duration]}`, amount });
        }
      }
      for (const [k, amount] of Object.entries(DEFAULT_ASSOC_TARIFFS)) {
        await t.add({ scope: 'association', key: k, label: ASSOC_LABEL[k as keyof typeof ASSOC_LABEL], amount });
      }
      const s = tx.table('sessions');
      for (const sess of DEFAULT_SESSIONS) await s.add({ ...sess, createdAt: Date.now() });
    });
    this.version(3).stores({
      members: '++id, cardNumber, category, sessionId, createdAt',
      associations: '++id, cardNumber, type, associationName, sessionId, createdAt',
      settings: 'key',
      sessions: '++id, day, slot',
      tariffs: '++id, &[scope+key]',
      payments: '++id, subjectType, subjectId, createdAt, kind',
    }).upgrade(async tx => {
      // Backfill payments from existing members & associations
      const pays = tx.table('payments');
      const ms = await tx.table('members').toArray();
      for (const m of ms) {
        await pays.add({
          subjectType: 'member', subjectId: m.id, cardNumber: m.cardNumber,
          fullName: `${m.firstName} ${m.lastName}`, amount: m.amount,
          receiptNumber: m.receiptNumber || '', kind: 'subscription',
          periodStart: m.startDate, periodEnd: m.endDate,
          createdAt: m.createdAt || Date.now(),
        });
      }
      const as = await tx.table('associations').toArray();
      for (const a of as) {
        await pays.add({
          subjectType: 'association', subjectId: a.id, cardNumber: a.cardNumber,
          fullName: `${a.firstName} ${a.lastName} — ${a.associationName}`, amount: a.amount,
          receiptNumber: '', kind: 'subscription',
          periodStart: a.startDate, periodEnd: a.endDate,
          createdAt: a.createdAt || Date.now(),
        });
      }
    });
  }
}

export const db = new PoolDB();

export const DEFAULT_TARIFFS: Record<Category, Record<Duration, number>> = {
  men:      { '1m': 2000, '2m': 4000, '3m': 5000, '6m': 9000, season: 13000 },
  women:    { '1m': 2000, '2m': 4000, '3m': 5000, '6m': 9000, season: 13000 },
  children: { '1m': 1000, '2m': 2000, '3m': 3000, '6m': 5000, season: 10000 },
};

export const DEFAULT_ASSOC_TARIFFS = {
  club: 150000,
  company: 300000,
  security: 0,
  disabled: 0,
};

export const ASSOC_LABEL = {
  club: 'النوادي',
  company: 'الشركات / النوادي المحترفة',
  security: 'الأسلاك الأمنية',
  disabled: 'المعاقين',
};

export const CATEGORY_LABEL: Record<Category, string> = {
  men: 'رجال', women: 'نساء', children: 'أطفال',
};

export const DURATION_LABEL: Record<Duration, string> = {
  '1m': 'شهر واحد', '2m': 'شهرين', '3m': '03 أشهر', '6m': '06 أشهر', season: 'الموسم',
};

// Backwards compatibility (Members.tsx still imports these as fallback defaults)
export const TARIFFS = DEFAULT_TARIFFS;
export const ASSOCIATION_TARIFFS = DEFAULT_ASSOC_TARIFFS;

export const DAYS = ['السبت','الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس'];
export const SLOTS = ['07-08','09-10','10:30-11:30','12-13','13:30-14:30','15-16','16:30-17:30','17:30-18:30','18:30-20:30','20:30-22:30'];

const DEFAULT_SESSIONS: Omit<Session, 'id' | 'createdAt'>[] = [
  { day: 'السبت', slot: '07-08', label: 'رجال', color: 'bg-secondary/20 text-secondary' },
  { day: 'السبت', slot: '09-10', label: 'رجال', color: 'bg-secondary/20 text-secondary' },
  { day: 'السبت', slot: '10:30-11:30', label: 'نساء', color: 'bg-pink-100 text-pink-700' },
  { day: 'السبت', slot: '12-13', label: 'أطفال', color: 'bg-amber-100 text-amber-700' },
  { day: 'السبت', slot: '15-16', label: 'نوادي مستوى 0', color: 'bg-primary/15 text-primary' },
  { day: 'السبت', slot: '16:30-17:30', label: 'نوادي مدارس', color: 'bg-primary/15 text-primary' },
  { day: 'السبت', slot: '18:30-20:30', label: 'كرة الماء — ASUC', color: 'bg-accent/30 text-accent-foreground' },
  { day: 'الأحد', slot: '07-08', label: 'رجال', color: 'bg-secondary/20 text-secondary' },
  { day: 'الأحد', slot: '09-10', label: 'نساء', color: 'bg-pink-100 text-pink-700' },
  { day: 'الأحد', slot: '15-16', label: 'نوادي مستوى 0', color: 'bg-primary/15 text-primary' },
  { day: 'الأحد', slot: '16:30-17:30', label: 'نوادي تنافسي', color: 'bg-primary/15 text-primary' },
  { day: 'الإثنين', slot: '07-08', label: 'رجال', color: 'bg-secondary/20 text-secondary' },
  { day: 'الإثنين', slot: '12-13', label: 'أطفال', color: 'bg-amber-100 text-amber-700' },
  { day: 'الإثنين', slot: '15-16', label: 'الشرطة', color: 'bg-blue-100 text-blue-700' },
  { day: 'الثلاثاء', slot: '07-08', label: 'نساء', color: 'bg-pink-100 text-pink-700' },
  { day: 'الثلاثاء', slot: '15-16', label: 'نوادي مدارس', color: 'bg-primary/15 text-primary' },
  { day: 'الثلاثاء', slot: '18:30-20:30', label: 'كرة الماء — WRS', color: 'bg-accent/30 text-accent-foreground' },
  { day: 'الأربعاء', slot: '07-08', label: 'رجال', color: 'bg-secondary/20 text-secondary' },
  { day: 'الأربعاء', slot: '15-16', label: 'نوادي مستوى 0', color: 'bg-primary/15 text-primary' },
  { day: 'الأربعاء', slot: '16:30-17:30', label: 'نوادي مدارس', color: 'bg-primary/15 text-primary' },
  { day: 'الخميس', slot: '07-08', label: 'رجال', color: 'bg-secondary/20 text-secondary' },
  { day: 'الخميس', slot: '15-16', label: 'المعاقين', color: 'bg-purple-100 text-purple-700' },
  { day: 'الخميس', slot: '16:30-17:30', label: 'نوادي مدارس', color: 'bg-primary/15 text-primary' },
];

// Helpers to read tariffs from DB with fallback to defaults
export async function getMemberPrice(category: Category, duration: Duration): Promise<number> {
  const row = await db.tariffs.where('[scope+key]').equals(['member', `${category}_${duration}`]).first();
  return row?.amount ?? DEFAULT_TARIFFS[category][duration];
}

export async function getAssocPrice(type: keyof typeof DEFAULT_ASSOC_TARIFFS): Promise<number> {
  const row = await db.tariffs.where('[scope+key]').equals(['association', type]).first();
  return row?.amount ?? DEFAULT_ASSOC_TARIFFS[type];
}

export async function logPayment(p: Omit<Payment, 'id' | 'createdAt'> & { createdAt?: number }) {
  return db.payments.add({ ...p, createdAt: p.createdAt ?? Date.now() });
}
