from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
from enum import Enum


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Enums for progress tracking
class ProgressStatus(str, Enum):
    NOT_STARTED = "not_started"  # 0 completions 
    ONCE = "once"  # 1 completion - diagonal slash /
    TWICE = "twice"  # 2 completions - cross X
    THRICE = "thrice"  # 3 completions - circle with cross ⊗

# Data Models
class Student(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    surname: str
    date_of_birth: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    wears_glasses: Optional[bool] = None
    theory_exam_passed: Optional[bool] = None
    theory_exam_date: Optional[str] = None
    practical_exam_date: Optional[str] = None
    practical_exam_passed: Optional[bool] = None
    license_number: Optional[str] = None
    instructor_notes: Optional[str] = None
    # Fahrten-Tracking
    ueberlandfahrten: Optional[List[bool]] = Field(default_factory=lambda: [False] * 5)
    autobahnfahrten: Optional[List[bool]] = Field(default_factory=lambda: [False] * 4)
    nachtfahrten: Optional[List[bool]] = Field(default_factory=lambda: [False] * 3)
    uebungsfahrten_ganz: Optional[List[bool]] = Field(default_factory=list)  # Ganze Stunden - unlimited
    uebungsfahrten_halb: Optional[List[bool]] = Field(default_factory=list)  # Halbe Stunden - unlimited
    start_date: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class StudentCreate(BaseModel):
    name: str
    surname: str
    date_of_birth: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    wears_glasses: Optional[bool] = None
    theory_exam_passed: Optional[bool] = None
    theory_exam_date: Optional[str] = None
    practical_exam_date: Optional[str] = None
    practical_exam_passed: Optional[bool] = None
    license_number: Optional[str] = None
    instructor_notes: Optional[str] = None
    # Fahrten-Tracking
    ueberlandfahrten: Optional[List[bool]] = None
    autobahnfahrten: Optional[List[bool]] = None
    nachtfahrten: Optional[List[bool]] = None
    uebungsfahrten_ganz: Optional[List[bool]] = None
    uebungsfahrten_halb: Optional[List[bool]] = None

class TrainingProgress(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    category: str  # e.g., "grundstufe", "aufbaustufe", "leistungsstufe"
    subcategory: str  # e.g., "einstellung", "rollen_schalten" 
    item: str  # specific training item
    status: ProgressStatus = ProgressStatus.NOT_STARTED
    notes: Optional[str] = None
    last_updated: datetime = Field(default_factory=datetime.utcnow)

class ProgressUpdate(BaseModel):
    status: ProgressStatus
    notes: Optional[str] = None

class Note(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    category: str
    subcategory: str
    item: str
    note_text: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class NoteCreate(BaseModel):
    student_id: str
    category: str
    subcategory: str
    item: str
    note_text: str

# Student Management Routes
@api_router.post("/students", response_model=Student)
async def create_student(student: StudentCreate):
    student_dict = student.dict()
    student_obj = Student(**student_dict)
    result = await db.students.insert_one(student_obj.dict())
    if result.inserted_id:
        return student_obj
    raise HTTPException(status_code=400, detail="Failed to create student")

@api_router.get("/students", response_model=List[Student])
async def get_students():
    students = await db.students.find().to_list(1000)
    return [Student(**student) for student in students]

@api_router.get("/students/{student_id}", response_model=Student)
async def get_student(student_id: str):
    student = await db.students.find_one({"id": student_id})
    if student:
        return Student(**student)
    raise HTTPException(status_code=404, detail="Student not found")

@api_router.put("/students/{student_id}", response_model=Student)
async def update_student(student_id: str, student_update: StudentCreate):
    update_data = student_update.dict(exclude_unset=True)
    result = await db.students.update_one(
        {"id": student_id}, 
        {"$set": update_data}
    )
    if result.modified_count:
        updated_student = await db.students.find_one({"id": student_id})
        return Student(**updated_student)
    raise HTTPException(status_code=404, detail="Student not found")

@api_router.delete("/students/{student_id}")
async def delete_student(student_id: str):
    result = await db.students.delete_one({"id": student_id})
    if result.deleted_count:
        # Also delete all related progress and notes
        await db.progress.delete_many({"student_id": student_id})
        await db.notes.delete_many({"student_id": student_id})
        return {"message": "Student deleted successfully"}
    raise HTTPException(status_code=404, detail="Student not found")

# Progress Management Routes
@api_router.get("/students/{student_id}/progress", response_model=List[TrainingProgress])
async def get_student_progress(student_id: str):
    progress_records = await db.progress.find({"student_id": student_id}).to_list(1000)
    return [TrainingProgress(**record) for record in progress_records]

@api_router.post("/students/{student_id}/progress", response_model=TrainingProgress)
async def create_or_update_progress(student_id: str, category: str, subcategory: str, item: str, progress: ProgressUpdate):
    # Check if progress record already exists
    existing = await db.progress.find_one({
        "student_id": student_id,
        "category": category,
        "subcategory": subcategory,
        "item": item
    })
    
    if existing:
        # Update existing record
        update_data = progress.dict(exclude_unset=True)
        update_data["last_updated"] = datetime.utcnow()
        result = await db.progress.update_one(
            {"id": existing["id"]},
            {"$set": update_data}
        )
        if result.modified_count:
            updated_record = await db.progress.find_one({"id": existing["id"]})
            return TrainingProgress(**updated_record)
    else:
        # Create new record
        progress_dict = progress.dict()
        progress_obj = TrainingProgress(
            student_id=student_id,
            category=category,
            subcategory=subcategory,
            item=item,
            **progress_dict
        )
        result = await db.progress.insert_one(progress_obj.dict())
        if result.inserted_id:
            return progress_obj
    
    raise HTTPException(status_code=400, detail="Failed to update progress")

@api_router.put("/progress/{progress_id}", response_model=TrainingProgress)
async def update_progress(progress_id: str, progress: ProgressUpdate):
    update_data = progress.dict(exclude_unset=True)
    update_data["last_updated"] = datetime.utcnow()
    
    result = await db.progress.update_one(
        {"id": progress_id},
        {"$set": update_data}
    )
    
    if result.modified_count:
        updated_record = await db.progress.find_one({"id": progress_id})
        return TrainingProgress(**updated_record)
    
    raise HTTPException(status_code=404, detail="Progress record not found")

# Notes Management Routes
@api_router.get("/students/{student_id}/notes", response_model=List[Note])
async def get_student_notes(student_id: str):
    notes = await db.notes.find({"student_id": student_id}).to_list(1000)
    return [Note(**note) for note in notes]

@api_router.post("/notes", response_model=Note)
async def create_note(note: NoteCreate):
    note_dict = note.dict()
    note_obj = Note(**note_dict)
    result = await db.notes.insert_one(note_obj.dict())
    if result.inserted_id:
        return note_obj
    raise HTTPException(status_code=400, detail="Failed to create note")

@api_router.delete("/notes/{note_id}")
async def delete_note(note_id: str):
    result = await db.notes.delete_one({"id": note_id})
    if result.deleted_count:
        return {"message": "Note deleted successfully"}
    raise HTTPException(status_code=404, detail="Note not found")

# Training Categories Configuration
@api_router.get("/training-categories")
async def get_training_categories():
    """Return the complete training structure based on German driving license card"""
    return {
        "grundstufe": {
            "name": "Grundstufe",
            "subtitle": "Einweisung und Bedienung",
            "color": "#F59E0B",
            "sections": {
                "besonderheiten_einsteigen": {
                    "name": "Besonderheiten beim Einsteigen",
                    "items": ["Besonderheiten beim Einsteigen"]
                },
                "einstellen": {
                    "name": "Einstellen", 
                    "items": ["Sitz", "Spiegel", "Lenkrad", "Kopfstütze"]
                },
                "lenkradhaltung": {
                    "name": "Lenkradhaltung",
                    "items": ["Lenkradhaltung"]
                },
                "pedale": {
                    "name": "Pedale",
                    "items": ["Pedale"]
                },
                "gurt_anlegen": {
                    "name": "Gurt anlegen/anpassen",
                    "items": ["Gurt anlegen/anpassen"]
                },
                "schalt_wahlhebel": {
                    "name": "Schalt-/Wählhebel",
                    "items": ["Schalt-/Wählhebel"]
                },
                "zundschloss": {
                    "name": "Zündschloss",
                    "items": ["Zündschloss"]
                },
                "motor_anlassen": {
                    "name": "Motor anlassen",
                    "items": ["Motor anlassen"]
                },
                "anfahren": {
                    "name": "Anfahren/Anhalteübungen",
                    "items": ["Anfahren/Anhalteübungen"]
                },
                "schaltubungen": {
                    "name": "Schaltübungen (umweltschonend)",
                    "items": ["hoch: 1-2", "2-3", "3-4", "...", "runter: 4-3", "3-2", "2-1", "...", "runter: 4-2", "4-1", "3-1"]
                },
                "lenkubungen": {
                    "name": "Lenkübungen",
                    "items": ["Lenkübungen"]
                }
            }
        },
        "aufbaustufe": {
            "name": "Aufbaustufe", 
            "subtitle": "Umweltschonendes, vorausschauendes Fahren, Blickschulung",
            "color": "#F97316",
            "sections": {
                "rollen_schalten": {
                    "name": "Rollen und Schalten",
                    "items": ["Rollen und Schalten"]
                },
                "abbremsen_schalten": {
                    "name": "Abbremsen und Schalten",
                    "items": ["Abbremsen und Schalten"]
                },
                "bremsübungen": {
                    "name": "Bremsübungen",
                    "items": ["degressiv", "Zielbremsungen", "Gefahrsituationen"]
                },
                "gefalle": {
                    "name": "Gefälle",
                    "items": ["Anhalten", "Anfahren", "Rückwärts", "Sichern", "Schalten"]
                },
                "steigung": {
                    "name": "Steigung", 
                    "items": ["Anhalten", "Anfahren", "Rückwärts", "Sichern", "Schalten"]
                },
                "tastgeschwindigkeit": {
                    "name": "Tastgeschwindigkeit",
                    "items": ["Tastgeschwindigkeit"]
                },
                "bedienungs_kontrolleinrichtungen": {
                    "name": "Bedienungs- und Kontrolleinrichtungen",
                    "items": ["Bedienungs- und Kontrolleinrichtungen"]
                },
                "ortliche_besonderheiten": {
                    "name": "Örtliche Besonderheiten",
                    "items": ["Örtliche Besonderheiten"]
                }
            }
        },
        "leistungsstufe": {
            "name": "Leistungsstufe",
            "subtitle": "Schwierige Verkehrssituationen, umweltschonendes, vorausschauendes Fahren, Blickschulung/Bremsbereitschaft",
            "color": "#EF4444", 
            "sections": {
                "fahrbahnabutzung": {
                    "name": "Fahrbahnbenutzung",
                    "items": ["Einordnen", "Markierungen"]
                },
                "fahrstreifenwechsel": {
                    "name": "Fahrstreifenwechsel",
                    "items": ["links", "rechts"]
                },
                "vorbeifahren": {
                    "name": "Vorbeifahren/Überholen",
                    "items": ["Vorbeifahren/Überholen"]
                },
                "abbiegen": {
                    "name": "Abbiegen",
                    "items": ["rechts", "links", "mehrspurig", "Radweg", "Sonderstreifen", "Straßenbahnen", "Einbahnstraßen"]
                },
                "vorfahrt": {
                    "name": "Vorfahrt",
                    "items": ["rechts vor links", "Grünpfeil", "Polizeibeamte", "Grünpfeil-Schild"]
                },
                "geschwindigkeit_abstand": {
                    "name": "Geschwindigkeit/Abstand",
                    "items": ["Geschwindigkeit/Abstand"]
                },
                "situationen_verkehrsteilnehmer": {
                    "name": "Situationen mit anderen Verkehrsteilnehmern",
                    "items": ["Fußgängerüberwege", "Kinder", "Öffentl. Verkehrsmittel", "Schulbus", "Ältere/Behinderte", "Radfahrer/Mofa", "Einbahnstr./Radfahrer", "Verk.-beruh. Bereich"]
                },
                "schwierige_verkehrsfuhrung": {
                    "name": "Schwierige Verkehrsführung",
                    "items": ["Schwierige Verkehrsführung"]
                },
                "engpass": {
                    "name": "Engpass",
                    "items": ["Engpass"]
                },
                "kreisverkehr": {
                    "name": "Kreisverkehr",
                    "items": ["Kreisverkehr"]
                },
                "bahnubergang": {
                    "name": "Bahnübergang (warten)",
                    "items": ["Bahnübergang (warten)"]
                },
                "kritische_verkehrssituationen": {
                    "name": "Kritische Verkehrssituationen",
                    "items": ["Hauptverkehrszeiten", "Partnerschaftliches Verhalten (Kommunikation, Verzicht auf Vorfahrt)", "Schwung nutzen"]
                },
                "fussganger_schutzbereich": {
                    "name": "Fußgänger Schutzbereich",
                    "items": ["Fußgänger Schutzbereich"]
                }
            }
        },
        "grundfahraufgaben": {
            "name": "Grundfahraufgaben",
            "color": "#F59E0B",
            "sections": {
                "ruckwartsfahren": {
                    "name": "Rückwärtsfahren",
                    "items": ["Rückwärtsfahren"]
                },
                "umkehren": {
                    "name": "Umkehren", 
                    "items": ["Umkehren"]
                },
                "gefahrbremsung": {
                    "name": "Gefahrbremsung",
                    "items": ["Gefahrbremsung"]
                },
                "einparken_langs": {
                    "name": "Einparken längs",
                    "items": ["vorwärts rechts", "vorwärts links", "rückwärts rechts", "rückwärts links"]
                },
                "einparken_quer": {
                    "name": "Einparken quer", 
                    "items": ["vorwärts rechts", "vorwärts links", "rückwärts rechts", "rückwärts links"]
                }
            }
        },
        "uberlandfahrten": {
            "name": "Überlandfahrten",
            "subtitle": "Sicheres und umweltschonendes Fahren mit höheren Geschwindigkeiten auf Landstraßen",
            "color": "#FDE047",
            "sections": {
                "main_items": {
                    "name": "",
                    "items": [
                        "Angepasste Geschwindigkeit/Gangwahl (alle Gänge)"
                    ]
                },
                "abstand": {
                    "name": "Abstand",
                    "items": ["vorne", "hinten", "seitlich"]
                },
                "main_items_2": {
                    "name": "",
                    "items": [
                        "Beobachtung/Spiegel",
                        "Verkehrszeichen",
                        "Kreuzungen/Einmündungen", 
                        "Kurven",
                        "Steigungen",
                        "Gefälle",
                        "Alleen",
                        "Überholen"
                    ]
                },
                "besondere_situationen": {
                    "name": "Besondere Situationen",
                    "items": ["Liegenbleiben • Absichern", "Einfahren in Ortschaften", "Fußgänger", "Wild/Tiere"]
                },
                "besondere_anforderungen": {
                    "name": "Besondere Anforderungen",
                    "items": ["Leistungsgrenze", "Ablenkung", "Konfliktsituationen"]
                }
            }
        },
        "autobahn": {
            "name": "Autobahn",
            "subtitle": "Sicheres und umweltschonendes Fahren mit höheren Geschwindigkeiten auf Autobahnen",
            "color": "#FDE047",
            "sections": {
                "main_items_1": {
                    "name": "",
                    "items": [
                        "Fahrtplanung",
                        "Einfahren in BAB",
                        "Fahrstreifenwahl", 
                        "Geschwindigkeit"
                    ]
                },
                "abstand": {
                    "name": "Abstand",
                    "items": ["vorne", "hinten", "seitlich"]
                },
                "main_items_2": {
                    "name": "",
                    "items": [
                        "Überholen",
                        "Schilder/Markierungen",
                        "Vorbeifahren/Anschlussstellen",
                        "Rast-/Parkplätze, Tankstellen",
                        "Verhalten bei Unfällen",
                        "Dichter Verkehr/Stau",
                        "Besondere Situationen"
                    ]
                },
                "besondere_anforderungen": {
                    "name": "Besondere Anforderungen",
                    "items": ["Leistungsgrenze", "Ablenkung", "Konfliktsituationen"]
                },
                "final_items": {
                    "name": "",
                    "items": ["Verlassen der BAB"]
                }
            }
        },
        "dammerung_dunkelheit": {
            "name": "Dämmerung/Dunkelheit", 
            "subtitle": "Kontrollieren/Einschalten der Beleuchtungseinrichtungen",
            "color": "#FDE047",
            "sections": {
                "beleuchtung": {
                    "name": "Beleuchtung",
                    "items": ["Kontrolle", "Benutzung", "Einstellen", "Fernlicht"]
                },
                "main_items": {
                    "name": "",
                    "items": [
                        "Beleuchtete Straßen",
                        "Unbeleuchtete Straßen", 
                        "Parken"
                    ]
                },
                "besondere_situationen": {
                    "name": "Besondere Situationen",
                    "items": ["Schlechte Witterung", "Bahnübergänge", "Tiere", "Unbeleuchtete Verkehrsteilnehmer"]
                },
                "besondere_anforderungen": {
                    "name": "Besondere Anforderungen",
                    "items": ["Blendung", "Orientierung"]
                },
                "final_items": {
                    "name": "",
                    "items": ["Abschlussbesprechung"]
                }
            }
        },
        "reife_teststufe": {
            "name": "Reife- und Teststufe",
            "subtitle": "Abschluss der Ausbildung - Prüfungsvorbereitung",
            "color": "#10B981",
            "sections": {
                "selbststandiges_fahren": {
                    "name": "Selbstständiges Fahren",
                    "items": ["innerorts", "außerorts"]
                },
                "verantwortungsbewusstes_fahren": {
                    "name": "Verantwortungsbewusstes Fahren",
                    "items": ["Verantwortungsbewusstes Fahren"]
                },
                "testfahrt": {
                    "name": "Testfahrt unter Prüfungsbedingungen",
                    "items": ["FAKT", "andere"]
                },
                "wiederholung": {
                    "name": "Wiederholung/Vertiefung",
                    "items": ["Wiederholung/Vertiefung"]
                },
                "leistungsbewertung": {
                    "name": "Leistungsbewertung", 
                    "items": ["Leistungsbewertung"]
                }
            }
        },
        "situative_bausteine": {
            "name": "Situative Bausteine",
            "color": "#60A5FA",
            "sections": {
                "fahrerassistenzsysteme": {
                    "name": "Fahrerassistenzsysteme",
                    "items": ["Bedienung der Fahrerassistenzsysteme"]
                },
                "fahrtechnische_vorbereitung": {
                    "name": "Checkliste zur fahrtechnischen Vorbereitung",
                    "sections": {
                        "fahrzeug": {
                            "name": "Beim Fahrzeug",
                            "items": ["Reifen (z.B. Beschädigungen, Profiltiefe, Reifendruck)"]
                        },
                        "scheiben_leuchten": {
                            "name": "Scheiben, Leuchten, Blinker, Hupe",
                            "items": ["Ein- und Ausschalten"]
                        },
                        "funktion_prufen": {
                            "name": "Funktion prüfen",
                            "items": ["Standlicht", "Abblendlicht", "Fernlicht", "Schlussleucht m. Kennzeichenbeleuchtung", "Nebelschlussleuchte", "Warnblinkanlage", "Blinker", "Hupe", "Bremsleuchte"]
                        },
                        "kontrollleuchten": {
                            "name": "Kontrollleuchten benennen",
                            "items": ["Kontrollleuchten benennen"]
                        },
                        "ruckstrahler": {
                            "name": "Rückstrahler",
                            "items": ["Vorhandensein", "Beschädigung"]
                        },
                        "lenkung": {
                            "name": "Lenkung",
                            "items": ["Lenkschloss entriegeln", "Überprüfen des Lenkspiels"]
                        },
                        "bremsen": {
                            "name": "Funktionsprüfung der Bremsen",
                            "items": ["Betriebsbremse", "Feststellbremse"]
                        }
                    }
                }
            }
        },
        "beim_fahrer": {
            "name": "Beim Fahrer (vor Fahrtbeginn)",
            "subtitle": "Richtige Sitzeinstellung",
            "color": "#60A5FA",
            "sections": {
                "sitzeinstellung": {
                    "name": "Richtige Sitzeinstellung",
                    "items": ["Richtige Sitzeinstellung"]
                },
                "ruckspiegeleinstellung": {
                    "name": "Einstellung der Rückspiegel",
                    "items": ["der Kopfstütze", "des Lenkrades"]
                },
                "sicherheitsgurt": {
                    "name": "Anlegen des Sicherheitsgurtes",
                    "items": ["Anlegen des Sicherheitsgurtes"]
                }
            }
        },
        "heizung_luftung": {
            "name": "Heizung und Lüftung",
            "color": "#60A5FA",
            "sections": {
                "bedienen_aggregate": {
                    "name": "Bedienen der Aggregate",
                    "items": ["Heizung", "Lüftung", "Klimaanlage", "Heckscheibenheizung", "Beheizte Sonderausstattungen"]
                },
                "energiesparende_nutzung": {
                    "name": "Energiesparende Nutzung",
                    "items": ["keine unnötigen Verbraucher", "Rechtzeitiges Abschalten"]
                }
            }
        },
        "betriebs_verkehrssicherheit": {
            "name": "Betriebs- und Verkehrssicherheit",
            "color": "#60A5FA",
            "sections": {
                "motorraum": {
                    "name": "Motorraum/Flüssigkeitsstände",
                    "items": ["Motoröl", "Kühlmittel", "Scheibenwischflüssigkeit"]
                },
                "tanken": {
                    "name": "Tanken",
                    "items": ["Tanken"]
                },
                "sicherungsmittel": {
                    "name": "Sicherungsmittel",
                    "items": ["Warndreieck", "Verbandskasten", "Bordwerkzeug", "zusätzliche Ausrüstung"]
                },
                "aussenkontrolle": {
                    "name": "Außenkontrolle (Schäden, Sauberkeit)",
                    "items": ["Scheiben/Wischer", "Spiegel", "Kennzeichen(HU/AU)", "Beleuchtung"]
                },
                "bremsen": {
                    "name": "Bremsen",
                    "items": ["Bremsen"]
                },
                "ladung": {
                    "name": "Ladung",
                    "items": ["Sicherung", "Kennzeichnung"]
                }
            }
        },
        "witterung": {
            "name": "Witterung",
            "subtitle": "Fahren bei verschiedenen Witterungsbedingungen",
            "color": "#60A5FA",
            "sections": {
                "schlechte_witterung": {
                    "name": "Fahren bei schlechter Witterung",
                    "items": ["Lüftung", "Beleuchtung", "Scheibenwischer/-wascher", "Regen, Sprühnebel", "Wasserlachen, Aquaplaning", "Wind, Sturm, Böen", "Schnee und Matsch", "Eis"]
                }
            }
        }
    }

# Fahrten Update Route
@api_router.put("/students/{student_id}/fahrten")
async def update_student_fahrten(student_id: str, fahrten_data: dict):
    """Update specific driving lessons for a student"""
    try:
        result = await db.students.update_one(
            {"id": student_id},
            {"$set": fahrten_data}
        )
        
        if result.modified_count:
            updated_student = await db.students.find_one({"id": student_id})
            return Student(**updated_student)
        
        raise HTTPException(status_code=404, detail="Student not found")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating fahrten: {str(e)}")

# Overall Progress Route
@api_router.get("/students/{student_id}/overall-progress")
async def get_student_overall_progress(student_id: str):
    """Get overall progress statistics for a student across all categories"""
    try:
        # Get all progress records for the student
        progress_records = await db.progress.find({"student_id": student_id}).to_list(1000)
        
        # Get training categories structure
        categories_response = await get_training_categories()
        
        total_items = 0
        total_completed = 0
        
        # Count all items across all categories
        for category_key, category in categories_response.items():
            category_total = 0
            
            # Count total items in this category
            for section_key, section in category['sections'].items():
                if 'sections' in section:  # Has nested sections
                    for sub_section_key, sub_section in section['sections'].items():
                        if 'items' in sub_section:
                            category_total += len(sub_section['items'])
                elif 'items' in section:  # Has direct items
                    category_total += len(section['items'])
            
            total_items += category_total
        
        # Count completed items (any status other than not_started)
        for progress in progress_records:
            if progress['status'] in ['once', 'twice', 'thrice']:
                total_completed += 1
        
        completion_percentage = round((total_completed / total_items * 100) if total_items > 0 else 0)
        
        return {
            'total_items': total_items,
            'total_completed': total_completed,
            'completion_percentage': completion_percentage
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating overall progress: {str(e)}")

# Practice Hours Management Routes
@api_router.post("/students/{student_id}/practice-hours")
async def add_practice_hour(student_id: str, hour_type: str = Query(...), duration: float = Query(...)):
    """Add a practice hour to a student (0.5 or 1.0 hours)"""
    try:
        if hour_type not in ["ganz", "halb"] or duration not in [0.5, 1.0]:
            raise HTTPException(status_code=400, detail="Invalid hour type or duration")
        
        # Get current student data
        student = await db.students.find_one({"id": student_id})
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        # Determine which array to update
        field_name = f"uebungsfahrten_{hour_type}"
        current_array = student.get(field_name, [])
        
        # Add new hour (True value)
        updated_array = current_array + [True]
        
        # Update student
        result = await db.students.update_one(
            {"id": student_id},
            {"$set": {field_name: updated_array}}
        )
        
        if result.modified_count:
            updated_student = await db.students.find_one({"id": student_id})
            return Student(**updated_student)
        
        raise HTTPException(status_code=400, detail="Failed to add practice hour")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding practice hour: {str(e)}")

@api_router.delete("/students/{student_id}/practice-hours")
async def remove_practice_hour(student_id: str, hour_type: str = Query(...), index: int = Query(...)):
    """Remove a practice hour from a student"""
    try:
        if hour_type not in ["ganz", "halb"]:
            raise HTTPException(status_code=400, detail="Invalid hour type")
        
        # Get current student data
        student = await db.students.find_one({"id": student_id})
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        # Determine which array to update
        field_name = f"uebungsfahrten_{hour_type}"
        current_array = student.get(field_name, [])
        
        # Check if index is valid
        if index < 0 or index >= len(current_array):
            raise HTTPException(status_code=400, detail="Invalid index")
        
        # Remove hour at index
        updated_array = current_array[:index] + current_array[index+1:]
        
        # Update student
        result = await db.students.update_one(
            {"id": student_id},
            {"$set": {field_name: updated_array}}
        )
        
        if result.modified_count:
            updated_student = await db.students.find_one({"id": student_id})
            return Student(**updated_student)
        
        raise HTTPException(status_code=400, detail="Failed to remove practice hour")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error removing practice hour: {str(e)}")

# Progress Statistics Route
@api_router.get("/students/{student_id}/progress-stats")
async def get_student_progress_stats(student_id: str):
    """Get progress statistics for each category"""
    try:
        # Get all progress records for the student
        progress_records = await db.progress.find({"student_id": student_id}).to_list(1000)
        
        # Get training categories structure
        categories_response = await get_training_categories()
        
        stats = {}
        
        for category_key, category in categories_response.items():
            total_items = 0
            completed_items = {
                'once': 0,
                'twice': 0, 
                'thrice': 0
            }
            
            # Count total items in this category
            for section_key, section in category['sections'].items():
                if 'sections' in section:  # Has nested sections
                    for sub_section_key, sub_section in section['sections'].items():
                        if 'items' in sub_section:
                            total_items += len(sub_section['items'])
                elif 'items' in section:  # Has direct items
                    total_items += len(section['items'])
            
            # Count completed items
            for progress in progress_records:
                if progress['category'] == category_key:
                    if progress['status'] in completed_items:
                        completed_items[progress['status']] += 1
            
            total_completed = sum(completed_items.values())
            completion_percentage = round((total_completed / total_items * 100) if total_items > 0 else 0)
            
            stats[category_key] = {
                'total_items': total_items,
                'completed_items': completed_items,
                'total_completed': total_completed,
                'completion_percentage': completion_percentage,
                'color': category['color']
            }
        
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating progress stats: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
