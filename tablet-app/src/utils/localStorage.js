// Lokale Datenspeicherung für die Tablet-App
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEYS = {
  STUDENTS: 'fahrschul_students',
  PROGRESS: 'fahrschul_progress',
  SETTINGS: 'fahrschul_settings'
};

// Deutsche Datumsformatierung
export const formatGermanDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Schüler-Management
export const studentsStorage = {
  getAll: () => {
    const stored = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    return stored ? JSON.parse(stored) : [];
  },

  getById: (id) => {
    const students = studentsStorage.getAll();
    return students.find(s => s.id === id);
  },

  save: (student) => {
    const students = studentsStorage.getAll();
    const existingIndex = students.findIndex(s => s.id === student.id);
    
    if (existingIndex >= 0) {
      students[existingIndex] = { ...student, updated_at: new Date().toISOString() };
    } else {
      const newStudent = {
        ...student,
        id: student.id || uuidv4(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      students.push(newStudent);
    }
    
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    return students;
  },

  delete: (id) => {
    const students = studentsStorage.getAll();
    const filtered = students.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(filtered));
    
    // Auch Progress-Daten löschen
    progressStorage.deleteByStudent(id);
    
    return filtered;
  }
};

// Progress-Management
export const progressStorage = {
  getAll: () => {
    const stored = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    return stored ? JSON.parse(stored) : [];
  },

  getByStudent: (studentId) => {
    const progress = progressStorage.getAll();
    return progress.filter(p => p.student_id === studentId);
  },

  save: (progressData) => {
    const allProgress = progressStorage.getAll();
    const key = `${progressData.student_id}_${progressData.category}_${progressData.subcategory}_${progressData.item}`;
    const existingIndex = allProgress.findIndex(p => 
      p.student_id === progressData.student_id &&
      p.category === progressData.category &&
      p.subcategory === progressData.subcategory &&
      p.item === progressData.item
    );

    const progressEntry = {
      ...progressData,
      id: progressData.id || uuidv4(),
      last_updated: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      allProgress[existingIndex] = progressEntry;
    } else {
      allProgress.push(progressEntry);
    }

    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(allProgress));
    return progressEntry;
  },

  deleteByStudent: (studentId) => {
    const allProgress = progressStorage.getAll();
    const filtered = allProgress.filter(p => p.student_id !== studentId);
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(filtered));
  }
};

// Demo-Daten erstellen
export const createDemoData = () => {
  const demoStudents = [
    {
      id: uuidv4(),
      name: 'Anna',
      surname: 'Schmidt',
      date_of_birth: '1998-03-20',
      address: 'Musterstraße 123, 12345 Berlin',
      phone: '+49 123 456789',
      start_date: '2024-01-15',
      theory_exam_date: '2025-10-15',
      practical_exam_date: '2025-11-20',
      theory_exam_passed: false,
      practical_exam_passed: false,
      wears_glasses: true,
      ueberlandfahrten: [true, true, false, true, false],
      autobahnfahrten: [true, false, true, false, true],
      nachtfahrten: [false, true, false],
      uebungsfahrten_ganz: [true, true, false, true, false, false, true, false, true, true],
      uebungsfahrten_halb: [true, false, true, false, true]
    }
  ];

  // Nur erstellen wenn noch keine Daten vorhanden
  if (studentsStorage.getAll().length === 0) {
    demoStudents.forEach(student => studentsStorage.save(student));
  }
};