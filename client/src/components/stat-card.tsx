import * as React from "react"
import type { LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps extends React.ComponentProps<typeof Card> {
  label: string
  value: React.ReactNode
  icon?: LucideIcon
  hint?: string
}

function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  className,
  ...props
}: StatCardProps) {
  return (
    <Card
      className={cn("gap-3 py-5", className)}
      {...props}
    >
      <CardContent className="flex items-center justify-between gap-4 px-5">
        <div className="grid gap-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        {Icon && (
          <span className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg text-primary">
            <Icon className="size-5" />
          </span>
        )}
      </CardContent>
    </Card>
  )
}

export { StatCard }