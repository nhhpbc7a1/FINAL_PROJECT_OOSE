import PatientDAO from '../dao/PatientDAO.js';

/**
 * Patient model representing a patient in the system
 */
class Patient {
    /**
     * Create a new Patient instance
     * @param {Object} data - Patient data
     */
    constructor(data = {}) {
        this.patientId = data.patientId || null;
        this.userId = data.userId || null;
        this.bloodType = data.bloodType || '';
        this.medicalHistory = data.medicalHistory || '';
        
        // User-related properties
        this.email = data.email || '';
        this.fullName = data.fullName || '';
        this.phoneNumber = data.phoneNumber || '';
        this.address = data.address || '';
        this.accountStatus = data.accountStatus || 'inactive';
        this.gender = data.gender || '';
        this.dob = data.dob || null;
        this.profileImage = data.profileImage || '/public/images/default-avatar.jpg';
        
        // Additional related data
        this.appointments = data.appointments || [];
        this.medicalRecords = data.medicalRecords || [];
    }

    /**
     * Save the patient (create or update)
     * @returns {Promise<number>} Patient ID
     */
    async save() {
        // If patient has an ID, update, otherwise create
        if (this.patientId) {
            // Update existing patient
            const patientData = {
                bloodType: this.bloodType,
                medicalHistory: this.medicalHistory,
                // The Patient table has gender and dob fields directly
                gender: this.gender,
                dob: this.dob
            };
            
            // Only include user data if it exists
            const userData = {};
            if (this.fullName) userData.fullName = this.fullName;
            if (this.phoneNumber) userData.phoneNumber = this.phoneNumber;
            if (this.address) userData.address = this.address;
            if (this.accountStatus) userData.accountStatus = this.accountStatus;
            // The User table also has gender and dob fields
            if (this.gender) userData.gender = this.gender;
            if (this.dob) userData.dob = this.dob;
            if (this.profileImage && this.profileImage !== '/public/images/default-avatar.jpg') {
                userData.profileImage = this.profileImage;
            }
            
            await PatientDAO.update(this.patientId, patientData, userData);
            return this.patientId;
        } else {
            // Create new patient
            if (!this.userId) {
                throw new Error('Patient must have a user ID');
            }
            
            const patientData = {
                userId: this.userId,
                bloodType: this.bloodType,
                medicalHistory: this.medicalHistory,
                gender: this.gender,
                dob: this.dob
            };
            
            this.patientId = await PatientDAO.add(patientData);
            return this.patientId;
        }
    }

    /**
     * Delete the patient
     * @returns {Promise<boolean>} True if successful
     */
    async delete() {
        if (!this.patientId) {
            throw new Error('Cannot delete an unsaved patient');
        }
        return await PatientDAO.delete(this.patientId);
    }

    /**
     * Find all patients
     * @returns {Promise<Array<Patient>>} Array of Patient instances
     */
    static async findAll() {
        const patients = await PatientDAO.findAll();
        return patients.map(patient => new Patient(patient));
    }

    /**
     * Find patient by ID
     * @param {number} patientId - Patient ID
     * @returns {Promise<Patient|null>} Patient instance or null
     */
    static async findById(patientId) {
        const patient = await PatientDAO.findById(patientId);
        return patient ? new Patient(patient) : null;
    }

    /**
     * Find patient by user ID
     * @param {number} userId - User ID
     * @returns {Promise<Patient|null>} Patient instance or null
     */
    static async findByUserId(userId) {
        const patient = await PatientDAO.findByUserId(userId);
        return patient ? new Patient(patient) : null;
    }

    /**
     * Search for patients
     * @param {string} query - Search query
     * @returns {Promise<Array<Patient>>} Array of Patient instances
     */
    static async search(query) {
        const patients = await PatientDAO.search(query);
        return patients.map(patient => new Patient(patient));
    }

    /**
     * Get patient with appointments
     * @param {number} patientId - Patient ID
     * @returns {Promise<Patient|null>} Patient instance with appointments or null
     */
    static async getPatientWithAppointments(patientId) {
        const result = await PatientDAO.getPatientWithAppointments(patientId);
        return result ? new Patient(result) : null;
    }

    /**
     * Get patient with medical records
     * @param {number} patientId - Patient ID
     * @returns {Promise<Patient|null>} Patient instance with medical records or null
     */
    static async getPatientWithMedicalRecords(patientId) {
        const result = await PatientDAO.getPatientWithMedicalRecords(patientId);
        return result ? new Patient(result) : null;
    }

    /**
     * Count patients by gender
     * @returns {Promise<Object>} Counts by gender
     */
    static async countByGender() {
        return await PatientDAO.countByGender();
    }

    /**
     * Count patients by age group
     * @returns {Promise<Array>} Counts by age group
     */
    static async countByAgeGroup() {
        return await PatientDAO.countByAgeGroup();
    }
}

export default Patient; 