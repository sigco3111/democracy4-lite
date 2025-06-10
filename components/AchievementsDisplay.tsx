
import React from 'react';
import type { Achievement } from '../types';

interface AchievementsDisplayProps {
  achievements: Achievement[];
}

const TrophyIconPanel = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2 text-yellow-400"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-4.5A3.375 3.375 0 0 0 12.75 9.75H11.25A3.375 3.375 0 0 0 7.5 13.5v4.5m4.5-4.5V6.75M7.5 16.5h9" /></svg>;

const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-500"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>;
const UnlockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-green-400"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 10.5a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25h16.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75Z" /></svg>;


const AchievementCard: React.FC<{ achievement: Achievement }> = ({ achievement }) => {
  return (
    <div className={`p-3 rounded-lg shadow transition-all duration-300 flex items-start space-x-3 ${achievement.unlocked ? 'bg-gray-700' : 'bg-gray-800 opacity-60'}`}>
      <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full ${achievement.unlocked ? 'bg-yellow-500' : 'bg-gray-600'}`}>
        {achievement.icon ?
            React.cloneElement(achievement.icon as React.ReactElement<{ className?: string }>, { className: `w-5 h-5 ${achievement.unlocked ? 'text-white': 'text-gray-400'}`})
            : <TrophyIconPanel />
        }
      </div>
      <div>
        <h4 className={`font-semibold ${achievement.unlocked ? 'text-sky-300' : 'text-gray-400'}`}>{achievement.name}</h4>
        <p className={`text-xs ${achievement.unlocked ? 'text-gray-300' : 'text-gray-500'}`}>{achievement.description}</p>
        {achievement.unlocked && <p className="text-xs text-green-400 mt-1 font-medium">달성 완료!</p>}
      </div>
      <div className="ml-auto flex-shrink-0 self-center">
        {achievement.unlocked ? <UnlockIcon /> : <LockIcon />}
      </div>
    </div>
  );
};

const AchievementsDisplay: React.FC<AchievementsDisplayProps> = ({ achievements }) => {
  const unlockedCount = achievements.filter(ach => ach.unlocked).length;
  const totalCount = achievements.length;

  return (
    <div className="mb-6">
      <details className="bg-gray-750 rounded-lg group" open> {/* Added 'open' attribute */}
        <summary
          className="text-xl font-semibold text-indigo-300 cursor-pointer p-3 hover:bg-gray-700 rounded-md list-none flex justify-between items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-expanded="true" // Changed to true
          aria-controls="achievements-panel"
        >
          <div className="flex items-center">
            <TrophyIconPanel />
            <span className="ml-1">업적 현황</span>
            <span className="ml-2 text-sm text-gray-400">({unlockedCount}/{totalCount} 달성)</span>
          </div>
          <span className="text-gray-400 group-open:rotate-90 transform transition-transform duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </span>
        </summary>
        <div id="achievements-panel" className="p-3 pt-2">
          {achievements.length === 0 ? (
            <p className="text-gray-400">정의된 업적이 없습니다.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {achievements.map(ach => (
                <AchievementCard key={ach.id} achievement={ach} />
              ))}
            </div>
          )}
        </div>
      </details>
    </div>
  );
};

export default AchievementsDisplay;