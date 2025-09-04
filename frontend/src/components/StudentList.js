import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, User, Calendar, Phone, Trash2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StudentList = ({ onSelectStudent, onNewStudent }) => {
  const [students, setStudents] = useState([]);
  const [studentProgress, setStudentProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${API}/students`);
      setStudents(response.data);
      
      // Fetch progress for each student
      const progressPromises = response.data.map(student =>
        fetchStudentProgress(student.id)
      );
      await Promise.all(progressPromises);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentProgress = async (studentId) => {
    try {
      const response = await axios.get(`${API}/students/${studentId}/overall-progress`);
      setStudentProgress(prev => ({
        ...prev,
        [studentId]: response.data
      }));
    } catch (error) {
      console.error('Error fetching student progress:', error);
      setStudentProgress(prev => ({
        ...prev,
        [studentId]: { total_items: 0, total_completed: 0, completion_percentage: 0 }
      }));
    }
  };

  const handleDeleteStudent = async (studentId) => {
    try {
      await axios.delete(`${API}/students/${studentId}`);
      setStudents(students.filter(student => student.id !== studentId));
      
      // Remove from progress state
      const newProgress = { ...studentProgress };
      delete newProgress[studentId];
      setStudentProgress(newProgress);
      
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Fehler beim Löschen des Schülers');
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    if (percentage >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getProgressTextColor = (percentage) => {
    if (percentage >= 90) return 'text-green-700';
    if (percentage >= 70) return 'text-blue-700';
    if (percentage >= 40) return 'text-yellow-700';
    if (percentage >= 20) return 'text-orange-700';
    return 'text-red-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Fahrschüler</h1>
        <button
          onClick={onNewStudent}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Neuer Schüler
        </button>
      </div>

      <div className="grid gap-4">
        {students.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <User size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">Noch keine Fahrschüler</p>
            <p className="text-sm">Klicken Sie auf "Neuer Schüler" um zu beginnen</p>
          </div>
        ) : (
          students.map((student) => {
            const progress = studentProgress[student.id] || { total_items: 0, total_completed: 0, completion_percentage: 0 };
            
            return (
              <div
                key={student.id}
                className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all"
              >
                <div 
                  onClick={() => onSelectStudent(student)}
                  className="p-4 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <User size={24} className="text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-800">
                          {student.name} {student.surname}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          {student.date_of_birth && (
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              {student.date_of_birth}
                            </div>
                          )}
                          {student.phone && (
                            <div className="flex items-center gap-1">
                              <Phone size={14} />
                              {student.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>Seit {new Date(student.start_date).toLocaleDateString('de-DE')}</p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Ausbildungsfortschritt</span>
                      <span className={`text-sm font-bold ${getProgressTextColor(progress.completion_percentage)}`}>
                        {progress.completion_percentage}% ({progress.total_completed}/{progress.total_items})
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(progress.completion_percentage)}`}
                        style={{ width: `${progress.completion_percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                {/* Delete Button */}
                <div className="px-4 pb-4 flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(student.id);
                    }}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors"
                    title="Schüler löschen"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Schüler löschen</h3>
            <p className="text-gray-600 mb-6">
              Sind Sie sicher, dass Sie diesen Schüler löschen möchten? 
              Alle Fortschrittsdaten und Notizen werden unwiderruflich gelöscht.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDeleteStudent(deleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Löschen
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md transition-colors"
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

export default StudentList;