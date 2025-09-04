import React from 'react';

const ProgressCheckbox = ({ status, onChange, disabled = false }) => {
  const getProgressSymbol = () => {
    switch (status) {
      case 'not_started':
        return '';
      case 'once':
        return '/';
      case 'twice':
        return '×';
      case 'thrice':
        return '⊗';
      default:
        return '';
    }
  };

  const getProgressColor = () => {
    switch (status) {
      case 'not_started':
        return 'border-gray-300 bg-white';
      case 'once':
        return 'border-yellow-400 bg-yellow-50 text-yellow-700';
      case 'twice':
        return 'border-orange-400 bg-orange-50 text-orange-700';
      case 'thrice':
        return 'border-green-500 bg-green-50 text-green-700';
      default:
        return 'border-gray-300 bg-white';
    }
  };

  const handleClick = () => {
    if (disabled) return;
    
    const statusFlow = ['not_started', 'once', 'twice', 'thrice'];
    const currentIndex = statusFlow.indexOf(status);
    const nextIndex = (currentIndex + 1) % statusFlow.length;
    onChange(statusFlow[nextIndex]);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        w-6 h-6 min-w-6 min-h-6 border-2 rounded-sm flex items-center justify-center text-sm font-bold
        transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
        ${getProgressColor()}
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:shadow-md'}
      `}
      title={`Status: ${status} - Klicken zum Ändern`}
    >
      <span className="select-none text-base leading-none">
        {getProgressSymbol()}
      </span>
    </button>
  );
};

export default ProgressCheckbox;