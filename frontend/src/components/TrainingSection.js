import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProgressCheckbox from './ProgressCheckbox';
import ProgressIndicator from './ProgressIndicator';
import { ChevronDown, ChevronUp, MessageSquare, X } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TrainingSection = ({ title, subtitle, color, sections, studentId, categoryKey, collapsed = false }) => {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const [progress, setProgress] = useState({});
  const [progressStats, setProgressStats] = useState(null);
  const [notes, setNotes] = useState({});
  const [showNoteModal, setShowNoteModal] = useState(null);
  const [currentNote, setCurrentNote] = useState('');
  const [loading, setLoading] = useState({});

  useEffect(() => {
    if (studentId) {
      fetchProgress();
      fetchProgressStats();
    }
  }, [studentId]);

  const fetchProgress = async () => {
    try {
      const response = await axios.get(`${API}/students/${studentId}/progress`);
      const progressMap = {};
      response.data.forEach(p => {
        const key = `${p.category}_${p.subcategory}_${p.item}`;
        progressMap[key] = p;
      });
      setProgress(progressMap);
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const fetchProgressStats = async () => {
    try {
      const response = await axios.get(`${API}/students/${studentId}/progress-stats`);
      setProgressStats(response.data[categoryKey]);
    } catch (error) {
      console.error('Error fetching progress stats:', error);
    }
  };

  const updateProgress = async (category, subcategory, item, newStatus) => {
    const key = `${category}_${subcategory}_${item}`;
    setLoading(prev => ({ ...prev, [key]: true }));

    try {
      const response = await axios.post(
        `${API}/students/${studentId}/progress?category=${category}&subcategory=${subcategory}&item=${item}`,
        { status: newStatus }
      );
      
      setProgress(prev => ({
        ...prev,
        [key]: response.data
      }));
      
      // Refresh stats after update
      fetchProgressStats();
    } catch (error) {
      console.error('Error updating progress:', error);
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const openNoteModal = (category, subcategory, item) => {
    const key = `${category}_${subcategory}_${item}`;
    const existingProgress = progress[key];
    setCurrentNote(existingProgress?.notes || '');
    setShowNoteModal({ category, subcategory, item });
  };

  const saveNote = async () => {
    if (!showNoteModal) return;

    const { category, subcategory, item } = showNoteModal;
    const key = `${category}_${subcategory}_${item}`;
    const existingProgress = progress[key];
    const currentStatus = existingProgress?.status || 'not_started';

    try {
      const response = await axios.post(
        `${API}/students/${studentId}/progress?category=${category}&subcategory=${subcategory}&item=${item}`,
        { status: currentStatus, notes: currentNote }
      );
      
      setProgress(prev => ({
        ...prev,
        [key]: response.data
      }));
      setShowNoteModal(null);
      setCurrentNote('');
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const categorySlug = title.toLowerCase().replace(/\s+/g, '_').replace(/[äöü-]/g, match => {
    const map = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', '-': '_' };
    return map[match] || match;
  });

  const renderSubSections = (section, sectionKey, level = 0) => {
    if (section.sections) {
      // Has nested sections
      return (
        <div key={sectionKey} className={`mb-4 ${level > 0 ? 'ml-4 border-l-2 border-gray-200 pl-4' : ''}`}>
          <h4 className={`font-semibold text-gray-700 mb-2 text-sm ${level === 0 ? 'uppercase tracking-wide' : ''}`}>
            {section.name}
            {section.subtitle && <span className="text-xs text-gray-500 ml-2">({section.subtitle})</span>}
          </h4>
          {Object.entries(section.sections).map(([subKey, subSection]) => 
            renderSubSections(subSection, `${sectionKey}_${subKey}`, level + 1)
          )}
        </div>
      );
    } else {
      // Has items
      return (
        <div key={sectionKey} className={`mb-4 ${level > 0 ? 'ml-4' : ''}`}>
          {section.name && (
            <h4 className={`font-semibold text-gray-700 mb-2 text-sm ${level === 0 ? 'uppercase tracking-wide' : ''}`}>
              {section.name}
              {section.subtitle && <span className="text-xs text-gray-500 ml-2">({section.subtitle})</span>}
            </h4>
          )}
          <div className="space-y-2">
            {section.items?.map((item, index) => {
              const key = `${categorySlug}_${sectionKey}_${item}`;
              const itemProgress = progress[key];
              const isLoading = loading[key];
              
              return (
                <div key={index} className="flex items-center gap-3 py-1">
                  <ProgressCheckbox
                    status={itemProgress?.status || 'not_started'}
                    onChange={(newStatus) => updateProgress(categorySlug, sectionKey, item, newStatus)}
                    disabled={isLoading}
                  />
                  <span className="flex-1 text-sm text-gray-700">{item}</span>
                  <button
                    onClick={() => openNoteModal(categorySlug, sectionKey, item)}
                    className={`p-1 rounded-full transition-colors ${
                      itemProgress?.notes 
                        ? 'text-blue-600 hover:bg-blue-50' 
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    }`}
                    title={itemProgress?.notes ? 'Notiz bearbeiten' : 'Notiz hinzufügen'}
                  >
                    <MessageSquare size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="px-4 py-3 cursor-pointer flex items-center justify-between transition-colors"
        style={{ 
          backgroundColor: color + '15', 
          borderLeft: `4px solid ${color}`,
          borderTop: `1px solid ${color}30`
        }}
      >
        <div>
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          <ProgressIndicator stats={progressStats} />
          {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-4" style={{ backgroundColor: color + '05' }}>
          {Object.entries(sections).map(([sectionKey, section]) => 
            renderSubSections(section, sectionKey)
          )}
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Notiz hinzufügen</h3>
              <button
                onClick={() => setShowNoteModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <textarea
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              placeholder="Notiz eingeben..."
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={saveNote}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Speichern
              </button>
              <button
                onClick={() => setShowNoteModal(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingSection;