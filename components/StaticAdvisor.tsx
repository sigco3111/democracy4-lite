
import React from 'react';

interface StaticAdvisorProps {
  message: string;
}

const AdvisorIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-3 text-yellow-300 flex-shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.355a7.5 7.5 0 0 1-7.5 0M12 6.75A2.25 2.25 0 0 1 14.25 9v1.006A2.25 2.25 0 0 0 12 12.25a2.25 2.25 0 0 0-2.25-2.244V9A2.25 2.25 0 0 1 12 6.75ZM12 6.75a2.25 2.25 0 0 0-2.25-2.25H9.75a.375.375 0 0 1-.375-.375V3.75a.375.375 0 0 1 .375-.375h4.5a.375.375 0 0 1 .375.375v.375a.375.375 0 0 1-.375.375H14.25a2.25 2.25 0 0 0-2.25 2.25Z" />
  </svg>
);


const StaticAdvisor: React.FC<StaticAdvisorProps> = ({ message }) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg h-full">
      <h2 className="text-xl font-semibold text-indigo-300 mb-3 flex items-center">
        <AdvisorIcon />
        조언가 브리핑
      </h2>
      <div className="bg-gray-700 p-3 rounded-md min-h-[100px] flex items-center">
        <p className="text-gray-300 italic leading-relaxed text-sm">
          {message || "조언가가 현재 상황을 분석하고 있습니다..."}
        </p>
      </div>
    </div>
  );
};

export default StaticAdvisor;
