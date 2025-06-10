
import React, { useState, useEffect, useRef } from 'react';
import type { EndOfTurnSummaryData, Metric } from '../types';
import { generateTurnIdentifier, DELEGATION_MODAL_AUTOCLOSE_DELAY } from '../constants'; // For next turn display

interface EndOfTurnSummaryModalProps {
  isOpen: boolean;
  onClose: () => void; 
  summaryData: EndOfTurnSummaryData;
  isDelegationModeActive?: boolean;
  onToggleDelegationMode?: () => void;
}

const BarChart: React.FC<{
  label: string;
  valueBefore: number;
  valueAfter: number;
  icon?: React.ReactNode;
  isPercentage?: boolean;
  maxValue?: number;
}> = ({ label, valueBefore, valueAfter, icon, isPercentage = false, maxValue = 100 }) => {
  const diff = valueAfter - valueBefore;
  const diffColor = diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-gray-400';
  const barMaxHeight = 80; // px

  const [animatedHeightBefore, setAnimatedHeightBefore] = useState(0);
  const [animatedHeightAfter, setAnimatedHeightAfter] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  const getBarHeight = (value: number) => {
    if (maxValue === 0) return 0; 
    return Math.max(0, Math.min(barMaxHeight, (value / maxValue) * barMaxHeight));
  };
  
  const valueSuffix = isPercentage ? '%' : '';

  useEffect(() => {
    if (!hasAnimated) {
        const timer = setTimeout(() => {
            setAnimatedHeightBefore(getBarHeight(valueBefore));
            setAnimatedHeightAfter(getBarHeight(valueAfter));
            setHasAnimated(true); 
        }, 100); 
        return () => clearTimeout(timer);
    } else {
        setAnimatedHeightBefore(getBarHeight(valueBefore));
        setAnimatedHeightAfter(getBarHeight(valueAfter));
    }
  }, [valueBefore, valueAfter, maxValue, hasAnimated]); 

  useEffect(() => {
    setHasAnimated(false);
  }, [label]);


  return (
    <div className="p-3 bg-gray-700 rounded-lg shadow">
      <div className="flex items-center mb-2">
        {icon && <span className="mr-2">{icon}</span>}
        <h4 className="text-md font-semibold text-sky-200">{label}</h4>
      </div>
      <div className="flex items-end justify-around h-[100px] mb-1">
        <div className="text-center w-2/5">
          <div
            className="bg-blue-500 mx-auto rounded-t-sm transition-all duration-500 ease-out"
            style={{ height: `${animatedHeightBefore}px`, width: '60%' }}
            title={`이전: ${valueBefore.toFixed(1)}${valueSuffix}`}
          ></div>
          <p className="text-xs text-gray-300 mt-1">{valueBefore.toFixed(1)}{valueSuffix}</p>
           <p className="text-xs text-gray-500">이전</p>
        </div>
        <div className="text-center w-2/5">
          <div
            className={`mx-auto rounded-t-sm transition-all duration-500 ease-out ${diff >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
            style={{ height: `${animatedHeightAfter}px`, width: '60%' }}
            title={`이후: ${valueAfter.toFixed(1)}${valueSuffix}`}
          ></div>
          <p className="text-xs text-gray-300 mt-1">{valueAfter.toFixed(1)}{valueSuffix}</p>
           <p className="text-xs text-gray-500">이후</p>
        </div>
      </div>
       <p className={`text-center text-sm font-semibold ${diffColor} mt-2`}>
        변화: {diff > 0 ? '+' : ''}{diff.toFixed(1)}{valueSuffix}
      </p>
    </div>
  );
};


const EndOfTurnSummaryModal: React.FC<EndOfTurnSummaryModalProps> = ({ 
    isOpen, 
    onClose, 
    summaryData, 
    isDelegationModeActive,
    onToggleDelegationMode 
}) => {
  useEffect(() => {
    let timerId: number | undefined;
    if (isOpen && isDelegationModeActive) {
      timerId = window.setTimeout(() => {
        if (isDelegationModeActive) { 
            onClose();
        }
      }, DELEGATION_MODAL_AUTOCLOSE_DELAY);
    }
    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [isOpen, isDelegationModeActive, onClose]);

  if (!isOpen) return null;

  const {
    turnIdentifierBefore,
    metricsBefore,
    metricsAfter,
    pcBefore,
    pcAfter,
    approvalBefore,
    approvalAfter,
    policiesDeactivated,
    policiesExpired,
    eventTriggeredThisTurn,
  } = summaryData;

  const mainMetricIds = ['economy', 'happiness', 'environment', 'stability'];

  const [currentYear, currentMonthStr] = turnIdentifierBefore.split('-');
  const currentMonthNum = parseInt(currentMonthStr, 10);
  let nextMonthNum = currentMonthNum + 1;
  let nextYearNum = parseInt(currentYear, 10);
  if (nextMonthNum > 12) {
    nextMonthNum = 1;
    nextYearNum += 1;
  }
  const nextTurnIdentifierDisplay = generateTurnIdentifier(nextYearNum, nextMonthNum);


  return (
    <div className="fixed inset-0 bg-black bg-opacity-85 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl max-w-3xl w-full mx-auto max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-indigo-400">{turnIdentifierBefore} 보고서 {isDelegationModeActive && <span className="text-sm text-yellow-400">(자동 진행 중...)</span>}</h2>
          <div className="flex items-center space-x-2">
            {onToggleDelegationMode && (
                <button
                    onClick={onToggleDelegationMode}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-md font-semibold transition-colors text-white
                        ${isDelegationModeActive ? 'bg-red-600 hover:bg-red-700' : 'bg-sky-500 hover:bg-sky-600'}`}
                    aria-label={isDelegationModeActive ? "위임 중지" : "위임 시작"}
                >
                    {isDelegationModeActive ? '위임 중지' : '위임 시작'}
                </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 transition-colors text-2xl sm:text-3xl"
              aria-label="모달 닫고 다음 달로 진행"
              disabled={isDelegationModeActive} 
            >
              &times;
            </button>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-sky-300 mb-2">주요 지표 변화</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {mainMetricIds.map(id => (
                <BarChart
                  key={`metric-${id}-${turnIdentifierBefore}`} 
                  label={metricsBefore[id]?.name || id}
                  valueBefore={metricsBefore[id]?.value || 0}
                  valueAfter={metricsAfter[id]?.value || 0}
                  icon={metricsBefore[id]?.icon}
                  maxValue={100}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <BarChart
              key={`pc-${turnIdentifierBefore}`} 
              label="정치 자금"
              valueBefore={pcBefore}
              valueAfter={pcAfter}
              icon={<span className="text-amber-400">💰</span>}
              maxValue={Math.max(200, pcBefore, pcAfter)} 
            />
            <BarChart
              key={`approval-${turnIdentifierBefore}`} 
              label="전체 지지율"
              valueBefore={approvalBefore}
              valueAfter={approvalAfter}
              icon={<span className="text-pink-400">📊</span>}
              isPercentage
              maxValue={100}
            />
          </div>
          
          {(policiesDeactivated.length > 0 || policiesExpired.length > 0) && (
            <div>
              <h3 className="text-lg font-semibold text-sky-300 mb-2">정책 변경 사항</h3>
              <div className="bg-gray-700 p-3 rounded-lg text-sm">
                {policiesDeactivated.length > 0 && (
                  <div className="mb-2">
                    <p className="text-orange-400 font-medium">유지비 부족으로 비활성화된 정책:</p>
                    <ul className="list-disc list-inside ml-4 text-gray-300">
                      {policiesDeactivated.map(p => <li key={`deact-${p.id}`}>{p.name} ({ (p.level === 2 && p.upgradedUpkeep !== undefined) ? p.upgradedUpkeep : p.upkeep} PC/월)</li>)}
                    </ul>
                  </div>
                )}
                {policiesExpired.length > 0 && (
                  <div>
                    <p className="text-yellow-400 font-medium">효과가 만료된 정책:</p>
                    <ul className="list-disc list-inside ml-4 text-gray-300">
                      {policiesExpired.map(p => <li key={`exp-${p.id}`}>{p.name}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {eventTriggeredThisTurn && (
            <div>
              <h3 className="text-lg font-semibold text-sky-300 mb-2">특별 발생 이벤트</h3>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="font-semibold text-teal-300">{eventTriggeredThisTurn.title}</p>
                <p className="text-sm text-gray-300 mt-1">{eventTriggeredThisTurn.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                    (효과: {eventTriggeredThisTurn.effect.type === 'pc' ? '정치 자금' : metricsAfter[eventTriggeredThisTurn.effect.targetId || '']?.name || '특정 지표'}
                    {eventTriggeredThisTurn.effect.value > 0 ? ' +' : ' '}{eventTriggeredThisTurn.effect.value})
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row justify-end items-center space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
            {!isDelegationModeActive && (
              <button
                onClick={onClose} 
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                다음 달 ({nextTurnIdentifierDisplay})로 진행
              </button>
            )}
             {isDelegationModeActive && (
                 <p className="text-sm text-gray-400 w-full sm:w-auto text-center sm:text-right">
                    자동으로 다음 달로 진행됩니다...
                 </p>
             )}
        </div>

      </div>
    </div>
  );
};

export default EndOfTurnSummaryModal;
