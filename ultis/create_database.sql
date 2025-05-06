-- Database creation
CREATE DATABASE IF NOT EXISTS FINAL_PROJECT_OOSE;
USE FINAL_PROJECT_OOSE;

-- Create Role table
CREATE TABLE IF NOT EXISTS Role (
    roleId INT AUTO_INCREMENT PRIMARY KEY,
    roleName VARCHAR(50) NOT NULL
);

-- Create User table
CREATE TABLE IF NOT EXISTS User (
    userId INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    fullName VARCHAR(100) NOT NULL,
    phoneNumber VARCHAR(20) NOT NULL,
    address VARCHAR(255),
    gender ENUM('male', 'female', 'other') NOT NULL,
    dob DATE,
    profileImage VARCHAR(255) DEFAULT '/public/images/default-avatar.jpg',
    accountStatus ENUM('active', 'inactive', 'pending') DEFAULT 'pending',
    createdDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    roleId INT NOT NULL,
    FOREIGN KEY (roleId) REFERENCES Role(roleId)
);

-- Create Notification table
CREATE TABLE IF NOT EXISTS Notification (
    notificationId INT AUTO_INCREMENT PRIMARY KEY,
    userId INT,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    isRead BOOLEAN DEFAULT FALSE,
    createdDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES User(userId)
);

-- Create Hospital table
CREATE TABLE IF NOT EXISTS Hospital (
    hospitalId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    phoneNumber VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    website VARCHAR(255),
    description TEXT,
    logo VARCHAR(255),
    workingHours TEXT
);

-- Create Patient table
CREATE TABLE IF NOT EXISTS Patient (
    patientId INT AUTO_INCREMENT PRIMARY KEY,
    userId INT UNIQUE,
    dob DATE NOT NULL,
    gender ENUM('male', 'female', 'other') NOT NULL,
    bloodType VARCHAR(10),
    medicalHistory TEXT,
    FOREIGN KEY (userId) REFERENCES User(userId)
);

-- Create Administrator table
CREATE TABLE IF NOT EXISTS Administrator (
    adminId INT AUTO_INCREMENT PRIMARY KEY,
    userId INT UNIQUE,
    position VARCHAR(100),
    FOREIGN KEY (userId) REFERENCES User(userId)
);

-- Create Specialty table
CREATE TABLE IF NOT EXISTS Specialty (
    specialtyId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    hospitalId INT,
    headDoctorId INT,
    icon VARCHAR(255) default '/public/images/specialties/default-specialty.jpg',
    FOREIGN KEY (hospitalId) REFERENCES Hospital(hospitalId)
);

-- Create Room table
CREATE TABLE IF NOT EXISTS Room (
    roomId INT AUTO_INCREMENT PRIMARY KEY,
    roomNumber VARCHAR(20) NOT NULL,
    specialtyId INT,
    capacity INT,
    roomType ENUM('examination', 'operation', 'laboratory', 'consultation', 'emergency', 'general') NOT NULL,
    status ENUM('available', 'occupied', 'maintenance') DEFAULT 'available',
    description TEXT,
    FOREIGN KEY (specialtyId) REFERENCES Specialty(specialtyId)
);

-- Create Doctor table
CREATE TABLE IF NOT EXISTS Doctor (
    doctorId INT AUTO_INCREMENT PRIMARY KEY,
    userId INT UNIQUE,
    specialtyId INT,
    licenseNumber VARCHAR(50) NOT NULL,
    experience INT,
    education TEXT,
    certifications TEXT,
    bio TEXT,
    FOREIGN KEY (userId) REFERENCES User(userId),
    FOREIGN KEY (specialtyId) REFERENCES Specialty(specialtyId)
);

-- Update Specialty with foreign key to headDoctor after Doctor table is created
ALTER TABLE Specialty
ADD FOREIGN KEY (headDoctorId) REFERENCES Doctor(doctorId);

-- Create LabTechnician table
CREATE TABLE IF NOT EXISTS LabTechnician (
    technicianId INT AUTO_INCREMENT PRIMARY KEY,
    userId INT UNIQUE,
    specialization VARCHAR(100),
    specialtyId INT,
    FOREIGN KEY (userId) REFERENCES User(userId),
    FOREIGN KEY (specialtyId) REFERENCES Specialty(specialtyId)
);

-- Create Schedule table
CREATE TABLE IF NOT EXISTS Schedule (
    scheduleId INT AUTO_INCREMENT PRIMARY KEY,
    doctorId INT,
    labTechnicianId INT,
    roomId INT,
    workDate DATE NOT NULL,
    startTime TIME NOT NULL,
    endTime TIME NOT NULL,
    status ENUM('available', 'booked', 'unavailable') DEFAULT 'available',
    FOREIGN KEY (doctorId) REFERENCES Doctor(doctorId),
    FOREIGN KEY (labTechnicianId) REFERENCES LabTechnician(technicianId),
    FOREIGN KEY (roomId) REFERENCES Room(roomId)
);

-- Create Service table
CREATE TABLE IF NOT EXISTS Service (
    serviceId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration INT NOT NULL, -- in minutes
    type ENUM('service', 'test') NOT NULL,
    category VARCHAR(50) NOT NULL,
    specialtyId INT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    image VARCHAR(255) DEFAULT '/public/images/services/default-service.jpg',
    FOREIGN KEY (specialtyId) REFERENCES Specialty(specialtyId)
);

-- Create Appointment table
CREATE TABLE IF NOT EXISTS Appointment (
    appointmentId INT AUTO_INCREMENT PRIMARY KEY,
    patientId INT,
    specialtyId INT,
    appointmentDate DATE NOT NULL,
    appointmentTime DATE NOT NULL,
    reason TEXT,
    queueNumber INT,
    estimatedTime TIME,
    doctorId INT,
    roomId INT,
    scheduleId INT,
    status ENUM('pending', 'confirmed', 'cancelled','completed') DEFAULT 'pending',
    emailVerified BOOLEAN DEFAULT FALSE,
    paymentStatus ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    patientAppointmentStatus ENUM('waiting', 'examining', 'examined') DEFAULT 'waiting',
    createdDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patientId) REFERENCES Patient(patientId),
    FOREIGN KEY (specialtyId) REFERENCES Specialty(specialtyId),
    FOREIGN KEY (doctorId) REFERENCES Doctor(doctorId),
    FOREIGN KEY (roomId) REFERENCES Room(roomId),
    FOREIGN KEY (scheduleId) REFERENCES Schedule(scheduleId)
);

-- Create AppointmentServices table
CREATE TABLE IF NOT EXISTS AppointmentServices (
    appointmentServiceId INT AUTO_INCREMENT PRIMARY KEY,
    appointmentId INT,
    serviceId INT,
    price DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    FOREIGN KEY (appointmentId) REFERENCES Appointment(appointmentId),
    FOREIGN KEY (serviceId) REFERENCES Service(serviceId)
);

-- Create MedicalRecord table
CREATE TABLE IF NOT EXISTS MedicalRecord (
    recordId INT AUTO_INCREMENT PRIMARY KEY,
    appointmentId INT,
    diagnosis TEXT,
    notes TEXT,
    recommendations TEXT,
    createdDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    followupDate DATE,
    FOREIGN KEY (appointmentId) REFERENCES Appointment(appointmentId)
);

-- Create File table for storing files
CREATE TABLE IF NOT EXISTS File (
    fileId INT AUTO_INCREMENT PRIMARY KEY,
    fileName VARCHAR(255) NOT NULL,
    filePath VARCHAR(255) NOT NULL,
    fileType VARCHAR(50) NOT NULL,
    fileSize INT NOT NULL,
    uploadDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- Create TestRequest table
CREATE TABLE IF NOT EXISTS TestRequest (
    requestId INT AUTO_INCREMENT PRIMARY KEY,
    appointmentId INT NOT NULL,
    serviceId INT NOT NULL,
    requestDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    notes TEXT,
    requestedByDoctorId INT,
    FOREIGN KEY (appointmentId) REFERENCES Appointment(appointmentId),
    FOREIGN KEY (serviceId) REFERENCES Service(serviceId),
    FOREIGN KEY (requestedByDoctorId) REFERENCES Doctor(doctorId)
);

-- Create TestResult table
CREATE TABLE IF NOT EXISTS TestResult (
    resultId INT AUTO_INCREMENT PRIMARY KEY,
    appointmentId INT,
    recordId INT,
    requestId INT,
    serviceId INT,
    technicianId INT,
    roomId INT,
    resultText TEXT,
    resultFileId INT,
    resultType ENUM('text', 'numeric', 'file', 'image', 'pdf') NOT NULL,
    normalRange VARCHAR(100),
    unit VARCHAR(50),
    interpretation TEXT,
    performedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    FOREIGN KEY (recordId) REFERENCES MedicalRecord(recordId),
    FOREIGN KEY (requestId) REFERENCES TestRequest(requestId),
    FOREIGN KEY (serviceId) REFERENCES Service(serviceId),
    FOREIGN KEY (technicianId) REFERENCES LabTechnician(technicianId),
    FOREIGN KEY (roomId) REFERENCES Room(roomId),
    FOREIGN KEY (resultFileId) REFERENCES File(fileId),
    FOREIGN KEY (appointmentId) REFERENCES Appointment(appointmentId)
);

-- Create Medication table
CREATE TABLE IF NOT EXISTS Medication (
    medicationId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    dosage VARCHAR(50),
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100),
    manufacturer VARCHAR(100),
    sideEffects TEXT
);

-- Create Prescription table
CREATE TABLE IF NOT EXISTS Prescription (
    prescriptionId INT AUTO_INCREMENT PRIMARY KEY,
    recordId INT,
    doctorId INT,
    prescriptionDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
    FOREIGN KEY (recordId) REFERENCES MedicalRecord(recordId),
    FOREIGN KEY (doctorId) REFERENCES Doctor(doctorId)
);

-- Create PrescriptionDetail table
CREATE TABLE IF NOT EXISTS PrescriptionDetail (
    detailId INT AUTO_INCREMENT PRIMARY KEY,
    prescriptionId INT,
    medicationId INT,
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    duration VARCHAR(100),
    instructions TEXT,
    FOREIGN KEY (prescriptionId) REFERENCES Prescription(prescriptionId),
    FOREIGN KEY (medicationId) REFERENCES Medication(medicationId)
);

-- Create Payment table
CREATE TABLE IF NOT EXISTS Payment (
    paymentId INT AUTO_INCREMENT PRIMARY KEY,
    appointmentId INT,
    amount DECIMAL(10, 2) NOT NULL,
    method ENUM('credit_card', 'debit_card', 'cash', 'bank_transfer', 'e_wallet') NOT NULL,
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    transactionId VARCHAR(100),
    paymentDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointmentId) REFERENCES Appointment(appointmentId)
);

-- Create EmailVerification table
CREATE TABLE IF NOT EXISTS EmailVerification (
    verificationId INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    verificationCode VARCHAR(50) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiresAt TIMESTAMP NULL DEFAULT NULL,
    verified BOOLEAN DEFAULT FALSE
);

-- Insert default roles
INSERT INTO Role (roleName) VALUES 
('administrator'), 
('doctor'), 
('patient'), 
('lab_technician'); 