import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Calendar, Phone, Plus } from 'lucide-react';
import { studentsStorage, formatGermanDate } from '../utils/localStorage';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setStudents(studentsStorage.getAll());
  }, []);

  const calculateOverallProgress = (student) => {
    const fahrten = [
      ...(student.ueberlandfahrten || []),
      ...(student.autobahnfahrten || []),
      ...(student.nachtfahrten || []),
      ...(student.uebungsfahrten_ganz || []),
      ...(student.uebungsfahrten_halb || [])
    ];
    
    const completed = fahrten.filter(Boolean).length;
    const total = fahrten.length;
    
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const handleStudentClick = (studentId) => {
    navigate(`/student/${studentId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header mit Add Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Fahrschüler</h2>
        <button className="touch-button bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors">
          <Plus size={20} />
          Neuer Schüler
        </button>
      </div>

      {/* Student Cards Grid */}
      <div className="tablet-grid">
        {students.map((student) => {
          const progress = calculateOverallProgress(student);
          
          return (
            <div
              key={student.id}
              className="student-card touch-button"
              onClick={() => handleStudentClick(student.id)}
            >
              {/* Student Info Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {student.name} {student.surname}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Seit {formatGermanDate(student.start_date)}
                    </p>
                  </div>
                </div>
                
                {/* Progress Circle */}
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-gray-200"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={`${getProgressColor(progress).replace('bg-', 'text-')}`}
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeDasharray={`${progress}, 100`}
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-semibold text-gray-700">
                      {progress}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Student Details */}
              <div className="space-y-2 text-sm text-gray-600">
                {student.date_of_birth && (
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>Geb.: {formatGermanDate(student.date_of_birth)}</span>
                  </div>
                )}
                {student.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={16} />
                    <span>{student.phone}</span>
                  </div>
                )}
              </div>

              {/* Prüfungsstatus */}
              <div className="mt-4 flex gap-4">
                <div className="flex items-center gap-2">
                  <div className={`status-indicator ${
                    student.theory_exam_passed ? 'status-completed' : 'status-in-progress'
                  }`}></div>
                  <span className="text-xs text-gray-600">Theorie</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`status-indicator ${
                    student.practical_exam_passed ? 'status-completed' : 'status-in-progress'
                  }`}></div>
                  <span className="text-xs text-gray-600">Praxis</span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-sm font-semibold text-gray-800">
                    {(student.uebungsfahrten_ganz || []).filter(Boolean).length}
                  </div>
                  <div className="text-xs text-gray-600">Ganze h</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-sm font-semibold text-gray-800">
                    {(student.uebungsfahrten_halb || []).filter(Boolean).length}
                  </div>
                  <div className="text-xs text-gray-600">Halbe h</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-sm font-semibold text-gray-800">
                    {(student.ueberlandfahrten || []).filter(Boolean).length}
                  </div>
                  <div className="text-xs text-gray-600">Überland</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-sm font-semibold text-gray-800">
                    {(student.autobahnfahrten || []).filter(Boolean).length}
                  </div>
                  <div className="text-xs text-gray-600">Autobahn</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {students.length === 0 && (
        <div className="text-center py-16">
          <User size={64} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Noch keine Fahrschüler
          </h3>
          <p className="text-gray-500 mb-6">
            Fügen Sie Ihren ersten Fahrschüler hinzu, um zu beginnen.
          </p>
          <button className="touch-button bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Ersten Schüler hinzufügen
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentList;