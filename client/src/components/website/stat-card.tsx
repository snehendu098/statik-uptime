"use client";

import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number | ReactNode;
  subtitle?: string;
  icon?: ReactNode;
}

export function StatCard({ title, value, subtitle, icon }: StatCardProps) {
  return (
    <div className="p-6 border bg-card rounded-4xl w-full min-w-0 transition-all duration-300 ease-in-out">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-muted-foreground">{title}</p>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        <p className="text-4xl font-semibold">
          <span className="inline-block transition-all duration-300 ease-out">
            {value}
          </span>
        </p>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
