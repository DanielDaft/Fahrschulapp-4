import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, Phone, MapPin, Plus, Minus, Eye, EyeOff } from 'lucide-react';
import { studentsStorage, formatGermanDate } from '../utils/localStorage';
import PracticeHoursSection from './PracticeHoursSection';

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [showPersonalData, setShowPersonalData] = useState(true);

  useEffect(() => {
    const studentData = studentsStorage.getById(id);
    if (studentData) {
      setStudent(studentData);
    } else {
      navigate('/');
    }
  }, [id, navigate]);

  const updateStudent = (updatedStudent) => {
    studentsStorage.save(updatedStudent);
    setStudent(updatedStudent);
  };

  const updateFahrt = (category, index) => {
    if (!student) return;
    
    const currentValue = student[category][index];
    const updatedFahrten = [...student[category]];
    updatedFahrten[index] = !currentValue;
    
    const updatedStudent = {
      ...student,
      [category]: updatedFahrten
    };
    
    updateStudent(updatedStudent);
  };

  const addUebungsfahrt = (category) => {
    if (!student) return;
    
    const updatedFahrten = [...(student[category] || []), false];
    const updatedStudent = {
      ...student,
      [category]: updatedFahrten
    };
    
    updateStudent(updatedStudent);
  };

  const removeUebungsfahrt = (category, index) => {
    if (!student || (student[category] || []).length <= 1) return;
    
    const updatedFahrten = student[category].filter((_, i) => i !== index);
    const updatedStudent = {
      ...student,
      [category]: updatedFahrten
    };
    
    updateStudent(updatedStudent);
  };

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/')}
          className="touch-button p-3 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">
            {student.name} {student.surname}
          </h1>
          <p className="text-gray-600">Fahrschüler-Details</p>
        </div>
      </div>

      {/* Personal Data Card */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <User size={20} />
            Persönliche Daten
          </h2>
          <button
            onClick={() => setShowPersonalData(!showPersonalData)}
            className="touch-button p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {showPersonalData ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {showPersonalData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {student.date_of_birth && (
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar size={16} />
                <span>Geburtsdatum: {formatGermanDate(student.date_of_birth)}</span>
              </div>
            )}
            {student.phone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone size={16} />
                <span>Telefon: {student.phone}</span>
              </div>
            )}
            {student.address && (
              <div className="flex items-center gap-2 text-gray-600 md:col-span-2">
                <MapPin size={16} />
                <span>Adresse: {student.address}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar size={16} />
              <span>Ausbildungsbeginn: {formatGermanDate(student.start_date)}</span>
            </div>

            {/* Prüfungsstatus */}
            {(student.theory_exam_date || student.theory_exam_passed) && (
              <div className="flex items-center gap-2 text-gray-600">
                <div className={`w-3 h-3 rounded-full ${student.theory_exam_passed ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span>
                  Theorieprüfung: {student.theory_exam_passed ? 'Bestanden' : 'Geplant'}
                  {student.theory_exam_date && ` (${formatGermanDate(student.theory_exam_date)})`}
                </span>
              </div>
            )}

            {(student.practical_exam_date || student.practical_exam_passed) && (
              <div className="flex items-center gap-2 text-gray-600">
                <div className={`w-3 h-3 rounded-full ${student.practical_exam_passed ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span>
                  Praktische Prüfung: {student.practical_exam_passed ? 'Bestanden' : 'Geplant'}
                  {student.practical_exam_date && ` (${formatGermanDate(student.practical_exam_date)})`}
                </span>
              </div>
            )}

            {student.wears_glasses !== null && (
              <div className="flex items-center gap-2 text-gray-600">
                <span>👓 Brillenträger: {student.wears_glasses ? 'Ja' : 'Nein'}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Practice Hours Component */}
      <PracticeHoursSection
        student={student}
        onUpdateStudent={updateStudent}
      />
    </div>
  );
};

export default StudentDetail;