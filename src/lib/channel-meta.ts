import {
  MessageSquare,
  Hash,
  MessageCircle,
  Camera,
  Smartphone,
  Mail,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneCall,
  Code,
  type LucideIcon,
} from "lucide-react";

// Maps a create-flow channel label to its chip display name, brand color, and icon.
export const CHANNEL_META: Record<
  string,
  { display: string; color: string; Icon: LucideIcon }
> = {
  "Web Widget": { display: "Widget", color: "#e05c34", Icon: MessageSquare },
  Slack: { display: "Slack", color: "#724be8", Icon: Hash },
  "Facebook Messenger": { display: "Messenger", color: "#3489db", Icon: MessageCircle },
  WhatsApp: { display: "WhatsApp", color: "#109081", Icon: MessageCircle },
  "Instagram Direct": { display: "Instagram", color: "#d62976", Icon: Camera },
  Android: { display: "Android", color: "#8a9a5b", Icon: Smartphone },
  iOS: { display: "iOS", color: "#4b4b4b", Icon: Smartphone },
  LINE: { display: "LINE", color: "#23831b", Icon: MessageCircle },
  Email: { display: "Email", color: "#2f69c7", Icon: Mail },
  "Inbound Voice": { display: "Inbound Voice", color: "#ac2a34", Icon: PhoneIncoming },
  "Outbound Voice": { display: "Outbound Voice", color: "#be297b", Icon: PhoneOutgoing },
  "Web Call": { display: "Web Call", color: "#7c1d79", Icon: PhoneCall },
  API: { display: "API", color: "#2f99b3", Icon: Code },
};

export function channelMeta(label: string) {
  return (
    CHANNEL_META[label] ?? {
      display: label,
      color: "#646864",
      Icon: MessageSquare,
    }
  );
}
