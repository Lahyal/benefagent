export type ToolId =
  | 'analyzer'
  | 'checker'
  | 'claims'
  | 'calculator'
  | 'history'
  | 'settings';

export type ToolItem = {
  id: ToolId;
  title: string;
  subtitle: string;
  icon: string;
  featured?: boolean;
};

/** Mirrors app.html navigation & schema.org featureList */
export const TOOLS: ToolItem[] = [
  {
    id: 'analyzer',
    title: 'Benefits Analyzer',
    subtitle: 'Upload your PDF — AI finds every dollar you are missing',
    icon: '📄',
    featured: true,
  },
  {
    id: 'checker',
    title: 'HSA / FSA Checker',
    subtitle: 'Type an expense or scan a receipt',
    icon: '🔍',
    featured: true,
  },
  {
    id: 'claims',
    title: 'Claim Builder',
    subtitle: 'Generate ready-to-submit claim forms',
    icon: '📋',
  },
  {
    id: 'calculator',
    title: '401k Calculator',
    subtitle: 'Optimize match & contribution limits',
    icon: '📈',
  },
  {
    id: 'history',
    title: 'History',
    subtitle: 'Past checks & saved results',
    icon: '🕐',
  },
  {
    id: 'settings',
    title: 'Settings',
    subtitle: 'Account, plan & preferences',
    icon: '⚙️',
  },
];

export const ONBOARDING_ACCOUNTS = [
  {
    id: 'hsa',
    icon: '🏥',
    label: 'HSA (Health Savings Account)',
    sub: 'Paired with an HDHP health plan',
  },
  {
    id: 'fsa',
    icon: '💊',
    label: 'FSA (Flexible Spending Account)',
    sub: 'Employer-sponsored, use-it-or-lose-it',
  },
  {
    id: '401k',
    icon: '📈',
    label: '401k with employer matching',
    sub: 'Get free money from your employer',
  },
  {
    id: 'commuter',
    icon: '🚌',
    label: 'Commuter benefits',
    sub: 'Pre-tax transit or parking',
  },
] as const;

export const ONBOARDING_PLAN = [
  {
    step: 1,
    title: 'Upload your benefits PDF',
    sub: 'AI finds every dollar you are missing',
  },
  {
    step: 2,
    title: 'Check or scan any expense',
    sub: 'AI checks HSA/FSA eligibility',
  },
  {
    step: 3,
    title: 'Build and submit your claim',
    sub: 'AI generates a ready-to-submit form',
  },
];
