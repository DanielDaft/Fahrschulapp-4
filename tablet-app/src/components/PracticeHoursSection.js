import React from 'react';
import { Plus, Minus, Clock } from 'lucide-react';

const PracticeHoursSection = ({ student, onUpdateStudent }) => {
  
  const updateFahrt = (category, index) => {
    const currentValue = student[category][index];
    const updatedFahrten = [...student[category]];
    updatedFahrten[index] = !currentValue;
    
    const updatedStudent = {
      ...student,
      [category]: updatedFahrten
    };
    
    onUpdateStudent(updatedStudent);
  };

  const addUebungsfahrt = (category) => {
    const updatedFahrten = [...(student[category] || []), false];
    const updatedStudent = {
      ...student,
      [category]: updatedFahrten
    };
    
    onUpdateStudent(updatedStudent);
  };

  const removeUebungsfahrt = (category, index) => {
    if ((student[category] || []).length <= 1) return;
    
    const updatedFahrten = student[category].filter((_, i) => i !== index);
    const updatedStudent = {
      ...student,
      [category]: updatedFahrten
    };
    
    onUpdateStudent(updatedStudent);
  };

  const renderFahrtenSection = (title, category, color = 'blue') => {
    const fahrten = student[category] || [];
    const completed = fahrten.filter(Boolean).length;
    const total = fahrten.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Clock size={20} className={`text-${color}-600`} />
            {title}
          </h3>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 bg-${color}-100 text-${color}-800 rounded-full text-sm font-medium`}>
              {percentage}% ({completed}/{total})
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {fahrten.map((completed, index) => (
            <div key={index} className="relative group">
              <button
                onClick={() => updateFahrt(category, index)}
                className={`touch-button w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all hover:scale-105 ${
                  completed
                    ? `bg-green-500 text-white hover:bg-green-600`
                    : `bg-gray-200 text-gray-600 hover:bg-gray-300`
                }`}
                title={`${title} ${index + 1} ${completed ? 'abgeschlossen' : 'nicht abgeschlossen'}`}
              >
                {index + 1}
              </button>
              
              {/* Remove Button (nur bei Übungsfahrten) */}
              {(category.includes('uebungsfahrten') && fahrten.length > 1) && (
                <button
                  onClick={() => removeUebungsfahrt(category, index)}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 flex items-center justify-center touch-button"
                  title="Entfernen"
                >
                  <Minus size={12} />
                </button>
              )}
            </div>
          ))}

          {/* Add Button (nur bei Übungsfahrten) */}
          {category.includes('uebungsfahrten') && (
            <button
              onClick={() => addUebungsfahrt(category)}
              className={`touch-button w-12 h-12 rounded-full bg-${color}-500 text-white hover:bg-${color}-600 transition-all hover:scale-105 flex items-center justify-center font-bold text-lg`}
              title={`${title} hinzufügen`}
            >
              <Plus size={20} />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Geleistete Fahrten</h2>
      
      {/* Übungsfahrten */}
      {renderFahrtenSection('Ganze Übungsstunden (1h)', 'uebungsfahrten_ganz', 'blue')}
      {renderFahrtenSection('Halbe Übungsstunden (0,5h)', 'uebungsfahrten_halb', 'green')}
      
      {/* Pflichtfahrten */}
      {renderFahrtenSection('Überlandfahrten', 'ueberlandfahrten', 'yellow')}
      {renderFahrtenSection('Autobahnfahrten', 'autobahnfahrten', 'orange')}
      {renderFahrtenSection('Nachtfahrten', 'nachtfahrten', 'purple')}
    </div>
  );
};

export default PracticeHoursSection;