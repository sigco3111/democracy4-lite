
export interface Metric {
  id: string;
  name: string;
  value: number;
  description: string;
  icon: React.ReactNode; // For displaying an icon next to the metric
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  cost: number; // Political Capital cost
  effects: { [metricId: string]: number }; // How it affects metrics, e.g., { economy: 10, environment: -5 }
  icon: React.ReactNode;
  prerequisites?: { // Optional: conditions to unlock this policy
    metrics?: { [metricId: string]: { min?: number, max?: number } };
    policies?: string[]; // list of policy IDs that must be enacted
  };
  duration?: number; // How many turns (months) the policy effect lasts, undefined for permanent
  currentDuration?: number; // For tracking temporary policies
  upkeep?: number; // Optional: Political Capital cost per turn (month) to maintain
  level?: number; // Current level of the policy, e.g., 1 or 2
  upgradable?: boolean; // Can this policy be upgraded?
  upgradeCost?: number; // PC cost to upgrade to next level
  upgradedEffects?: { [metricId: string]: number }; // Effects if upgraded
  upgradedUpkeep?: number; // Upkeep if upgraded
  upgradedDescription?: string; // Description if upgraded
  parentId?: string | null; // ID of the parent policy for tree structure
}

export type ToastNotificationType = 'success' | 'error' | 'info' | 'warning';

export interface ToastNotificationState {
  id: string; // Unique ID for key prop
  message: string;
  type: ToastNotificationType;
}

export interface MiniEvent {
  id: string;
  title: string;
  description: string;
  effect: {
    type: 'metric' | 'pc'; // 'metric' for game metrics, 'pc' for political capital
    targetId?: string; // metricId if type is 'metric'
    value: number; // amount to change
  };
}

export interface GameState {
  year: number;
  month: number; // Added: current month (1-12)
  currentTurnIdentifier: string; // Added: e.g., "2024-01"
  politicalCapital: number;
  metrics: { [id: string]: Metric };
  activePolicies: Policy[];
  availablePolicies: Policy[];
  advisorMessage: string; 
  gameOver: boolean;
  gameOverMessage: string;
  electionUpcoming: boolean; // Will be set true when electionCooldown is 0
  electionCooldown: number; // Added: months until next election
  electionResult: string | null; 
  toastNotification: ToastNotificationState | null; 
}

export interface VoterGroup {
  id: string;
  name: string;
  populationPercentage: number; 
  approval: number; // 0-100
  metricPriorities: { [metricId: string]: number }; 
  icon: React.ReactNode;
}

export interface EndOfTurnSummaryData {
  turnIdentifierBefore: string; // Changed from yearBefore
  metricsBefore: { [id: string]: Metric };
  metricsAfter: { [id: string]: Metric };
  pcBefore: number;
  pcAfter: number;
  approvalBefore: number;
  approvalAfter: number;
  policiesDeactivated: Policy[];
  policiesExpired: Policy[];
  eventTriggeredThisTurn: MiniEvent | null;
  significantMetricChanges: Array<{ metricName: string; change: number; direction: '증가' | '감소' }>;
}

export interface NewsItem {
  id: string;
  text: string;
  turnIdentifier: string; // Changed from turnGenerated
  type: 'policy' | 'metric' | 'event' | 'general' | 'election' | 'achievement';
}

export interface AdvisorMessage {
  id: string;
  text: string;
  condition: (gameState: EnhancedGameState, prevGameState?: EnhancedGameState) => boolean;
  priority: number; // Higher number means higher priority
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: JSX.Element; // Changed from React.ReactNode
  unlocked: boolean;
  condition: (gameState: EnhancedGameState) => boolean;
  unlockMessage: string;
}

export interface Rank {
  title: string;
  minScore: number;
  description: string;
  icon: JSX.Element;
}

export interface ScoreBreakdownItem {
    label: string;
    value: string | number; // The raw value of the metric (e.g., 75 for happiness, 120 for PC)
    contribution: number; // How much this item contributed to the final score
    rawValue: number; // The actual numerical value used for calculation, if different from display 'value'
}

// For policy tree structure in PolicySelector
// export interface PolicyTreeNode extends Policy {
//   children: PolicyTreeNode[];
// }


export interface EnhancedGameState extends GameState {
  voterGroups: VoterGroup[];
  overallApproval: number;
  currentEvent: MiniEvent | null; 
  showEventModal: boolean; 
  showEndOfTurnSummaryModal: boolean; 
  endOfTurnSummaryData: EndOfTurnSummaryData | null; 
  newsItems: NewsItem[]; 
  achievements: Achievement[]; 
  finalScore?: number;
  finalRank?: Rank | null;
  scoreBreakdown?: ScoreBreakdownItem[];
  totalMonthsRuled?: number;
  isDelegationModeActive: boolean;
  showElectionModal: boolean; // Added
  showResetConfirmationModal: boolean; // Added
}