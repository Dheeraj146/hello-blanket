import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type Severity = Database["public"]["Enums"]["severity_level"];

const severityConfig: Record<Severity, { className: string; label: string }> = {
  critical: { className: "bg-cyber-red/20 text-cyber-red border-cyber-red/30", label: "Critical" },
  high: { className: "bg-cyber-amber/20 text-cyber-amber border-cyber-amber/30", label: "High" },
  medium: { className: "bg-cyber-cyan/20 text-cyber-cyan border-cyber-cyan/30", label: "Medium" },
  low: { className: "bg-cyber-green/20 text-cyber-green border-cyber-green/30", label: "Low" },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const config = severityConfig[severity];
  return <Badge variant="outline" className={cn("font-mono text-[10px]", config.className)}>{config.label}</Badge>;
}
