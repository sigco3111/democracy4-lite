
import React from 'react';
import type { Metric, VoterGroup } from '../types';

interface MetricsDisplayProps {
  metrics: { [id: string]: Metric };
  voterGroups: VoterGroup[];
}

const MetricCard: React.FC<{ metric: Metric }> = ({ metric }) => {
  const valueColor = metric.value > 70 ? 'text-green-400' : metric.value > 40 ? 'text-yellow-400' : 'text-red-400';
  const progressBarColor = metric.value > 70 ? 'bg-green-500' : metric.value > 40 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="bg-gray-700 p-4 rounded-lg shadow hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center mb-2">
        {metric.icon}
        <h3 className="text-lg font-semibold ml-2">{metric.name}</h3>
      </div>
      <p className={`text-3xl font-bold ${valueColor} mb-1`}>{metric.value.toFixed(1)}</p>
      <div className="w-full bg-gray-600 rounded-full h-2.5 mb-2">
        <div className={progressBarColor} style={{ width: `${Math.max(0, Math.min(100, metric.value))}%`, height: '100%', borderRadius: 'inherit' }}></div>
      </div>
      <p className="text-xs text-gray-400">{metric.description}</p>
    </div>
  );
};

const VoterGroupCard: React.FC<{ group: VoterGroup }> = ({ group }) => {
    const approvalColor = group.approval > 70 ? 'text-green-400' : group.approval > 40 ? 'text-yellow-400' : 'text-red-400';
    const progressBarColor = group.approval > 70 ? 'bg-green-500' : group.approval > 40 ? 'bg-yellow-500' : 'bg-red-500';

    return (
        <div className="bg-gray-700 p-3 rounded-lg shadow">
            <div className="flex items-center mb-1">
                {group.icon}
                <h4 className="text-md font-semibold ml-2">{group.name}</h4>
            </div>
            <p className={`text-xl font-bold ${approvalColor} mb-1`}>{group.approval.toFixed(1)}%</p>
            <div className="w-full bg-gray-600 rounded-full h-2 mb-1">
                <div className={progressBarColor} style={{ width: `${Math.max(0, Math.min(100, group.approval))}%`, height: '100%', borderRadius: 'inherit' }}></div>
            </div>
            <p className="text-xs text-gray-400">인구: {(group.populationPercentage * 100).toFixed(0)}%</p>
        </div>
    );
};


const MetricsDisplay: React.FC<MetricsDisplayProps> = ({ metrics, voterGroups }) => {
  const mainMetrics = ['economy', 'happiness', 'environment', 'stability'];
  const secondaryMetrics = ['education', 'healthcare'];


  return (
    <div className="mb-6">
      <h2 className="text-2xl font-semibold mb-4 text-indigo-300">국가 현황</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {mainMetrics.map(id => metrics[id] && <MetricCard key={id} metric={metrics[id]} />)}
      </div>
      
      <details className="bg-gray-750 rounded-lg group" open> {/* Added 'group' for details[open] selector and 'open' attribute */}
        <summary 
          className="text-xl font-semibold text-indigo-300 cursor-pointer p-3 hover:bg-gray-700 rounded-md list-none flex justify-between items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-expanded="true" // Changed to true
          aria-controls="secondary-info-panel"
        >
          보조 지표 및 유권자 그룹
          <span className="text-gray-400 group-open:rotate-90 transform transition-transform duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </span>
        </summary>
        <div id="secondary-info-panel" className="p-3 pt-0"> {/* pt-0 to avoid double padding */}
            <h3 className="text-lg font-semibold my-3 text-sky-300">보조 지표</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {secondaryMetrics.map(id => metrics[id] && <MetricCard key={id} metric={metrics[id]} />)}
            </div>
            <h3 className="text-lg font-semibold my-3 text-sky-300">유권자 그룹 지지율</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {voterGroups.map(group => <VoterGroupCard key={group.id} group={group} />)}
            </div>
        </div>
      </details>
    </div>
  );
};

export default MetricsDisplay;