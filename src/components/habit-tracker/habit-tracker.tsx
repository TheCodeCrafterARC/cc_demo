import { Component, State, h } from '@stencil/core';

interface Habit {
  id: number;
  name: string;
  completed: boolean;
}

interface DayData {
  habits: Habit[];
  notes: string;
}

// localStorage shape: { "2026-04-09": DayData, ... }
type HabitStore = Record<string, DayData>;

const STORAGE_KEY = 'habit-tracker-v2';

const HABIT_ICONS: { keywords: string[]; icon: string }[] = [
  { keywords: ['workout', 'exercise', 'gym', 'run', 'walk', 'yoga', 'stretch'], icon: '💪' },
  { keywords: ['read', 'book', 'study', 'learn'], icon: '📚' },
  { keywords: ['water', 'drink', 'hydrat'], icon: '💧' },
  { keywords: ['meditat', 'mindful', 'breath', 'calm'], icon: '🧘' },
  { keywords: ['journal', 'write', 'diary', 'reflect'], icon: '📝' },
  { keywords: ['sleep', 'rest', 'nap', 'bed'], icon: '😴' },
  { keywords: ['eat', 'meal', 'diet', 'nutrition', 'food', 'cook'], icon: '🥗' },
  { keywords: ['gratitude', 'thankful', 'grateful'], icon: '🙏' },
  { keywords: ['code', 'program', 'develop', 'build'], icon: '💻' },
  { keywords: ['social', 'call', 'friend', 'family'], icon: '🤝' },
  { keywords: ['clean', 'tidy', 'organiz'], icon: '🧹' },
  { keywords: ['outside', 'nature', 'walk', 'fresh air'], icon: '🌿' },
];

function habitIcon(name: string): string {
  const lower = name.toLowerCase();
  for (const { keywords, icon } of HABIT_ICONS) {
    if (keywords.some(k => lower.includes(k))) return icon;
  }
  return '✅';
}

const QUOTES = [
  'Small steps every day lead to big changes.',
  'Consistency is the key to lasting habits.',
  'Every day is a fresh start.',
  'Progress, not perfection.',
  'You are one decision away from a different life.',
  'Build the life you want, one habit at a time.',
  'Today\'s efforts are tomorrow\'s results.',
];

function dailyQuote(): string {
  const day = new Date().getDate();
  return QUOTES[day % QUOTES.length];
}

@Component({
  tag: 'habit-tracker',
  shadow: false,
})
export class HabitTracker {
  @State() habits: Habit[] = [];
  @State() notes: string = '';
  @State() newHabitName: string = '';
  @State() nextId: number = 1;
  @State() selectedDate: Date = new Date();
  @State() showCalendar: boolean = false;
  @State() calendarViewDate: Date = new Date();

  private inputRef!: HTMLInputElement;

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  componentWillLoad() {
    this.loadDay(this.selectedDate);
  }

  // ─── Storage ────────────────────────────────────────────────────────────────

  private dateKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private readStore(): HabitStore {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as HabitStore) : {};
    } catch {
      return {};
    }
  }

  private writeStore(store: HabitStore) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch { /* quota exceeded */ }
  }

  private loadDay(date: Date) {
    const store = this.readStore();
    const data = store[this.dateKey(date)];
    const habits = data?.habits ?? [];
    this.habits = habits;
    this.notes = data?.notes ?? '';
    this.nextId = habits.length > 0 ? Math.max(...habits.map(h => h.id)) + 1 : 1;
  }

  private persist() {
    const store = this.readStore();
    store[this.dateKey(this.selectedDate)] = { habits: this.habits, notes: this.notes };
    this.writeStore(store);
  }

  // ─── Calendar ───────────────────────────────────────────────────────────────

  private openCalendar() {
    this.calendarViewDate = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), 1);
    this.showCalendar = true;
  }

  private selectDate(date: Date) {
    this.showCalendar = false;
    this.selectedDate = date;
    this.loadDay(date);
  }

  private prevMonth() {
    const d = this.calendarViewDate;
    this.calendarViewDate = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  }

  private nextMonth() {
    const d = this.calendarViewDate;
    this.calendarViewDate = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  }

  // ─── Habits ─────────────────────────────────────────────────────────────────

  private addHabit() {
    const name = this.newHabitName.trim();
    if (!name) return;
    this.habits = [...this.habits, { id: this.nextId++, name, completed: false }];
    this.newHabitName = '';
    if (this.inputRef) this.inputRef.value = '';
    this.inputRef?.focus();
    this.persist();
  }

  private toggleHabit(id: number) {
    this.habits = this.habits.map(h => (h.id === id ? { ...h, completed: !h.completed } : h));
    this.persist();
  }

  private removeHabit(id: number) {
    this.habits = this.habits.filter(h => h.id !== id);
    this.persist();
  }

  private clearCompleted() {
    this.habits = this.habits.map(h => ({ ...h, completed: false }));
    this.persist();
  }

  // ─── Date utils ─────────────────────────────────────────────────────────────

  private sameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  private isToday(date: Date) { return this.sameDay(date, new Date()); }

  private isFuture(date: Date) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const d = new Date(date); d.setHours(0, 0, 0, 0);
    return d > today;
  }

  private formattedDate(date: Date) {
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  // ─── Calendar render ────────────────────────────────────────────────────────

  private renderCalendar() {
    const store = this.readStore();
    const year = this.calendarViewDate.getFullYear();
    const month = this.calendarViewDate.getMonth();
    const today = new Date();
    const atCurrentMonth = year === today.getFullYear() && month === today.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthLabel = this.calendarViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const cells: any[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(<div key={`e${i}`} />);

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const key = this.dateKey(date);
      const data = store[key];
      const dayHabits: Habit[] = data?.habits ?? [];
      const hasData = dayHabits.length > 0;
      const allDone = hasData && dayHabits.every(h => h.completed);
      const isSelected = this.sameDay(date, this.selectedDate);
      const isToday = this.isToday(date);
      const future = this.isFuture(date);

      let cls = 'relative flex flex-col items-center justify-center w-9 h-9 rounded-full text-sm font-medium transition-all duration-150 mx-auto focus:outline-none ';
      if (isSelected) cls += 'bg-violet-600 text-white shadow-md ';
      else if (isToday) cls += 'border-2 border-violet-400 text-violet-700 hover:bg-violet-50 ';
      else if (future) cls += 'text-gray-300 cursor-not-allowed ';
      else cls += 'text-gray-700 hover:bg-violet-50 ';

      const dotColor = hasData ? (isSelected ? 'bg-white' : allDone ? 'bg-emerald-400' : 'bg-violet-400') : '';

      cells.push(
        <button key={`d${d}`} class={cls} disabled={future} onClick={() => !future && this.selectDate(date)}>
          {d}
          {hasData && <span class={`absolute rounded-full ${dotColor}`} style={{ width: '6px', height: '6px', bottom: '3px' }} />}
        </button>
      );
    }

    return (
      <div
        class="absolute mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-violet-100 p-4"
        style={{ top: '100%', left: '50%', transform: 'translateX(-50%)', zIndex: '50' }}
        onClick={(e: MouseEvent) => e.stopPropagation()}
      >
        <div class="flex items-center justify-between mb-3">
          <button class="p-1.5 rounded-lg hover:bg-violet-50 text-gray-400 hover:text-violet-600 transition-colors focus:outline-none" onClick={() => this.prevMonth()}>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span class="text-sm font-semibold text-gray-800">{monthLabel}</span>
          <button
            class={`p-1.5 rounded-lg transition-colors focus:outline-none ${atCurrentMonth ? 'text-gray-200 cursor-not-allowed' : 'hover:bg-violet-50 text-gray-400 hover:text-violet-600'}`}
            disabled={atCurrentMonth} onClick={() => !atCurrentMonth && this.nextMonth()}
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        <div class="grid grid-cols-7 mb-1">
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(l => <div key={l} class="text-center text-xs font-medium text-gray-400 py-1">{l}</div>)}
        </div>
        <div class="grid grid-cols-7 gap-y-0.5">{cells}</div>
        <div class="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
          <div class="flex items-center gap-1.5"><span class="inline-block w-2 h-2 rounded-full bg-violet-400" /><span class="text-xs text-gray-400">In progress</span></div>
          <div class="flex items-center gap-1.5"><span class="inline-block w-2 h-2 rounded-full bg-emerald-400" /><span class="text-xs text-gray-400">All done</span></div>
        </div>
      </div>
    );
  }

  // ─── Binder editor render ───────────────────────────────────────────────────

  private renderBinder() {
    const RING_COUNT = 9;
    const lineHeight = 40; // px — must match textarea line-height

    // Combined background: red margin line + horizontal rules
    const paperBg = [
      `linear-gradient(90deg, transparent 56px, #fca5a5 56px, #fca5a5 57px, transparent 57px)`,
      `repeating-linear-gradient(to bottom, transparent 0px, transparent ${lineHeight - 1}px, #d1d5db ${lineHeight - 1}px, #d1d5db ${lineHeight}px)`,
    ].join(', ');

    return (
      <div class="flex-1 rounded-3xl overflow-hidden shadow-xl border border-slate-200" style={{ minHeight: '560px' }}>
        <div class="flex h-full" style={{ minHeight: '560px' }}>

          {/* ── Spine / Rings ── */}
          <div
            class="flex flex-col items-center py-6 border-r-2 border-slate-300"
            style={{
              width: '44px',
              flexShrink: '0',
              background: 'linear-gradient(to right, #cbd5e1, #e2e8f0)',
              gap: `${Math.floor((560 - 48 - RING_COUNT * 22) / (RING_COUNT - 1))}px`,
            }}
          >
            {Array.from({ length: RING_COUNT }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  border: '3px solid #94a3b8',
                  background: 'radial-gradient(circle at 35% 35%, #f8fafc, #cbd5e1)',
                  boxShadow: 'inset 0 2px 3px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.1)',
                  flexShrink: '0',
                }}
              />
            ))}
          </div>

          {/* ── Paper ── */}
          <div class="flex-1 flex flex-col" style={{ background: '#fffef7' }}>

            {/* Top strip — title row */}
            <div
              class="flex items-center justify-between px-5 border-b-2"
              style={{ borderColor: '#fca5a5', minHeight: '48px', background: '#fffef7' }}
            >
              <div class="flex items-center gap-2">
                <span class="inline-block w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span class="text-sm font-bold tracking-widest text-rose-400 uppercase">Notes</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-xs text-gray-300">{this.notes.length > 0 ? `${this.notes.length} chars` : ''}</span>
                <span class="text-xs text-gray-400">{this.formattedDate(this.selectedDate)}</span>
              </div>
            </div>

            {/* Ruled writing area */}
            <div class="flex-1 relative" style={{ background: paperBg, backgroundSize: `100% ${lineHeight}px` }}>
              <textarea
                class="absolute inset-0 w-full h-full resize-none focus:outline-none text-gray-700"
                style={{
                  background: 'transparent',
                  lineHeight: `${lineHeight}px`,
                  paddingLeft: '72px',
                  paddingRight: '20px',
                  paddingTop: '0px',
                  fontFamily: '"Georgia", "Times New Roman", serif',
                  fontSize: '15px',
                  color: '#374151',
                  caretColor: '#7c3aed',
                }}
                placeholder="Write your thoughts, goals, or reflections for the day..."
                value={this.notes}
                onInput={(e: Event) => {
                  this.notes = (e.target as HTMLTextAreaElement).value;
                  this.persist();
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main render ────────────────────────────────────────────────────────────

  render() {
    const completedCount = this.habits.filter(h => h.completed).length;
    const totalCount = this.habits.length;
    const allDone = totalCount > 0 && completedCount === totalCount;
    const isViewingPast = !this.isToday(this.selectedDate);

    return (
      <div class="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100 flex items-start justify-center px-6 py-10">

        {/* Backdrop */}
        {this.showCalendar && (
          <div class="fixed inset-0" style={{ zIndex: '40' }} onClick={() => (this.showCalendar = false)} />
        )}

        <div class="w-full" style={{ maxWidth: '1100px' }}>

          {/* ── Header ── */}
          <div class="text-center mb-8">
            <div class="inline-block relative mb-4" style={{ zIndex: this.showCalendar ? '50' : 'auto' }}>
              <button
                class="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-violet-100 text-violet-600 text-sm font-medium px-4 py-1.5 rounded-full shadow-sm hover:bg-white hover:shadow-md hover:border-violet-300 transition-all duration-150 focus:outline-none cursor-pointer"
                onClick={() => (this.showCalendar ? (this.showCalendar = false) : this.openCalendar())}
              >
                <span>📅</span>
                <span>{this.formattedDate(this.selectedDate)}</span>
                <svg class={`w-3.5 h-3.5 text-violet-400 transition-transform duration-200 ${this.showCalendar ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {this.showCalendar && this.renderCalendar()}
            </div>
            <h1
              class="text-4xl font-bold tracking-tight"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
            >
              Daily Habits
            </h1>
            <p class="text-gray-400 mt-1.5 text-sm">
              {isViewingPast
                ? '🕐 Viewing a past day — changes are saved automatically'
                : allDone && totalCount > 0
                ? '🎉 All habits complete — amazing work today!'
                : totalCount > 0 && completedCount > 0
                ? `⚡ Keep going — ${totalCount - completedCount} habit${totalCount - completedCount !== 1 ? 's' : ''} left!`
                : 'Track what matters every day'}
            </p>
            <p class="text-gray-300 mt-2 text-xs italic">"{dailyQuote()}"</p>
          </div>

          {/* ── Two-column layout ── */}
          <div class="flex gap-6 items-start">

            {/* ── LEFT: Habit tracker ── */}
            <div style={{ width: '400px', flexShrink: '0' }}>
              <div class="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl shadow-violet-100/60 overflow-hidden border border-violet-100/60">
                {/* Gradient top accent bar */}
                <div style={{ height: '4px', background: 'linear-gradient(90deg, #7c3aed, #6366f1, #818cf8)' }} />

                {/* Stats ribbon */}
                {totalCount > 0 && !isViewingPast && (
                  <div class="flex items-center gap-5 px-5 py-3 border-b border-violet-50/80" style={{ background: 'linear-gradient(135deg, #faf5ff, #eef2ff)' }}>
                    <div class="flex items-center gap-2">
                      <span class="text-xl">🔥</span>
                      <div>
                        <div class="text-lg font-bold text-gray-800 leading-none">1</div>
                        <div class="text-xs text-gray-400 mt-0.5">day streak</div>
                      </div>
                    </div>
                    <div class="w-px h-10 bg-violet-100" />
                    <div class="flex items-center gap-2">
                      <span class="text-xl">⚡</span>
                      <div>
                        <div class="text-lg font-bold text-gray-800 leading-none">{completedCount}</div>
                        <div class="text-xs text-gray-400 mt-0.5">done today</div>
                      </div>
                    </div>
                    <div class="w-px h-10 bg-violet-100" />
                    <div class="flex items-center gap-2">
                      <span class="text-xl">🎯</span>
                      <div>
                        <div class="text-lg font-bold text-gray-800 leading-none">{totalCount}</div>
                        <div class="text-xs text-gray-400 mt-0.5">habits total</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Past banner */}
                {isViewingPast && (
                  <div class="flex items-center gap-2 bg-amber-50 border-b border-amber-100 px-5 py-2.5">
                    <span class="text-amber-500 text-sm">🕐</span>
                    <span class="text-amber-700 text-xs font-medium">Past entry</span>
                    <button class="ml-auto text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors" onClick={() => this.selectDate(new Date())}>
                      Go to today →
                    </button>
                  </div>
                )}

                {/* Circular progress ring */}
                {totalCount > 0 && (
                  <div class="px-5 pt-4 pb-3 flex items-center gap-5">
                    {(() => {
                      const pct = Math.round((completedCount / totalCount) * 100);
                      const r = 30;
                      const circ = 2 * Math.PI * r;
                      const dash = (pct / 100) * circ;
                      const color = allDone ? '#10b981' : '#7c3aed';
                      return (
                        <div class="relative flex-shrink-0" style={{ width: '76px', height: '76px' }}>
                          <svg width="76" height="76" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="38" cy="38" r={r} fill="none" stroke="#d1d5db" stroke-width="8" />
                            <circle
                              cx="38" cy="38" r={r} fill="none"
                              stroke={color} stroke-width="8"
                              stroke-linecap="round"
                              stroke-dasharray={`${dash} ${circ}`}
                              style={{ transition: 'stroke-dasharray 0.6s ease', filter: `drop-shadow(0 0 4px ${color}66)` }}
                            />
                          </svg>
                          <div class="absolute inset-0 flex flex-col items-center justify-center">
                            <span class="text-sm font-bold" style={{ color }}>{pct}%</span>
                          </div>
                        </div>
                      );
                    })()}
                    <div class="flex-1">
                      <div class="text-sm font-semibold text-gray-700 mb-0.5">
                        {allDone ? '🎉 All done!' : `${completedCount} of ${totalCount} complete`}
                      </div>
                      <div class="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          class="h-1.5 rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.round((completedCount / totalCount) * 100)}%`,
                            background: allDone ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#7c3aed,#818cf8)',
                          }}
                        />
                      </div>
                      <div class="text-xs text-gray-400 mt-1">{totalCount - completedCount} remaining today</div>
                    </div>
                  </div>
                )}

                {/* Add habit */}
                <div class="px-5 pt-4 pb-4">
                  <div class="flex gap-2">
                    <input
                      ref={el => (this.inputRef = el as HTMLInputElement)}
                      type="text"
                      placeholder="Add a new habit..."
                      class="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
                      onInput={(e: Event) => (this.newHabitName = (e.target as HTMLInputElement).value)}
                      onKeyDown={(e: KeyboardEvent) => e.key === 'Enter' && this.addHabit()}
                    />
                    <button
                      onClick={() => this.addHabit()}
                      disabled={!this.newHabitName.trim()}
                      class="active:scale-95 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all duration-150 shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 4px 12px rgba(124,58,237,0.35)' }}
                    >
                      + Add
                    </button>
                  </div>
                </div>

                <div class="border-t border-gray-100 mx-5" />

                {/* Habit list */}
                <div class="px-5 py-4" style={{ minHeight: '80px' }}>
                  {this.habits.length === 0 ? (
                    <div class="text-center py-8">
                      <div class="text-4xl mb-2">✨</div>
                      <p class="text-gray-400 text-sm">No habits yet. Add one above!</p>
                    </div>
                  ) : (() => {
                    const pending = this.habits.filter(h => !h.completed);
                    const done = this.habits.filter(h => h.completed);
                    const hasBoth = pending.length > 0 && done.length > 0;
                    const row = (habit: Habit) => (
                      <div
                        key={habit.id}
                        class={`flex items-center gap-3 p-3 mb-2 rounded-xl transition-all duration-200 group border-l-4 hover:scale-[1.01] hover:shadow-md ${
                          habit.completed
                            ? 'bg-emerald-50/60 border border-emerald-100 border-l-emerald-400'
                            : 'bg-gray-50 border border-gray-100 border-l-violet-400 hover:border-violet-200 hover:bg-violet-50/40'
                        }`}
                      >
                        <button
                          onClick={() => this.toggleHabit(habit.id)}
                          class={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                            habit.completed
                              ? 'border-emerald-500 bg-emerald-500'
                              : 'border-gray-300 bg-white hover:border-violet-400'
                          }`}
                        >
                          {habit.completed && (
                            <svg class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <span class="text-base leading-none select-none">{habitIcon(habit.name)}</span>
                        <span class={`flex-1 text-sm font-medium transition-all duration-200 ${habit.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                          {habit.name}
                        </span>
                        <button
                          onClick={() => this.removeHabit(habit.id)}
                          class="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all duration-150 p-1 rounded-lg hover:bg-red-50 focus:outline-none"
                        >
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                    return (
                      <div>
                        {hasBoth && <div class="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2">Pending</div>}
                        {pending.map(row)}
                        {hasBoth && <div class="text-xs font-semibold text-emerald-500 uppercase tracking-wide px-1 mt-3 mb-2">Completed</div>}
                        {done.map(row)}
                      </div>
                    );
                  })()}
                </div>

                {/* Footer */}
                {completedCount > 0 && (
                  <div class="px-5 pb-5 pt-1 flex items-center justify-end">
                    <button
                      onClick={() => this.clearCompleted()}
                      class="text-xs font-medium text-violet-500 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-all duration-150"
                    >
                      Clear selections
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT: Binder editor ── */}
            {this.renderBinder()}
          </div>

          <p class="text-center text-xs text-gray-400 mt-6">Built with StencilJS + Tailwind CSS</p>
        </div>
      </div>
    );
  }
}
