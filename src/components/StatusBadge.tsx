import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type EndpointStatus = Database["public"]["Enums"]["endpoint_status"];
type EventStatus = Database["public"]["Enums"]["event_status"];

const endpointConfig: Record<EndpointStatus, string> = {
  secure: "bg-cyber-green/20 text-cyber-green border-cyber-green/30",
  warning: "bg-cyber-amber/20 text-cyber-amber border-cyber-amber/30",
  critical: "bg-cyber-red/20 text-cyber-red border-cyber-red/30",
  offline: "bg-muted text-muted-foreground border-muted",
};

const eventConfig: Record<EventStatus, string> = {
  open: "bg-cyber-red/20 text-cyber-red border-cyber-red/30",
  investigating: "bg-cyber-amber/20 text-cyber-amber border-cyber-amber/30",
  resolved: "bg-cyber-green/20 text-cyber-green border-cyber-green/30",
  dismissed: "bg-muted text-muted-foreground border-muted",
};

export function EndpointStatusBadge({ status }: { status: EndpointStatus }) {
  return <Badge variant="outline" className={cn("font-mono text-[10px] capitalize", endpointConfig[status])}>{status}</Badge>;
}

export function EventStatusBadge({ status }: { status: EventStatus }) {
  return <Badge variant="outline" className={cn("font-mono text-[10px] capitalize", eventConfig[status])}>{status}</Badge>;
}
