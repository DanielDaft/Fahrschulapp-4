import React, { useState } from 'react';
import axios from 'axios';
import { Save, X, User } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StudentForm = ({ onSave, onCancel, student = null }) => {
  const [formData, setFormData] = useState({
    name: student?.name || '',
    surname: student?.surname || '',
    date_of_birth: student?.date_of_birth || '',
    address: student?.address || '',
    phone: student?.phone || '',
    wears_glasses: student?.wears_glasses || false,
    theory_exam_passed: student?.theory_exam_passed || false,
    theory_exam_date: student?.theory_exam_date || '',
    practical_exam_date: student?.practical_exam_date || '',
    practical_exam_passed: student?.practical_exam_passed || false,
    license_number: student?.license_number || '',
    instructor_notes: student?.instructor_notes || '',
    // Fahrten
    ueberlandfahrten: student?.ueberlandfahrten || [false, false, false, false, false],
    autobahnfahrten: student?.autobahnfahrten || [false, false, false, false],
    nachtfahrten: student?.nachtfahrten || [false, false, false],
    uebungsfahrten_ganz: student?.uebungsfahrten_ganz || [false, false, false, false, false],
    uebungsfahrten_halb: student?.uebungsfahrten_halb || [false, false, false, false, false]
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFahrtenChange = (category, index) => {
    setFormData(prev => ({
      ...prev,
      [category]: prev[category].map((checked, i) => i === index ? !checked : checked)
    }));
  };

  const addUebungsfahrt = (category) => {
    setFormData(prev => ({
      ...prev,
      [category]: [...prev[category], false]
    }));
  };

  const removeUebungsfahrt = (category, index) => {
    setFormData(prev => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name ist erforderlich';
    if (!formData.surname.trim()) newErrors.surname = 'Nachname ist erforderlich';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      let response;
      if (student) {
        // Update existing student
        response = await axios.put(`${API}/students/${student.id}`, formData);
      } else {
        // Create new student
        response = await axios.post(`${API}/students`, formData);
      }
      onSave(response.data);
    } catch (error) {
      console.error('Error saving student:', error);
      setErrors({ submit: 'Fehler beim Speichern. Bitte versuchen Sie es erneut.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 p-2 rounded-full">
          <User size={24} className="text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">
          {student ? 'Schüler bearbeiten' : 'Neuer Fahrschüler'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vorname *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Vorname eingeben"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nachname *
            </label>
            <input
              type="text"
              name="surname"
              value={formData.surname}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.surname ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nachname eingeben"
            />
            {errors.surname && <p className="text-red-500 text-xs mt-1">{errors.surname}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Geburtsdatum
          </label>
          <input
            type="date"
            name="date_of_birth"
            value={formData.date_of_birth}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Adresse
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Straße, PLZ, Ort"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefonnummer
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Telefonnummer"
          />
        </div>

        {/* Brillenträger */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Zusätzliche Informationen</h3>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="wears_glasses"
              checked={formData.wears_glasses}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">
              Brillenträger
            </label>
          </div>
        </div>

        {/* Fahrten-Tabelle */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Geleistete Fahrten</h3>
          
          {/* Überlandfahrten */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-2">Überlandfahrten (5 Fahrten)</h4>
            <div className="flex gap-3 flex-wrap">
              {formData.ueberlandfahrten.map((checked, index) => (
                <label key={index} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleFahrtenChange('ueberlandfahrten', index)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-1 text-sm text-gray-700">{index + 1}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Autobahnfahrten */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-2">Autobahnfahrten (4 Fahrten)</h4>
            <div className="flex gap-3 flex-wrap">
              {formData.autobahnfahrten.map((checked, index) => (
                <label key={index} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleFahrtenChange('autobahnfahrten', index)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-1 text-sm text-gray-700">{index + 1}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Nachtfahrten */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-2">Nachtfahrten (3 Fahrten)</h4>
            <div className="flex gap-3 flex-wrap">
              {formData.nachtfahrten.map((checked, index) => (
                <label key={index} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleFahrtenChange('nachtfahrten', index)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-1 text-sm text-gray-700">{index + 1}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Übungsfahrten */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-2">Übungsfahrten</h4>
            
            {/* Ganze Stunden */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Ganze Stunden</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => addUebungsfahrt('uebungsfahrten_ganz')}
                    className="text-green-600 hover:text-green-800 text-sm px-2 py-1 rounded bg-green-50 hover:bg-green-100"
                  >
                    + Hinzufügen
                  </button>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {formData.uebungsfahrten_ganz.map((checked, index) => (
                  <div key={index} className="flex items-center bg-gray-50 rounded px-2 py-1">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleFahrtenChange('uebungsfahrten_ganz', index)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-1 text-sm text-gray-700">{index + 1}h</span>
                    </label>
                    {formData.uebungsfahrten_ganz.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeUebungsfahrt('uebungsfahrten_ganz', index)}
                        className="ml-2 text-red-500 hover:text-red-700 text-xs"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Halbe Stunden */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Halbe Stunden</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => addUebungsfahrt('uebungsfahrten_halb')}
                    className="text-green-600 hover:text-green-800 text-sm px-2 py-1 rounded bg-green-50 hover:bg-green-100"
                  >
                    + Hinzufügen
                  </button>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {formData.uebungsfahrten_halb.map((checked, index) => (
                  <div key={index} className="flex items-center bg-gray-50 rounded px-2 py-1">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleFahrtenChange('uebungsfahrten_halb', index)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-1 text-sm text-gray-700">{index + 1}×0.5h</span>
                    </label>
                    {formData.uebungsfahrten_halb.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeUebungsfahrt('uebungsfahrten_halb', index)}
                        className="ml-2 text-red-500 hover:text-red-700 text-xs"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Theory Exam Section */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Theorieprüfung</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prüfungsdatum
              </label>
              <input
                type="date"
                name="theory_exam_date"
                value={formData.theory_exam_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="theory_exam_passed"
                checked={formData.theory_exam_passed}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Theorieprüfung bestanden
              </label>
            </div>
          </div>
        </div>

        {/* Practical Exam Section */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Praktische Prüfung</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prüfungsdatum
              </label>
              <input
                type="date"
                name="practical_exam_date"
                value={formData.practical_exam_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="practical_exam_passed"
                checked={formData.practical_exam_passed}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Praktische Prüfung bestanden
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Führerscheinnummer
          </label>
          <input
            type="text"
            name="license_number"
            value={formData.license_number}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Führerscheinnummer (nach bestandener Prüfung)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fahrlehrer-Notizen
          </label>
          <textarea
            name="instructor_notes"
            value={formData.instructor_notes}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Allgemeine Notizen zum Schüler..."
          />
        </div>

        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {errors.submit}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-1 border-white"></div>
            ) : (
              <Save size={18} />
            )}
            {loading ? 'Speichern...' : 'Speichern'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center gap-2 transition-colors"
          >
            <X size={18} />
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentForm;