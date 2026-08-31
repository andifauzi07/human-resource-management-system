import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"]

// Peta kondisi umum HRIS (cuti/absensi/karyawan) ke varian Badge token.
const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  active: "success",
  approved: "success",
  success: "success",
  present: "success",
  pending: "warning",
  warning: "warning",
  processing: "info",
  info: "info",
  rejected: "destructive",
  cancelled: "destructive",
  failed: "destructive",
  absent: "destructive",
  inactive: "secondary",
}

interface StatusBadgeProps extends React.ComponentProps<"span"> {
  status: string
  label?: string
  variant?: BadgeVariant
}

function StatusBadge({
  status,
  label,
  variant,
  className,
  ...props
}: StatusBadgeProps) {
  const resolved =
    variant ?? STATUS_VARIANTS[status.toLowerCase()] ?? "secondary"
  return (
    <Badge
      variant={resolved}
      className={cn("capitalize", className)}
      {...props}
    >
      {label ?? status}
    </Badge>
  )
}

export { StatusBadge }