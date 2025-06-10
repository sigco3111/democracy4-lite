import React from 'react';
import type { Policy, Metric, VoterGroup, MiniEvent, AdvisorMessage, EnhancedGameState, Achievement, Rank } from './types';

// Define a common interface for icon props
interface IconProps {
  className?: string;
}

// Helper for icons
const EconomyIcon: React.FC<IconProps> = ({ className: propClassName }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 text-green-400 ${propClassName || ''}`.trim()}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
const HappinessIcon: React.FC<IconProps> = ({ className: propClassName }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 text-yellow-400 ${propClassName || ''}`.trim()}><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm+4.5 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Z" /></svg>;
const EnvironmentIcon: React.FC<IconProps> = ({ className: propClassName }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 text-teal-400 ${propClassName || ''}`.trim()}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A11.978 11.978 0 0 1 12 16.5c-2.998 0-5.74-1.1-7.843-2.918m15.686-7.418A8.966 8.966 0 0 1 12 10.5" /></svg>;
const StabilityIcon: React.FC<IconProps> = ({ className: propClassName }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 text-indigo-400 ${propClassName || ''}`.trim()}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5h16.5m-16.5 0a1.125 1.125 0 0 1-1.125-1.125v-1.5A1.125 1.125 0 0 1 3.75 9.75h16.5A1.125 1.125 0 0 1 21.375 10.875v1.5A1.125 1.125 0 0 1 20.25 13.5M3.75 13.5v2.25A1.125 1.125 0 0 0 4.875 16.875h14.25A1.125 1.125 0 0 0 20.25 15.75V13.5M6 13.5V9.75M10.5 13.5V9.75M15 13.5V9.75M19.5 13.5V9.75M3 19.5h18" /></svg>;
const EducationIcon: React.FC<IconProps> = ({ className: propClassName }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 mr-2 ${propClassName || ''}`.trim()}><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 0 0-.491 6.347A48.627 48.627 0 0 1 12 20.904a48.627 48.627 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.57 50.57 0 0 0-2.658-.813A59.905 59.905 0 0 1 12 3.493a59.902 59.902 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" /></svg>;
const HealthcareIcon: React.FC<IconProps> = ({ className: propClassName }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 mr-2 ${propClassName || ''}`.trim()}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>;
const TaxIcon: React.FC<IconProps> = ({ className: propClassName }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 mr-2 ${propClassName || ''}`.trim()}><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 7.756a4.5 4.5 0 1 0 0 8.488M7.5 10.5h5.25m-5.25 3h5.25M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
const IndustryIcon: React.FC<IconProps> = ({ className: propClassName }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 mr-2 ${propClassName || ''}`.trim()}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6M9 11.25h6M9 15.75h6M5.25 6.75h.008v.008H5.25V6.75Zm0 4.5h.008v.008H5.25v-.008Zm0 4.5h.008v.008H5.25v-.008Zm13.5-9h.008v.008h-.008V6.75Zm0 4.5h.008v.008h-.008v-.008Zm0 4.5h.008v.008h-.008v-.008Z" /></svg>;
const GreenTechIcon: React.FC<IconProps> = ({ className: propClassName }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 mr-2 ${propClassName || ''}`.trim()}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75v6.75m0 0-3-3m3 3 3-3m-8.25 6a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" /></svg>;
const InfrastructureIcon: React.FC<IconProps> = ({ className: propClassName }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 mr-2 ${propClassName || ''}`.trim()}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-1.5M6 11.25H4.5m15 0H18" /></svg>;
const BusIcon: React.FC<IconProps> = ({ className: propClassName }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 mr-2 text-cyan-400 ${propClassName || ''}`.trim()}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-17.25 4.5V6.75C3.375 5.504 4.379 4.5 5.625 4.5h12.75c1.246 0 2.25.996 2.25 2.228v7.522M7.5 4.5V2.25m9 2.25V2.25m0 9h-9m9 0H12m6 0H12m-3.75 4.5V9.75" /></svg>;
const WelfareIcon: React.FC<IconProps> = ({ className: propClassName }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 mr-2 text-pink-400 ${propClassName || ''}`.trim()}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>;
export const UpgradeIcon: React.FC<IconProps> = ({ className: propClassName }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 mr-1 ${propClassName || ''}`.trim()}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" /></svg>;

// Rank Icons
const RankIconSeedling: React.FC<IconProps> = ({ className: propClassName }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 text-lime-500 ${propClassName || ''}`.trim()}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21a9.004 9.004 0 0 0 8.716-6.747M10.5 21a9.004 9.004 0 0 1-8.716-6.747M10.5 21V3m0 18c-2.485 0-4.5-4.03-4.5-9S8.015 3 10.5 3m0 0a8.997 8.997 0 0 1 7.843 4.582M10.5 3a8.997 8.997 0 0 0-7.843 4.582m5.501 8.266a5.25 5.25 0 0 1-7.012-4.942" /></svg>;
const RankIconBuilding: React.FC<IconProps> = ({ className: propClassName }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 text-cyan-500 ${propClassName || ''}`.trim()}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6M9 11.25h6M9 15.75h6" /></svg>;
const RankIconFlag: React.FC<IconProps> = ({ className: propClassName }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 text-blue-500 ${propClassName || ''}`.trim()}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-1.5M21 3v1.5m0 16.5v-1.5M12 5.25v13.5M8.25 5.25H3m18 0h-5.25M8.25 9.75H3m18 0h-5.25M8.25 14.25H3m18 0h-5.25M8.25 18.75H3m18 0h-5.25" /></svg>;
const RankIconCrown: React.FC<IconProps> = ({ className: propClassName }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 text-amber-500 ${propClassName || ''}`.trim()}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25L12 2.25l6.75 6L12 14.25 5.25 8.25ZM5.25 15.75h13.5" /></svg>;
const RankIconStar: React.FC<IconProps> = ({ className: propClassName }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 text-yellow-400 ${propClassName || ''}`.trim()}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.822.672l-4.684-2.656a.563.563 0 0 0-.652 0l-4.684 2.656a.562.562 0 0 1-.822-.672l1.285-5.385a.562.562 0 0 0-.182-.557l-4.204-3.602a.563.563 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>;
const RankIconLaurel: React.FC<IconProps> = ({ className: propClassName }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 text-emerald-500 ${propClassName || ''}`.trim()}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 10.5A6.75 6.75 0 0 1 12 3.75a6.75 6.75 0 0 1 6.75 6.75c0 2.186-.985 4.169-2.568 5.474A6.722 6.722 0 0 1 12 17.25a6.722 6.722 0 0 1-4.182-1.276A6.731 6.731 0 0 1 5.25 10.5Zm14.25 8.25c-.832 0-1.5.672-1.5 1.5s.668 1.5 1.5 1.5 1.5-.672 1.5-1.5-.668-1.5-1.5-1.5ZM4.5 18.75c-.832 0-1.5.672-1.5 1.5s.668 1.5 1.5 1.5 1.5-.672 1.5-1.5-.668-1.5-1.5-1.5ZM12 7.5A2.25 2.25 0 0 0 9.75 9.75v.027a6.722 6.722 0 0 0-1.019 1.798" /></svg>;


export const INITIAL_YEAR = 2024;
export const INITIAL_MONTH = 1; // January
export const INITIAL_POLITICAL_CAPITAL = 150; // Increased difficulty
export const ELECTION_INTERVAL_MONTHS = 12 * 4; // 4 years
export const MINI_EVENT_CHANCE = 0.20; // Slightly increased
export const NEWS_HEADLINE_TEMPLATES = {
  policyEnacted: (policyName: string) => `정부, "${policyName}" 정책 전격 시행! 변화의 바람 부나?`,
  policyUpgraded: (policyName: string) => `"${policyName}" 정책 강화, 효과 증대 기대!`,
  policyDeactivated: (policyName: string) => `자금난 봉착? "${policyName}" 정책, 긴축으로 중단.`,
  policyExpired: (policyName: string) => `"${policyName}" 정책, 기간 만료로 효과 종료.`,
  electionWin: (turn: string, approval: number) => `[${turn}] 선거 승리! 현 정부, ${approval.toFixed(1)}% 지지율로 재집권 성공!`,
  electionLoss: (turn: string, approval: number) => `[${turn}] 선거 패배. ${approval.toFixed(1)}% 지지율, 정권 교체 확정.`,
  eventOccurred: (eventTitle: string) => `주요 사건 발생: ${eventTitle}`,
  metricChangeSignificant: (metricName: string, direction: '증가' | '감소', change: number) => `${metricName} 지표 ${Math.abs(change).toFixed(1)} 포인트 ${direction}, 눈에 띄는 변화.`,
  gameStart: (turn: string) => `[${turn}] 새로운 시대의 시작! 국가의 미래가 당신의 손에 달렸습니다.`,
  achievementUnlocked: (achName: string) => `업적 달성: "${achName}"! 국가 발전에 큰 획을 그었습니다.`
};
export const MAX_NEWS_ITEMS = 20;
export const SIGNIFICANT_METRIC_CHANGE_THRESHOLD = 5;
export const DEFAULT_ADVISOR_MESSAGE = "모든 것이 평온합니다, 지도자시여. 다음 지시를 기다리겠습니다.";
export const DELEGATION_MODAL_AUTOCLOSE_DELAY = 2000; // 2 seconds

export const generateTurnIdentifier = (year: number, month: number): string => {
  return `${year}-${String(month).padStart(2, '0')}`;
};


// CORE METRICS
export const INITIAL_METRICS: { [id: string]: Metric } = {
  economy: { id: 'economy', name: '경제력', value: 50, description: '국가 경제의 전반적인 건전성입니다.', icon: <EconomyIcon /> },
  happiness: { id: 'happiness', name: '국민 행복도', value: 50, description: '대중의 전반적인 만족도입니다.', icon: <HappinessIcon /> },
  environment: { id: 'environment', name: '환경 품질', value: 50, description: '자연 환경의 상태입니다.', icon: <EnvironmentIcon /> },
  stability: { id: 'stability', name: '정치적 안정성', value: 50, description: '국가 내 질서와 평화입니다.', icon: <StabilityIcon /> },
  // SECONDARY METRICS
  education: { id: 'education', name: '교육 수준', value: 40, description: '시민들의 평균 교육 수준입니다.', icon: <EducationIcon /> },
  healthcare: { id: 'healthcare', name: '의료 접근성', value: 40, description: '의료 서비스의 이용 가능성 및 품질입니다.', icon: <HealthcareIcon /> },
};

// VOTER GROUPS
export const INITIAL_VOTER_GROUPS: VoterGroup[] = [
  { 
    id: 'capitalists', name: '자본가', populationPercentage: 0.20, approval: 50, 
    metricPriorities: { economy: 0.7, stability: 0.2, education: 0.1, happiness: -0.05, environment: -0.1 },
    icon: <IndustryIcon className="text-blue-400" />
  },
  { 
    id: 'socialists', name: '사회주의자', populationPercentage: 0.25, approval: 50, 
    metricPriorities: { happiness: 0.5, healthcare: 0.3, education: 0.2, economy: -0.1, stability: 0.05 },
    icon: <WelfareIcon className="text-red-400" />
  },
  { 
    id: 'environmentalists', name: '환경운동가', populationPercentage: 0.15, approval: 50, 
    metricPriorities: { environment: 0.8, happiness: 0.1, healthcare: 0.1, economy: -0.2 },
    icon: <GreenTechIcon className="text-green-400" />
  },
  { 
    id: 'patriots', name: '애국자', populationPercentage: 0.20, approval: 50, 
    metricPriorities: { stability: 0.6, economy: 0.3, happiness: 0.1, environment: -0.05 },
    icon: <StabilityIcon className="text-purple-400" />
  },
  { 
    id: 'liberals', name: '자유주의자', populationPercentage: 0.20, approval: 50, 
    metricPriorities: { happiness: 0.4, education: 0.3, environment: 0.1, stability: 0.1, economy: 0.1 },
    icon: <HappinessIcon className="text-orange-400" />
  },
];

// POLICIES
export const ALL_POLICIES: Policy[] = [
  // --- Category Policies ---
  {
    id: 'taxCategory',
    name: '세금 정책 카테고리',
    description: '다양한 세금 관련 정책을 활성화합니다. 이 자체로는 효과가 없습니다.',
    cost: 0,
    effects: {},
    icon: <TaxIcon className="text-gray-400" />,
    upkeep: 0,
    parentId: null,
  },
  {
    id: 'industryCategory',
    name: '산업 정책 카테고리',
    description: '산업 성장 및 규제 관련 정책을 활성화합니다.',
    cost: 0,
    effects: {},
    icon: <IndustryIcon className="text-gray-400" />,
    upkeep: 0,
    parentId: null,
  },
  {
    id: 'environmentCategory',
    name: '환경 정책 카테고리',
    description: '환경 보호 및 지속 가능성 관련 정책을 활성화합니다.',
    cost: 0,
    effects: {},
    icon: <GreenTechIcon className="text-gray-400" />,
    upkeep: 0,
    parentId: null,
  },
  {
    id: 'infrastructureCategory',
    name: '사회 기반 시설 카테고리',
    description: '교통, 통신 등 국가 기반 시설 관련 정책을 활성화합니다.',
    cost: 0,
    effects: {},
    icon: <InfrastructureIcon className="text-gray-400" />,
    upkeep: 0,
    parentId: null,
  },
  {
    id: 'educationCategory',
    name: '교육 정책 카테고리',
    description: '교육 시스템 및 투자 관련 정책을 활성화합니다.',
    cost: 0,
    effects: {},
    icon: <EducationIcon className="text-gray-400" />,
    upkeep: 0,
    parentId: null,
  },
  {
    id: 'healthcareCategory',
    name: '의료 정책 카테고리',
    description: '국민 건강 및 의료 서비스 관련 정책을 활성화합니다.',
    cost: 0,
    effects: {},
    icon: <HealthcareIcon className="text-gray-400" />,
    upkeep: 0,
    parentId: null,
  },
  {
    id: 'welfareCategory',
    name: '복지 정책 카테고리',
    description: '사회 복지 및 지원 프로그램 관련 정책을 활성화합니다.',
    cost: 0,
    effects: {},
    icon: <WelfareIcon className="text-gray-400" />,
    upkeep: 0,
    parentId: null,
  },

  // --- Tax Policies ---
  {
    id: 'incomeTaxCut',
    name: '소득세 인하',
    description: '시민들의 가처분 소득을 늘리지만, 정부 수입은 감소합니다. 자본가와 자유주의자들이 선호합니다.',
    cost: 12, // Increased cost
    upkeep: 3, // Added upkeep
    effects: { happiness: 5, economy: 3, politicalCapital: -5 },
    icon: <TaxIcon className="text-red-400" />,
    prerequisites: { policies: ['taxCategory'] },
    parentId: 'taxCategory',
    upgradable: true,
    upgradeCost: 15,
    upgradedEffects: { happiness: 8, economy: 5, politicalCapital: -7 },
    upgradedUpkeep: 5,
    upgradedDescription: '소득세를 추가 인하하여 시민 만족도를 높이고 경제를 활성화하지만, 정치 자금 감소폭이 커집니다.',
  },
  {
    id: 'corporateTaxCut',
    name: '법인세 인하',
    description: '기업 투자를 촉진하지만, 정부 수입은 줄어듭니다. 자본가들이 크게 환영합니다.',
    cost: 18, // Increased cost
    upkeep: 4, // Added upkeep
    effects: { economy: 8, stability: -2, politicalCapital: -6 },
    icon: <TaxIcon className="text-red-400" />,
    prerequisites: { policies: ['taxCategory'] },
    parentId: 'taxCategory',
  },
  // --- Industry Policies ---
  {
    id: 'technologyGrants',
    name: '기술 연구 지원금',
    description: '첨단 기술 연구 개발에 자금을 지원하여 장기적인 경제 성장을 도모합니다.',
    cost: 22, // Increased cost
    upkeep: 5,
    effects: { economy: 6, education: 4, environment: -2 },
    icon: <IndustryIcon className="text-sky-400" />,
    prerequisites: { policies: ['industryCategory'] },
    parentId: 'industryCategory',
  },
  // --- Environment Policies ---
  {
    id: 'carbonTax',
    name: '탄소세 도입',
    description: '탄소 배출에 세금을 부과하여 환경을 개선하지만, 단기적으로 경제에 부담을 줄 수 있습니다.',
    cost: 15,
    upkeep: 2, // PC gain
    effects: { environment: 10, economy: -3, happiness: -2, politicalCapital: 2 },
    icon: <GreenTechIcon className="text-green-400" />,
    prerequisites: { policies: ['environmentCategory', 'taxCategory'] },
    parentId: 'environmentCategory',
    upgradable: true,
    upgradeCost: 12,
    upgradedEffects: { environment: 15, economy: -4, happiness: -3, politicalCapital: 3 },
    upgradedUpkeep: 3,
    upgradedDescription: '탄소세율을 인상하여 환경 개선 효과를 극대화하지만, 경제 및 행복도에 미치는 부정적 영향도 커집니다.',
  },
  {
    id: 'renewableEnergySubsidies',
    name: '재생에너지 보조금',
    description: '청정 에너지 생산을 장려하여 환경을 보호하고 새로운 산업을 육성합니다.',
    cost: 25, // Increased cost
    upkeep: 6,
    effects: { environment: 8, economy: 3, happiness: 2 },
    icon: <GreenTechIcon className="text-lime-400" />,
    prerequisites: { policies: ['environmentCategory'] },
    parentId: 'environmentCategory',
  },
  // --- Infrastructure Policies ---
  {
    id: 'publicTransportExpansion',
    name: '대중교통망 확충',
    description: '버스, 지하철 등 대중교통 시스템을 개선하여 시민 편의를 증진하고 환경 오염을 줄입니다.',
    cost: 30, // Increased cost
    upkeep: 7,
    effects: { happiness: 6, environment: 4, economy: 2 },
    icon: <BusIcon />,
    prerequisites: { policies: ['infrastructureCategory'] },
    parentId: 'infrastructureCategory',
  },
  {
    id: 'internetInfrastructureInvestment',
    name: '초고속 인터넷망 투자',
    description: '전국적인 초고속 인터넷망 구축으로 디지털 경제를 활성화하고 교육 수준을 향상시킵니다.',
    cost: 28, // Increased cost
    upkeep: 5,
    effects: { economy: 5, education: 5, happiness: 3 },
    icon: <InfrastructureIcon className="text-blue-400" />,
    prerequisites: { policies: ['infrastructureCategory'] },
    parentId: 'infrastructureCategory',
  },
  // --- Education Policies ---
  {
    id: 'schoolFundingIncrease',
    name: '학교 운영 예산 증액',
    description: '공교육의 질을 향상시키기 위해 학교 시설 개선 및 교사 지원에 추가 예산을 투입합니다.',
    cost: 20,
    upkeep: 6,
    effects: { education: 8, happiness: 3, economy: 1 },
    icon: <EducationIcon className="text-yellow-400" />,
    prerequisites: { policies: ['educationCategory'] },
    parentId: 'educationCategory',
    upgradable: true,
    upgradeCost: 18,
    upgradedEffects: { education: 12, happiness: 5, economy: 2 },
    upgradedUpkeep: 9,
    upgradedDescription: '공교육 예산을 대폭 증액하여 교육 수준과 국민 행복도를 크게 향상시키지만, 유지비가 증가합니다.',
  },
  // --- Healthcare Policies ---
  {
    id: 'nationalHealthcareProgram',
    name: '국가 의료보험 프로그램',
    description: '모든 시민에게 기본적인 의료 서비스를 제공하여 건강 수준과 사회적 안정성을 높입니다.',
    cost: 35, // Increased cost
    upkeep: 10,
    effects: { healthcare: 10, happiness: 7, stability: 3, economy: -2 },
    icon: <HealthcareIcon className="text-rose-400" />,
    prerequisites: { policies: ['healthcareCategory'] },
    parentId: 'healthcareCategory',
  },
   // --- Welfare Policies ---
   {
    id: 'unemploymentBenefits',
    name: '실업 수당 지급',
    description: '실직자들에게 재정적 지원을 제공하여 사회 안전망을 강화하고 국민 행복도를 높입니다.',
    cost: 20,
    upkeep: 7,
    effects: { happiness: 6, stability: 4, economy: -3 },
    icon: <WelfareIcon className="text-purple-400" />,
    prerequisites: { policies: ['welfareCategory', 'taxCategory'] },
    parentId: 'welfareCategory',
  },
];


// MINI EVENTS
export const MINI_EVENTS: MiniEvent[] = [
  { id: 'economicBoom', title: '깜짝 경제 호황!', description: '예상치 못한 수출 증가로 경제가 크게 성장했습니다.', effect: { type: 'metric', targetId: 'economy', value: 8 } },
  { id: 'scientificBreakthrough', title: '과학적 발견!', description: '한 연구팀의 획기적인 발견으로 국가 기술력이 향상되었습니다.', effect: { type: 'metric', targetId: 'education', value: 6 } },
  { id: 'naturalDisaster', title: '자연재해 발생', description: '갑작스러운 자연재해로 국가 기반시설이 손상되고 시민들이 불안에 떨고 있습니다.', effect: { type: 'metric', targetId: 'happiness', value: -7 } },
  { id: 'pcBoost', title: '정치적 지지 확보', description: '성공적인 외교 활동으로 정치적 영향력이 강화되었습니다.', effect: { type: 'pc', value: 25 } }, // Increased PC boost
  { id: 'scandal', title: '정부 스캔들 발생!', description: '정부 내 스캔들로 인해 정치적 안정성이 크게 하락했습니다.', effect: { type: 'metric', targetId: 'stability', value: -10 } }, // Increased negative effect
  { id: 'stockMarketCrash', title: '주식 시장 붕괴', description: '국제 금융 시장의 불안정으로 국내 주식 시장이 붕괴하여 경제에 큰 타격을 주었습니다.', effect: { type: 'metric', targetId: 'economy', value: -12 } }, // Increased negative effect
];

// ADVISOR MESSAGES (Sorted by priority implicitly by order, explicitly by .sort in App.tsx)
export const ADVISOR_MESSAGES: AdvisorMessage[] = [
  { id: 'lowStability', text: "지도자시여, 국가 안정성이 매우 낮습니다! 시급한 조치가 필요합니다. 폭동 직전입니다!", condition: (gs) => gs.metrics.stability.value < 20, priority: 10 },
  { id: 'lowHappiness', text: "국민들이 매우 불행해하고 있습니다. 행복도를 높일 방안을 강구해야 합니다.", condition: (gs) => gs.metrics.happiness.value < 20, priority: 9 },
  { id: 'lowEconomy', text: "경제가 침체되어 있습니다. 경제 성장 정책을 고려해 보십시오.", condition: (gs) => gs.metrics.economy.value < 30, priority: 8 },
  { id: 'badEnvironment', text: "환경 오염이 심각한 수준입니다. 지속 가능한 발전 정책이 필요합니다.", condition: (gs) => gs.metrics.environment.value < 25, priority: 7 },
  { id: 'electionSoon', text: "곧 선거가 다가옵니다! 지지율 관리에 총력을 기울여야 할 때입니다.", condition: (gs) => gs.electionCooldown <= 6 && gs.electionCooldown > 0 , priority: 6 },
  { id: 'lowPC', text: "정치 자금이 바닥나고 있습니다. 지출을 줄이거나 자금 확보 방안을 찾아야 합니다.", condition: (gs) => gs.politicalCapital < 25, priority: 5 },
  { id: 'highApproval', text: "훌륭하십니다! 국민 대다수가 당신의 리더십을 지지하고 있습니다.", condition: (gs) => gs.overallApproval > 80, priority: 2 },
  { id: 'balancedNation', text: "국가가 모든 면에서 균형 잡힌 발전을 이루고 있습니다. 계속해서 현명한 통치를 부탁드립니다.", condition: (gs) => Object.values(gs.metrics).every(m => m.value >= 55 && m.value <= 75) && gs.politicalCapital > 100, priority: 1 },
  { id: 'criticalEducation', text: "교육 수준이 매우 낮습니다. 미래를 위한 투자가 시급합니다.", condition: (gs) => gs.metrics.education.value < 30, priority: 7 },
  { id: 'criticalHealthcare', text: "의료 접근성이 심각하게 낮습니다. 국민 건강에 대한 대책이 필요합니다.", condition: (gs) => gs.metrics.healthcare.value < 30, priority: 7 },
];

export const ALL_ACHIEVEMENTS: Achievement[] = [
    { 
        id: 'economicPowerhouse', name: '경제 대국', 
        description: '경제력을 90 이상으로 끌어올리세요.', 
        icon: <EconomyIcon className="w-full h-full" />, unlocked: false,
        condition: (gs) => gs.metrics.economy.value >= 90,
        unlockMessage: "경제 대국 달성! 국가 경제가 최고조에 달했습니다!"
    },
    { 
        id: 'utopiaSeeker', name: '행복 전도사', 
        description: '국민 행복도를 90 이상으로 만드세요.', 
        icon: <HappinessIcon className="w-full h-full" />, unlocked: false,
        condition: (gs) => gs.metrics.happiness.value >= 90,
        unlockMessage: "행복 전도사 달성! 국민들이 더할 나위 없이 행복합니다!"
    },
    { 
        id: 'greenParadise', name: '녹색 낙원', 
        description: '환경 품질을 90 이상으로 개선하세요.', 
        icon: <EnvironmentIcon className="w-full h-full" />, unlocked: false,
        condition: (gs) => gs.metrics.environment.value >= 90,
        unlockMessage: "녹색 낙원 달성! 청정 환경국가로 거듭났습니다!"
    },
    { 
        id: 'ironStability', name: '철옹성 국가', 
        description: '정치적 안정성을 95 이상으로 유지하세요.', 
        icon: <StabilityIcon className="w-full h-full" />, unlocked: false,
        condition: (gs) => gs.metrics.stability.value >= 95,
        unlockMessage: "철옹성 국가 달성! 그 누구도 넘볼 수 없는 안정을 이룩했습니다!"
    },
    {
        id: 'educationFirst', name: '교육 제일주의',
        description: '교육 수준을 85 이상으로 끌어올리세요.',
        icon: <EducationIcon className="w-full h-full" />, unlocked: false,
        condition: (gs) => gs.metrics.education.value >= 85,
        unlockMessage: "교육 제일주의 달성! 백년대계의 초석을 다졌습니다!"
    },
    {
        id: 'healthForAll', name: '만민 건강 보장',
        description: '의료 접근성을 85 이상으로 만드세요.',
        icon: <HealthcareIcon className="w-full h-full" />, unlocked: false,
        condition: (gs) => gs.metrics.healthcare.value >= 85,
        unlockMessage: "만민 건강 보장 달성! 모든 국민이 최상의 의료 혜택을 누립니다!"
    },
    {
        id: 'policyMaster', name: '정책의 달인',
        description: '10개 이상의 정책을 동시에 활성화하세요 (카테고리 정책 제외).',
        icon: <UpgradeIcon className="w-full h-full text-teal-400" />, unlocked: false,
        condition: (gs) => gs.activePolicies.filter(p => Object.keys(p.effects).length > 0).length >= 10,
        unlockMessage: "정책의 달인 달성! 다양한 정책으로 국가를 운영하고 있습니다!"
    },
    {
        id: 'longReign', name: '장기 집권',
        description: '10년 (120개월) 이상 통치하세요.',
        icon: <RankIconCrown className="w-full h-full" />, unlocked: false,
        condition: (gs) => (gs.totalMonthsRuled || 0) >= 120,
        unlockMessage: "장기 집권 달성! 오랜 기간 국가를 안정적으로 이끌었습니다!"
    }
];

export const SCORING_WEIGHTS = {
  coreMetricsAvg: 1.5, // Average of economy, happiness, environment, stability
  politicalCapital: 0.25,
  overallApproval: 1.0,
  durationMonths: 0.15,
  achievements: 25, // Per achievement
};

export const RANK_TIERS: Rank[] = [
  { title: "새싹 정치인", minScore: 0, description: "이제 막 정치의 쓴맛 단맛을 알아가는 단계입니다.", icon: <RankIconSeedling /> },
  { title: "지역 유지", minScore: 300, description: "지역 사회에서 어느 정도 영향력을 행사하는 정치인입니다.", icon: <RankIconBuilding /> },
  { title: "중앙 정치인", minScore: 600, description: "국가 정책 결정에 참여하는 비중 있는 인물입니다.", icon: <RankIconFlag /> },
  { title: "국민 지도자", minScore: 1000, description: "국민적 지지와 신망을 받는 뛰어난 지도자입니다.", icon: <RankIconCrown /> },
  { title: "위대한 통치자", minScore: 1500, description: "역사에 길이 남을 위대한 업적을 세운 통치자입니다.", icon: <RankIconStar /> },
  { title: "전설적인 현자", minScore: 2000, description: "국가를 이상향으로 이끈, 전설로 회자될 현자입니다.", icon: <RankIconLaurel /> },
];
