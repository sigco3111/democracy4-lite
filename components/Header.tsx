
import React from 'react';

interface HeaderProps {
  year: number;
  month: number; // Added month
  politicalCapital: number;
  overallApproval: number;
}

const Header: React.FC<HeaderProps> = ({ year, month, politicalCapital, overallApproval }) => {
  const approvalColor = overallApproval > 70 ? 'text-green-400' : overallApproval > 40 ? 'text-yellow-400' : 'text-red-400';

  return (
    <header className="bg-gray-800 shadow-lg p-4 rounded-lg mb-6">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
        <h1 className="text-3xl font-bold text-indigo-400 mb-2 sm:mb-0">민주주의4.0 Lite</h1>
        <div className="flex flex-wrap justify-center sm:justify-end space-x-4 text-lg">
          <span className="whitespace-nowrap">시점: <span className="font-semibold text-sky-300">{year}년 {String(month).padStart(2, '0')}월</span></span>
          <span className="whitespace-nowrap">정치 자금: <span className="font-semibold text-amber-400">{politicalCapital}</span></span>
          <span className="whitespace-nowrap">전체 지지율: <span className={`font-semibold ${approvalColor}`}>{overallApproval.toFixed(1)}%</span></span>
        </div>
      </div>
    </header>
  );
};

export default Header;