
import React from 'react';
import type { NewsItem } from '../types';

interface StaticNewsFeedProps {
  newsItems: NewsItem[];
}

const NewsIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3 text-gray-400 flex-shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25H5.625a2.25 2.25 0 0 1-2.25-2.25V7.875c0-.621.504-1.125 1.125-1.125H7.5M12 7.5h3.75M12 10.5h3.75M12 13.5h3.75m-10.5-9v1.5m0 12V18M15 3.75v1.5m0 12V18" />
  </svg>
);

const StaticNewsFeed: React.FC<StaticNewsFeedProps> = ({ newsItems }) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg h-full">
      <h2 className="text-xl font-semibold text-indigo-300 mb-3 flex items-center">
        <NewsIcon />
        국내 동향
      </h2>
      {newsItems.length === 0 ? (
        <p className="text-gray-400 text-sm">최신 뉴스가 없습니다.</p>
      ) : (
        <div className="space-y-2 overflow-y-auto custom-scrollbar max-h-[200px] pr-2">
          {newsItems.map((item) => (
            <div key={item.id} className="bg-gray-700 p-2.5 rounded-md shadow hover:shadow-md transition-shadow duration-200">
              <p className="text-sm text-gray-200 leading-relaxed">
                 <span className="font-medium text-sky-400">[{item.turnIdentifier}]</span> {item.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StaticNewsFeed;
