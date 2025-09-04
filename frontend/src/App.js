import { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import { Button } from "./components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./components/ui/card";
import { Plus, Minus, Clock } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PracticeHoursView = () => {
  const [practiceHours, setPracticeHours] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPracticeHours = async () => {
    try {
      const response = await axios.get(`${API}/practice-hours`);
      setPracticeHours(response.data);
    } catch (error) {
      console.error("Error fetching practice hours:", error);
    }
  };

  const addPracticeHour = async (duration) => {
    setLoading(true);
    try {
      await axios.post(`${API}/practice-hours`, { duration });
      await fetchPracticeHours();
    } catch (error) {
      console.error("Error adding practice hour:", error);
    } finally {
      setLoading(false);
    }
  };

  const removePracticeHour = async (hourId) => {
    setLoading(true);
    try {
      await axios.delete(`${API}/practice-hours/${hourId}`);
      await fetchPracticeHours();
    } catch (error) {
      console.error("Error removing practice hour:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPracticeHours();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Clock className="w-6 h-6" />
              Fahrschule - Übungsfahrten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <Button
                onClick={() => addPracticeHour(1.0)}
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                + 1 Stunde
              </Button>
              <Button
                onClick={() => addPracticeHour(0.5)}
                disabled={loading}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4" />
                + 0,5 Stunden
              </Button>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Übungsstunden:</h3>
              {practiceHours.length === 0 ? (
                <p className="text-gray-500 italic">Noch keine Übungsstunden hinzugefügt.</p>
              ) : (
                practiceHours.map((hour) => (
                  <div
                    key={hour.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">
                        {hour.duration === 1.0 ? '1,0' : '0,5'} Stunden
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(hour.date)}
                      </span>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removePracticeHour(hour.id)}
                      disabled={loading}
                      className="flex items-center gap-1"
                    >
                      <Minus className="w-3 h-3" />
                      Entfernen
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PracticeHoursView />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;