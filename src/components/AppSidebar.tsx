'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useModel } from '@/lib/context';
import { NAV_ITEMS } from '@/lib/nav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const SIDEBAR_KEY = 'growthModelSidebarCollapsed';

export function AppSidebar({
  collapsed,
  onCollapsedChange,
}: {
  collapsed: boolean;
  onCollapsedChange: (v: boolean) => void;
}) {
  const pathname = usePathname();
  const {
    state,
    currentBusinessId,
    currentBusinessName,
    setBusinessId,
    scenarioMetas,
    currentScenarioId,
    setScenarioId,
  } = useModel();

  const [bizOpen, setBizOpen] = useState(false);
  const businesses = Object.values(state.businesses);
  const currentScenarioName =
    scenarioMetas.find(m => m.id === currentScenarioId)?.displayName || 'Base plan';

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-background transition-[width] duration-200',
        collapsed ? 'w-14' : 'w-60'
      )}
    >
      <div className="flex items-start justify-between gap-2 border-b px-3 py-3">
        {!collapsed && (
          <div className="min-w-0 pt-0.5">
            <h1 className="font-serif text-lg leading-tight truncate">Growth Model</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">Private · this browser</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0 ml-auto"
          onClick={() => onCollapsedChange(!collapsed)}
          aria-label={collapsed ? 'Expand nav' : 'Collapse nav'}
          title={collapsed ? 'Expand nav' : 'Collapse nav'}
        >
          {collapsed ? '»' : '«'}
        </Button>
      </div>

      {!collapsed && (
        <div className="border-b px-3 py-3">
          <button
            type="button"
            onClick={() => setBizOpen(v => !v)}
            className="interactive-lift w-full rounded-lg border bg-card px-3 py-2.5 text-left hover:bg-muted/50 hover:border-primary/25"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Business
                </div>
                <div className="font-medium text-sm truncate flex items-center gap-1.5">
                  {currentBusinessName}
                  {currentBusinessId === 'safemomma' && (
                    <Badge variant="secondary" className="text-[10px]">
                      placeholder
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate mt-0.5">
                  Scenario · {currentScenarioName}
                </div>
              </div>
              <span className="text-muted-foreground text-xs shrink-0">
                {bizOpen ? '▴' : '▾'}
              </span>
            </div>
          </button>

          {bizOpen && (
            <div className="mt-2 rounded-lg border bg-muted/20 p-2 space-y-3">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground px-1 mb-1">
                  Switch business
                </div>
                <ul className="space-y-0.5">
                  {businesses.map(b => (
                    <li key={b.id}>
                      <button
                        type="button"
                        onClick={() => setBusinessId(b.id)}
                        className={cn(
                          'w-full rounded-md px-2 py-1.5 text-left text-sm motion-safe:transition-colors motion-safe:duration-150',
                          b.id === currentBusinessId
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'hover:bg-muted text-foreground active:scale-[0.99]'
                        )}
                      >
                        {b.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t pt-2">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground px-1 mb-1">
                  Scenario
                </div>
                <ul className="space-y-0.5">
                  {scenarioMetas.map(m => (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => setScenarioId(m.id)}
                        className={cn(
                          'w-full rounded-md px-2 py-1.5 text-left text-sm motion-safe:transition-colors motion-safe:duration-150',
                          m.id === currentScenarioId
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'hover:bg-muted text-muted-foreground hover:text-foreground active:scale-[0.99]'
                        )}
                      >
                        {m.displayName}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href;
            const short = item.label
              .split(/[\s&]+/)
              .map(w => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={item.label}
                  className={cn(
                    'block rounded-md text-sm motion-safe:transition-[color,background-color,transform] motion-safe:duration-150',
                    collapsed ? 'px-2 py-2 text-center' : 'px-3 py-2',
                    active
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-0.5 active:scale-[0.99]'
                  )}
                >
                  {collapsed ? short : item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

export function useSidebarCollapsed() {
  // Always start expanded so SSR matches first client paint
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore preference after mount
      setCollapsed(localStorage.getItem(SIDEBAR_KEY) === '1');
    } catch {
      /* ignore */
    }
  }, []);

  const onCollapsedChange = (v: boolean) => {
    setCollapsed(v);
    try {
      localStorage.setItem(SIDEBAR_KEY, v ? '1' : '0');
    } catch {
      /* ignore */
    }
  };

  return { collapsed, onCollapsedChange };
}
