import React, { useState } from "react";
import "./App.css";
import StudentList from "./components/StudentList";
import StudentForm from "./components/StudentForm";
import StudentDetail from "./components/StudentDetail";

function App() {
  const [currentView, setCurrentView] = useState('list'); // 'list', 'form', 'detail'
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setCurrentView('detail');
  };

  const handleNewStudent = () => {
    setEditingStudent(null);
    setCurrentView('form');
  };

  const handleEditStudent = () => {
    setEditingStudent(selectedStudent);
    setCurrentView('form');
  };

  const handleSaveStudent = (student) => {
    setSelectedStudent(student);
    setCurrentView('detail');
    // If we were editing, go to detail view
    // If we were creating new, also go to detail view
  };

  const handleBack = () => {
    if (currentView === 'detail') {
      setCurrentView('list');
      setSelectedStudent(null);
    } else if (currentView === 'form') {
      if (editingStudent) {
        setCurrentView('detail'); // Go back to detail if we were editing
      } else {
        setCurrentView('list'); // Go back to list if we were creating new
      }
      setEditingStudent(null);
    }
  };

  const handleCancel = () => {
    handleBack();
  };

  return (
    <div className="App min-h-screen bg-gray-50">
      {currentView === 'list' && (
        <StudentList 
          onSelectStudent={handleSelectStudent}
          onNewStudent={handleNewStudent}
        />
      )}
      
      {currentView === 'form' && (
        <StudentForm
          student={editingStudent}
          onSave={handleSaveStudent}
          onCancel={handleCancel}
        />
      )}
      
      {currentView === 'detail' && selectedStudent && (
        <StudentDetail
          student={selectedStudent}
          onBack={handleBack}
          onEdit={handleEditStudent}
        />
      )}
    </div>
  );
}

export default App;
