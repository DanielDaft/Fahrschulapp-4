import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TrainingSection from './TrainingSection';
import { ArrowLeft, User, Calendar, Phone, MapPin, Edit2, Eye, EyeOff, Plus, Minus } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StudentDetail = ({ student, onBack, onEdit }) => {
  const [trainingCategories, setTrainingCategories] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(student);

  // Deutsche Datumsformatierung
  const formatGermanDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  useEffect(() => {
    fetchTrainingCategories();
  }, []);

  const fetchTrainingCategories = async () => {
    try {
      const response = await axios.get(`${API}/training-categories`);
      setTrainingCategories(response.data);
    } catch (error) {
      console.error('Error fetching training categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFahrt = async (category, index) => {
    try {
      const currentValue = studentData[category][index];
      const updatedFahrten = [...studentData[category]];
      updatedFahrten[index] = !currentValue;

      const updateData = { [category]: updatedFahrten };
      
      await axios.put(`${API}/students/${studentData.id}/fahrten`, updateData);
      
      setStudentData(prev => ({
        ...prev,
        [category]: updatedFahrten
      }));
    } catch (error) {
      console.error('Error updating fahrt:', error);
    }
  };

  const addUebungsfahrt = async (category, duration) => {
    try {
      // Fallback to old API if new practice-hours API doesn't work
      const updatedFahrten = [...(studentData[category] || []), false];
      const updateData = { [category]: updatedFahrten };
      
      await axios.put(`${API}/students/${studentData.id}/fahrten`, updateData);
      
      setStudentData(prev => ({
        ...prev,
        [category]: updatedFahrten
      }));
    } catch (error) {
      console.error('Error adding übungsfahrt:', error);
    }
  };

  const removeUebungsfahrt = async (category, index) => {
    try {
      if ((studentData[category] || []).length <= 1) return; // Keep at least one
      
      const updatedFahrten = (studentData[category] || []).filter((_, i) => i !== index);
      const updateData = { [category]: updatedFahrten };
      
      await axios.put(`${API}/students/${studentData.id}/fahrten`, updateData);
      
      setStudentData(prev => ({
        ...prev,
        [category]: updatedFahrten
      }));
    } catch (error) {
      console.error('Error removing übungsfahrt:', error);
    }
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
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">
            {studentData.name} {studentData.surname}
          </h1>
        </div>
        <button
          onClick={onEdit}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
          title="Schüler bearbeiten"
        >
          <Edit2 size={20} />
        </button>
      </div>

      {/* Student Info Card */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-100 p-2 rounded-full">
            <User size={24} className="text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800">Schülerinformationen</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {studentData.date_of_birth && (
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar size={16} />
              <span>Geburtsdatum: {formatGermanDate(studentData.date_of_birth)}</span>
            </div>
          )}
          {studentData.phone && (
            <div className="flex items-center gap-2 text-gray-600">
              <Phone size={16} />
              <span>Telefon: {studentData.phone}</span>
            </div>
          )}
          {studentData.address && (
            <div className="flex items-center gap-2 text-gray-600 md:col-span-2">
              <MapPin size={16} />
              <span>Adresse: {studentData.address}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar size={16} />
            <span>Ausbildungsbeginn: {new Date(studentData.start_date).toLocaleDateString('de-DE')}</span>
          </div>
          
          {/* Brillenträger Status */}
          {studentData.wears_glasses !== null && (
            <div className="flex items-center gap-2 text-gray-600">
              {studentData.wears_glasses ? <Eye size={16} /> : <EyeOff size={16} />}
              <span>{studentData.wears_glasses ? 'Brillenträger' : 'Kein Brillenträger'}</span>
            </div>
          )}
          
          {/* Theory Exam Status */}
          {(studentData.theory_exam_date || studentData.theory_exam_passed) && (
            <div className="flex items-center gap-2 text-gray-600">
              <div className={`w-3 h-3 rounded-full ${studentData.theory_exam_passed ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span>
                Theorieprüfung: {studentData.theory_exam_passed ? 'Bestanden' : 'Geplant'}
                {studentData.theory_exam_date && ` (${formatGermanDate(studentData.theory_exam_date)})`}
              </span>
            </div>
          )}
          
          {/* Practical Exam Status */}
          {(studentData.practical_exam_date || studentData.practical_exam_passed) && (
            <div className="flex items-center gap-2 text-gray-600">
              <div className={`w-3 h-3 rounded-full ${studentData.practical_exam_passed ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span>
                Praktische Prüfung: {studentData.practical_exam_passed ? 'Bestanden' : 'Geplant'}
                {studentData.practical_exam_date && ` (${formatGermanDate(studentData.practical_exam_date)})`}
              </span>
            </div>
          )}
          
          {/* License Number */}
          {studentData.license_number && (
            <div className="flex items-center gap-2 text-gray-600">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Führerscheinnummer: {studentData.license_number}</span>
            </div>
          )}
          
          {/* Instructor Notes */}
          {studentData.instructor_notes && (
            <div className="md:col-span-2 mt-2 p-3 bg-blue-50 rounded-md">
              <h4 className="font-medium text-blue-800 mb-1">Fahrlehrer-Notizen:</h4>
              <p className="text-blue-700 text-sm">{studentData.instructor_notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Fahrten-Übersicht */}
      {(studentData.ueberlandfahrten || studentData.autobahnfahrten || studentData.nachtfahrten || studentData.uebungsfahrten_ganz || studentData.uebungsfahrten_halb) && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Geleistete Fahrten</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Überlandfahrten */}
            {studentData.ueberlandfahrten && (
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Überlandfahrten (5 Fahrten)</h3>
                <div className="flex gap-2">
                  {studentData.ueberlandfahrten.map((completed, index) => (
                    <button
                      key={index}
                      onClick={() => updateFahrt('ueberlandfahrten', index)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors cursor-pointer hover:scale-110 ${
                        completed 
                          ? 'bg-green-500 text-white hover:bg-green-600' 
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                      title={`Überlandfahrt ${index + 1} ${completed ? 'abgeschlossen' : 'nicht abgeschlossen'} - Klicken zum Ändern`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    ({studentData.ueberlandfahrten.filter(Boolean).length}/5)
                  </span>
                </div>
              </div>
            )}

            {/* Autobahnfahrten */}
            {studentData.autobahnfahrten && (
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Autobahnfahrten (4 Fahrten)</h3>
                <div className="flex gap-2">
                  {studentData.autobahnfahrten.map((completed, index) => (
                    <button
                      key={index}
                      onClick={() => updateFahrt('autobahnfahrten', index)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors cursor-pointer hover:scale-110 ${
                        completed 
                          ? 'bg-green-500 text-white hover:bg-green-600' 
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                      title={`Autobahnfahrt ${index + 1} ${completed ? 'abgeschlossen' : 'nicht abgeschlossen'} - Klicken zum Ändern`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    ({studentData.autobahnfahrten.filter(Boolean).length}/4)
                  </span>
                </div>
              </div>
            )}

            {/* Nachtfahrten */}
            {studentData.nachtfahrten && (
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Nachtfahrten (3 Fahrten)</h3>
                <div className="flex gap-2">
                  {studentData.nachtfahrten.map((completed, index) => (
                    <button
                      key={index}
                      onClick={() => updateFahrt('nachtfahrten', index)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors cursor-pointer hover:scale-110 ${
                        completed 
                          ? 'bg-green-500 text-white hover:bg-green-600' 
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                      title={`Nachtfahrt ${index + 1} ${completed ? 'abgeschlossen' : 'nicht abgeschlossen'} - Klicken zum Ändern`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    ({studentData.nachtfahrten.filter(Boolean).length}/3)
                  </span>
                </div>
              </div>
            )}

            {/* Übungsfahrten */}
            <div className="md:col-span-2">
              <h3 className="font-medium text-gray-700 mb-2">Übungsfahrten</h3>
              
              {/* Ganze Stunden */}
              <div className="mb-3">
                <h4 className="text-sm text-gray-600 mb-2">Ganze Stunden</h4>
                <div className="flex gap-2 flex-wrap">
                  {(studentData.uebungsfahrten_ganz || []).map((completed, index) => (
                    <div key={index} className="relative group">
                      <button
                        onClick={() => updateFahrt('uebungsfahrten_ganz', index)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors cursor-pointer hover:scale-110 ${
                          completed
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                        title={`Ganze Übungsstunde ${index + 1} ${completed ? 'abgeschlossen' : 'nicht abgeschlossen'} - Klicken zum Ändern`}
                      >
                        {index + 1}
                      </button>
                      <button
                        onClick={() => removeUebungsfahrt('uebungsfahrten_ganz', index)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 flex items-center justify-center"
                        title="Entfernen"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addUebungsfahrt('uebungsfahrten_ganz', 1.0)}
                    className="w-8 h-8 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center justify-center font-bold text-lg"
                    title="Ganze Stunde hinzufügen"
                  >
                    +
                  </button>
                </div>
                <span className="ml-2 text-sm text-gray-600">
                  ({(studentData.uebungsfahrten_ganz || []).filter(Boolean).length}/{(studentData.uebungsfahrten_ganz || []).length})
                </span>
              </div>
              
              {/* Halbe Stunden */}
              <div>
                <h4 className="text-sm text-gray-600 mb-2">Halbe Stunden</h4>
                <div className="flex gap-2 flex-wrap">
                  {(studentData.uebungsfahrten_halb || []).map((completed, index) => (
                    <div key={index} className="relative group">
                      <button
                        onClick={() => updateFahrt('uebungsfahrten_halb', index)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors cursor-pointer hover:scale-110 ${
                          completed
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                        title={`Halbe Übungsstunde ${index + 1} ${completed ? 'abgeschlossen' : 'nicht abgeschlossen'} - Klicken zum Ändern`}
                      >
                        {index + 1}
                      </button>
                      <button
                        onClick={() => removeUebungsfahrt('uebungsfahrten_halb', index)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 flex items-center justify-center"
                        title="Entfernen"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addUebungsfahrt('uebungsfahrten_halb', 0.5)}
                    className="w-8 h-8 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors flex items-center justify-center font-bold text-lg"
                    title="Halbe Stunde hinzufügen"
                  >
                    +
                  </button>
                </div>
                <span className="ml-2 text-sm text-gray-600">
                  ({(studentData.uebungsfahrten_halb || []).filter(Boolean).length}/{(studentData.uebungsfahrten_halb || []).length})
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Training Progress */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Ausbildungsfortschritt</h2>
        
        {trainingCategories && Object.entries(trainingCategories).map(([key, category]) => {
          // Filter out fahrerassistenzsysteme from situative_bausteine
          if (key === 'situative_bausteine') {
            const filteredSections = { ...category.sections };
            delete filteredSections.fahrerassistenzsysteme;
            
            return (
              <div key={key}>
                {/* Original Situative Bausteine without Fahrerassistenzsysteme */}
                <TrainingSection
                  key={key}
                  categoryKey={key}
                  title={category.name}
                  subtitle={category.subtitle}
                  color={category.color}
                  sections={filteredSections}
                  studentId={student.id}
                  collapsed={key !== 'grundstufe'}
                />
                
                {/* Separate Fahrerassistenzsysteme category */}
                {category.sections.fahrerassistenzsysteme && (
                  <TrainingSection
                    key="fahrerassistenzsysteme_separate"
                    categoryKey="situative_bausteine" // Keep same category for data consistency
                    title="Fahrerassistenzsysteme"
                    subtitle=""
                    color="#60A5FA" // Same blue color as situative_bausteine
                    sections={{
                      fahrerassistenzsysteme: category.sections.fahrerassistenzsysteme
                    }}
                    studentId={student.id}
                    collapsed={true}
                  />
                )}
              </div>
            );
          }
          
          // All other categories remain unchanged
          return (
            <TrainingSection
              key={key}
              categoryKey={key}
              title={category.name}
              subtitle={category.subtitle}
              color={category.color}
              sections={category.sections}
              studentId={student.id}
              collapsed={key !== 'grundstufe'}
            />
          );
        })}
      </div>
    </div>
  );
};

export default StudentDetail;