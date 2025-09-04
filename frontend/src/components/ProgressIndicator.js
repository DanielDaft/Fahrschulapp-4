import React from 'react';

const ProgressIndicator = ({ stats }) => {
  const getIndicatorColor = (percentage) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getTextColor = (percentage) => {
    if (percentage >= 90) return 'text-green-700';
    if (percentage >= 70) return 'text-yellow-700';
    if (percentage >= 40) return 'text-orange-700';
    return 'text-red-700';
  };

  if (!stats) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <div className={`w-3 h-3 rounded-full ${getIndicatorColor(stats.completion_percentage)}`}></div>
        <span className={`text-xs font-medium ${getTextColor(stats.completion_percentage)}`}>
          {stats.completion_percentage}%
        </span>
      </div>
      <div className="text-xs text-gray-500">
        ({stats.total_completed}/{stats.total_items})
      </div>
      
      {/* Mini breakdown */}
      {(stats.completed_items.once > 0 || stats.completed_items.twice > 0 || stats.completed_items.thrice > 0) && (
        <div className="flex items-center gap-1 text-xs">
          {stats.completed_items.once > 0 && (
            <span className="bg-yellow-100 text-yellow-700 px-1 rounded">
              /{stats.completed_items.once}
            </span>
          )}
          {stats.completed_items.twice > 0 && (
            <span className="bg-orange-100 text-orange-700 px-1 rounded">
              ×{stats.completed_items.twice}
            </span>
          )}
          {stats.completed_items.thrice > 0 && (
            <span className="bg-green-100 text-green-700 px-1 rounded">
              ⊗{stats.completed_items.thrice}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgressIndicator;