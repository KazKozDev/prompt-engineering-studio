import React from 'react';

interface TabsProps {
  tabs: readonly string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange, className = '' }) => {
  return (
    <div className={`flex gap-6 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`pb-1 text-[13px] font-medium transition-all duration-200 ${
            tab === activeTab
              ? 'text-primary'
              : 'text-text-muted hover:text-text-main'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};
