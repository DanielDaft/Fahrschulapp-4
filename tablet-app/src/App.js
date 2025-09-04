import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import StudentList from './components/StudentList';
import StudentDetail from './components/StudentDetail';
import { createDemoData } from './utils/localStorage';
import './App.css';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Demo-Daten erstellen falls noch keine vorhanden
    createDemoData();
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Fahrschul-App wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App min-h-screen bg-gray-50">
      <BrowserRouter>
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 text-center">
              📚 Deutsche Fahrschul-App
            </h1>
            <p className="text-center text-gray-600 mt-2">
              Offline-Version für iPad
            </p>
          </header>
          
          <Routes>
            <Route path="/" element={<StudentList />} />
            <Route path="/student/:id" element={<StudentDetail />} />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;