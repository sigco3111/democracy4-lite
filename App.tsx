
import React, { useState, useEffect, useCallback } from 'react';
import type { EnhancedGameState, Metric, Policy, VoterGroup, ToastNotificationState, MiniEvent, EndOfTurnSummaryData, NewsItem, AdvisorMessage, Achievement, Rank, ScoreBreakdownItem } from './types';
import { 
    INITIAL_METRICS, ALL_POLICIES, INITIAL_YEAR, INITIAL_MONTH, INITIAL_POLITICAL_CAPITAL, 
    INITIAL_VOTER_GROUPS, ELECTION_INTERVAL_MONTHS, MINI_EVENTS, MINI_EVENT_CHANCE,
    ADVISOR_MESSAGES, NEWS_HEADLINE_TEMPLATES, MAX_NEWS_ITEMS, SIGNIFICANT_METRIC_CHANGE_THRESHOLD,
    DEFAULT_ADVISOR_MESSAGE, ALL_ACHIEVEMENTS, generateTurnIdentifier, SCORING_WEIGHTS, RANK_TIERS,
    DELEGATION_MODAL_AUTOCLOSE_DELAY
} from './constants';
import Header from './components/Header';
import MetricsDisplay from './components/MetricsDisplay';
import PolicyGraphDisplay from './components/PolicySelector'; // 경로 수정: PolicyGraphDisplay 컴포넌트는 PolicySelector.tsx 파일에 있습니다.
import Modal from './components/Modal';
import ToastNotification from './components/ToastNotification';
import EndOfTurnSummaryModal from './components/EndOfTurnSummaryModal';
import StaticNewsFeed from './components/StaticNewsFeed';
import StaticAdvisor from './components/StaticAdvisor';
import AchievementsDisplay from './components/AchievementsDisplay';

// Helper functions to get fresh initial state, preserving React elements
const getInitialMetrics = (): { [id: string]: Metric } => {
  const newMetrics: { [id: string]: Metric } = {};
  for (const key in INITIAL_METRICS) {
    newMetrics[key] = { ...INITIAL_METRICS[key] };
  }
  return newMetrics;
};

const deepCopyMetrics = (metricsToCopy: { [id: string]: Metric }): { [id: string]: Metric } => {
  const newMetrics: { [id: string]: Metric } = {};
  for (const key in metricsToCopy) {
    newMetrics[key] = { ...metricsToCopy[key] };
  }
  return newMetrics;
};

const getInitialVoterGroups = (): VoterGroup[] => {
  return INITIAL_VOTER_GROUPS.map(group => ({ ...group }));
};

const getInitialAvailablePolicies = (): Policy[] => {
  return ALL_POLICIES.map(policy => ({ ...policy, currentDuration: policy.duration, level: 1 }));
};

const getInitialAchievements = (): Achievement[] => {
    return ALL_ACHIEVEMENTS.map(ach => ({ ...ach, unlocked: false }));
};


const _calculateOverallApprovalLogic = (
  currentMetrics: { [id: string]: Metric },
  currentVoterGroups: VoterGroup[]
): { updatedVoterGroups: VoterGroup[], overallApproval: number } => {
  let totalWeightedApproval = 0;
  let totalPopulationPercentage = 0;

  const updatedVoterGroups = currentVoterGroups.map(group => {
      let weightedSum = 0;
      Object.entries(group.metricPriorities).forEach(([metricId, weight]) => {
          const metricVal = currentMetrics[metricId]?.value ?? 50;
          weightedSum += (metricVal - 50) * weight;
      });
      
      if (group.id === 'capitalists' && currentMetrics.economy.value > 80) weightedSum += 5 * group.metricPriorities.economy;
      if (group.id === 'environmentalists' && currentMetrics.environment.value > 70) weightedSum += 5 * group.metricPriorities.environment;
      if (group.id === 'socialists' && currentMetrics.happiness.value > 70) weightedSum += 5 * group.metricPriorities.happiness;

      const newApproval = Math.max(0, Math.min(100, 50 + weightedSum));
      totalWeightedApproval += newApproval * group.populationPercentage;
      totalPopulationPercentage += group.populationPercentage;
      return { ...group, approval: newApproval };
  });
  
  const overallApproval = totalPopulationPercentage > 0 ? totalWeightedApproval / totalPopulationPercentage : 50;
  return { updatedVoterGroups, overallApproval: Math.max(0, Math.min(100, overallApproval)) };
};


const _selectAdvisorMessageLogic = (currentGs: EnhancedGameState, prevGs?: EnhancedGameState): string => {
    const sortedMessages = [...ADVISOR_MESSAGES].sort((a, b) => b.priority - a.priority);
    for (const msg of sortedMessages) {
        if (msg.condition(currentGs, prevGs)) {
            return msg.text;
        }
    }
    return DEFAULT_ADVISOR_MESSAGE;
};

const LOCAL_STORAGE_KEY = 'simpoly_autosave';

const rehydrateIconsForCollection = (items: any[] | undefined, initialDefs: any[], idKey: string = 'id'): any[] => {
  if (!items || !initialDefs) return items || [];
  return items.map(item => {
    const initialDef = initialDefs.find(def => def[idKey] === item[idKey]);
    if (initialDef && initialDef.icon) { // Check if initialDef and initialDef.icon exist
      return { ...item, icon: initialDef.icon };
    }
    return item; // Return item as is if no match or no icon in def
  });
};

const loadGameStateFromLocalStorage = (): EnhancedGameState | null => {
  const savedStateString = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!savedStateString) return null;

  try {
    const parsedState = JSON.parse(savedStateString) as EnhancedGameState;

    // Rehydrate metrics
    const rehydratedMetrics: { [id: string]: Metric } = {};
    if (parsedState.metrics) {
      for (const key in parsedState.metrics) {
        const initialMetricDef = INITIAL_METRICS[key];
        if (initialMetricDef && initialMetricDef.icon) {
          rehydratedMetrics[key] = { ...parsedState.metrics[key], icon: initialMetricDef.icon };
        } else {
          rehydratedMetrics[key] = parsedState.metrics[key];
        }
      }
      parsedState.metrics = rehydratedMetrics;
    }
    
    parsedState.availablePolicies = rehydrateIconsForCollection(parsedState.availablePolicies, ALL_POLICIES, 'id');
    parsedState.activePolicies = rehydrateIconsForCollection(parsedState.activePolicies, ALL_POLICIES, 'id');
    parsedState.voterGroups = rehydrateIconsForCollection(parsedState.voterGroups, INITIAL_VOTER_GROUPS, 'id');
    
    if (parsedState.achievements) {
        parsedState.achievements = parsedState.achievements.map(savedAch => {
            const initialAchDef = ALL_ACHIEVEMENTS.find(def => def.id === savedAch.id);
            if (initialAchDef) {
                return {
                    ...savedAch, 
                    icon: initialAchDef.icon, 
                    condition: initialAchDef.condition, 
                };
            }
            return savedAch; 
        });
    }

    if (parsedState.finalRank && parsedState.finalRank.title) {
      const initialRankDef = RANK_TIERS.find(r => r.title === parsedState.finalRank!.title);
      if (initialRankDef && initialRankDef.icon) {
        parsedState.finalRank.icon = initialRankDef.icon;
      }
    }

    if (parsedState.endOfTurnSummaryData && parsedState.endOfTurnSummaryData.metricsBefore && parsedState.endOfTurnSummaryData.metricsAfter) {
      const rehydrateEotsMetrics = (metricsObj: { [id: string]: Metric }) => {
        const rehydrated: { [id: string]: Metric } = {};
        for (const key in metricsObj) {
          const initialMetricDef = INITIAL_METRICS[key];
          if (initialMetricDef && initialMetricDef.icon) {
            rehydrated[key] = { ...metricsObj[key], icon: initialMetricDef.icon };
          } else {
            rehydrated[key] = metricsObj[key];
          }
        }
        return rehydrated;
      };
      parsedState.endOfTurnSummaryData.metricsBefore = rehydrateEotsMetrics(parsedState.endOfTurnSummaryData.metricsBefore);
      parsedState.endOfTurnSummaryData.metricsAfter = rehydrateEotsMetrics(parsedState.endOfTurnSummaryData.metricsAfter);
    }
    
    if (!parsedState.metrics || !parsedState.year || typeof parsedState.politicalCapital !== 'number') {
        console.error("Loaded game state is invalid or incomplete.");
        localStorage.removeItem(LOCAL_STORAGE_KEY); 
        return null;
    }
    
    parsedState.isDelegationModeActive = parsedState.isDelegationModeActive || false;
    parsedState.showElectionModal = parsedState.showElectionModal || false;
    parsedState.showResetConfirmationModal = parsedState.showResetConfirmationModal || false;

    return parsedState;
  } catch (error) {
    console.error("Failed to load or parse game state:", error);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    return null;
  }
};


const App: React.FC = () => {
  const [gameState, setGameState] = useState<EnhancedGameState>(() => {
    const loadedState = loadGameStateFromLocalStorage();
    if (loadedState) {
      const { updatedVoterGroups, overallApproval } = _calculateOverallApprovalLogic(loadedState.metrics, loadedState.voterGroups || []);
      loadedState.voterGroups = updatedVoterGroups;
      loadedState.overallApproval = overallApproval;
      loadedState.advisorMessage = _selectAdvisorMessageLogic(loadedState); 
      return loadedState;
    }

    const initialMetrics = getInitialMetrics();
    const initialVoterGroups = getInitialVoterGroups();
    const initialAvailablePolicies = getInitialAvailablePolicies();
    const initialAchievements = getInitialAchievements();
    const initialTurnIdentifier = generateTurnIdentifier(INITIAL_YEAR, INITIAL_MONTH);
    
    const initialNews: NewsItem[] = [{
        id: Date.now().toString(),
        text: NEWS_HEADLINE_TEMPLATES.gameStart(initialTurnIdentifier),
        turnIdentifier: initialTurnIdentifier,
        type: 'general'
    }];

    const { updatedVoterGroups, overallApproval } = _calculateOverallApprovalLogic(initialMetrics, initialVoterGroups);

    const tempGameStateForAdvisor: EnhancedGameState = { 
        year: INITIAL_YEAR,
        month: INITIAL_MONTH,
        currentTurnIdentifier: initialTurnIdentifier,
        politicalCapital: INITIAL_POLITICAL_CAPITAL,
        metrics: initialMetrics,
        activePolicies: [],
        availablePolicies: initialAvailablePolicies,
        newsItems: initialNews,
        advisorMessage: "", 
        gameOver: false,
        gameOverMessage: "",
        voterGroups: updatedVoterGroups, 
        overallApproval: overallApproval, 
        electionUpcoming: false,
        electionCooldown: ELECTION_INTERVAL_MONTHS,
        electionResult: null, 
        toastNotification: null, 
        currentEvent: null,
        showEventModal: false,
        showEndOfTurnSummaryModal: false, 
        endOfTurnSummaryData: null,
        achievements: initialAchievements,
        finalScore: undefined,
        finalRank: undefined,
        scoreBreakdown: undefined,
        totalMonthsRuled: 0,
        isDelegationModeActive: false,
        showElectionModal: false,
        showResetConfirmationModal: false,
    };
    tempGameStateForAdvisor.advisorMessage = _selectAdvisorMessageLogic(tempGameStateForAdvisor); 
    return tempGameStateForAdvisor;
  });

  const [prevGameState, setPrevGameState] = useState<EnhancedGameState | undefined>(undefined);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(gameState));
  }, [gameState]); // Simplified to gameState, as all relevant sub-properties should trigger it.


  const showToast = (message: string, type: ToastNotificationState['type'] = 'success') => {
    const id = Date.now().toString(); 
    setGameState(prev => ({ ...prev, toastNotification: { id, message, type } }));
    setTimeout(() => {
      setGameState(prev => {
        if (prev.toastNotification && prev.toastNotification.id === id) {
          return { ...prev, toastNotification: null };
        }
        return prev;
      });
    }, 3000); 
  };
  
  const addNewsItem = useCallback((text: string, type: NewsItem['type']) => {
    setGameState(prev => {
        const newNewsItem: NewsItem = {
            id: `${Date.now()}-${Math.random()}`,
            text,
            turnIdentifier: prev.currentTurnIdentifier,
            type
        };
        const updatedNewsItems = [newNewsItem, ...prev.newsItems].slice(0, MAX_NEWS_ITEMS);
        return { ...prev, newsItems: updatedNewsItems };
    });
  }, []); 

  const checkAndUnlockAchievements = useCallback(() => {
    setGameState(currentGs => {
        let newAchievementsUnlocked = false;
        const updatedAchievements = currentGs.achievements.map(ach => {
            if (!ach.unlocked && typeof ach.condition === 'function' && ach.condition(currentGs)) {
                if (!currentGs.isDelegationModeActive) showToast(ach.unlockMessage, 'success');
                addNewsItem(NEWS_HEADLINE_TEMPLATES.achievementUnlocked(ach.name), 'achievement');
                newAchievementsUnlocked = true;
                return { ...ach, unlocked: true };
            }
            return ach;
        });

        if (newAchievementsUnlocked) {
            return { ...currentGs, achievements: updatedAchievements };
        }
        return currentGs;
    });
  }, [addNewsItem]); 
  
  const updateAdvisorMessage = useCallback(() => {
      setGameState(currentGs => {
          const prevGsForAdvisor = prevGameState || { 
              ...currentGs, 
              month: currentGs.month - 1 < 1 ? 12 : currentGs.month - 1, 
              year: currentGs.month - 1 < 1 ? currentGs.year - 1 : currentGs.year,
              currentTurnIdentifier: generateTurnIdentifier(
                currentGs.month - 1 < 1 ? currentGs.year - 1 : currentGs.year, 
                currentGs.month - 1 < 1 ? 12 : currentGs.month - 1
              ) 
          };
          const newMessage = _selectAdvisorMessageLogic(currentGs, prevGsForAdvisor);
          if (currentGs.advisorMessage !== newMessage) {
              return { ...currentGs, advisorMessage: newMessage };
          }
          return currentGs; 
      });
  }, [prevGameState]); 


  const calculateOverallApproval = useCallback((
    currentMetrics: { [id: string]: Metric },
    currentVoterGroups: VoterGroup[]
  ): { updatedVoterGroups: VoterGroup[], overallApproval: number } => {
    return _calculateOverallApprovalLogic(currentMetrics, currentVoterGroups);
  }, []);


  useEffect(() => {
    const { updatedVoterGroups, overallApproval } = calculateOverallApproval(gameState.metrics, gameState.voterGroups);
    if (JSON.stringify(gameState.voterGroups) !== JSON.stringify(updatedVoterGroups) || gameState.overallApproval !== overallApproval) {
        setGameState(prev => ({
            ...prev,
            voterGroups: updatedVoterGroups,
            overallApproval
        }));
    }
  }, [gameState.metrics, gameState.voterGroups, calculateOverallApproval]);
  
  useEffect(() => {
    if (!isInitialLoad) {
        updateAdvisorMessage();
    }
  }, [gameState.metrics, gameState.politicalCapital, gameState.overallApproval, gameState.electionUpcoming, gameState.currentTurnIdentifier, updateAdvisorMessage, isInitialLoad]);


  const enactPolicy = (policy: Policy) => {
    if (gameState.gameOver) return;
    if (gameState.politicalCapital < policy.cost) {
      if (!gameState.isDelegationModeActive) showToast("정치 자금이 부족합니다!", "error");
      return false;
    }
    if (gameState.activePolicies.some(p => p.id === policy.id)) {
      if (!gameState.isDelegationModeActive) showToast("이미 시행 중인 정책입니다!", "warning");
      return false;
    }

    setGameState(prev => {
      const newPolicyInstance = {...policy, currentDuration: policy.duration, level: 1}; 
      
      if (!prev.isDelegationModeActive) showToast(`"${policy.name}" 정책이 성공적으로 시행되었습니다!`, "success");
      addNewsItem(NEWS_HEADLINE_TEMPLATES.policyEnacted(policy.name), 'policy');
      return {
        ...prev,
        politicalCapital: prev.politicalCapital - policy.cost,
        activePolicies: [...prev.activePolicies, newPolicyInstance],
      };
    });
    return true;
  };

  const upgradePolicy = (policyId: string) => {
    if (gameState.gameOver) return false;

    let success = false;
    setGameState(prev => {
        const policyToUpgrade = prev.activePolicies.find(p => p.id === policyId);
        if (!policyToUpgrade || !policyToUpgrade.upgradable || policyToUpgrade.level !== 1 || policyToUpgrade.upgradeCost === undefined) {
            if (!prev.isDelegationModeActive) showToast("이 정책은 강화할 수 없거나 이미 강화되었습니다.", "warning");
            return prev;
        }
        if (prev.politicalCapital < policyToUpgrade.upgradeCost) {
            if (!prev.isDelegationModeActive) showToast("정책 강화에 필요한 정치 자금이 부족합니다!", "error");
            return prev;
        }

        const upgradedPolicy: Policy = {
            ...policyToUpgrade,
            level: 2,
        };

        if (!prev.isDelegationModeActive) showToast(`"${policyToUpgrade.name}" 정책이 성공적으로 강화되었습니다! (Lv.2)`, "success");
        addNewsItem(NEWS_HEADLINE_TEMPLATES.policyUpgraded(policyToUpgrade.name), 'policy');
        success = true;
        return {
            ...prev,
            politicalCapital: prev.politicalCapital - policyToUpgrade.upgradeCost,
            activePolicies: prev.activePolicies.map(p => p.id === policyId ? upgradedPolicy : p),
        };
    });
    return success;
  };

  const checkPolicyPrerequisites = useCallback((policy: Policy, currentMetrics: { [id: string]: Metric }, currentActivePolicies: Policy[]): { met: boolean, reasons: string[] } => {
    if (!policy.prerequisites) return { met: true, reasons: [] };
    
    const reasons: string[] = [];
    let met = true;

    if (policy.prerequisites.metrics) {
      for (const metricId in policy.prerequisites.metrics) {
        const condition = policy.prerequisites.metrics[metricId];
        const currentMetric = currentMetrics[metricId];
        if (!currentMetric) {
          met = false;
          reasons.push(`"${metricId}" 지표 데이터를 사용할 수 없습니다.`);
          continue;
        }
        const currentMetricValue = currentMetric.value;
        if (condition.min !== undefined && currentMetricValue < condition.min) {
          met = false;
          reasons.push(`${currentMetric.name} 최소 ${condition.min} 필요.`);
        }
        if (condition.max !== undefined && currentMetricValue > condition.max) {
          met = false;
          reasons.push(`${currentMetric.name} 최대 ${condition.max} 가능.`);
        }
      }
    }

    if (policy.prerequisites.policies) {
      for (const reqPolicyId of policy.prerequisites.policies) {
        if (!currentActivePolicies.some(p => p.id === reqPolicyId)) {
          met = false;
          const reqPolicyDetails = ALL_POLICIES.find(p => p.id === reqPolicyId);
          reasons.push(`"${reqPolicyDetails ? reqPolicyDetails.name : reqPolicyId}" 정책 필요.`);
        }
      }
    }
    return { met, reasons };
  }, []);


  const makeAutomatedPolicyDecisions = useCallback(() => {
    setGameState(prevGs => {
        if (prevGs.politicalCapital < 5 || prevGs.gameOver) return prevGs;

        let decisionMade = false;
        const workingGs = deepCopyGameState(prevGs); // Operate on a mutable copy

        const ALL_TRACKED_METRIC_IDS = ['economy', 'happiness', 'environment', 'stability', 'education', 'healthcare'];
        
        // Define thresholds
        const ULTRA_CRITICAL_MAX = 30; // Metrics < 30
        const CRITICAL_MAX = 45;       // Metrics >= 30 and < 45
        const LOW_MAX = 60;            // Metrics >= 45 and < 60

        // Helper to attempt an action and set decisionMade
        const attemptAction = (actionFn: () => boolean): void => {
            if (decisionMade) return;
            if (actionFn()) {
                decisionMade = true;
            }
        };
        
        // Function to process a list of metric IDs to improve
        const tryFixSpecificMetrics = (metricIdsToFix: string[]): void => {
            if (decisionMade) return;
            for (const metricId of metricIdsToFix) {
                // 1a. Attempt Upgrade for this metricId
                const upgradableActivePolicies = workingGs.activePolicies
                    .filter(p =>
                        p.upgradable && p.level === 1 && p.upgradeCost !== undefined && workingGs.politicalCapital >= p.upgradeCost &&
                        p.upgradedEffects && p.upgradedEffects[metricId] && p.upgradedEffects[metricId] > 0
                    )
                    .sort((a,b) => (b.upgradedEffects![metricId] || 0) - (a.upgradedEffects![metricId] || 0));

                if (upgradableActivePolicies.length > 0) {
                    const policyToUpgrade = upgradableActivePolicies[0];
                    attemptAction(() => {
                        workingGs.politicalCapital -= policyToUpgrade.upgradeCost!;
                        workingGs.activePolicies = workingGs.activePolicies.map(p =>
                            p.id === policyToUpgrade.id ? { ...p, level: 2 } : p
                        );
                        addNewsItem(NEWS_HEADLINE_TEMPLATES.policyUpgraded(policyToUpgrade.name), 'policy');
                        return true;
                    });
                    if (decisionMade) break;
                }

                // 1b. Attempt Enactment for this metricId (Standard Policies Only)
                const enactableStandardPoliciesAndCategories: Array<{policy: Policy, categoryToUnlock?: Policy}> = [];
                ALL_POLICIES.filter(p =>
                    !workingGs.activePolicies.some(ap => ap.id === p.id) && // Not active
                    Object.keys(p.effects).length > 0 && // Standard policy
                    p.effects && p.effects[metricId] && p.effects[metricId] > 0 // Positive effect on target
                ).forEach(p => {
                    const prereqCheck = checkPolicyPrerequisites(p, workingGs.metrics, workingGs.activePolicies);
                    if (prereqCheck.met && workingGs.politicalCapital >= p.cost) {
                        enactableStandardPoliciesAndCategories.push({ policy: p });
                    } else if (!prereqCheck.met && prereqCheck.reasons.length === 1) {
                        // Check if the only unmet prereq is an inactive category policy
                        const unmetReqPolicyId = p.prerequisites?.policies?.find(id => !workingGs.activePolicies.some(ap => ap.id === id));
                        if (unmetReqPolicyId) {
                            const categoryPolicy = ALL_POLICIES.find(catP => 
                                catP.id === unmetReqPolicyId && 
                                Object.keys(catP.effects).length === 0 && // Is a category
                                !workingGs.activePolicies.some(ap => ap.id === catP.id) // Is inactive
                            );
                            if (categoryPolicy && workingGs.politicalCapital >= categoryPolicy.cost && checkPolicyPrerequisites(categoryPolicy, workingGs.metrics, workingGs.activePolicies).met) {
                                enactableStandardPoliciesAndCategories.push({ policy: p, categoryToUnlock: categoryPolicy });
                            }
                        }
                    }
                });

                // Sort by direct effect on metricId, prioritizing direct enactments
                enactableStandardPoliciesAndCategories.sort((a,b) => {
                    if (a.categoryToUnlock && !b.categoryToUnlock) return 1; // b (direct) is better
                    if (!a.categoryToUnlock && b.categoryToUnlock) return -1; // a (direct) is better
                    return (b.policy.effects![metricId] || 0) - (a.policy.effects![metricId] || 0);
                });

                if (enactableStandardPoliciesAndCategories.length > 0) {
                    const bestChoice = enactableStandardPoliciesAndCategories[0];
                    if (bestChoice.categoryToUnlock) { // Needs category unlock first
                        if (workingGs.politicalCapital >= bestChoice.categoryToUnlock.cost) {
                           attemptAction(() => {
                                workingGs.politicalCapital -= bestChoice.categoryToUnlock!.cost;
                                workingGs.activePolicies.push({ ...bestChoice.categoryToUnlock!, currentDuration: bestChoice.categoryToUnlock!.duration, level: 1 });
                                addNewsItem(NEWS_HEADLINE_TEMPLATES.policyEnacted(bestChoice.categoryToUnlock!.name), 'policy');
                                return true;
                            });
                        }
                    } else { // Direct enactment
                         if (workingGs.politicalCapital >= bestChoice.policy.cost) {
                            attemptAction(() => {
                                workingGs.politicalCapital -= bestChoice.policy.cost;
                                workingGs.activePolicies.push({ ...bestChoice.policy, currentDuration: bestChoice.policy.duration, level: 1 });
                                addNewsItem(NEWS_HEADLINE_TEMPLATES.policyEnacted(bestChoice.policy.name), 'policy');
                                return true;
                            });
                        }
                    }
                    if (decisionMade) break;
                }
            }
        };

        // Get metrics sorted by value
        const sortedMetricsInfo = ALL_TRACKED_METRIC_IDS
            .map(id => ({ id, value: workingGs.metrics[id]?.value || 0 }))
            .sort((a, b) => a.value - b.value);

        // Tiered fixing
        tryFixSpecificMetrics(sortedMetricsInfo.filter(m => m.value < ULTRA_CRITICAL_MAX).map(m => m.id));
        if (!decisionMade) {
            tryFixSpecificMetrics(sortedMetricsInfo.filter(m => m.value >= ULTRA_CRITICAL_MAX && m.value < CRITICAL_MAX).map(m => m.id));
        }
        if (!decisionMade) {
            tryFixSpecificMetrics(sortedMetricsInfo.filter(m => m.value >= CRITICAL_MAX && m.value < LOW_MAX).map(m => m.id));
        }
        
        // Fallback 1: General Upgrades (less harmful)
        if (!decisionMade) {
            const generalUpgradable = workingGs.activePolicies
                .filter(p => p.upgradable && p.level === 1 && p.upgradeCost !== undefined && workingGs.politicalCapital >= p.upgradeCost)
                .map(p => {
                    let harmScore = 0;
                    if (p.upgradedEffects) {
                        for (const metricId of ALL_TRACKED_METRIC_IDS) {
                            if ((workingGs.metrics[metricId]?.value || 50) < CRITICAL_MAX && (p.upgradedEffects[metricId] || 0) < 0) {
                                harmScore += Math.abs(p.upgradedEffects[metricId]!); // Higher harmScore is worse
                            }
                        }
                    }
                    return { policy: p, harmScore, cost: p.upgradeCost! };
                })
                .sort((a,b) => a.harmScore - b.harmScore || a.cost - b.cost); // Least harmful, then cheapest
            
            if (generalUpgradable.length > 0) {
                const policyToUpgrade = generalUpgradable[0].policy;
                 attemptAction(() => {
                    workingGs.politicalCapital -= policyToUpgrade.upgradeCost!;
                    workingGs.activePolicies = workingGs.activePolicies.map(p =>
                        p.id === policyToUpgrade.id ? { ...p, level: 2 } : p
                    );
                    addNewsItem(NEWS_HEADLINE_TEMPLATES.policyUpgraded(policyToUpgrade.name), 'policy');
                    return true;
                });
            }
        }

        // Fallback 2: General Enactment of Standard Policies (less harmful)
        if (!decisionMade) {
            const generalEnactable = ALL_POLICIES
                .filter(p =>
                    !workingGs.activePolicies.some(ap => ap.id === p.id) &&
                    Object.keys(p.effects).length > 0 && // Standard policies only
                    workingGs.politicalCapital >= p.cost &&
                    checkPolicyPrerequisites(p, workingGs.metrics, workingGs.activePolicies).met
                )
                .map(p => {
                    let harmScore = 0;
                    for (const metricId of ALL_TRACKED_METRIC_IDS) {
                        if ((workingGs.metrics[metricId]?.value || 50) < CRITICAL_MAX && (p.effects[metricId] || 0) < 0) {
                            harmScore += Math.abs(p.effects[metricId]!);
                        }
                    }
                    return { policy: p, harmScore, cost: p.cost };
                })
                .sort((a,b) => a.harmScore - b.harmScore || a.cost - b.cost); // Least harmful, then cheapest


            if (generalEnactable.length > 0) {
                const policyToEnact = generalEnactable[0].policy;
                attemptAction(() => {
                    workingGs.politicalCapital -= policyToEnact.cost;
                    workingGs.activePolicies.push({ ...policyToEnact, currentDuration: policyToEnact.duration, level: 1 });
                    addNewsItem(NEWS_HEADLINE_TEMPLATES.policyEnacted(policyToEnact.name), 'policy');
                    return true;
                });
            }
        }

        // Fallback 3: Unlock Cheapest Available Category Policies
        if (!decisionMade) {
            const availableCategoryPolicies = ALL_POLICIES.filter(p =>
                !workingGs.activePolicies.some(ap => ap.id === p.id) &&
                Object.keys(p.effects).length === 0 && // Category policies
                workingGs.politicalCapital >= p.cost && 
                checkPolicyPrerequisites(p, workingGs.metrics, workingGs.activePolicies).met
            ).sort((a,b) => a.cost - b.cost); // Cheapest first

            if (availableCategoryPolicies.length > 0) {
                const categoryToEnact = availableCategoryPolicies[0];
                attemptAction(() => {
                    workingGs.politicalCapital -= categoryToEnact.cost; // Should be 0 or low for categories
                    workingGs.activePolicies.push({ ...categoryToEnact, currentDuration: categoryToEnact.duration, level: 1 });
                    addNewsItem(NEWS_HEADLINE_TEMPLATES.policyEnacted(categoryToEnact.name), 'policy');
                    return true;
                });
            }
        }
        
        return decisionMade ? workingGs : prevGs; 
    });
  }, [checkPolicyPrerequisites, addNewsItem]);


  useEffect(() => {
    const gs = gameState; 

    if (gs.isDelegationModeActive && !gs.gameOver &&
        !gs.showEndOfTurnSummaryModal &&
        !gs.showEventModal &&
        !gs.showElectionModal &&
        !gs.showResetConfirmationModal) {

      makeAutomatedPolicyDecisions(); 

      const timerId = setTimeout(() => {
        calculateEndOfTurnSummary();
      }, 700); 
      return () => clearTimeout(timerId);
    }
  }, [
      gameState.isDelegationModeActive, gameState.currentTurnIdentifier, gameState.gameOver,
      gameState.showEndOfTurnSummaryModal, gameState.showEventModal,
      gameState.showElectionModal, gameState.showResetConfirmationModal,
      makeAutomatedPolicyDecisions 
  ]);


  const calculateEndOfTurnSummary = () => { 
    if (gameState.gameOver || gameState.showEventModal || gameState.showEndOfTurnSummaryModal) return;
    
    setPrevGameState(deepCopyGameState(gameState)); 

    const metricsBefore = deepCopyMetrics(gameState.metrics); 
    const pcBefore = gameState.politicalCapital;
    const approvalBefore = gameState.overallApproval;
    const turnIdentifierBefore = gameState.currentTurnIdentifier;

    let currentPoliticalCapital = gameState.politicalCapital;
    const newMetrics: { [id: string]: Metric } = deepCopyMetrics(gameState.metrics); 
    
    let stillActivePoliciesAfterUpkeep: Policy[] = [...gameState.activePolicies];
    let totalUpkeepCost = 0;
    
    const policiesWithUpkeep = stillActivePoliciesAfterUpkeep.filter(p => {
        const upkeepToApply = (p.level === 2 && p.upgradedUpkeep !== undefined) ? p.upgradedUpkeep : p.upkeep;
        return upkeepToApply && upkeepToApply > 0;
    });
    const policiesDeactivatedThisTurn: Policy[] = [];

    if (policiesWithUpkeep.length > 0) {
      totalUpkeepCost = policiesWithUpkeep.reduce((sum, p) => {
        const upkeepToApply = (p.level === 2 && p.upgradedUpkeep !== undefined) ? p.upgradedUpkeep : p.upkeep;
        return sum + (upkeepToApply || 0);
      }, 0);
      
      if (currentPoliticalCapital < totalUpkeepCost) {
        const sortedPoliciesToDeactivate = [...policiesWithUpkeep].sort((a,b) => {
            const upkeepA = (a.level === 2 && a.upgradedUpkeep !== undefined) ? a.upgradedUpkeep : a.upkeep;
            const upkeepB = (b.level === 2 && b.upgradedUpkeep !== undefined) ? b.upgradedUpkeep : b.upkeep;
            return (upkeepB || 0) - (upkeepA || 0);
        });
        
        for (const policyToConsider of sortedPoliciesToDeactivate) {
          const upkeepOfPolicy = (policyToConsider.level === 2 && policyToConsider.upgradedUpkeep !== undefined) ? policyToConsider.upgradedUpkeep : policyToConsider.upkeep;
          if (currentPoliticalCapital < totalUpkeepCost) { 
              totalUpkeepCost -= (upkeepOfPolicy || 0);
              policiesDeactivatedThisTurn.push(policyToConsider);
              stillActivePoliciesAfterUpkeep = stillActivePoliciesAfterUpkeep.filter(p => p.id !== policyToConsider.id);
          } else {
              break; 
          }
        }
      }
      currentPoliticalCapital = Math.max(0, currentPoliticalCapital - totalUpkeepCost);
    }
    
    let politicalCapitalGainFromEconomy = 1 + Math.floor(newMetrics.economy.value / 50); 
    let politicalCapitalEffectsFromPolicies = 0;
    const finalActivePoliciesForNextTurn: Policy[] = []; 
    const policiesExpiredThisTurn: Policy[] = [];

    stillActivePoliciesAfterUpkeep.forEach(p => {
        let policyRemainsActive = true;
        const effectsToApply = (p.level === 2 && p.upgradedEffects) ? p.upgradedEffects : p.effects;

        for (const metricId in effectsToApply) {
            if (newMetrics[metricId]) {
            newMetrics[metricId].value += effectsToApply[metricId];
            newMetrics[metricId].value = Math.max(0, Math.min(100, newMetrics[metricId].value));
            } else if (metricId === 'politicalCapital') {
            politicalCapitalEffectsFromPolicies += effectsToApply[metricId];
            }
        }

        const policyWithUpdatedDuration = {...p}; 

        if (policyWithUpdatedDuration.currentDuration !== undefined) {
            policyWithUpdatedDuration.currentDuration -= 1; 
            if (policyWithUpdatedDuration.currentDuration <= 0) {
                policiesExpiredThisTurn.push({...policyWithUpdatedDuration}); 
                policyRemainsActive = false;
            }
        }
        
        if (policyRemainsActive) {
            finalActivePoliciesForNextTurn.push(policyWithUpdatedDuration);
        }
    });
    
    currentPoliticalCapital += politicalCapitalGainFromEconomy + politicalCapitalEffectsFromPolicies;
    currentPoliticalCapital = Math.max(0, currentPoliticalCapital);

    const { updatedVoterGroups: voterGroupsAfterPolicies, overallApproval: approvalAfterPolicies } = calculateOverallApproval(newMetrics, gameState.voterGroups);
    let finalMetricsForSummary = newMetrics;
    let finalPcForSummary = currentPoliticalCapital;
    let finalApprovalForSummary = approvalAfterPolicies;
    let finalVoterGroupsForSummary = voterGroupsAfterPolicies;

    let triggeredEvent: MiniEvent | null = null;
    if (Math.random() < MINI_EVENT_CHANCE) {
      triggeredEvent = MINI_EVENTS[Math.floor(Math.random() * MINI_EVENTS.length)];
      if (triggeredEvent) {
        const metricsAfterEvent = deepCopyMetrics(newMetrics); 
        let pcAfterEvent = currentPoliticalCapital;

        if (triggeredEvent.effect.type === 'pc') {
          pcAfterEvent = Math.max(0, pcAfterEvent + triggeredEvent.effect.value);
        } else if (triggeredEvent.effect.type === 'metric' && triggeredEvent.effect.targetId && metricsAfterEvent[triggeredEvent.effect.targetId]) {
          metricsAfterEvent[triggeredEvent.effect.targetId].value += triggeredEvent.effect.value;
          metricsAfterEvent[triggeredEvent.effect.targetId].value = Math.max(0, Math.min(100, metricsAfterEvent[triggeredEvent.effect.targetId].value));
        }
        
        const { updatedVoterGroups: voterGroupsAfterEvent, overallApproval: approvalAfterEvent } = calculateOverallApproval(metricsAfterEvent, gameState.voterGroups); 
        
        finalMetricsForSummary = metricsAfterEvent;
        finalPcForSummary = pcAfterEvent;
        finalApprovalForSummary = approvalAfterEvent;
        finalVoterGroupsForSummary = voterGroupsAfterEvent; 
      }
    }
    
    const significantMetricChanges: EndOfTurnSummaryData['significantMetricChanges'] = [];
    Object.keys(finalMetricsForSummary).forEach(metricId => {
        const change = finalMetricsForSummary[metricId].value - metricsBefore[metricId].value;
        if (Math.abs(change) >= SIGNIFICANT_METRIC_CHANGE_THRESHOLD) {
            significantMetricChanges.push({
                metricName: finalMetricsForSummary[metricId].name,
                change: change,
                direction: change > 0 ? '증가' : '감소'
            });
        }
    });

     const summaryData: EndOfTurnSummaryData = {
        turnIdentifierBefore,
        metricsBefore,
        metricsAfter: finalMetricsForSummary, 
        pcBefore,
        pcAfter: finalPcForSummary,           
        approvalBefore,
        approvalAfter: finalApprovalForSummary, 
        policiesDeactivated: policiesDeactivatedThisTurn,
        policiesExpired: policiesExpiredThisTurn,
        eventTriggeredThisTurn: triggeredEvent,
        significantMetricChanges,
    };

    setGameState(prev => ({ 
        ...prev,
        endOfTurnSummaryData: summaryData,
        showEndOfTurnSummaryModal: true,
        voterGroups: finalVoterGroupsForSummary, 
    }));
  };

  const proceedToNextMonth = () => { 
    setGameState(prev => { 
        if (!prev.endOfTurnSummaryData) return prev;

        const {
          metricsAfter, 
          pcAfter,      
          policiesDeactivated,
          policiesExpired,
          eventTriggeredThisTurn,
          significantMetricChanges,
        } = prev.endOfTurnSummaryData;

        if (policiesDeactivated.length > 0) {
            const deactivatedNames = policiesDeactivated.map(p=>p.name).join(', ');
            if (!prev.isDelegationModeActive) showToast(`유지비 부족으로 다음 정책이 비활성화되었습니다: ${deactivatedNames}`, "warning");
            policiesDeactivated.forEach(p => addNewsItem(NEWS_HEADLINE_TEMPLATES.policyDeactivated(p.name), 'policy'));
        }
        if (policiesExpired.length > 0) {
            const expiredNames = policiesExpired.map(p=>p.name).join(', ');
            if (!prev.isDelegationModeActive) showToast(`다음 정책의 효과가 만료되었습니다: ${expiredNames}`, "info");
            policiesExpired.forEach(p => addNewsItem(NEWS_HEADLINE_TEMPLATES.policyExpired(p.name), 'policy'));
        }
        if (eventTriggeredThisTurn) {
            addNewsItem(NEWS_HEADLINE_TEMPLATES.eventOccurred(eventTriggeredThisTurn.title), 'event');
        }
        significantMetricChanges.forEach(change => {
            addNewsItem(NEWS_HEADLINE_TEMPLATES.metricChangeSignificant(change.metricName, change.direction, change.change), 'metric');
        });

        const activePoliciesForNextTurn: Policy[] = prev.activePolicies
          .map(p => {
              if (policiesDeactivated.some(dp => dp.id === p.id)) return null;
              
              const policyInstanceFromSummary = prev.endOfTurnSummaryData?.policiesExpired.find(ep => ep.id === p.id) 
                                                || prev.activePolicies.find(ap => ap.id === p.id);
              
              if (policyInstanceFromSummary?.currentDuration !== undefined && policyInstanceFromSummary.currentDuration <= 0) {
                return null; 
              }

              return policyInstanceFromSummary ? {...policyInstanceFromSummary} : null;
          })
          .filter(p => p !== null) as Policy[];

        const { overallApproval: finalOverallApproval, updatedVoterGroups: finalVoterGroups } = calculateOverallApproval(metricsAfter, prev.voterGroups); 

        let nextYear = prev.year;
        let nextMonth = prev.month + 1;
        if (nextMonth > 12) {
          nextMonth = 1;
          nextYear += 1;
        }
        const nextTurnIdentifier = generateTurnIdentifier(nextYear, nextMonth);
        
        let nextElectionCooldown = prev.electionCooldown - 1;
        let triggerElection = false;
        if (nextElectionCooldown <= 0) {
          triggerElection = true;
          nextElectionCooldown = ELECTION_INTERVAL_MONTHS; 
        }

        const newState: EnhancedGameState = {
          ...prev,
          year: nextYear,
          month: nextMonth,
          currentTurnIdentifier: nextTurnIdentifier,
          politicalCapital: pcAfter,
          metrics: metricsAfter, 
          activePolicies: activePoliciesForNextTurn, 
          overallApproval: finalOverallApproval, 
          voterGroups: finalVoterGroups, 
          electionUpcoming: triggerElection,
          electionCooldown: nextElectionCooldown,
          electionResult: null, 
          currentEvent: eventTriggeredThisTurn, 
          showEventModal: !!eventTriggeredThisTurn, 
          showEndOfTurnSummaryModal: false, 
          endOfTurnSummaryData: null, 
          totalMonthsRuled: (prev.totalMonthsRuled || 0) + 1,
        };
        
        const prevForAdvisor = prevGameState || prev; 
        newState.advisorMessage = _selectAdvisorMessageLogic(newState, prevForAdvisor);
        return newState;
    });
  };

  useEffect(() => {
    if (!gameState.showEndOfTurnSummaryModal && !gameState.showEventModal && !gameState.gameOver) {
        checkAndUnlockAchievements();
    }
  }, [gameState.currentTurnIdentifier, gameState.metrics, gameState.activePolicies, gameState.showEndOfTurnSummaryModal, gameState.showEventModal, gameState.gameOver, checkAndUnlockAchievements]);

  const calculateFinalScoreAndRank = (gs: EnhancedGameState): { score: number; rank: Rank | null; breakdown: ScoreBreakdownItem[]; totalMonths: number } => {
    const coreMetricIds = ['economy', 'happiness', 'environment', 'stability'];
    const coreMetricsSum = coreMetricIds.reduce((sum, id) => sum + (gs.metrics[id]?.value || 0), 0);
    const coreMetricsAvg = coreMetricIds.length > 0 ? coreMetricsSum / coreMetricIds.length : 0;

    const totalMonthsRuled = gs.totalMonthsRuled || ((gs.year - INITIAL_YEAR) * 12 + (gs.month - INITIAL_MONTH) + 1);
    const numAchievementsUnlocked = gs.achievements.filter(ach => ach.unlocked).length;

    const breakdown: ScoreBreakdownItem[] = [];

    const coreMetricsContribution = coreMetricsAvg * SCORING_WEIGHTS.coreMetricsAvg;
    breakdown.push({ label: '핵심 지표 평균', value: `${coreMetricsAvg.toFixed(1)} / 100`, contribution: coreMetricsContribution, rawValue: coreMetricsAvg });

    const pcContribution = gs.politicalCapital * SCORING_WEIGHTS.politicalCapital;
    breakdown.push({ label: '잔여 정치 자금', value: gs.politicalCapital, contribution: pcContribution, rawValue: gs.politicalCapital });
    
    const approvalContribution = gs.overallApproval * SCORING_WEIGHTS.overallApproval;
    breakdown.push({ label: '최종 전체 지지율', value: `${gs.overallApproval.toFixed(1)}%`, contribution: approvalContribution, rawValue: gs.overallApproval });

    const durationContribution = totalMonthsRuled * SCORING_WEIGHTS.durationMonths;
    breakdown.push({ label: '총 통치 기간 (개월)', value: totalMonthsRuled, contribution: durationContribution, rawValue: totalMonthsRuled });

    const achievementsContribution = numAchievementsUnlocked * SCORING_WEIGHTS.achievements;
    breakdown.push({ label: '달성 업적 수', value: `${numAchievementsUnlocked}개`, contribution: achievementsContribution, rawValue: numAchievementsUnlocked });

    const finalScore = breakdown.reduce((sum, item) => sum + item.contribution, 0);
    
    let achievedRank: Rank | null = null;
    for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
        if (finalScore >= RANK_TIERS[i].minScore) {
            achievedRank = RANK_TIERS[i];
            break;
        }
    }
    if (!achievedRank && RANK_TIERS.length > 0) { 
        achievedRank = RANK_TIERS[0];
    }

    return { score: Math.round(finalScore), rank: achievedRank, breakdown, totalMonths: totalMonthsRuled };
  };


  useEffect(() => {
    if (gameState.gameOver) return;

    let newGameOver = false;
    let newGameOverMessage = "";

    if (gameState.politicalCapital <= 0 && gameState.activePolicies.some(p => {
        const upkeepToApply = (p.level === 2 && p.upgradedUpkeep !== undefined) ? p.upgradedUpkeep : p.upkeep;
        return upkeepToApply && upkeepToApply > 0;
    }) && (gameState.year > INITIAL_YEAR || (gameState.year === INITIAL_YEAR && gameState.month > INITIAL_MONTH))) { 
        newGameOver = true;
        newGameOverMessage = "정치적 파산! 정책 유지 자금 부족으로 정부가 붕괴했습니다.";
    }

     if (gameState.metrics.stability.value < 10) {
      newGameOver = true;
      newGameOverMessage = "국가 위기! 극심한 불안정으로 인한 광범위한 소요와 혼란.";
    } else if (gameState.metrics.happiness.value < 10) {
      newGameOver = true;
      newGameOverMessage = "불행 만연! 국민들이 완전히 낙담하여 당신은 몰락했습니다.";
    } else if (gameState.overallApproval < 20 && (gameState.year > INITIAL_YEAR || (gameState.year === INITIAL_YEAR && gameState.month > (INITIAL_MONTH + 6)))) { 
      newGameOver = true;
      newGameOverMessage = "국민적 항의! 지지율 급락으로 사임하게 되었습니다.";
    }

    if (newGameOver) {
      const scoreResults = calculateFinalScoreAndRank(gameState);
      setGameState(prev => ({ 
        ...prev, 
        gameOver: true, 
        gameOverMessage: newGameOverMessage, 
        showEventModal: false, 
        currentEvent: null,
        showEndOfTurnSummaryModal: false,
        endOfTurnSummaryData: null,
        finalScore: scoreResults.score,
        finalRank: scoreResults.rank,
        scoreBreakdown: scoreResults.breakdown,
        totalMonthsRuled: scoreResults.totalMonths,
        isDelegationModeActive: false, 
      }));
    }
  }, [gameState.politicalCapital, gameState.metrics.stability.value, gameState.metrics.happiness.value, gameState.year, gameState.month, gameState.overallApproval, gameState.gameOver, gameState.activePolicies]);


  useEffect(() => {
    if (gameState.electionUpcoming && !gameState.gameOver && !gameState.showEventModal && !gameState.showEndOfTurnSummaryModal) {
      setGameState(prev => ({...prev, showElectionModal: true})); 
      let resultMessage = "";
      if (gameState.overallApproval >= 50) {
        resultMessage = `축하합니다! ${gameState.overallApproval.toFixed(1)}%의 지지율로 선거에서 승리하여 다음 임기를 확보했습니다! 국민들이 당신의 리더십을 신뢰합니다. (정치 자금 +20)`;
        addNewsItem(NEWS_HEADLINE_TEMPLATES.electionWin(gameState.currentTurnIdentifier, gameState.overallApproval), 'election');
        setGameState(prev => ({
            ...prev, 
            politicalCapital: prev.politicalCapital + 20, 
            electionUpcoming: false, 
            electionResult: resultMessage,
            // showElectionModal will be set by the effect triggering this, or ensure it's true if needed
        }));
        if (!gameState.isDelegationModeActive) showToast("선거 승리!", "success");
      } else {
        resultMessage = `선거 결과가 나왔습니다. 단 ${gameState.overallApproval.toFixed(1)}%의 지지율로 선거에서 패배했습니다. 당신의 임기는 여기서 끝납니다. 심폴리의 새 시대가 열립니다.`;
        addNewsItem(NEWS_HEADLINE_TEMPLATES.electionLoss(gameState.currentTurnIdentifier, gameState.overallApproval), 'election');
        const scoreResults = calculateFinalScoreAndRank(gameState);
        setGameState(prev => ({
            ...prev, 
            gameOver: true, 
            gameOverMessage: resultMessage, 
            electionUpcoming: false, 
            electionResult: resultMessage,
            finalScore: scoreResults.score,
            finalRank: scoreResults.rank,
            scoreBreakdown: scoreResults.breakdown,
            totalMonthsRuled: scoreResults.totalMonths,
            isDelegationModeActive: false,
        }));
      }
    }
  }, [gameState.electionUpcoming, gameState.gameOver, gameState.overallApproval, gameState.showEventModal, gameState.showEndOfTurnSummaryModal, addNewsItem, gameState.currentTurnIdentifier, gameState.isDelegationModeActive]);

  const deepCopyGameState = (gs: EnhancedGameState): EnhancedGameState => {
    return {
        ...gs,
        metrics: deepCopyMetrics(gs.metrics),
        activePolicies: gs.activePolicies.map(p => ({...p})),
        availablePolicies: gs.availablePolicies.map(p => ({...p})),
        voterGroups: gs.voterGroups.map(vg => ({...vg})),
        newsItems: gs.newsItems.map(ni => ({...ni})),
        achievements: gs.achievements.map(ac => ({...ac})),
        endOfTurnSummaryData: gs.endOfTurnSummaryData ? {...gs.endOfTurnSummaryData, metricsBefore: deepCopyMetrics(gs.endOfTurnSummaryData.metricsBefore), metricsAfter: deepCopyMetrics(gs.endOfTurnSummaryData.metricsAfter)} : null,
        currentEvent: gs.currentEvent ? {...gs.currentEvent} : null,
        toastNotification: gs.toastNotification ? {...gs.toastNotification} : null,
        finalRank: gs.finalRank ? {...gs.finalRank, icon: gs.finalRank.icon} : null, 
        scoreBreakdown: gs.scoreBreakdown ? gs.scoreBreakdown.map(item => ({...item})) : undefined,
    };
  };

  const restartGame = () => {
    const initialMetrics = getInitialMetrics();
    const initialVoterGroups = getInitialVoterGroups();
    const initialAvailablePolicies = getInitialAvailablePolicies(); 
    const initialAchievements = getInitialAchievements();
    const initialTurnIdentifier = generateTurnIdentifier(INITIAL_YEAR, INITIAL_MONTH);
    
    const initialNews: NewsItem[] = [{
        id: Date.now().toString(),
        text: NEWS_HEADLINE_TEMPLATES.gameStart(initialTurnIdentifier),
        turnIdentifier: initialTurnIdentifier,
        type: 'general'
    }];
    
    const { updatedVoterGroups, overallApproval } = _calculateOverallApprovalLogic(initialMetrics, initialVoterGroups);

    const tempGameState: EnhancedGameState = {
        year: INITIAL_YEAR,
        month: INITIAL_MONTH,
        currentTurnIdentifier: initialTurnIdentifier,
        politicalCapital: INITIAL_POLITICAL_CAPITAL,
        metrics: initialMetrics,
        activePolicies: [],
        availablePolicies: initialAvailablePolicies,
        newsItems: initialNews,
        advisorMessage: "", 
        gameOver: false,
        gameOverMessage: "",
        voterGroups: updatedVoterGroups,
        overallApproval: overallApproval,
        electionUpcoming: false,
        electionCooldown: ELECTION_INTERVAL_MONTHS,
        electionResult: null,
        toastNotification: null,
        currentEvent: null,
        showEventModal: false,
        showEndOfTurnSummaryModal: false,
        endOfTurnSummaryData: null,
        achievements: initialAchievements,
        finalScore: undefined,
        finalRank: undefined,
        scoreBreakdown: undefined,
        totalMonthsRuled: 0,
        isDelegationModeActive: false,
        showElectionModal: false,
        showResetConfirmationModal: false,
    };
    tempGameState.advisorMessage = _selectAdvisorMessageLogic(tempGameState);

    setGameState(tempGameState); 
    setPrevGameState(undefined);
  };

  const handleRequestResetGame = () => {
    setGameState(prev => ({...prev, showResetConfirmationModal: true }));
  };

  const confirmResetGame = () => {
    setGameState(prev => ({...prev, showResetConfirmationModal: false }));
    restartGame();
  };

  const cancelResetGame = () => {
    setGameState(prev => ({...prev, showResetConfirmationModal: false }));
  };

  const toggleDelegationMode = () => {
    setGameState(prev => ({
      ...prev,
      isDelegationModeActive: !prev.isDelegationModeActive
    }));
    showToast(`위임 모드가 ${!gameState.isDelegationModeActive ? '활성화' : '비활성화'}되었습니다.`, 'info');
  };


  const closeEventModal = () => {
    setGameState(prev => ({...prev, showEventModal: false, currentEvent: null}));
  }
  
  const closeElectionModal = () => {
    setGameState(prev => ({...prev, showElectionModal: false}));
  };

  const renderGameOverContent = () => {
    const ruledYears = Math.floor((gameState.totalMonthsRuled || 0) / 12);
    const ruledMonths = (gameState.totalMonthsRuled || 0) % 12;

    return (
        <div className="text-gray-300">
            <p className="mb-3 text-lg">{gameState.gameOverMessage || gameState.electionResult}</p>
            
            {gameState.totalMonthsRuled !== undefined && (
                 <p className="mb-3 text-md">총 통치 기간: <span className="font-semibold text-sky-300">{ruledYears}년 {ruledMonths}개월</span></p>
            )}

            {gameState.finalRank && (
                <div className="my-4 p-3 bg-gray-700 rounded-lg text-center">
                    <div className="flex items-center justify-center mb-2">
                        {React.cloneElement(gameState.finalRank.icon as React.ReactElement<{ className?: string }>, { className: "w-8 h-8 mr-2" })}
                        <h3 className="text-xl font-semibold text-yellow-400">달성 칭호: {gameState.finalRank.title}</h3>
                    </div>
                    <p className="text-sm text-gray-400 italic">"{gameState.finalRank.description}"</p>
                </div>
            )}

            {gameState.finalScore !== undefined && (
                <p className="mb-2 text-2xl font-bold text-center">최종 점수: <span className="text-green-400">{gameState.finalScore}점</span></p>
            )}

            {gameState.scoreBreakdown && gameState.scoreBreakdown.length > 0 && (
                <details className="mt-4 mb-6 bg-gray-750 rounded group">
                    <summary className="text-md font-semibold text-indigo-300 cursor-pointer p-2 hover:bg-gray-700 list-none flex justify-between items-center">
                        점수 상세 내역
                        <span className="text-gray-400 group-open:rotate-90 transform transition-transform duration-200">▶</span>
                    </summary>
                    <ul className="p-3 space-y-1 text-sm">
                        {gameState.scoreBreakdown.map(item => (
                            <li key={item.label} className="flex justify-between">
                                <span>{item.label} (값: {item.value}):</span>
                                <span className="font-semibold">{item.contribution.toFixed(0)}점</span>
                            </li>
                        ))}
                    </ul>
                </details>
            )}

            <button
                onClick={() => {
                    if (gameState.electionResult && gameState.gameOver) {
                        setGameState(prev => ({...prev, showElectionModal: false}));
                    }
                    restartGame();
                }}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-4 rounded-md transition-colors mt-4 text-lg"
            >
                새 게임 시작
            </button>
        </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 bg-gradient-to-br from-gray-900 to-slate-800">
      <Header year={gameState.year} month={gameState.month} politicalCapital={gameState.politicalCapital} overallApproval={gameState.overallApproval} />
      
      {!gameState.showEventModal && !gameState.showEndOfTurnSummaryModal && (
        <div className="container mx-auto max-w-7xl mt-4 mb-4 flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          <div>
            <button
              onClick={handleRequestResetGame}
              className="bg-red-700 hover:bg-red-800 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center text-sm sm:text-base"
              aria-label="게임 초기화"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              초기화
            </button>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={toggleDelegationMode}
              className={`${
                gameState.isDelegationModeActive ? 'bg-sky-600 hover:bg-sky-700' : 'bg-gray-600 hover:bg-gray-700'
              } text-white font-semibold py-2 px-3 sm:px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center text-sm sm:text-base`}
              aria-label="위임 모드 토글"
            >
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09l2.846.813-.813 2.846a4.5 4.5 0 0 0-3.09 3.09ZM18.25 7.5l.813-2.846L21.904 9l-2.846.813a4.5 4.5 0 0 0-3.09 3.09L15 15.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L7.25 9l2.846-.813A4.5 4.5 0 0 0 13.19 5.097L15 2.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L21.904 9l-2.846.813a4.5 4.5 0 0 0-3.09 3.09L15 15.75l-.813-2.846A4.5 4.5 0 0 0 11.096 9.813L9.004 9l2.092-.813a4.5 4.5 0 0 0 3.09-3.09L15 2.25Z" />
              </svg>
              위임: {gameState.isDelegationModeActive ? 'ON' : 'OFF'}
            </button>
            {!gameState.gameOver && (
              <button
                onClick={calculateEndOfTurnSummary}
                disabled={gameState.isDelegationModeActive || gameState.electionUpcoming || gameState.showElectionModal || gameState.gameOver}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 sm:px-6 rounded-lg text-sm sm:text-md shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                턴 종료
              </button>
            )}
          </div>
        </div>
      )}

      {gameState.toastNotification && (
        <ToastNotification
          {...gameState.toastNotification} 
          onClose={() => setGameState(prev => ({ ...prev, toastNotification: null }))}
        />
      )}

      <div className="flex-grow container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <StaticNewsFeed newsItems={gameState.newsItems} />
          </div>
          <div>
            <StaticAdvisor message={gameState.advisorMessage} />
          </div>
        </div>

        <MetricsDisplay metrics={gameState.metrics} voterGroups={gameState.voterGroups} />
        
        <AchievementsDisplay achievements={gameState.achievements} />

        {!gameState.gameOver && !gameState.showEventModal && !gameState.showEndOfTurnSummaryModal && (
          <PolicyGraphDisplay
            activePolicies={gameState.activePolicies}
            onEnactPolicy={enactPolicy}
            onUpgradePolicy={upgradePolicy}
            politicalCapital={gameState.politicalCapital}
            metrics={gameState.metrics}
          />
        )}
      </div>

      {gameState.showEndOfTurnSummaryModal && gameState.endOfTurnSummaryData && (
        <EndOfTurnSummaryModal
          isOpen={gameState.showEndOfTurnSummaryModal}
          summaryData={gameState.endOfTurnSummaryData}
          onClose={proceedToNextMonth} 
          isDelegationModeActive={gameState.isDelegationModeActive}
          onToggleDelegationMode={toggleDelegationMode}
        />
      )}

      <Modal 
        isOpen={gameState.gameOver && !!(gameState.gameOverMessage || gameState.electionResult)} 
        onClose={() => { 
            if (gameState.electionResult && gameState.gameOver) { 
                 setGameState(prev => ({...prev, showElectionModal: false}));
            }
            restartGame(); 
        }} 
        title={gameState.electionResult && gameState.gameOver ? "선거 패배" : "게임 오버"}
      >
        {renderGameOverContent()}
      </Modal>

       <Modal 
         isOpen={gameState.showElectionModal && !gameState.gameOver && !!gameState.electionResult} 
         onClose={closeElectionModal} 
         title="선거 결과"
         isDelegationModeActive={gameState.isDelegationModeActive && !gameState.gameOver} 
         autoCloseDelay={DELEGATION_MODAL_AUTOCLOSE_DELAY}
       >
         <p className="text-gray-300 mb-6">{gameState.electionResult}</p>
         {!gameState.isDelegationModeActive && (
            <button
                onClick={closeElectionModal}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
            >
                확인 및 계속
            </button>
         )}
      </Modal>

      {gameState.showEventModal && gameState.currentEvent && !gameState.showEndOfTurnSummaryModal && ( 
        <Modal
          isOpen={gameState.showEventModal}
          onClose={closeEventModal}
          title={gameState.currentEvent.title}
          isDelegationModeActive={gameState.isDelegationModeActive}
          autoCloseDelay={DELEGATION_MODAL_AUTOCLOSE_DELAY}
        >
          <p className="text-gray-300 mb-6">{gameState.currentEvent.description}</p>
          <p className="text-sm text-sky-300 mb-4">
            효과: {gameState.currentEvent.effect.type === 'pc' ? '정치 자금' : gameState.metrics[gameState.currentEvent.effect.targetId || '']?.name}
            {gameState.currentEvent.effect.value > 0 ? ' +' : ' '}{gameState.currentEvent.effect.value}
          </p>
          {!gameState.isDelegationModeActive && (
            <button
                onClick={closeEventModal}
                className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
            >
                확인
            </button>
          )}
        </Modal>
      )}

      <Modal
        isOpen={gameState.showResetConfirmationModal}
        onClose={cancelResetGame}
        title="게임 초기화 경고"
      >
        <p className="text-gray-300 mb-6">정말로 현재 게임 진행 상황을 모두 초기화하고 새 게임을 시작하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={cancelResetGame}
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
          >
            취소
          </button>
          <button
            onClick={confirmResetGame}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
          >
            초기화 확인
          </button>
        </div>
      </Modal>


      <footer className="text-center text-gray-500 mt-12 pb-4 text-sm">
        <p>&copy; {new Date().getFullYear()} 민주주의4.0 Lite. 복잡한 전략 게임에서 영감을 받아 웹용으로 단순화되었습니다.</p>
        <p>React, Tailwind CSS 기반으로 제작되었습니다.</p>
      </footer>
    </div>
  );
};

export default App;
