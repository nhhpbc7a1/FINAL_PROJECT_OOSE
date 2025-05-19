use FINAL_PROJECT_OOSE;

-- Add 10 pending test requests for each specialty (50 total)
INSERT INTO TestRequest (appointmentId, serviceId, requestDate, status, notes, requestedByDoctorId) VALUES
-- Cardiology Test Requests (Specialty ID 1)
-- Using services 3 (ECG Test) and 4 (Echocardiogram)
(6, 3, CURDATE(), 'pending', 'Routine ECG test for arrhythmia evaluation', 1),
(11, 3, CURDATE(), 'pending', 'Baseline ECG for new patient with chest pain', 2),
(16, 3, CURDATE(), 'pending', 'Follow-up ECG for medication monitoring', 3),
(21, 3, CURDATE(), 'pending', 'ECG for pre-operative cardiac clearance', 1),
(26, 4, CURDATE(), 'pending', 'Echocardiogram to evaluate heart valve function', 2),
(31, 4, CURDATE(), 'pending', 'Echocardiogram for suspected heart failure', 3),
(36, 4, CURDATE(), 'pending', 'Follow-up echocardiogram post-treatment', 1),
(41, 3, CURDATE(), 'pending', 'ECG for suspected atrial fibrillation', 2),
(46, 3, CURDATE(), 'pending', 'ECG for palpitation investigation', 3),
(1, 4, CURDATE(), 'pending', 'Echocardiogram to assess ejection fraction', 1),

-- Dermatology Test Requests (Specialty ID 2)
-- Using service 6 (Skin Biopsy)
(7, 6, CURDATE(), 'pending', 'Skin biopsy for suspected psoriasis', 4),
(12, 6, CURDATE(), 'pending', 'Biopsy for suspicious mole', 5),
(17, 6, CURDATE(), 'pending', 'Skin biopsy for unexplained rash', 6),
(22, 6, CURDATE(), 'pending', 'Biopsy for recurring skin lesion', 4),
(27, 6, CURDATE(), 'pending', 'Skin biopsy for suspected melanoma', 5),
(32, 6, CURDATE(), 'pending', 'Biopsy for suspected fungal infection', 6),
(37, 6, CURDATE(), 'pending', 'Skin biopsy for suspected dermatitis', 4),
(42, 6, CURDATE(), 'pending', 'Biopsy for persistent eczema', 5),
(47, 6, CURDATE(), 'pending', 'Skin biopsy for suspected lichen planus', 6),
(2, 6, CURDATE(), 'pending', 'Biopsy for unexplained skin changes', 4),

-- Neurology Test Requests (Specialty ID 3)
-- Using services 9 (EEG Test) and 10 (MRI Brain)
(8, 9, CURDATE(), 'pending', 'EEG for suspected seizure disorder', 7),
(13, 9, CURDATE(), 'pending', 'Follow-up EEG for epilepsy monitoring', 8),
(18, 10, CURDATE(), 'pending', 'MRI Brain for chronic headaches', 9),
(23, 10, CURDATE(), 'pending', 'MRI Brain for suspected multiple sclerosis', 7),
(28, 9, CURDATE(), 'pending', 'EEG for sleep disorder evaluation', 8),
(33, 10, CURDATE(), 'pending', 'MRI Brain for memory loss investigation', 9),
(38, 9, CURDATE(), 'pending', 'EEG for unexplained fainting episodes', 7),
(43, 10, CURDATE(), 'pending', 'MRI Brain for suspected tumor', 8),
(48, 9, CURDATE(), 'pending', 'EEG for medication effectiveness monitoring', 9),
(3, 10, CURDATE(), 'pending', 'MRI Brain for persistent vertigo', 7),

-- Orthopedics Test Requests (Specialty ID 4)
-- Using service 12 (X-Ray)
(9, 12, CURDATE(), 'pending', 'X-Ray for lower back pain', 10),
(14, 12, CURDATE(), 'pending', 'X-Ray for suspected fracture in wrist', 11),
(19, 12, CURDATE(), 'pending', 'X-Ray for chronic knee pain', 12),
(24, 12, CURDATE(), 'pending', 'X-Ray for shoulder mobility assessment', 10),
(29, 12, CURDATE(), 'pending', 'X-Ray for hip replacement evaluation', 11),
(34, 12, CURDATE(), 'pending', 'X-Ray for spinal alignment check', 12),
(39, 12, CURDATE(), 'pending', 'X-Ray for ankle injury', 10),
(44, 12, CURDATE(), 'pending', 'X-Ray for suspected osteoarthritis', 11),
(49, 12, CURDATE(), 'pending', 'X-Ray for joint space evaluation', 12),
(4, 12, CURDATE(), 'pending', 'X-Ray for post-surgical follow-up', 10),

-- Pediatrics Test Requests (Specialty ID 5)
-- Using service 16 (Vaccination) and creating custom notes for each
(10, 16, CURDATE(), 'pending', 'Routine vaccination for 2-year-old', 13),
(15, 16, CURDATE(), 'pending', 'Vaccination catch-up for 5-year-old', 14),
(20, 16, CURDATE(), 'pending', 'Seasonal flu vaccination for child', 15),
(25, 16, CURDATE(), 'pending', 'School-required vaccination update', 13),
(30, 16, CURDATE(), 'pending', 'HPV vaccination for adolescent', 14),
(35, 16, CURDATE(), 'pending', 'Booster shot for 4-year-old', 15),
(40, 16, CURDATE(), 'pending', 'Vaccination prior to international travel', 13),
(45, 16, CURDATE(), 'pending', 'Pneumococcal vaccination for high-risk child', 14),
(50, 16, CURDATE(), 'pending', 'Vaccination for immunocompromised patient', 15),
(5, 16, CURDATE(), 'pending', 'Routine vaccination schedule for infant', 13); 