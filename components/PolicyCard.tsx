
import React, { useMemo } from 'react';
import type { Policy, Metric } from '../types';
import { ALL_POLICIES, UpgradeIcon } from '../constants'; 

interface PolicyCardProps {
  policy: Policy;
  onEnact: (policy: Policy) => void;
  onUpgrade: (policyId: string) => void;
  politicalCapital: number;
  isActive: boolean;
  metrics: { [id: string]: Metric };
  activePolicies: Policy[];
}

const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 ml-1 inline-block text-sky-400"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;

const PolicyCard: React.FC<PolicyCardProps> = ({ policy, onEnact, onUpgrade, politicalCapital, isActive, metrics, activePolicies }) => {
  const currentLevel = policy.level || 1;
  const isUpgraded = currentLevel > 1;
  
  const displayEffects = (isUpgraded && policy.upgradedEffects) ? policy.upgradedEffects : policy.effects;
  const displayDescription = (isUpgraded && policy.upgradedDescription) ? policy.upgradedDescription : policy.description;
  const displayUpkeep = (isUpgraded && policy.upgradedUpkeep !== undefined) ? policy.upgradedUpkeep : policy.upkeep;

  const canAffordEnact = politicalCapital >= policy.cost;
  const canAffordUpgrade = policy.upgradable && policy.upgradeCost !== undefined && politicalCapital >= policy.upgradeCost;
  
  const checkPrerequisites = (): { met: boolean, reasons: string[] } => {
    if (!policy.prerequisites) return { met: true, reasons: [] };
    
    const reasons: string[] = [];
    let met = true;

    if (policy.prerequisites.metrics) {
      for (const metricId in policy.prerequisites.metrics) {
        const condition = policy.prerequisites.metrics[metricId];
        const currentMetric = metrics[metricId];
        if (!currentMetric) {
          met = false;
          reasons.push(`"${metricId}" 지표 데이터를 사용할 수 없습니다.`);
          continue;
        }
        const currentMetricValue = currentMetric.value;
        if (condition.min !== undefined && currentMetricValue < condition.min) {
          met = false;
          reasons.push(`${currentMetric.name} 최소 ${condition.min} 필요. (현재: ${currentMetricValue.toFixed(1)})`);
        }
        if (condition.max !== undefined && currentMetricValue > condition.max) {
          met = false;
          reasons.push(`${currentMetric.name} 최대 ${condition.max} 가능. (현재: ${currentMetricValue.toFixed(1)})`);
        }
      }
    }

    if (policy.prerequisites.policies) {
      for (const reqPolicyId of policy.prerequisites.policies) {
        if (!activePolicies.some(p => p.id === reqPolicyId)) {
          met = false;
          const reqPolicyDetails = ALL_POLICIES.find(p => p.id === reqPolicyId);
          reasons.push(`"${reqPolicyDetails ? reqPolicyDetails.name : reqPolicyId}" 정책이 먼저 시행되어야 합니다.`);
        }
      }
    }
    return { met, reasons };
  };

  const prerequisitesResult = checkPrerequisites();

  const isCategoryPolicy = useMemo(() => {
    const hasNoDirectImpact = Object.keys(policy.effects).length === 0 && policy.cost === 0;
    if (!hasNoDirectImpact) return false;
    return ALL_POLICIES.some(p => p.parentId === policy.id);
  }, [policy.id, policy.cost, policy.effects]);


  const isTemporaryActive = isActive && policy.currentDuration !== undefined && policy.currentDuration > 0;

  // Initialize defaults, primarily for standard enactable policies
  let canEnactStandardPolicy = canAffordEnact && !isActive && prerequisitesResult.met && !isCategoryPolicy;
  let buttonText = '정책 시행';
  let buttonAction = () => onEnact(policy);
  let buttonDisabled = !canEnactStandardPolicy;
  let buttonStyle = "bg-indigo-500 hover:bg-indigo-600";
  let cardBorderStyle = `border-2 border-transparent hover:border-indigo-500`;
  let cardOpacity = 'opacity-100';


  if (isActive) {
    // Policy is ALREADY ACTIVE
    if (isCategoryPolicy) {
        buttonText = '카테고리 활성됨';
        buttonStyle = "bg-sky-700 cursor-not-allowed";
        cardBorderStyle = "border-2 border-sky-700"; // Style for active categories
        buttonDisabled = true;
        cardOpacity = 'opacity-80';
    } else if (policy.upgradable && currentLevel === 1 && policy.upgradeCost !== undefined) {
        // Standard active policy, upgradable
        buttonText = '정책 강화';
        buttonAction = () => onUpgrade(policy.id);
        buttonDisabled = !canAffordUpgrade;
        buttonStyle = canAffordUpgrade ? "bg-teal-500 hover:bg-teal-600" : "bg-gray-500 cursor-not-allowed";
        cardBorderStyle = "border-2 border-green-500"; // Active, Lv.1, upgradable (green border)
        cardOpacity = canAffordUpgrade ? 'opacity-100' : 'opacity-70'; // Match original logic
    } else {
        // Standard active policy, not upgradable or already upgraded, or temporary
        if (isTemporaryActive) {
            buttonText = `임시 활성 (${policy.currentDuration}턴 남음)`;
        } else {
            // Note: isCategoryPolicy is false in this branch
            buttonText = isUpgraded ? '영구 활성 (강화됨)' : '영구 활성 중';
        }
        // Note: isCategoryPolicy is false in this branch
        buttonStyle = isUpgraded ? "bg-yellow-600 cursor-not-allowed" : 
                      (currentLevel === 1 && policy.upgradable ? "bg-green-600 cursor-not-allowed" : "bg-green-600 cursor-not-allowed");
        
        cardBorderStyle = isUpgraded ? "border-2 border-yellow-500" : `border-2 border-green-500`;
        buttonDisabled = true;
        cardOpacity = 'opacity-80'; // Match original logic
    }
  } else {
    // Policy is NOT ACTIVE
    if (isCategoryPolicy) {
        // Category policy that is not active yet
        const canActivateCategory = canAffordEnact && prerequisitesResult.met; // Prerequisites for category itself
        buttonText = '카테고리 잠금 해제';
        buttonAction = () => onEnact(policy); // Action is to enact the category
        buttonDisabled = !canActivateCategory;
        buttonStyle = canActivateCategory ? "bg-sky-500 hover:bg-sky-600" : "bg-gray-500 cursor-not-allowed";
        cardBorderStyle = canActivateCategory ? 'border-2 border-transparent hover:border-sky-500' : 'border-2 border-gray-600';
        cardOpacity = canActivateCategory ? 'opacity-100' : 'opacity-60';
        if (!canActivateCategory) {
            if (!prerequisitesResult.met) {
                buttonText = '선결 조건 미충족'; // For the category itself
            } else if (!canAffordEnact) { // Should not happen if cost is 0 for categories
                buttonText = '자금 부족';
            }
        }
    } else { 
      // Standard policy, not active.
      // `canEnactStandardPolicy` was defined at the top.
      // Default values for buttonText, buttonAction, buttonStyle, cardBorderStyle, cardOpacity are already set for the enactable case.
      if (!canEnactStandardPolicy) {
          // Standard policy, not active, AND not enactable
          buttonStyle = "bg-gray-500 cursor-not-allowed";
          buttonDisabled = true; // Explicitly disable
          cardOpacity = 'opacity-60';
          cardBorderStyle = 'border-2 border-gray-600'; // Explicitly set disabled border
          if (!prerequisitesResult.met) {
              buttonText = '선결 조건 미충족';
          } else if (!canAffordEnact) {
              buttonText = '자금 부족';
          } else {
               // This case should ideally not be reached if the above conditions are comprehensive
               buttonText = '시행 불가'; 
          }
      }
    }
  }


  return (
    <div className={`bg-gray-700 p-3 rounded-lg shadow-md transition-all duration-300 flex flex-col justify-between ${cardOpacity} ${cardBorderStyle} max-w-xs w-full`}>
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center">
            {policy.icon}
            <h3 className={`text-md font-semibold ml-2 ${isCategoryPolicy ? 'text-sky-400' : (isUpgraded && isActive ? 'text-yellow-300' : 'text-sky-300')}`}>{policy.name}</h3>
          </div>
          {!isCategoryPolicy && (
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
              isUpgraded && isActive ? 'bg-yellow-500 text-gray-900' : (isActive ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300')
            }`}>
              {isUpgraded && isActive ? `Lv.2` : (isActive && policy.upgradable && currentLevel === 1 ? 'Lv.1 활성' : (isActive ? '활성' : 'Lv.1'))}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-300 mb-2 h-12 overflow-y-auto custom-scrollbar">{displayDescription}</p>
        
        {!isActive && !isCategoryPolicy && <p className="text-xs font-medium mb-1">시행 비용: <span className="text-amber-400">{policy.cost} PC</span></p>}
        {isActive && policy.upgradable && currentLevel === 1 && policy.upgradeCost !== undefined && !isCategoryPolicy && (
             <p className="text-xs font-medium mb-1">강화 비용: <span className="text-teal-400">{policy.upgradeCost} PC</span></p>
        )}

        {policy.duration && !isCategoryPolicy && (
          <p className="text-xs text-gray-400 mb-0.5">
            지속 기간: {policy.duration} 턴 
            {isTemporaryActive ? <ClockIcon /> : ''}
          </p>
        )}
        {displayUpkeep !== undefined && displayUpkeep > 0 && !isCategoryPolicy && (
          <p className="text-xs text-gray-400 mb-0.5">
            유지비: <span className="text-orange-400">{displayUpkeep} PC/턴</span>
          </p>
        )}
        {Object.keys(displayEffects).length > 0 && !isCategoryPolicy && (
            <div className="text-xs text-gray-400 mb-1">
            효과:
            <ul className="list-disc list-inside ml-2">
                {Object.entries(displayEffects).map(([key, value]) => {
                const metricName = key === 'politicalCapital' ? '정치 자금' : (metrics[key]?.name || key.charAt(0).toUpperCase() + key.slice(1));
                const valueColor = key === 'politicalCapital' ? (value > 0 ? 'text-green-400' : 'text-red-400') : (value > 0 ? 'text-green-400' : 'text-red-400');
                return (
                    <li key={key} className={valueColor}>
                    {metricName}: {value > 0 ? '+' : ''}{value}
                    </li>
                );
                })}
            </ul>
            </div>
        )}
        {!isActive && !prerequisitesResult.met && !isCategoryPolicy && (
          <div className="text-xs text-red-400 mt-0.5 mb-1">
            <span className="font-semibold">선결 조건 미충족:</span>
            <ul className="list-disc list-inside ml-2">
              {prerequisitesResult.reasons.map(reason => <li key={reason}>{reason}</li>)}
            </ul>
          </div>
        )}
      </div>
      <button
        onClick={buttonAction}
        disabled={buttonDisabled}
        className={`w-full py-1.5 px-3 rounded-md text-white text-sm font-semibold transition-colors duration-200 ${buttonStyle} mt-auto flex items-center justify-center`}
        aria-label={isActive ? (policy.upgradable && currentLevel ===1 ? `정책 ${policy.name} 강화` : `정책 ${policy.name} 활성 중`) : (canEnactStandardPolicy || (isCategoryPolicy && !buttonDisabled) ? `정책 ${policy.name} 시행 또는 활성화` : `정책 ${policy.name} 시행 불가`)}
      >
        {isActive && policy.upgradable && currentLevel === 1 && !buttonDisabled && <UpgradeIcon />}
        {buttonText}
      </button>
    </div>
  );
};

export default PolicyCard;
