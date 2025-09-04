#!/usr/bin/env python3
"""
Comprehensive Backend Tests for Driving Lesson Tracking App
Tests all API endpoints and functionality as specified in the review request.
"""

import requests
import json
import uuid
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://todo-progress.preview.emergentagent.com')
BASE_URL = f"{BACKEND_URL}/api"

print(f"Testing backend at: {BASE_URL}")

class BackendTester:
    def __init__(self):
        self.test_student_id = None
        self.test_progress_id = None
        self.test_note_id = None
        self.passed_tests = 0
        self.failed_tests = 0
        
    def log_test(self, test_name, success, message=""):
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if message:
            print(f"   {message}")
        
        if success:
            self.passed_tests += 1
        else:
            self.failed_tests += 1
    
    def test_student_management(self):
        """Test all student CRUD operations"""
        print("\n=== TESTING STUDENT MANAGEMENT ===")
        
        # Test 1: Create Student
        student_data = {
            "name": "Max",
            "surname": "Mustermann", 
            "date_of_birth": "1995-06-15",
            "address": "Musterstraße 123, 12345 Berlin",
            "phone": "+49 30 12345678"
        }
        
        try:
            response = requests.post(f"{BASE_URL}/students", json=student_data)
            if response.status_code == 200:
                student = response.json()
                self.test_student_id = student['id']
                self.log_test("Create Student", True, f"Created student with ID: {self.test_student_id}")
                
                # Verify all fields are saved correctly
                expected_fields = ['id', 'name', 'surname', 'date_of_birth', 'address', 'phone', 'start_date', 'created_at']
                missing_fields = [field for field in expected_fields if field not in student]
                if not missing_fields:
                    self.log_test("Student Fields Validation", True, "All required fields present")
                else:
                    self.log_test("Student Fields Validation", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Create Student", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Create Student", False, f"Exception: {str(e)}")
            return False
        
        # Test 2: Get All Students
        try:
            response = requests.get(f"{BASE_URL}/students")
            if response.status_code == 200:
                students = response.json()
                if isinstance(students, list) and len(students) > 0:
                    self.log_test("Get All Students", True, f"Retrieved {len(students)} students")
                else:
                    self.log_test("Get All Students", False, "No students returned or invalid format")
            else:
                self.log_test("Get All Students", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Get All Students", False, f"Exception: {str(e)}")
        
        # Test 3: Get Specific Student
        if self.test_student_id:
            try:
                response = requests.get(f"{BASE_URL}/students/{self.test_student_id}")
                if response.status_code == 200:
                    student = response.json()
                    if student['name'] == student_data['name'] and student['surname'] == student_data['surname']:
                        self.log_test("Get Specific Student", True, "Student data matches")
                    else:
                        self.log_test("Get Specific Student", False, "Student data mismatch")
                else:
                    self.log_test("Get Specific Student", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_test("Get Specific Student", False, f"Exception: {str(e)}")
        
        # Test 4: Update Student
        if self.test_student_id:
            update_data = {
                "name": "Max Updated",
                "surname": "Mustermann Updated",
                "phone": "+49 30 87654321"
            }
            try:
                response = requests.put(f"{BASE_URL}/students/{self.test_student_id}", json=update_data)
                if response.status_code == 200:
                    updated_student = response.json()
                    if updated_student['name'] == update_data['name']:
                        self.log_test("Update Student", True, "Student updated successfully")
                    else:
                        self.log_test("Update Student", False, "Update data not reflected")
                else:
                    self.log_test("Update Student", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_test("Update Student", False, f"Exception: {str(e)}")
        
        # Test 5: Error Handling - Invalid Student ID
        try:
            response = requests.get(f"{BASE_URL}/students/invalid-id")
            if response.status_code == 404:
                self.log_test("Invalid Student ID Error Handling", True, "Correctly returned 404")
            else:
                self.log_test("Invalid Student ID Error Handling", False, f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_test("Invalid Student ID Error Handling", False, f"Exception: {str(e)}")
        
        return True
    
    def test_progress_tracking(self):
        """Test progressive marking system and progress tracking"""
        print("\n=== TESTING PROGRESS TRACKING ===")
        
        if not self.test_student_id:
            self.log_test("Progress Tracking Setup", False, "No test student available")
            return False
        
        # Test 1: Create Progress - Test progressive states
        progress_states = ["not_started", "once", "twice", "thrice"]
        category = "grundstufe"
        subcategory = "einstellen"
        item = "Sitz"
        
        for i, status in enumerate(progress_states):
            try:
                progress_data = {
                    "status": status,
                    "notes": f"Test note for {status} state"
                }
                
                response = requests.post(
                    f"{BASE_URL}/students/{self.test_student_id}/progress",
                    params={"category": category, "subcategory": subcategory, "item": item},
                    json=progress_data
                )
                
                if response.status_code == 200:
                    progress = response.json()
                    if i == 0:  # Store first progress ID for later tests
                        self.test_progress_id = progress['id']
                    
                    if progress['status'] == status:
                        self.log_test(f"Progress State: {status}", True, f"Successfully set to {status}")
                    else:
                        self.log_test(f"Progress State: {status}", False, f"Expected {status}, got {progress['status']}")
                else:
                    self.log_test(f"Progress State: {status}", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_test(f"Progress State: {status}", False, f"Exception: {str(e)}")
        
        # Test 2: Get Student Progress
        try:
            response = requests.get(f"{BASE_URL}/students/{self.test_student_id}/progress")
            if response.status_code == 200:
                progress_list = response.json()
                if isinstance(progress_list, list) and len(progress_list) > 0:
                    self.log_test("Get Student Progress", True, f"Retrieved {len(progress_list)} progress records")
                else:
                    self.log_test("Get Student Progress", False, "No progress records found")
            else:
                self.log_test("Get Student Progress", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Get Student Progress", False, f"Exception: {str(e)}")
        
        # Test 3: Update Specific Progress
        if self.test_progress_id:
            try:
                update_data = {
                    "status": "twice",
                    "notes": "Updated progress note"
                }
                response = requests.put(f"{BASE_URL}/progress/{self.test_progress_id}", json=update_data)
                if response.status_code == 200:
                    updated_progress = response.json()
                    if updated_progress['status'] == "twice":
                        self.log_test("Update Specific Progress", True, "Progress updated successfully")
                    else:
                        self.log_test("Update Specific Progress", False, "Update not reflected")
                else:
                    self.log_test("Update Specific Progress", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_test("Update Specific Progress", False, f"Exception: {str(e)}")
        
        # Test 4: Test Multiple Training Items
        training_items = [
            ("grundstufe", "einstellen", "Spiegel"),
            ("aufbaustufe", "rollen_schalten", "Rollen und Schalten"),
            ("leistungsstufe", "abbiegen", "rechts")
        ]
        
        for category, subcategory, item in training_items:
            try:
                progress_data = {"status": "once", "notes": f"Test for {item}"}
                response = requests.post(
                    f"{BASE_URL}/students/{self.test_student_id}/progress",
                    params={"category": category, "subcategory": subcategory, "item": item},
                    json=progress_data
                )
                
                if response.status_code == 200:
                    self.log_test(f"Multiple Items: {item}", True, f"Created progress for {item}")
                else:
                    self.log_test(f"Multiple Items: {item}", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_test(f"Multiple Items: {item}", False, f"Exception: {str(e)}")
        
        return True
    
    def test_notes_system(self):
        """Test notes functionality"""
        print("\n=== TESTING NOTES SYSTEM ===")
        
        if not self.test_student_id:
            self.log_test("Notes System Setup", False, "No test student available")
            return False
        
        # Test 1: Create Note
        note_data = {
            "student_id": self.test_student_id,
            "category": "grundstufe",
            "subcategory": "einstellen",
            "item": "Sitz",
            "note_text": "Student needs more practice with seat adjustment. Remember to check mirrors after seat adjustment."
        }
        
        try:
            response = requests.post(f"{BASE_URL}/notes", json=note_data)
            if response.status_code == 200:
                note = response.json()
                self.test_note_id = note['id']
                self.log_test("Create Note", True, f"Created note with ID: {self.test_note_id}")
                
                # Verify note content
                if note['note_text'] == note_data['note_text']:
                    self.log_test("Note Content Validation", True, "Note text matches")
                else:
                    self.log_test("Note Content Validation", False, "Note text mismatch")
            else:
                self.log_test("Create Note", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Create Note", False, f"Exception: {str(e)}")
        
        # Test 2: Get Student Notes
        try:
            response = requests.get(f"{BASE_URL}/students/{self.test_student_id}/notes")
            if response.status_code == 200:
                notes = response.json()
                if isinstance(notes, list) and len(notes) > 0:
                    self.log_test("Get Student Notes", True, f"Retrieved {len(notes)} notes")
                else:
                    self.log_test("Get Student Notes", False, "No notes found")
            else:
                self.log_test("Get Student Notes", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Get Student Notes", False, f"Exception: {str(e)}")
        
        # Test 3: Create Multiple Notes for Different Items
        additional_notes = [
            {
                "student_id": self.test_student_id,
                "category": "aufbaustufe",
                "subcategory": "bremsübungen",
                "item": "degressiv",
                "note_text": "Good progress with degressive braking technique."
            },
            {
                "student_id": self.test_student_id,
                "category": "leistungsstufe",
                "subcategory": "abbiegen",
                "item": "links",
                "note_text": "Needs to improve observation when turning left."
            }
        ]
        
        for note_data in additional_notes:
            try:
                response = requests.post(f"{BASE_URL}/notes", json=note_data)
                if response.status_code == 200:
                    self.log_test(f"Additional Note: {note_data['item']}", True, f"Created note for {note_data['item']}")
                else:
                    self.log_test(f"Additional Note: {note_data['item']}", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_test(f"Additional Note: {note_data['item']}", False, f"Exception: {str(e)}")
        
        return True
    
    def test_training_categories(self):
        """Test training categories API"""
        print("\n=== TESTING TRAINING CATEGORIES ===")
        
        try:
            response = requests.get(f"{BASE_URL}/training-categories")
            if response.status_code == 200:
                categories = response.json()
                
                # Test structure matches German driving license card
                expected_categories = ["grundstufe", "aufbaustufe", "leistungsstufe", "sonderfahrten", "grundfahraufgaben"]
                
                missing_categories = [cat for cat in expected_categories if cat not in categories]
                if not missing_categories:
                    self.log_test("Training Categories Structure", True, "All main categories present")
                else:
                    self.log_test("Training Categories Structure", False, f"Missing categories: {missing_categories}")
                
                # Test specific category content
                if "grundstufe" in categories:
                    grundstufe = categories["grundstufe"]
                    if "sections" in grundstufe and "einstellen" in grundstufe["sections"]:
                        einstellen = grundstufe["sections"]["einstellen"]
                        expected_items = ["Sitz", "Spiegel", "Lenkrad", "Kopfstütze"]
                        if "items" in einstellen and all(item in einstellen["items"] for item in expected_items):
                            self.log_test("Grundstufe Content Validation", True, "Einstellen section has correct items")
                        else:
                            self.log_test("Grundstufe Content Validation", False, "Einstellen section missing items")
                    else:
                        self.log_test("Grundstufe Content Validation", False, "Einstellen section not found")
                
                # Test color coding
                if "grundstufe" in categories and "color" in categories["grundstufe"]:
                    self.log_test("Category Color Coding", True, "Categories have color information")
                else:
                    self.log_test("Category Color Coding", False, "Missing color information")
                
            else:
                self.log_test("Get Training Categories", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Get Training Categories", False, f"Exception: {str(e)}")
        
        return True
    
    def test_data_persistence(self):
        """Test data persistence by retrieving created data"""
        print("\n=== TESTING DATA PERSISTENCE ===")
        
        if not self.test_student_id:
            self.log_test("Data Persistence", False, "No test student to verify persistence")
            return False
        
        # Verify student data persists
        try:
            response = requests.get(f"{BASE_URL}/students/{self.test_student_id}")
            if response.status_code == 200:
                student = response.json()
                if student['name'] == "Max Updated":  # From our update test
                    self.log_test("Student Data Persistence", True, "Student updates persisted")
                else:
                    self.log_test("Student Data Persistence", False, "Student updates not persisted")
            else:
                self.log_test("Student Data Persistence", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Student Data Persistence", False, f"Exception: {str(e)}")
        
        # Verify progress data persists
        try:
            response = requests.get(f"{BASE_URL}/students/{self.test_student_id}/progress")
            if response.status_code == 200:
                progress_list = response.json()
                if len(progress_list) >= 4:  # We created multiple progress records
                    self.log_test("Progress Data Persistence", True, f"All {len(progress_list)} progress records persisted")
                else:
                    self.log_test("Progress Data Persistence", False, f"Expected >=4 records, found {len(progress_list)}")
            else:
                self.log_test("Progress Data Persistence", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Progress Data Persistence", False, f"Exception: {str(e)}")
        
        # Verify notes data persists
        try:
            response = requests.get(f"{BASE_URL}/students/{self.test_student_id}/notes")
            if response.status_code == 200:
                notes = response.json()
                if len(notes) >= 3:  # We created multiple notes
                    self.log_test("Notes Data Persistence", True, f"All {len(notes)} notes persisted")
                else:
                    self.log_test("Notes Data Persistence", False, f"Expected >=3 notes, found {len(notes)}")
            else:
                self.log_test("Notes Data Persistence", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Notes Data Persistence", False, f"Exception: {str(e)}")
        
        return True
    
    def test_cascading_deletes(self):
        """Test that deleting a student removes associated progress and notes"""
        print("\n=== TESTING CASCADING DELETES ===")
        
        if not self.test_student_id:
            self.log_test("Cascading Deletes", False, "No test student for delete test")
            return False
        
        # First, verify we have progress and notes
        try:
            progress_response = requests.get(f"{BASE_URL}/students/{self.test_student_id}/progress")
            notes_response = requests.get(f"{BASE_URL}/students/{self.test_student_id}/notes")
            
            progress_count = len(progress_response.json()) if progress_response.status_code == 200 else 0
            notes_count = len(notes_response.json()) if notes_response.status_code == 200 else 0
            
            self.log_test("Pre-Delete Data Check", True, f"Found {progress_count} progress records and {notes_count} notes")
        except Exception as e:
            self.log_test("Pre-Delete Data Check", False, f"Exception: {str(e)}")
        
        # Delete the student
        try:
            response = requests.delete(f"{BASE_URL}/students/{self.test_student_id}")
            if response.status_code == 200:
                self.log_test("Delete Student", True, "Student deleted successfully")
                
                # Verify student is gone
                verify_response = requests.get(f"{BASE_URL}/students/{self.test_student_id}")
                if verify_response.status_code == 404:
                    self.log_test("Student Deletion Verification", True, "Student no longer exists")
                else:
                    self.log_test("Student Deletion Verification", False, "Student still exists after deletion")
                
                # Verify progress records are gone
                progress_response = requests.get(f"{BASE_URL}/students/{self.test_student_id}/progress")
                if progress_response.status_code == 200:
                    remaining_progress = progress_response.json()
                    if len(remaining_progress) == 0:
                        self.log_test("Progress Cascading Delete", True, "All progress records deleted")
                    else:
                        self.log_test("Progress Cascading Delete", False, f"{len(remaining_progress)} progress records remain")
                
                # Verify notes are gone
                notes_response = requests.get(f"{BASE_URL}/students/{self.test_student_id}/notes")
                if notes_response.status_code == 200:
                    remaining_notes = notes_response.json()
                    if len(remaining_notes) == 0:
                        self.log_test("Notes Cascading Delete", True, "All notes deleted")
                    else:
                        self.log_test("Notes Cascading Delete", False, f"{len(remaining_notes)} notes remain")
                
            else:
                self.log_test("Delete Student", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Delete Student", False, f"Exception: {str(e)}")
        
        return True
    
    def test_error_handling(self):
        """Test error handling for invalid requests"""
        print("\n=== TESTING ERROR HANDLING ===")
        
        # Test invalid student ID formats
        invalid_ids = ["", "invalid-uuid", "12345", "null"]
        
        for invalid_id in invalid_ids:
            try:
                response = requests.get(f"{BASE_URL}/students/{invalid_id}")
                if response.status_code == 404:
                    self.log_test(f"Invalid ID Handling: {invalid_id}", True, "Correctly returned 404")
                else:
                    self.log_test(f"Invalid ID Handling: {invalid_id}", False, f"Expected 404, got {response.status_code}")
            except Exception as e:
                self.log_test(f"Invalid ID Handling: {invalid_id}", False, f"Exception: {str(e)}")
        
        # Test invalid progress status
        if self.test_student_id:  # This will be None after deletion, so create a new student
            try:
                # Create a temporary student for error testing
                temp_student = {
                    "name": "Test",
                    "surname": "Error"
                }
                response = requests.post(f"{BASE_URL}/students", json=temp_student)
                if response.status_code == 200:
                    temp_id = response.json()['id']
                    
                    # Test invalid progress status
                    invalid_progress = {
                        "status": "invalid_status",
                        "notes": "Test note"
                    }
                    
                    progress_response = requests.post(
                        f"{BASE_URL}/students/{temp_id}/progress",
                        params={"category": "test", "subcategory": "test", "item": "test"},
                        json=invalid_progress
                    )
                    
                    if progress_response.status_code == 422:  # Validation error
                        self.log_test("Invalid Progress Status", True, "Correctly rejected invalid status")
                    else:
                        self.log_test("Invalid Progress Status", False, f"Expected 422, got {progress_response.status_code}")
                    
                    # Clean up temp student
                    requests.delete(f"{BASE_URL}/students/{temp_id}")
                    
            except Exception as e:
                self.log_test("Invalid Progress Status", False, f"Exception: {str(e)}")
        
        return True
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Comprehensive Backend Tests for Driving Lesson Tracking App")
        print("=" * 80)
        
        # Run all test suites
        self.test_student_management()
        self.test_progress_tracking()
        self.test_notes_system()
        self.test_training_categories()
        self.test_data_persistence()
        self.test_cascading_deletes()
        self.test_error_handling()
        
        # Print summary
        print("\n" + "=" * 80)
        print("🏁 TEST SUMMARY")
        print("=" * 80)
        print(f"✅ Passed: {self.passed_tests}")
        print(f"❌ Failed: {self.failed_tests}")
        print(f"📊 Total: {self.passed_tests + self.failed_tests}")
        
        if self.failed_tests == 0:
            print("🎉 ALL TESTS PASSED! Backend is working correctly.")
        else:
            print(f"⚠️  {self.failed_tests} tests failed. Please review the issues above.")
        
        return self.failed_tests == 0

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)