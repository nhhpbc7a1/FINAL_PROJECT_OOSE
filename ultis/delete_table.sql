-- Drop all foreign key constraints first to avoid dependency issues
SET FOREIGN_KEY_CHECKS = 0;

-- Drop all tables
DROP TABLE IF EXISTS PrescriptionDetail;
DROP TABLE IF EXISTS Prescription;
DROP TABLE IF EXISTS Medication;
DROP TABLE IF EXISTS TestResult;
DROP TABLE IF EXISTS File;
DROP TABLE IF EXISTS LabTechnician;
DROP TABLE IF EXISTS MedicalRecord;
DROP TABLE IF EXISTS AppointmentServices;
DROP TABLE IF EXISTS Appointment;
DROP TABLE IF EXISTS Service;
DROP TABLE IF EXISTS Schedule;
DROP TABLE IF EXISTS Doctor;
DROP TABLE IF EXISTS Room;
DROP TABLE IF EXISTS Specialty;
DROP TABLE IF EXISTS Administrator;
DROP TABLE IF EXISTS Patient;
DROP TABLE IF EXISTS Hospital;
DROP TABLE IF EXISTS Notification;
DROP TABLE IF EXISTS User;
DROP TABLE IF EXISTS Role;
DROP TABLE IF EXISTS Payment;
DROP TABLE IF EXISTS EmailVerification;

-- Reset foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Drop the entire database
DROP DATABASE IF EXISTS FINAL_PROJECT_OOSE;

-- Confirmation message (will show in client)
SELECT 'Database FINAL_PROJECT_OOSE has been completely dropped.' AS Result; 