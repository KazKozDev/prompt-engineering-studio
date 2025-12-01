import React from 'react';

interface TabsProps {
  tabs: readonly string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange, className = '' }) => {
  return (
    <div className={`flex gap-3 ${className}`}>
      {tabs.map((tab) => (
        <Button
          key={tab}
          onClick={() => onTabChange(tab)}
          variant={tab === activeTab ? 'primary' : 'ghost'}
          size="sm"
          className="px-3 py-1.5 text-[13px]"
        >
          {tab}
        </Button>
      ))}
    </div>
  );
};
import { Button } from './Button';
