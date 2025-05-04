-- Use the database
USE FINAL_PROJECT_OOSE;

-- Insert sample data into Role table
INSERT INTO Role (roleName) VALUES 
('administrator'),
('doctor'),
('patient'),
('lab_technician');

-- All users have the same password: "password"
-- The password is stored as a bcrypt hash: $2a$12$ZYlEJnSQDFI4qy/s9jYo6O9vKqKOQCULgUpKS1vt5/FrA.iCVEsvy
-- Insert sample data into User table
INSERT INTO User (email, password, fullName, gender, dob, phoneNumber, address, accountStatus, roleId) VALUES
-- Administrators
('admin@hospital.com', '$2a$12$ZYlEJnSQDFI4qy/s9jYo6O9vKqKOQCULgUpKS1vt5/FrA.iCVEsvy', 'Admin User', 'Male', '1975-05-10', '0901234567', '123 Admin St', 'active', 1),
('manager@hospital.com', '$2a$12$ZYlEJnSQDFI4qy/s9jYo6O9vKqKOQCULgUpKS1vt5/FrA.iCVEsvy', 'Manager User', 'Female', '1980-11-22', '0901234568', '124 Admin St', 'active', 1),

-- Doctors
('drsmith@hospital.com', '$2a$12$ZYlEJnSQDFI4qy/s9jYo6O9vKqKOQCULgUpKS1vt5/FrA.iCVEsvy', 'Dr. John Smith', 'Male', '1978-09-15', '0901234569', '125 Doctor St', 'active', 2),
('drnguyen@hospital.com', '$2a$12$ZYlEJnSQDFI4qy/s9jYo6O9vKqKOQCULgUpKS1vt5/FrA.iCVEsvy', 'Dr. Nguyen Van A', 'Male', '1982-03-20', '0901234570', '126 Doctor St', 'active', 2),
('drpham@hospital.com', '$2a$12$ZYlEJnSQDFI4qy/s9jYo6O9vKqKOQCULgUpKS1vt5/FrA.iCVEsvy', 'Dr. Pham Thi B', 'Female', '1985-07-01', '0901234571', '127 Doctor St', 'active', 2),
('drle@hospital.com', '$2a$12$ZYlEJnSQDFI4qy/s9jYo6O9vKqKOQCULgUpKS1vt5/FrA.iCVEsvy', 'Dr. Le Van C', 'Male', '1976-12-05', '0901234572', '128 Doctor St', 'active', 2),
('drtran@hospital.com', '$2a$12$ZYlEJnSQDFI4qy/s9jYo6O9vKqKOQCULgUpKS1vt5/FrA.iCVEsvy', 'Dr. Tran Thi D', 'Female', '1988-02-28', '0901234573', '129 Doctor St', 'active', 2),

-- Patients
('patient1@example.com', '$2a$12$ZYlEJnSQDFI4qy/s9jYo6O9vKqKOQCULgUpKS1vt5/FrA.iCVEsvy', 'Nguyen Van X', 'Male', '1990-06-11', '0901234574', '130 Patient St', 'active', 3),
('patient2@example.com', '$2a$12$ZYlEJnSQDFI4qy/s9jYo6O9vKqKOQCULgUpKS1vt5/FrA.iCVEsvy', 'Tran Thi Y', 'Female', '1995-08-19', '0901234575', '131 Patient St', 'active', 3),
('patient3@example.com', '$2a$12$ZYlEJnSQDFI4qy/s9jYo6O9vKqKOQCULgUpKS1vt5/FrA.iCVEsvy', 'Le Van Z', 'Male', '1988-10-30', '0901234576', '132 Patient St', 'active', 3),
('patient4@example.com', '$2a$12$ZYlEJnSQDFI4qy/s9jYo6O9vKqKOQCULgUpKS1vt5/FrA.iCVEsvy', 'Pham Van K', 'Male', '2001-04-14', '0901234577', '133 Patient St', 'active', 3),
('patient5@example.com', '$2a$12$ZYlEJnSQDFI4qy/s9jYo6O9vKqKOQCULgUpKS1vt5/FrA.iCVEsvy', 'Hoang Thi L', 'Female', '1992-11-07', '0901234578', '134 Patient St', 'active', 3),

-- Lab Technicians
('lab1@hospital.com', '$2a$12$ZYlEJnSQDFI4qy/s9jYo6O9vKqKOQCULgUpKS1vt5/FrA.iCVEsvy', 'Lab Tech 1', 'Female', '1993-01-25', '0901234579', '135 Lab St', 'active', 4),
('lab2@hospital.com', '$2a$12$ZYlEJnSQDFI4qy/s9jYo6O9vKqKOQCULgUpKS1vt5/FrA.iCVEsvy', 'Lab Tech 2', 'Male', '1996-05-09', '0901234580', '136 Lab St', 'active', 4);


-- Insert sample data into Hospital table
INSERT INTO Hospital (name, address, phoneNumber, email, website, description, workingHours) VALUES 
('Main Hospital', '123 Main Street, Ho Chi Minh City', '0283123456', 'info@hospital.com', 'www.hospital.com', 'Main hospital branch with full services', 'Monday-Friday: 7:00-19:00, Weekend: 8:00-17:00');

-- Insert sample data into Notification table
INSERT INTO Notification (userId, title, content, isRead) VALUES 
(1, 'System Update', 'The system will be updated tonight. Please save your work.', false),
(3, 'Appointment Reminder', 'You have an appointment tomorrow at 10:00 AM.', false),
(8, 'Test Results Ready', 'Your test results are ready. Please check with your doctor.', false),
(9, 'Appointment Confirmed', 'Your appointment has been confirmed for next Monday.', true);

-- Insert sample data into Patient table
INSERT INTO Patient (userId, dob, gender, bloodType, healthInsuranceNumber, emergencyContact, medicalHistory) VALUES 
(8, '1990-05-15', 'male', 'O+', 'HI12345678', 'Emergency Contact: 0901234590', 'No major medical history.'),
(9, '1985-10-20', 'female', 'A-', 'HI12345679', 'Emergency Contact: 0901234591', 'Allergic to penicillin.'),
(10, '1978-03-25', 'male', 'B+', 'HI12345680', 'Emergency Contact: 0901234592', 'Hypertension.'),
(11, '1995-08-12', 'male', 'AB+', 'HI12345681', 'Emergency Contact: 0901234593', 'No major medical history.'),
(12, '1988-11-30', 'female', 'O-', 'HI12345682', 'Emergency Contact: 0901234594', 'Asthma, Diabetes Type 2.');

-- Insert sample data into Administrator table
INSERT INTO Administrator (userId, position) VALUES 
(1, 'System Administrator'),
(2, 'Hospital Manager');

-- Insert sample data into Specialty table
INSERT INTO Specialty (name, description, hospitalId) VALUES 
('Cardiology', 'Deals with disorders of the heart and cardiovascular system', 1),
('Dermatology', 'Focused on diagnosing and treating skin disorders', 1),
('Neurology', 'Deals with disorders of the nervous system', 1),
('Orthopedics', 'Focused on conditions involving the musculoskeletal system', 1),
('Pediatrics', 'Medical care of infants, children, and adolescents', 1);

-- Insert sample data into Room table
INSERT INTO Room (roomNumber, specialtyId, capacity, roomType, status, description) VALUES 
('101', 1, 2, 'examination', 'available', 'Cardiology examination room'),
('102', 1, 2, 'examination', 'available', 'Cardiology examination room'),
('201', 2, 2, 'examination', 'available', 'Dermatology examination room'),
('301', 3, 2, 'examination', 'available', 'Neurology examination room'),
('401', 4, 2, 'examination', 'available', 'Orthopedics examination room'),
('501', 5, 2, 'examination', 'available', 'Pediatrics examination room'),
('601', 1, 4, 'operation', 'available', 'Cardiology operation room'),
('701', 3, 1, 'laboratory', 'available', 'Neurology lab room');

-- Insert sample data into Doctor table
INSERT INTO Doctor (userId, specialtyId, licenseNumber, experience, education, bio) VALUES 
(3, 1, 'DOC123456', 10, 'MD from Harvard Medical School', 'Experienced cardiologist with focus on heart disease prevention.'),
(4, 2, 'DOC123457', 8, 'MD from Stanford Medical School', 'Specialist in skin cancer and aesthetic dermatology.'),
(5, 3, 'DOC123458', 12, 'MD from Johns Hopkins University', 'Neurologist with expertise in stroke treatment and prevention.'),
(6, 4, 'DOC123459', 15, 'MD from Yale University', 'Orthopedic surgeon specializing in sports injuries.'),
(7, 5, 'DOC123460', 7, 'MD from Columbia University', 'Pediatrician with focus on early childhood development.');

-- Update Specialty headDoctorId
UPDATE Specialty SET headDoctorId = 1 WHERE specialtyId = 1;
UPDATE Specialty SET headDoctorId = 2 WHERE specialtyId = 2;
UPDATE Specialty SET headDoctorId = 3 WHERE specialtyId = 3;
UPDATE Specialty SET headDoctorId = 4 WHERE specialtyId = 4;
UPDATE Specialty SET headDoctorId = 5 WHERE specialtyId = 5;

-- Insert sample data into Schedule table
INSERT INTO Schedule (doctorId, roomId, workDate, startTime, endTime, status) VALUES 
(1, 1, CURDATE(), '08:00:00', '12:00:00', 'available'),
(1, 1, CURDATE() + INTERVAL 1 DAY, '08:00:00', '12:00:00', 'available'),
(1, 1, CURDATE() + INTERVAL 2 DAY, '08:00:00', '12:00:00', 'available'),
(2, 3, CURDATE(), '13:00:00', '17:00:00', 'available'),
(2, 3, CURDATE() + INTERVAL 1 DAY, '13:00:00', '17:00:00', 'available'),
(3, 4, CURDATE(), '08:00:00', '12:00:00', 'available'),
(4, 5, CURDATE() + INTERVAL 1 DAY, '13:00:00', '17:00:00', 'available'),
(5, 6, CURDATE() + INTERVAL 2 DAY, '08:00:00', '12:00:00', 'available');

-- Insert sample data into Service table
INSERT INTO Service (name, description, price, duration, type, category, specialtyId, status) VALUES 
-- Cardiology Services
('Basic Heart Checkup', 'Basic heart examination including ECG', 500000, 30, 'service', 'Examination', 1, 'active'),
('Comprehensive Heart Examination', 'Comprehensive heart examination with stress test', 1500000, 60, 'service', 'Examination', 1, 'active'),
('ECG Test', 'Electrocardiogram test', 300000, 15, 'test', 'Diagnostic', 1, 'active'),
('Echocardiogram', 'Ultrasound of the heart', 800000, 30, 'test', 'Diagnostic', 1, 'active'),

-- Dermatology Services
('Skin Consultation', 'General skin consultation', 400000, 30, 'service', 'Consultation', 2, 'active'),
('Skin Biopsy', 'Removal of a small piece of skin for testing', 600000, 20, 'test', 'Diagnostic', 2, 'active'),
('Mole Removal', 'Surgical removal of moles', 1000000, 45, 'service', 'Treatment', 2, 'active'),

-- Neurology Services
('Neurological Consultation', 'Comprehensive neurological examination', 600000, 45, 'service', 'Consultation', 3, 'active'),
('EEG Test', 'Electroencephalogram test', 700000, 40, 'test', 'Diagnostic', 3, 'active'),
('MRI Brain', 'Magnetic Resonance Imaging of the brain', 2500000, 60, 'test', 'Diagnostic', 3, 'active'),

-- Orthopedics Services
('Orthopedic Consultation', 'General consultation for bone and joint issues', 500000, 30, 'service', 'Consultation', 4, 'active'),
('X-Ray', 'X-ray imaging', 400000, 15, 'test', 'Diagnostic', 4, 'active'),
('Joint Injection', 'Therapeutic injection into joints', 800000, 20, 'service', 'Treatment', 4, 'active'),

-- Pediatrics Services
('Child Health Checkup', 'General health checkup for children', 400000, 30, 'service', 'Examination', 5, 'active'),
('Growth and Development Assessment', 'Assessment of child growth and development', 500000, 40, 'service', 'Assessment', 5, 'active'),
('Vaccination', 'Standard childhood vaccination', 300000, 15, 'service', 'Preventive', 5, 'active');

-- Insert sample data into LabTechnician table
INSERT INTO LabTechnician (userId, specialization, specialtyId) VALUES 
(13, 'Blood Analysis', 1),
(14, 'Imaging Technology', 3);

-- Insert sample data into File table
INSERT INTO File (fileName, filePath, fileType, fileSize, description) VALUES 
('ecg_result_template.pdf', '/uploads/templates/ecg_result.pdf', 'application/pdf', 256000, 'Template for ECG results'),
('xray_template.jpg', '/uploads/templates/xray.jpg', 'image/jpeg', 1024000, 'Template for X-ray image'),
('blood_test_template.pdf', '/uploads/templates/blood_test.pdf', 'application/pdf', 180000, 'Template for blood test results');

-- Insert sample data into Appointment table
INSERT INTO Appointment (patientId, specialtyId, appointmentDate, reason, queueNumber, estimatedTime, doctorId, roomId, scheduleId, status, emailVerified, paymentStatus) VALUES 
(1, 1, CURDATE() + INTERVAL 1 DAY, 'Chest pain and shortness of breath', 1, '09:00:00', 1, 1, 2, 'confirmed', true, 'completed'),
(2, 2, CURDATE() + INTERVAL 1 DAY, 'Skin rash and itching', 1, '14:00:00', 2, 3, 5, 'confirmed', true, 'completed'),
(3, 3, CURDATE(), 'Frequent headaches', 1, '09:30:00', 3, 4, 6, 'confirmed', true, 'completed'),
(4, 4, CURDATE() + INTERVAL 1 DAY, 'Knee pain after injury', 1, '14:30:00', 4, 5, 7, 'confirmed', true, 'pending'),
(5, 5, CURDATE() + INTERVAL 2 DAY, 'Routine checkup for child', 1, '09:00:00', 5, 6, 8, 'confirmed', true, 'pending');

-- Insert sample data into AppointmentServices table
INSERT INTO AppointmentServices (appointmentId, serviceId, price, notes) VALUES 
(1, 1, 500000, 'Basic heart checkup requested'),
(1, 3, 300000, 'ECG test recommended'),
(2, 5, 400000, 'Initial skin consultation'),
(3, 8, 600000, 'Neurological consultation for headaches'),
(3, 9, 700000, 'EEG test to check for abnormalities'),
(4, 11, 500000, 'Assessment of knee injury'),
(4, 12, 400000, 'X-ray of knee recommended'),
(5, 14, 400000, 'Regular checkup for 5-year-old');

-- Insert sample data into MedicalRecord table
INSERT INTO MedicalRecord (appointmentId, diagnosis, notes, recommendations, followupDate) VALUES 
(1, 'Mild hypertension', 'Blood pressure slightly elevated at 140/90 mmHg', 'Lifestyle changes, follow-up in 1 month', CURDATE() + INTERVAL 1 MONTH),
(2, 'Contact dermatitis', 'Skin rash likely caused by new detergent', 'Avoid allergen, apply prescribed cream', CURDATE() + INTERVAL 2 WEEK),
(3, 'Tension headaches', 'Likely stress-related headaches', 'Stress management techniques, pain medication as needed', CURDATE() + INTERVAL 3 WEEK);

-- Insert sample data into TestResult table
INSERT INTO TestResult (recordId, serviceId, technicianId, roomId, resultText, resultFileId, resultType, normalRange, unit, interpretation, status) VALUES 
(1, 3, 1, 1, 'Heart rate: 78 bpm, Regular rhythm, Normal QRS complex', 1, 'text', '60-100', 'bpm', 'Normal ECG result with no significant abnormalities', 'completed'),
(2, 6, 1, 3, NULL, 3, 'pdf', NULL, NULL, 'Skin sample shows inflammation consistent with contact dermatitis', 'completed'),
(3, 9, 2, 4, 'Normal brain wave activity', 1, 'text', 'N/A', 'N/A', 'No evidence of seizure activity or other abnormalities', 'completed');

-- Insert sample data into Medication table
INSERT INTO Medication (name, description, dosage, price, category, manufacturer, sideEffects) VALUES 
('Amlodipine', 'Calcium channel blocker for hypertension', '5mg tablet', 50000, 'Antihypertensive', 'Pfizer', 'Headache, dizziness, swelling'),
('Hydrocortisone Cream', 'Topical steroid for skin inflammation', '1% cream', 80000, 'Corticosteroid', 'Johnson & Johnson', 'Skin thinning, local irritation'),
('Ibuprofen', 'NSAID for pain and inflammation', '400mg tablet', 30000, 'Pain Reliever', 'Advil', 'Stomach upset, heartburn'),
('Amoxicillin', 'Antibiotic for bacterial infections', '500mg capsule', 60000, 'Antibiotic', 'GlaxoSmithKline', 'Diarrhea, rash, nausea'),
('Loratadine', 'Antihistamine for allergies', '10mg tablet', 40000, 'Antiallergic', 'Claritin', 'Drowsiness, dry mouth');

-- Insert sample data into Prescription table
INSERT INTO Prescription (recordId, doctorId, notes, status) VALUES 
(1, 1, 'Take medication daily with food', 'active'),
(2, 2, 'Apply cream twice daily to affected areas', 'active'),
(3, 3, 'Take pain medication as needed for headaches', 'active');

-- Insert sample data into PrescriptionDetail table
INSERT INTO PrescriptionDetail (prescriptionId, medicationId, dosage, frequency, duration, instructions) VALUES 
(1, 1, '5mg', 'Once daily', '30 days', 'Take in the morning with food'),
(2, 2, 'Thin layer', 'Twice daily', '14 days', 'Apply to affected areas and avoid sun exposure'),
(3, 3, '400mg', 'As needed', '7 days', 'Take when headache occurs, maximum 3 tablets per day');

-- Insert sample data into Payment table
INSERT INTO Payment (appointmentId, amount, method, status, transactionId, paymentDate) VALUES 
(1, 800000, 'credit_card', 'completed', 'TXN123456789', NOW() - INTERVAL 2 DAY),
(2, 400000, 'bank_transfer', 'completed', 'TXN123456790', NOW() - INTERVAL 1 DAY),
(3, 1300000, 'credit_card', 'completed', 'TXN123456791', NOW() - INTERVAL 12 HOUR);

-- Insert sample data into EmailVerification table
INSERT INTO EmailVerification (email, verificationCode, expiresAt, verified) VALUES 
('patient1@example.com', '123456', DATE_ADD(NOW(), INTERVAL 1 DAY), true),
('patient2@example.com', '234567', DATE_ADD(NOW(), INTERVAL 1 DAY), true),
('newpatient@example.com', '345678', DATE_ADD(NOW(), INTERVAL 1 DAY), false); 