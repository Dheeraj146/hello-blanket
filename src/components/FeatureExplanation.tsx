import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, Mail, ShieldAlert, Server } from "lucide-react";
import type { ReactNode } from "react";

export type FeatureKey = "email-monitoring" | "threat-detection" | "endpoint-monitoring";

const FEATURES: Record<FeatureKey, { icon: typeof Mail; title: string; sections: { heading: string; content: string }[] }> = {
  "email-monitoring": {
    icon: Mail,
    title: "Email Monitoring",
    sections: [
      {
        heading: "What it does",
        content: "Email Monitoring tracks every sent and received email across your domain in real time. It captures metadata including sender, recipient, subject, protocol, size, attachment status, and delivery outcome — giving you full visibility into your organization's email traffic."
      },
      {
        heading: "How it works",
        content: "The system integrates with multiple email protocols including SMTP (Simple Mail Transfer Protocol), IMAP (Internet Message Access Protocol), POP3, and Microsoft Exchange. Each email transaction is logged with its protocol, direction (inbound/outbound), delivery status, and associated IP address. Emails are automatically scanned for threats, spam content, and suspicious attachments."
      },
      {
        heading: "Key metrics tracked",
        content: "• Total email volume (inbound vs outbound)\n• Delivery success/failure rates\n• Protocol distribution (SMTP, IMAP, Exchange, POP3)\n• Spam score analysis\n• Attachment tracking\n• Threat detection rates\n• Email size distribution\n• Blocked and quarantined message counts"
      },
    ],
  },
  "threat-detection": {
    icon: ShieldAlert,
    title: "Threat Detection",
    sections: [
      {
        heading: "What it does",
        content: "Threat Detection identifies and classifies security threats across your infrastructure in real time. It monitors for phishing attempts, malware delivery, spoofing attacks, spam campaigns, and other malicious activities targeting your domain."
      },
      {
        heading: "How it works",
        content: "The system uses multi-layered analysis combining signature-based detection, heuristic analysis, and behavioral pattern recognition. Each incoming communication is evaluated against known threat databases, checked for domain spoofing indicators (SPF, DKIM, DMARC validation), and analyzed for suspicious patterns. Threats are classified by severity (Critical, High, Medium, Low) and tracked from detection through resolution."
      },
      {
        heading: "Key metrics tracked",
        content: "• Active vs resolved threats\n• Severity distribution (Critical/High/Medium/Low)\n• Threat source identification and geolocation\n• Detection-to-resolution time\n• Threat type classification (phishing, malware, spoofing, spam)\n• False positive rates\n• Attack vector analysis"
      },
    ],
  },
  "endpoint-monitoring": {
    icon: Server,
    title: "Endpoint Monitoring",
    sections: [
      {
        heading: "What it does",
        content: "Endpoint Monitoring provides continuous surveillance of all network-connected devices and servers in your infrastructure. It tracks device health, agent status, operating system information, and security posture of each endpoint."
      },
      {
        heading: "How it works",
        content: "Lightweight monitoring agents are deployed on each endpoint (servers, workstations, network devices). These agents report status, system information, and security events back to the central dashboard. Endpoints are classified into status tiers: Secure (fully compliant), Warning (minor issues detected), Critical (active threats or major vulnerabilities), and Offline (unreachable). The system tracks last-seen timestamps to detect offline endpoints quickly."
      },
      {
        heading: "Key metrics tracked",
        content: "• Total endpoints under surveillance\n• Status distribution (Secure/Warning/Critical/Offline)\n• Operating system inventory\n• Agent version compliance\n• Last-seen timestamps and uptime\n• IP address mapping\n• Hostname registry"
      },
    ],
  },
};

interface FeatureExplanationDialogProps {
  featureKey: FeatureKey;
  trigger?: ReactNode;
}

export function FeatureExplanationDialog({ featureKey, trigger }: FeatureExplanationDialogProps) {
  const feature = FEATURES[featureKey];
  const Icon = feature.icon;

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
            <Info className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            {feature.title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {feature.sections.map((s) => (
            <div key={s.heading}>
              <h3 className="text-sm font-semibold mb-1">{s.heading}</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{s.content}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
