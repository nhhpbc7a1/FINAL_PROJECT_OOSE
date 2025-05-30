import PrescriptionDAO from '../dao/PrescriptionDAO.js';
import PrescriptionObserver from '../observers/implementations/PrescriptionObserver.js';
import notificationSubject from '../observers/implementations/NotificationSubject.js';
import PatientDAO from '../dao/PatientDAO.js';
import DoctorDAO from '../dao/DoctorDAO.js';
import moment from 'moment';

/**
 * Prescription Model Class
 * Represents a prescription in the system
 */
class Prescription {
    /**
     * Create a new Prescription instance
     * @param {Object} prescriptionData - Prescription data
     */
    constructor(prescriptionData = {}) {
        this.prescriptionId = prescriptionData.prescriptionId || null;
        this.recordId = prescriptionData.recordId;
        this.doctorId = prescriptionData.doctorId;
        this.prescriptionDate = prescriptionData.prescriptionDate || moment().format('YYYY-MM-DD HH:mm:ss');
        this.notes = prescriptionData.notes || '';
        this.status = prescriptionData.status || 'active';
        
        // Related data from joins
        this.doctorName = prescriptionData.doctorName;
        this.patientId = prescriptionData.patientId;
        this.patientName = prescriptionData.patientName;
        
        // Medications in this prescription
        this.medications = prescriptionData.medications || [];
    }

    /**
     * Save the prescription
     * @returns {Promise<number>} The prescription ID
     */
    async save() {
        try {
            const prescriptionData = {
                recordId: this.recordId,
                doctorId: this.doctorId,
                prescriptionDate: this.prescriptionDate,
                notes: this.notes,
                status: this.status
            };
            
            if (this.prescriptionId) {
                // Update existing prescription
                await PrescriptionDAO.update(this.prescriptionId, prescriptionData);
                return this.prescriptionId;
            } else {
                // Create new prescription
                this.prescriptionId = await PrescriptionDAO.add(prescriptionData);
                return this.prescriptionId;
            }
        } catch (error) {
            console.error('Error saving prescription:', error);
            throw new Error('Failed to save prescription: ' + error.message);
        }
    }

    /**
     * Add details (medications) to the prescription
     * @param {Array} details - Medication details
     * @returns {Promise<boolean>} Success status
     */
    async addDetails(details) {
        try {
            if (!this.prescriptionId) {
                throw new Error('Cannot add details to unsaved prescription');
            }
            
            return await PrescriptionDAO.addDetails(this.prescriptionId, details);
        } catch (error) {
            console.error('Error adding prescription details:', error);
            throw new Error('Failed to add prescription details: ' + error.message);
        }
    }

    /**
     * Delete the prescription
     * @returns {Promise<boolean>} Success status
     */
    async delete() {
        try {
            if (!this.prescriptionId) {
                throw new Error('Cannot delete unsaved prescription');
            }
            
            return await PrescriptionDAO.delete(this.prescriptionId);
        } catch (error) {
            console.error('Error deleting prescription:', error);
            throw new Error('Failed to delete prescription: ' + error.message);
        }
    }

    /**
     * Find all prescriptions
     * @returns {Promise<Array<Prescription>>} Array of prescriptions
     */
    static async findAll() {
        try {
            const prescriptions = await PrescriptionDAO.findAll();
            return prescriptions.map(prescription => new Prescription(prescription));
        } catch (error) {
            console.error('Error fetching all prescriptions:', error);
            throw new Error('Unable to load prescriptions: ' + error.message);
        }
    }

    /**
     * Find a prescription by ID
     * @param {number} prescriptionId - Prescription ID
     * @returns {Promise<Prescription|null>} The found prescription or null
     */
    static async findById(prescriptionId) {
        try {
            const prescription = await PrescriptionDAO.getById(prescriptionId);
            return prescription ? new Prescription(prescription) : null;
        } catch (error) {
            console.error(`Error finding prescription with ID ${prescriptionId}:`, error);
            throw new Error('Unable to find prescription: ' + error.message);
        }
    }

    /**
     * Find prescriptions by patient ID
     * @param {number} patientId - Patient ID
     * @returns {Promise<Array<Prescription>>} Array of prescriptions
     */
    static async findByPatientId(patientId) {
        try {
            const prescriptions = await PrescriptionDAO.findByPatientId(patientId);
            return prescriptions.map(prescription => new Prescription(prescription));
        } catch (error) {
            console.error(`Error finding prescriptions for patient ${patientId}:`, error);
            throw new Error('Unable to find prescriptions by patient: ' + error.message);
        }
    }

    /**
     * Find prescriptions by doctor ID
     * @param {number} doctorId - Doctor ID
     * @returns {Promise<Array<Prescription>>} Array of prescriptions
     */
    static async findByDoctorId(doctorId) {
        try {
            const prescriptions = await PrescriptionDAO.findByDoctorId(doctorId);
            return prescriptions.map(prescription => new Prescription(prescription));
        } catch (error) {
            console.error(`Error finding prescriptions for doctor ${doctorId}:`, error);
            throw new Error('Unable to find prescriptions by doctor: ' + error.message);
        }
    }

    /**
     * Find prescriptions by record ID
     * @param {number} recordId - Medical record ID
     * @returns {Promise<Array<Prescription>>} Array of prescriptions
     */
    static async findByRecordId(recordId) {
        try {
            const prescriptions = await PrescriptionDAO.findByRecordId(recordId);
            return prescriptions.map(prescription => new Prescription(prescription));
        } catch (error) {
            console.error(`Error finding prescriptions for record ${recordId}:`, error);
            throw new Error('Unable to find prescriptions by record: ' + error.message);
        }
    }

    /**
     * Create a medical record and prescription in one operation
     * @param {Object} recordData - Medical record data
     * @param {Object} prescriptionData - Prescription data
     * @param {Array} medications - List of medications
     * @returns {Promise<Object>} The created IDs
     */
    static async createWithMedicalRecord(recordData, prescriptionData, medications) {
        try {
            return await PrescriptionDAO.createWithMedicalRecord(recordData, prescriptionData, medications);
        } catch (error) {
            console.error('Error creating medical record and prescription:', error);
            throw new Error('Failed to create medical record and prescription: ' + error.message);
        }
    }

    /**
     * Find prescriptions by appointment ID
     * @param {number} appointmentId - Appointment ID
     * @returns {Promise<Array<Prescription>>} Array of prescriptions
     */
    static async findByAppointmentId(appointmentId) {
        try {
            const prescriptions = await PrescriptionDAO.findByAppointmentId(appointmentId);
            return prescriptions.map(prescription => new Prescription(prescription));
        } catch (error) {
            console.error(`Error finding prescriptions for appointment ${appointmentId}:`, error);
            throw new Error('Unable to find prescriptions by appointment: ' + error.message);
        }
    }

    /**
     * Create a new prescription with notifications
     * @returns {Promise<Object>} The created prescription result
     */
    async create() {
        try {
            // Create prescription in database
            const result = await PrescriptionDAO.create({
                patientId: this.patientId,
                doctorId: this.doctorId,
                medications: this.medications,
                status: 'active'
            });

            if (result) {
                // Get user IDs from Patient and Doctor
                const patient = await PatientDAO.findById(this.patientId);
                const doctor = await DoctorDAO.findById(this.doctorId);

                if (!patient || !doctor) {
                    throw new Error('Could not find patient or doctor information');
                }

                // Create observers for patient and doctor
                const patientObserver = new PrescriptionObserver(patient.userId);
                const doctorObserver = new PrescriptionObserver(doctor.userId);

                // Attach observers
                notificationSubject.attach(patientObserver, 'prescription');
                notificationSubject.attach(doctorObserver, 'prescription');

                // Notify observers
                const notificationData = {
                    prescriptionId: result.prescriptionId,
                    medications: this.medications,
                    additionalInfo: 'A new prescription has been created.'
                };
                notificationSubject.notify('prescription', notificationData);

                // Detach observers after notification
                notificationSubject.detach(patientObserver, 'prescription');
                notificationSubject.detach(doctorObserver, 'prescription');

                return result;
            }
        } catch (error) {
            console.error('Error creating prescription:', error);
            throw error;
        }
    }

    /**
     * Update prescription with notifications
     * @param {Array} medications - Updated medications list
     * @returns {Promise<boolean>} Success status
     */
    async update(medications) {
        try {
            // Update prescription in database
            const result = await PrescriptionDAO.update(this.prescriptionId, {
                medications: medications,
                status: 'updated'
            });

            if (result) {
                // Get user IDs from Patient and Doctor
                const patient = await PatientDAO.findById(this.patientId);
                const doctor = await DoctorDAO.findById(this.doctorId);

                if (!patient || !doctor) {
                    throw new Error('Could not find patient or doctor information');
                }

                // Create observers for patient and doctor
                const patientObserver = new PrescriptionObserver(patient.userId);
                const doctorObserver = new PrescriptionObserver(doctor.userId);

                // Attach observers
                notificationSubject.attach(patientObserver, 'prescription');
                notificationSubject.attach(doctorObserver, 'prescription');

                // Notify observers
                const notificationData = {
                    prescriptionId: this.prescriptionId,
                    medications: medications,
                    additionalInfo: 'The prescription has been updated.'
                };
                notificationSubject.notify('prescription', notificationData);

                // Detach observers after notification
                notificationSubject.detach(patientObserver, 'prescription');
                notificationSubject.detach(doctorObserver, 'prescription');

                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating prescription:', error);
            throw error;
        }
    }
}

export default Prescription; 