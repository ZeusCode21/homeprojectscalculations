'use client';

import type { ReactNode } from 'react';
import { ModelProvider } from '@/lib/context';
import { AppSidebar, useSidebarCollapsed } from '@/components/AppSidebar';
import { cn } from '@/lib/utils';

function Shell({ children }: { children: ReactNode }) {
  const { collapsed, onCollapsedChange } = useSidebarCollapsed();

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar collapsed={collapsed} onCollapsedChange={onCollapsedChange} />
      <main
        className={cn(
          'min-h-screen transition-[padding] duration-200',
          collapsed ? 'pl-14' : 'pl-60'
        )}
      >
        <div className="mx-auto max-w-[1200px] px-6 py-8 page-enter">{children}</div>
      </main>
    </div>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ModelProvider>
      <Shell>{children}</Shell>
    </ModelProvider>
  );
}
