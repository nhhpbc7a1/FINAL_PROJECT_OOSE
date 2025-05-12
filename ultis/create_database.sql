-- Database creation
CREATE DATABASE IF NOT EXISTS FINAL_PROJECT_OOSE;
USE FINAL_PROJECT_OOSE;

-- Create Role table
CREATE TABLE IF NOT EXISTS Role (
    roleId INT AUTO_INCREMENT PRIMARY KEY,
    roleName VARCHAR(50) NOT NULL UNIQUE
);

-- Create User table
CREATE TABLE IF NOT EXISTS User (
    userId INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Storing hashed passwords
    fullName VARCHAR(100) NOT NULL,
    phoneNumber VARCHAR(20) NOT NULL,
    address VARCHAR(255),
    gender ENUM('male', 'female', 'other') NOT NULL,
    dob DATE,
    profileImage VARCHAR(255) DEFAULT '/public/images/default-avatar.jpg', -- Path or URL to image
    accountStatus ENUM('active', 'inactive', 'pending') DEFAULT 'pending',
    createdDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    roleId INT NOT NULL,
    FOREIGN KEY (roleId) REFERENCES Role(roleId) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create Notification table
CREATE TABLE IF NOT EXISTS Notification (
    notificationId INT AUTO_INCREMENT PRIMARY KEY,
    userId INT, -- Can be NULL for system notifications
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    isRead BOOLEAN DEFAULT FALSE,
    createdDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES User(userId) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Hospital table
CREATE TABLE IF NOT EXISTS Hospital (
    hospitalId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    phoneNumber VARCHAR(20) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    website VARCHAR(255),
    description TEXT,
    logo VARCHAR(255), -- Path or URL to logo image
    workingHours TEXT -- e.g., 'Mon-Fri 8am-5pm'
);

-- Create Patient table (Links to User)
CREATE TABLE IF NOT EXISTS Patient (
    patientId INT AUTO_INCREMENT PRIMARY KEY,
    userId INT UNIQUE NOT NULL, -- Each patient must have a user account
    dob DATE NOT NULL,
    gender ENUM('male', 'female', 'other') NOT NULL,
    bloodType VARCHAR(10),
    medicalHistory TEXT, -- Summary or brief notes
    FOREIGN KEY (userId) REFERENCES User(userId) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Administrator table (Links to User)
CREATE TABLE IF NOT EXISTS Administrator (
    adminId INT AUTO_INCREMENT PRIMARY KEY,
    userId INT UNIQUE NOT NULL, -- Each admin must have a user account
    position VARCHAR(100),
    FOREIGN KEY (userId) REFERENCES User(userId) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Specialty table
CREATE TABLE IF NOT EXISTS Specialty (
    specialtyId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    hospitalId INT, -- Which hospital offers this specialty
    headDoctorId INT, -- Foreign key added later after Doctor table creation
    icon VARCHAR(255) default '/public/images/specialties/default-specialty.jpg',
    FOREIGN KEY (hospitalId) REFERENCES Hospital(hospitalId) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create Room table
CREATE TABLE IF NOT EXISTS Room (
    roomId INT AUTO_INCREMENT PRIMARY KEY,
    roomNumber VARCHAR(20) NOT NULL,
    specialtyId INT, -- Which specialty primarily uses this room (can be NULL for general rooms)
    capacity INT, -- e.g., number of beds or examination stations
    roomType ENUM('examination', 'operation', 'laboratory', 'consultation', 'emergency', 'general') NOT NULL,
    status ENUM('available', 'occupied', 'maintenance') DEFAULT 'available',
    description TEXT,
    FOREIGN KEY (specialtyId) REFERENCES Specialty(specialtyId) ON DELETE SET NULL ON UPDATE CASCADE,
    UNIQUE KEY (roomNumber, specialtyId) -- Optional: room numbers unique within a specialty or globally unique
);

-- Create Doctor table (Links to User)
CREATE TABLE IF NOT EXISTS Doctor (
    doctorId INT AUTO_INCREMENT PRIMARY KEY,
    userId INT UNIQUE NOT NULL, -- Each doctor must have a user account
    specialtyId INT,
    licenseNumber VARCHAR(50) NOT NULL UNIQUE,
    experience INT, -- Years of experience
    education TEXT, -- e.g., MD, PhD, degrees and institutions
    certifications TEXT, -- e.g., Board certified, specific training
    bio TEXT,
    FOREIGN KEY (userId) REFERENCES User(userId) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (specialtyId) REFERENCES Specialty(specialtyId) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Update Specialty with foreign key to headDoctor after Doctor table is created
ALTER TABLE Specialty
ADD FOREIGN KEY (headDoctorId) REFERENCES Doctor(doctorId) ON DELETE SET NULL ON UPDATE CASCADE;

-- Create LabTechnician table (Links to User)
CREATE TABLE IF NOT EXISTS LabTechnician (
    technicianId INT AUTO_INCREMENT PRIMARY KEY,
    userId INT UNIQUE NOT NULL, -- Each technician must have a user account
    specialization VARCHAR(100), -- e.g., Phlebotomy, Microbiology
    specialtyId INT, -- Which specialty they are associated with (can be NULL)
    FOREIGN KEY (userId) REFERENCES User(userId) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (specialtyId) REFERENCES Specialty(specialtyId) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create Schedule table (Flexible for Doctor or LabTechnician)
CREATE TABLE IF NOT EXISTS Schedule (
    scheduleId INT AUTO_INCREMENT PRIMARY KEY,
    doctorId INT,
    labTechnicianId INT,
    roomId INT, -- Where the schedule takes place (e.g., examination room, lab)
    workDate DATE NOT NULL,
    startTime TIME NOT NULL,
    endTime TIME NOT NULL,
    status ENUM('available', 'fullfilled') DEFAULT 'available', -- For booking status
    createdDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY (doctorId, workDate, startTime), -- Prevent double booking doctor
    UNIQUE KEY (labTechnicianId, workDate, startTime), -- Prevent double booking technician
    UNIQUE KEY (roomId, workDate, startTime), -- Prevent double booking room
    CHECK ((doctorId IS NOT NULL AND labTechnicianId IS NULL) OR (doctorId IS NULL AND labTechnicianId IS NOT NULL)), -- Must be either doctor or technician
    FOREIGN KEY (doctorId) REFERENCES Doctor(doctorId) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (labTechnicianId) REFERENCES LabTechnician(technicianId) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (roomId) REFERENCES Room(roomId) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create Service table (Consultations, Tests, Procedures)
CREATE TABLE IF NOT EXISTS Service (
    serviceId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration INT NOT NULL, -- Estimated duration in minutes
    type ENUM('service', 'test', 'procedure') NOT NULL, -- Consultation is a 'service', Lab work is a 'test', Surgery is a 'procedure'
    category VARCHAR(100) NOT NULL, -- e.g., 'Examination', 'Diagnostic Imaging', 'Laboratory'
    specialtyId INT, -- Which specialty provides this service (can be NULL for general services)
    status ENUM('active', 'inactive') DEFAULT 'active',
    image VARCHAR(255) DEFAULT '/public/images/services/default-service.jpg',
    FOREIGN KEY (specialtyId) REFERENCES Specialty(specialtyId) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create Appointment table (Links Patient to Schedule and Doctor/Specialty)
CREATE TABLE IF NOT EXISTS Appointment (
    appointmentId INT AUTO_INCREMENT PRIMARY KEY,
    patientId INT NOT NULL,
    specialtyId INT, -- Specialty of the appointment
    appointmentDate DATE NOT NULL,
    appointmentTime TIME, -- Specific time if not linked directly to a schedule slot time
    reason TEXT, -- Reason for visit provided by patient
    queueNumber INT, -- Optional queue number for the day/time
    estimatedTime TIME, -- Estimated time of appointment (if queue system used)
    doctorId INT, -- Doctor assigned to the appointment (can be NULL initially)
    roomId INT, -- Room assigned for the appointment (can be NULL initially)
    scheduleId INT, -- Link to a specific schedule slot if applicable
    status ENUM('pending', 'confirmed', 'cancelled', 'completed', 'waiting_payment', 'paid') DEFAULT 'pending',
    emailVerified BOOLEAN DEFAULT FALSE, -- If patient's email was verified for booking
    paymentStatus ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending', -- Status of payment for this appointment's services/fees
    patientAppointmentStatus ENUM('waiting', 'examining', 'examined') DEFAULT 'waiting',
    createdDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patientId) REFERENCES Patient(patientId) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (specialtyId) REFERENCES Specialty(specialtyId) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (doctorId) REFERENCES Doctor(doctorId) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (roomId) REFERENCES Room(roomId) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (scheduleId) REFERENCES Schedule(scheduleId) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create AppointmentServices table (Many-to-Many link between Appointment and Service)
CREATE TABLE IF NOT EXISTS AppointmentServices (
    appointmentServiceId INT AUTO_INCREMENT PRIMARY KEY,
    appointmentId INT NOT NULL,
    serviceId INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL, -- Price at the time of service
    notes TEXT, -- Specific notes about this service for this appointment
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending', -- Status of this specific service within the appointment
    FOREIGN KEY (appointmentId) REFERENCES Appointment(appointmentId) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (serviceId) REFERENCES Service(serviceId) ON DELETE RESTRICT ON UPDATE CASCADE -- Restrict deletion if service is linked to an appointment
);

-- Create MedicalRecord table (Stores encounter notes, diagnosis, etc.)
CREATE TABLE IF NOT EXISTS MedicalRecord (
    recordId INT AUTO_INCREMENT PRIMARY KEY,
    appointmentId INT UNIQUE NOT NULL, -- Each medical record links to a specific appointment
    diagnosis TEXT,
    notes TEXT, -- Clinical notes from the doctor
    recommendations TEXT, -- Treatment plan, follow-up instructions
    createdDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    followupDate DATE, -- Recommended date for next visit
    FOREIGN KEY (appointmentId) REFERENCES Appointment(appointmentId) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create File table for storing files (lab results, images, reports)
CREATE TABLE IF NOT EXISTS File (
    fileId INT AUTO_INCREMENT PRIMARY KEY,
    fileName VARCHAR(255) NOT NULL,
    filePath VARCHAR(255) NOT NULL, -- Path to the stored file
    fileType VARCHAR(50) NOT NULL, -- MIME type or extension (e.g., 'application/pdf', 'image/jpeg')
    fileSize INT NOT NULL, -- File size in bytes
    uploadDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    uploadedByUserId INT, -- User who uploaded the file
    FOREIGN KEY (uploadedByUserId) REFERENCES User(userId) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create TestRequest table
CREATE TABLE IF NOT EXISTS TestRequest (
    requestId INT AUTO_INCREMENT PRIMARY KEY,
    appointmentId INT NOT NULL,
    serviceId INT NOT NULL,
    requestDate DATE NOT NULL,
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') NOT NULL,
    notes TEXT,
    requestedByDoctorId INT NOT NULL,
    FOREIGN KEY (appointmentId) REFERENCES Appointment(appointmentId) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (serviceId) REFERENCES Service(serviceId) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (requestedByDoctorId) REFERENCES Doctor(doctorId) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create TestResult table (Links to MedicalRecord, Service, Technician, File)
CREATE TABLE IF NOT EXISTS TestResult (
    resultId INT AUTO_INCREMENT PRIMARY KEY,
    recordId INT, -- Links to a medical record (can be NULL if test is not tied to a specific doctor visit record)
    appointmentId INT, -- Added link directly to appointment for tests ordered independently
    requestId INT,
    serviceId INT NOT NULL, -- Which service/test this result is for
    technicianId INT, -- Who performed the test
    roomId INT, -- Where the test was performed (e.g., lab room)
    resultText TEXT, -- Textual representation of results (e.g., qualitative results)
    resultNumeric DECIMAL(10, 2), -- Numeric result if applicable
    resultFileId INT, -- Link to the actual report file (PDF, image)
    resultType ENUM('text', 'numeric', 'file', 'image', 'pdf', 'other') NOT NULL, -- Type of primary result storage
    normalRange VARCHAR(100), -- Reference range for the test
    unit VARCHAR(50), -- Units for numeric results
    interpretation TEXT, -- Doctor's interpretation of the result
    performedDate TIMESTAMP NULL DEFAULT NULL, -- When the test was physically performed
    reportedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- When the result was entered/uploaded
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    FOREIGN KEY (recordId) REFERENCES MedicalRecord(recordId) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (appointmentId) REFERENCES Appointment(appointmentId) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (requestId) REFERENCES TestRequest(requestId) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (serviceId) REFERENCES Service(serviceId) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (technicianId) REFERENCES LabTechnician(technicianId) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (roomId) REFERENCES Room(roomId) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (resultFileId) REFERENCES File(fileId) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create Medication table
CREATE TABLE IF NOT EXISTS Medication (
    medicationId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    dosage VARCHAR(50), -- Common dosage form/strength (e.g., '5mg tablet', '10mg/ml solution')
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100), -- e.g., 'Antibiotic', 'Pain Reliever', 'Antihypertensive'
    manufacturer VARCHAR(100),
    sideEffects TEXT,
    stockQuantity INT DEFAULT 0 -- Added stock quantity
);

-- Create Prescription table (Links to MedicalRecord and Doctor)
CREATE TABLE IF NOT EXISTS Prescription (
    prescriptionId INT AUTO_INCREMENT PRIMARY KEY,
    recordId INT UNIQUE NOT NULL, -- Each prescription links to a medical record entry
    doctorId INT NOT NULL, -- Doctor who issued the prescription
    prescriptionDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT, -- General notes for the pharmacist or patient
    status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
    FOREIGN KEY (recordId) REFERENCES MedicalRecord(recordId) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (doctorId) REFERENCES Doctor(doctorId) ON DELETE RESTRICT ON UPDATE CASCADE -- Doctor must exist
);

-- Create PrescriptionDetail table (Many-to-Many link between Prescription and Medication)
CREATE TABLE IF NOT EXISTS PrescriptionDetail (
    detailId INT AUTO_INCREMENT PRIMARY KEY,
    prescriptionId INT NOT NULL,
    medicationId INT NOT NULL,
    dosage VARCHAR(100), -- Specific dosage for this prescription line
    frequency VARCHAR(100), -- How often to take (e.g., 'Once daily', 'Every 8 hours')
    duration VARCHAR(100), -- How long to take (e.g., '7 days', 'Until finished')
    instructions TEXT, -- Specific instructions for the patient
    FOREIGN KEY (prescriptionId) REFERENCES Prescription(prescriptionId) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (medicationId) REFERENCES Medication(medicationId) ON DELETE RESTRICT ON UPDATE CASCADE -- Medication must exist
);

-- Create Payment table (Links to Appointment or other billable items)
CREATE TABLE IF NOT EXISTS Payment (
    paymentId INT AUTO_INCREMENT PRIMARY KEY,
    appointmentId INT, -- Can be NULL if payment is for something else (e.g., medication refill)
    amount DECIMAL(10, 2) NOT NULL,
    method ENUM('credit_card', 'debit_card', 'cash', 'bank_transfer', 'e_wallet', 'insurance', 'other') NOT NULL,
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    transactionId VARCHAR(100), -- Transaction ID from payment gateway
    paymentDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (appointmentId) REFERENCES Appointment(appointmentId) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create EmailVerification table (For user registration verification)
CREATE TABLE IF NOT EXISTS EmailVerification (
    verificationId INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    verificationCode VARCHAR(50) NOT NULL,
    appointmentId INT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiresAt TIMESTAMP NULL DEFAULT NULL,
    verified BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (appointmentId) REFERENCES Appointment(appointmentId) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Review table (For patient feedback on appointments)
CREATE TABLE IF NOT EXISTS Review (
    reviewId INT AUTO_INCREMENT PRIMARY KEY,
    appointmentId INT UNIQUE NOT NULL, -- One review per appointment
    rating INT CHECK (rating >= 1 AND rating <= 5), -- Rating from 1 to 5
    comment TEXT,
    reviewDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointmentId) REFERENCES Appointment(appointmentId) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Billing table (To track charges and link to payments)
CREATE TABLE IF NOT EXISTS Billing (
    billingId INT AUTO_INCREMENT PRIMARY KEY,
    appointmentId INT, -- Link to appointment for consultation/procedure charges
    appointmentServiceId INT, -- Link to specific service within an appointment
    testResultId INT, -- Link to a lab test result that needs billing
    medicationId INT, -- Link to medication dispensed/billed
    itemDescription VARCHAR(255) NOT NULL, -- Description of the billed item
    amount DECIMAL(10, 2) NOT NULL, -- Amount charged
    billingDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'billed', 'paid', 'cancelled') DEFAULT 'pending',
    paymentId INT, -- Link to the payment that covered this bill item (can be NULL if partially paid or pending)
    FOREIGN KEY (appointmentId) REFERENCES Appointment(appointmentId) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (appointmentServiceId) REFERENCES AppointmentServices(appointmentServiceId) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (testResultId) REFERENCES TestResult(resultId) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (medicationId) REFERENCES Medication(medicationId) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (paymentId) REFERENCES Payment(paymentId) ON DELETE SET NULL ON UPDATE CASCADE
);

