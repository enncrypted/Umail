export type FolderId = "inbox" | "sent" | "drafts" | "spam" | "archive" | "scheduled";

export interface Attachment {
  id: string;
  name: string;
  size: string;
  kind: "pdf" | "doc" | "sheet" | "image" | "zip";
}

export interface Message {
  id: string;
  from: string;
  fromEmail: string;
  to: string;
  time: string;
  body: string;
  attachments?: Attachment[];
}

export interface Email {
  id: string;
  folder: FolderId;
  subject: string;
  sender: string;
  senderEmail: string;
  preview: string;
  time: string;
  unread: boolean;
  starred: boolean;
  priority: boolean;
  labels: string[];
  hasAttachment: boolean;
  messages: Message[];
}

export interface AppNotification {
  id: string;
  title: string;
  detail: string;
  time: string;
  kind: "reminder" | "mention" | "system";
  read: boolean;
}

const msg = (
  id: string,
  from: string,
  fromEmail: string,
  time: string,
  body: string,
  attachments?: Attachment[],
  to = "you@contoso.com",
): Message => ({
  id,
  from,
  fromEmail,
  to,
  time,
  body,
  ...(attachments ? { attachments } : {}),
});

// User 1: Sarah J. Assenmon (sarah.j@contoso.com) - Product & Executive Lead
const SARAH_EMAILS: Email[] = [
  {
    id: "s-e1",
    folder: "inbox",
    subject: "FW: Q4 Product Roadmap & Executive Board Deck — Final Sign-off",
    sender: "Chief Product Officer",
    senderEmail: "cpo@contoso.com",
    preview:
      "Thank you for your leadership on Nova Mail. We need the Q4 strategy deck locked by Friday 5 PM EST.",
    time: "11:15 AM",
    unread: true,
    starred: true,
    priority: true,
    labels: ["Product Strategy", "Board Deck"],
    hasAttachment: true,
    messages: [
      msg(
        "s-e1m1",
        "Chief Product Officer",
        "cpo@contoso.com",
        "11:15 AM",
        "Hi Sarah,\n\nThank you for the early preview — the review board is thrilled with the enterprise mail client UI progress.\n\nCould you send the finalized Q4 roadmap and user retention metrics by Friday 5 PM EST? I'll fold them directly into the executive board packet.\n\nBest,\nMarcus (CPO)",
        [
          { id: "sa1", name: "Q4-Product-Roadmap.pdf", size: "3.8 MB", kind: "pdf" },
          { id: "sa2", name: "UX-Retention-Metrics.xlsx", size: "1.2 MB", kind: "sheet" },
        ],
        "sarah.j@contoso.com",
      ),
      msg(
        "s-e1m2",
        "Mark Chen",
        "mark.c@contoso.com",
        "11:41 AM",
        "Adding the platform data — frontend bundle size dropped 42% after TanStack Start SSR optimizations, so performance slides look strong for the board.",
        undefined,
        "sarah.j@contoso.com",
      ),
    ],
  },
  {
    id: "s-e2",
    folder: "inbox",
    subject: "Design System v3.0 Redlines & Dark Mode Theme Spec",
    sender: "Dana Whitfield",
    senderEmail: "dana.w@contoso.com",
    preview:
      "Attached the redlines for empty states, notification center overflow, and automatic system dark mode detection.",
    time: "10:30 AM",
    unread: true,
    starred: false,
    priority: true,
    labels: ["Design System"],
    hasAttachment: true,
    messages: [
      msg(
        "s-e2m1",
        "Dana Whitfield",
        "dana.w@contoso.com",
        "10:30 AM",
        "Hi Sarah,\n\nRedlines for Design System v3.0 attached. Highlights:\n1. Azure-inspired enterprise color palette with high contrast ratios.\n2. Smooth 200ms transitions for dark/light mode toggle.\n3. Accessible focus rings and keyboard navigation.\n\nLet me know if we can merge these into the component library.\n\n— Dana",
        [
          { id: "sa3", name: "DS-v3-Redlines.png", size: "2.4 MB", kind: "image" },
          { id: "sa4", name: "theme-tokens.json", size: "45 KB", kind: "doc" },
        ],
        "sarah.j@contoso.com",
      ),
    ],
  },
  {
    id: "s-e3",
    folder: "inbox",
    subject: "Acme Enterprise Customer Feedback — Nova Mail Alpha",
    sender: "Alex Rivera (Acme Corp VP)",
    senderEmail: "alex.r@acme.com",
    preview:
      "Our leadership team tested Nova Mail all week. The responsiveness and keyboard shortcuts are fantastic.",
    time: "Yesterday",
    unread: false,
    starred: true,
    priority: false,
    labels: ["Customer", "Enterprise"],
    hasAttachment: false,
    messages: [
      msg(
        "s-e3m1",
        "Alex Rivera",
        "alex.r@acme.com",
        "Yesterday",
        "Hi Sarah,\n\nJust wanted to pass along great feedback from our trial users at Acme. The 3-panel layout and quick keyboard shortcuts ('/' for search, 'J/K' for navigation) saved our team hours this week.\n\nWe'd love to discuss enterprise SSO rollout when you have a moment.\n\nBest regards,\nAlex Rivera\nVP of Operations, Acme Corp",
        undefined,
        "sarah.j@contoso.com",
      ),
    ],
  },
  {
    id: "s-e4",
    folder: "inbox",
    subject: "Approved: UX Research & Accessibility Audit Budget ($45k)",
    sender: "Finance Desk",
    senderEmail: "finance@contoso.com",
    preview:
      "Your purchase order for Q4 user testing and accessibility compliance auditing has been officially approved.",
    time: "Tuesday",
    unread: false,
    starred: false,
    priority: false,
    labels: ["Finance", "Budget"],
    hasAttachment: true,
    messages: [
      msg(
        "s-e4m1",
        "Finance Desk",
        "finance@contoso.com",
        "Tuesday",
        "Sarah,\n\nPurchase Order PO-89241 ($45,000) for external accessibility testing and user research sessions has been approved by corporate accounting.\n\nSigned PO attached.\n\n— Finance Desk",
        [{ id: "sa5", name: "PO-89241-Signed.pdf", size: "680 KB", kind: "pdf" }],
        "sarah.j@contoso.com",
      ),
    ],
  },
  {
    id: "s-sent1",
    folder: "sent",
    subject: "RE: Q4 Product Roadmap & Executive Board Deck",
    sender: "Sarah J. Assenmon",
    senderEmail: "sarah.j@contoso.com",
    preview:
      "Hi Marcus, slide deck updated with Mark's bundle optimizations and Dana's design system redlines.",
    time: "1:20 PM",
    unread: false,
    starred: false,
    priority: false,
    labels: ["Board Deck"],
    hasAttachment: false,
    messages: [
      msg(
        "s-sent1m1",
        "Sarah J. Assenmon",
        "sarah.j@contoso.com",
        "1:20 PM",
        "Marcus — updated the slide deck with Mark's latest performance deltas and our Q4 design roadmap. Ready for your review ahead of Friday.\n\nSarah",
        undefined,
        "cpo@contoso.com",
      ),
    ],
  },
  {
    id: "s-d1",
    folder: "drafts",
    subject: "Draft: Executive Summary for Q4 Keynote",
    sender: "Sarah J. Assenmon",
    senderEmail: "sarah.j@contoso.com",
    preview:
      "Keynote theme: Speed, Simplicity, and Enterprise Security. Outline of upcoming features...",
    time: "Yesterday",
    unread: false,
    starred: false,
    priority: false,
    labels: ["Draft"],
    hasAttachment: false,
    messages: [
      msg(
        "s-d1m1",
        "Sarah J. Assenmon",
        "sarah.j@contoso.com",
        "Yesterday",
        "Keynote theme: Speed, Simplicity, and Enterprise Security.\n\n1. Built with modern web standards\n2. Sub-100ms UI responses\n3. Zero client-side API key leaks\n4. Seamless account switching",
        undefined,
        "all-product@contoso.com",
      ),
    ],
  },
  {
    id: "s-sched1",
    folder: "scheduled",
    subject: "Scheduled: All-Hands Product Keynote Announcement",
    sender: "Sarah J. Assenmon",
    senderEmail: "sarah.j@contoso.com",
    preview:
      "Team, join us this Thursday at 10 AM EST for the live demonstration of the new Nova Mail client.",
    time: "Scheduled for Thu 10:00 AM",
    unread: false,
    starred: false,
    priority: false,
    labels: ["Scheduled"],
    hasAttachment: false,
    messages: [
      msg(
        "s-sched1m1",
        "Sarah J. Assenmon",
        "sarah.j@contoso.com",
        "Thu 10:00 AM",
        "Hello Team,\n\nPlease join us this Thursday at 10 AM EST for our all-hands demonstration of Nova Mail. We will showcase the live architecture, AI summarization features, and enterprise authentication flows.\n\nBest,\nSarah",
        undefined,
        "team-all@contoso.com",
      ),
    ],
  },
  ...Array.from({ length: 3 }, (_, i) => ({
    id: `s-sp${i + 1}`,
    folder: "spam" as FolderId,
    subject:
      i === 0 ? "Executive Leadership Summit Invitation" : "Exclusive Executive Coaching Offer",
    sender: "Summit Outreach",
    senderEmail: "events@exec-summit-world.com",
    preview: "Unsolicited promotional offer for executive seminars.",
    time: `4:${10 + i * 15} AM`,
    unread: true,
    starred: false,
    priority: false,
    labels: ["Spam"],
    hasAttachment: false,
    messages: [
      msg(
        `s-sp${i + 1}m1`,
        "Summit Outreach",
        "events@exec-summit-world.com",
        `4:${10 + i * 15} AM`,
        "Dear Sarah,\n\nClaim your VIP seat at the Global Leadership Forum today.",
        undefined,
        "sarah.j@contoso.com",
      ),
    ],
  })),
];

const SARAH_NOTIFICATIONS: AppNotification[] = [
  {
    id: "sn1",
    title: "Reminder: Board deck sign-off due Friday",
    detail: "CPO Marcus requested the finalized Q4 slide deck.",
    time: "10m ago",
    kind: "reminder",
    read: false,
  },
  {
    id: "sn2",
    title: "Dana Whitfield attached redlines",
    detail: "Design System v3.0 theme specs ready for review.",
    time: "45m ago",
    kind: "mention",
    read: false,
  },
  {
    id: "sn3",
    title: "Acme Corp feedback received",
    detail: "Alex Rivera sent positive trial review.",
    time: "2h ago",
    kind: "system",
    read: true,
  },
];

// User 2: Mark Chen (mark.c@contoso.com) - Senior Tech Lead & Architect
const MARK_EMAILS: Email[] = [
  {
    id: "m-e1",
    folder: "inbox",
    subject: "CRITICAL ALERT: Redis Cache Memory Utilization at 94%",
    sender: "Grafana Alert Manager",
    senderEmail: "alerts@monitoring.contoso.com",
    preview:
      "Cluster node redis-us-east-1a triggered HIGH MEMORY warning. P99 latency elevated by 14ms.",
    time: "09:42 AM",
    unread: true,
    starred: true,
    priority: true,
    labels: ["Incidents", "Monitoring"],
    hasAttachment: false,
    messages: [
      msg(
        "m-e1m1",
        "Grafana Alert Manager",
        "alerts@monitoring.contoso.com",
        "09:42 AM",
        "ALERT DETAILS:\n- Service: Redis In-Memory Cache (us-east-1a)\n- Metric: memory.used_percent = 94.2%\n- Impact: Session cache eviction rate rising.\n- Recommended Action: Check key TTL policies or scale replica node.\n\nDashboard: https://grafana.contoso.com/d/redis-health",
        undefined,
        "mark.c@contoso.com",
      ),
    ],
  },
  {
    id: "m-e2",
    folder: "inbox",
    subject: "PR #482 Review: TanStack Start SSR Hydration & Route Caching",
    sender: "Alex Taylor",
    senderEmail: "alex.t@contoso.com",
    preview:
      "Hey Mark, requested your re-review on PR #482. Resolved the hydration mismatch on server functions.",
    time: "09:15 AM",
    unread: true,
    starred: false,
    priority: true,
    labels: ["Code Review", "GitHub"],
    hasAttachment: false,
    messages: [
      msg(
        "m-e2m1",
        "Alex Taylor",
        "alex.t@contoso.com",
        "09:15 AM",
        "Hey Mark,\n\nI updated PR #482 based on your feedback:\n1. Server functions now use typed zod validators.\n2. Fixed the React hydration warning on root route metadata.\n3. Added unit tests for error boundary fallbacks.\n\nCould you take a look when free?\n\nThanks,\nAlex",
        undefined,
        "mark.c@contoso.com",
      ),
    ],
  },
  {
    id: "m-e3",
    folder: "inbox",
    subject: "Security Audit: Critical Dependency CVE Patch Report",
    sender: "SecOps Bot",
    senderEmail: "secops@contoso.com",
    preview:
      "Automated vulnerability scanner identified 2 package advisories requiring upgrade in the main repository.",
    time: "Yesterday",
    unread: false,
    starred: true,
    priority: true,
    labels: ["Security", "Audit"],
    hasAttachment: true,
    messages: [
      msg(
        "m-e3m1",
        "SecOps Bot",
        "secops@contoso.com",
        "Yesterday",
        "Security Audit Summary:\n- Status: Action Needed\n- Critical Severity: 0\n- High Severity: 2 (Transitive devDependencies)\n\nPlease verify bun.lock / package-lock updates to ensure zero vulnerabilities before production release.\n\nReport attached.",
        [{ id: "ma1", name: "CVE-2026-Audit-Report.pdf", size: "310 KB", kind: "pdf" }],
        "mark.c@contoso.com",
      ),
    ],
  },
  {
    id: "m-e4",
    folder: "inbox",
    subject: "AI Gateway Latency Benchmark: Gemini Flash 3.6 Evaluation",
    sender: "AI Infrastructure Team",
    senderEmail: "ai-infra@contoso.com",
    preview:
      "Benchmark results attached: Gemini Flash 3.6 achieved 180ms TTFT under 500 RPS load test.",
    time: "Yesterday",
    unread: false,
    starred: false,
    priority: false,
    labels: ["AI", "Performance"],
    hasAttachment: true,
    messages: [
      msg(
        "m-e4m1",
        "AI Infrastructure Team",
        "ai-infra@contoso.com",
        "Yesterday",
        "Hi Mark,\n\nWe benchmarked server-side AI model invocation latency across our regional gateways. Gemini Flash 3.6 yielded 180ms time-to-first-token with zero throttling errors under 500 concurrent requests.\n\nFull JSON metrics attached.\n\n— AI Infra",
        [{ id: "ma2", name: "ai-benchmark-results.json", size: "14 KB", kind: "doc" }],
        "mark.c@contoso.com",
      ),
    ],
  },
  {
    id: "m-sent1",
    folder: "sent",
    subject: "RE: PR #482 Approved — Merged into main",
    sender: "Mark Chen",
    senderEmail: "mark.c@contoso.com",
    preview: "Great work Alex! Code looks clean and tests pass. Merged into main branch.",
    time: "10:05 AM",
    unread: false,
    starred: false,
    priority: false,
    labels: ["GitHub"],
    hasAttachment: false,
    messages: [
      msg(
        "m-sent1m1",
        "Mark Chen",
        "mark.c@contoso.com",
        "10:05 AM",
        "Hi Alex,\n\nReviewed the changes — clean implementation of server function validation and hydration safety. Merged into main!\n\nMark",
        undefined,
        "alex.t@contoso.com",
      ),
    ],
  },
  {
    id: "m-d1",
    folder: "drafts",
    subject: "Draft: Tech Debt Prioritization Roadmap Q4",
    sender: "Mark Chen",
    senderEmail: "mark.c@contoso.com",
    preview:
      "Technical debt items for Q4 engineering sprint: 1. Strict null checks. 2. Tailored theme tokens...",
    time: "08:15 AM",
    unread: false,
    starred: false,
    priority: false,
    labels: ["Draft"],
    hasAttachment: false,
    messages: [
      msg(
        "m-d1m1",
        "Mark Chen",
        "mark.c@contoso.com",
        "08:15 AM",
        "Technical Debt Prioritization Roadmap Q4:\n1. Enable TypeScript strict flag across all routes.\n2. Optimize Tailwind CSS bundle tree-shaking.\n3. Expand automated end-to-end user flow verifications.",
        undefined,
        "eng-leads@contoso.com",
      ),
    ],
  },
  {
    id: "m-sched1",
    folder: "scheduled",
    subject: "Scheduled: Release Notes v2.4.0 Deployment Summary",
    sender: "Mark Chen",
    senderEmail: "mark.c@contoso.com",
    preview: "Release notes for v2.4.0 deployment scheduled tonight at 02:00 UTC.",
    time: "Scheduled for Tonight 02:00 UTC",
    unread: false,
    starred: false,
    priority: false,
    labels: ["Scheduled"],
    hasAttachment: false,
    messages: [
      msg(
        "m-sched1m1",
        "Mark Chen",
        "mark.c@contoso.com",
        "02:00 UTC",
        "Engineers,\n\nRelease v2.4.0 is ready for deployment. Includes performance upgrades, account switcher enhancements, and accessibility fixes.\n\nMark",
        undefined,
        "eng-all@contoso.com",
      ),
    ],
  },
  ...Array.from({ length: 2 }, (_, i) => ({
    id: `m-sp${i + 1}`,
    folder: "spam" as FolderId,
    subject: "Unsolicited Cloud Monitoring Trial",
    sender: "SaaS Sales Bot",
    senderEmail: "sales@cloud-monitor-tool.io",
    preview: "Try our new observability dashboard free for 30 days.",
    time: "03:12 AM",
    unread: true,
    starred: false,
    priority: false,
    labels: ["Spam"],
    hasAttachment: false,
    messages: [
      msg(
        `m-sp${i + 1}m1`,
        "SaaS Sales Bot",
        "sales@cloud-monitor-tool.io",
        "03:12 AM",
        "Hi Mark, replace your existing telemetry tools with Cloud Monitor today.",
        undefined,
        "mark.c@contoso.com",
      ),
    ],
  })),
];

const MARK_NOTIFICATIONS: AppNotification[] = [
  {
    id: "mn1",
    title: "Grafana High Memory Alert",
    detail: "Redis cluster node redis-us-east-1a triggered 94% warning.",
    time: "15m ago",
    kind: "reminder",
    read: false,
  },
  {
    id: "mn2",
    title: "Alex Taylor requested review",
    detail: "PR #482: TanStack Start SSR Hydration & Route Caching.",
    time: "40m ago",
    kind: "mention",
    read: false,
  },
  {
    id: "mn3",
    title: "CI/CD Pipeline #9411 Succeeded",
    detail: "All unit and integration tests passed in 42s.",
    time: "2h ago",
    kind: "system",
    read: true,
  },
];

// User 3: Ops Service Account (ops.svc@contoso.com) - IT Infrastructure & Operations
const OPS_EMAILS: Email[] = [
  {
    id: "o-e1",
    folder: "inbox",
    subject: "URGENT: Wildcard SSL Certificate Expiration Warning (14 Days)",
    sender: "Cert Manager Daemon",
    senderEmail: "certs@contoso.com",
    preview:
      "Certificate *.contoso.com expires on Aug 28, 2026. ACME HTTP-01 challenge verification required.",
    time: "08:00 AM",
    unread: true,
    starred: true,
    priority: true,
    labels: ["Security", "Certificates"],
    hasAttachment: true,
    messages: [
      msg(
        "o-e1m1",
        "Cert Manager Daemon",
        "certs@contoso.com",
        "08:00 AM",
        "AUTOMATED ALERT:\n- Domain: *.contoso.com & contoso.com\n- Issuer: Let's Encrypt Authority\n- Expiration: Aug 28, 2026 (14 Days Remaining)\n- Status: Automatic renewal DNS challenge pending validation.\n\nPlease verify Cloudflare API credentials or complete manual DNS TXT record verification.\n\nDetails attached.",
        [{ id: "oa1", name: "cert-chain-audit.pdf", size: "420 KB", kind: "pdf" }],
        "ops.svc@contoso.com",
      ),
    ],
  },
  {
    id: "o-e2",
    folder: "inbox",
    subject: "Nightly Postgres Database Backup Successful (142 GB)",
    sender: "Backup Daemon",
    senderEmail: "db-backup@contoso.com",
    preview: "Full snapshot db-prod-20260814 created and checksum verified in US-East S3 bucket.",
    time: "04:30 AM",
    unread: false,
    starred: false,
    priority: false,
    labels: ["Backups", "Automated"],
    hasAttachment: false,
    messages: [
      msg(
        "o-e2m1",
        "Backup Daemon",
        "db-backup@contoso.com",
        "04:30 AM",
        "DATABASE BACKUP REPORT:\n- Target: db-prod-primary (PostgreSQL 16.2)\n- Archive Size: 142.8 GB\n- Encryption: AES-256 GCM\n- SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\n- Status: VERIFIED & RESTORE-TESTED",
        undefined,
        "ops.svc@contoso.com",
      ),
    ],
  },
  {
    id: "o-e3",
    folder: "inbox",
    subject: "Pending Approval: Okta Access Request #8942",
    sender: "Okta Identity System",
    senderEmail: "access-control@contoso.com",
    preview:
      "User dev.alex@contoso.com requested 30-day temporary read-only access to Production Replica DB.",
    time: "Yesterday",
    unread: true,
    starred: false,
    priority: true,
    labels: ["Access Control", "Okta"],
    hasAttachment: false,
    messages: [
      msg(
        "o-e3m1",
        "Okta Identity System",
        "access-control@contoso.com",
        "Yesterday",
        "ACCESS TICKET #8942:\n- Requester: Alex Taylor (Frontend Eng)\n- Manager Approved: Mark Chen\n- Requested Role: db_read_only_replica\n- Duration: 30 Days\n- Reason: Investigating production cache invalidation issue.\n\nClick Approve or Reject in Okta Admin Portal.",
        undefined,
        "ops.svc@contoso.com",
      ),
    ],
  },
  {
    id: "o-e4",
    folder: "inbox",
    subject: "Weekly Infrastructure Health & SLA Compliance Digest",
    sender: "CloudOps Digest",
    senderEmail: "infra-bot@contoso.com",
    preview:
      "Overall uptime: 99.991%. Total network throughput: 4.2 TB. Zero unhandled outage events.",
    time: "Tuesday",
    unread: false,
    starred: false,
    priority: false,
    labels: ["SLA", "Weekly Digest"],
    hasAttachment: true,
    messages: [
      msg(
        "o-e4m1",
        "CloudOps Digest",
        "infra-bot@contoso.com",
        "Tuesday",
        "Weekly Ops Summary:\n- Overall Availability: 99.991%\n- Inbound Requests: 48.2 Million\n- Average Edge Latency: 22ms\n- Active Containers: 128\n\nFull SLA audit document attached.",
        [{ id: "oa2", name: "SLA-Weekly-Aug.pdf", size: "920 KB", kind: "pdf" }],
        "ops.svc@contoso.com",
      ),
    ],
  },
  {
    id: "o-sent1",
    folder: "sent",
    subject: "RE: Okta Access Request #8942 Approved",
    sender: "Ops Service Account",
    senderEmail: "ops.svc@contoso.com",
    preview:
      "Granted 30-day read-only replica DB access to dev.alex@contoso.com with audit logging enabled.",
    time: "Yesterday",
    unread: false,
    starred: false,
    priority: false,
    labels: ["Access Control"],
    hasAttachment: false,
    messages: [
      msg(
        "o-sent1m1",
        "Ops Service Account",
        "ops.svc@contoso.com",
        "Yesterday",
        "Approved ticket #8942 for dev.alex@contoso.com. Access token activated with 30-day auto-revocation policy.",
        undefined,
        "access-control@contoso.com",
      ),
    ],
  },
  {
    id: "o-d1",
    folder: "drafts",
    subject: "Draft: Multi-Region Failover Runbook (SOP-104)",
    sender: "Ops Service Account",
    senderEmail: "ops.svc@contoso.com",
    preview:
      "Step 1: Shift Cloudflare DNS routing to secondary region. Step 2: Promote Postgres standby...",
    time: "Monday",
    unread: false,
    starred: false,
    priority: false,
    labels: ["Draft"],
    hasAttachment: false,
    messages: [
      msg(
        "o-d1m1",
        "Ops Service Account",
        "ops.svc@contoso.com",
        "Monday",
        "Standard Operating Procedure SOP-104:\n1. Verify regional health endpoints.\n2. Switch DNS origin pool to Secondary West.\n3. Execute database replica promotion script.",
        undefined,
        "ops-team@contoso.com",
      ),
    ],
  },
  {
    id: "o-sched1",
    folder: "scheduled",
    subject: "Scheduled: Sunday Maintenance Window Broadcast",
    sender: "Ops Service Account",
    senderEmail: "ops.svc@contoso.com",
    preview:
      "Scheduled broadcast: Planned maintenance window on Sunday Aug 17 from 02:00 to 04:00 UTC.",
    time: "Scheduled for Sun 02:00 UTC",
    unread: false,
    starred: false,
    priority: false,
    labels: ["Scheduled"],
    hasAttachment: false,
    messages: [
      msg(
        "o-sched1m1",
        "Ops Service Account",
        "ops.svc@contoso.com",
        "Sun 02:00 UTC",
        "Notice to all staff:\n\nSystem infrastructure maintenance is scheduled for Sunday Aug 17, 02:00 to 04:00 UTC. Brief 2-minute API reconnects may occur.",
        undefined,
        "all-staff@contoso.com",
      ),
    ],
  },
  ...Array.from({ length: 2 }, (_, i) => ({
    id: `o-sp${i + 1}`,
    folder: "spam" as FolderId,
    subject: "Automated Domain Renewal Pitch",
    sender: "Domain Sales",
    senderEmail: "notice@domain-registrar-fake.net",
    preview: "Your domain registration is expiring soon. Click to renew.",
    time: "01:20 AM",
    unread: true,
    starred: false,
    priority: false,
    labels: ["Spam"],
    hasAttachment: false,
    messages: [
      msg(
        `o-sp${i + 1}m1`,
        "Domain Sales",
        "notice@domain-registrar-fake.net",
        "01:20 AM",
        "Phishing warning: Ignore domain registration solicitation.",
        undefined,
        "ops.svc@contoso.com",
      ),
    ],
  })),
];

const OPS_NOTIFICATIONS: AppNotification[] = [
  {
    id: "on1",
    title: "SSL Certificate Expiration Warning",
    detail: "*.contoso.com wildcard cert expires in 14 days.",
    time: "5m ago",
    kind: "reminder",
    read: false,
  },
  {
    id: "on2",
    title: "Okta Ticket #8942 Pending Approval",
    detail: "Alex Taylor requested 30-day DB replica access.",
    time: "1h ago",
    kind: "mention",
    read: false,
  },
  {
    id: "on3",
    title: "Nightly Database Backup Complete",
    detail: "Full 142 GB snapshot verified in S3 storage.",
    time: "4h ago",
    kind: "system",
    read: true,
  },
];

// Fallback Mock Data for Guest / New Users
const DEFAULT_EMAILS: Email[] = SARAH_EMAILS;
const DEFAULT_NOTIFICATIONS: AppNotification[] = SARAH_NOTIFICATIONS;

export const MOCK_EMAILS: Email[] = SARAH_EMAILS;
export const MOCK_NOTIFICATIONS: AppNotification[] = SARAH_NOTIFICATIONS;

export function getMockEmailsForUser(email?: string | null): Email[] {
  if (!email) return DEFAULT_EMAILS;
  const normalized = email.trim().toLowerCase();
  if (normalized.includes("sarah")) return SARAH_EMAILS;
  if (normalized.includes("mark")) return MARK_EMAILS;
  if (normalized.includes("ops")) return OPS_EMAILS;
  return DEFAULT_EMAILS;
}

export function getMockNotificationsForUser(email?: string | null): AppNotification[] {
  if (!email) return DEFAULT_NOTIFICATIONS;
  const normalized = email.trim().toLowerCase();
  if (normalized.includes("sarah")) return SARAH_NOTIFICATIONS;
  if (normalized.includes("mark")) return MARK_NOTIFICATIONS;
  if (normalized.includes("ops")) return OPS_NOTIFICATIONS;
  return DEFAULT_NOTIFICATIONS;
}

export const FOLDERS: { id: FolderId; label: string }[] = [
  { id: "inbox", label: "Inbox" },
  { id: "sent", label: "Sent" },
  { id: "drafts", label: "Drafts" },
  { id: "scheduled", label: "Scheduled" },
  { id: "archive", label: "Archive" },
  { id: "spam", label: "Spam" },
];

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function maskIdentifier(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const head = local.slice(0, 2);
  return `${head}${"•".repeat(Math.max(3, local.length - 2))}@${domain}`;
}
