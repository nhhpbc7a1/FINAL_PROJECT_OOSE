import DoctorDAO from '../dao/DoctorDAO.js';
import AppointmentDAO from '../dao/AppointmentDAO.js';
import ScheduleDAO from '../dao/ScheduleDAO.js';

/**
 * Doctor model representing a doctor in the system
 */
class Doctor {
    /**
     * Create a new Doctor instance
     * @param {Object} data - Doctor data
     */
    constructor(data = {}) {
        this.doctorId = data.doctorId || null;
        this.userId = data.userId || null;
        this.specialtyId = data.specialtyId || null;
        this.licenseNumber = data.licenseNumber || '';
        this.experience = data.experience || 0;
        this.education = data.education || '';
        this.certifications = data.certifications || '';
        this.bio = data.bio || '';
        
        // User-related properties
        this.email = data.email || '';
        this.fullName = data.fullName || '';
        this.phoneNumber = data.phoneNumber || '';
        this.address = data.address || '';
        this.accountStatus = data.accountStatus || 'inactive';
        this.gender = data.gender || '';
        this.dob = data.dob || null;
        this.profileImage = data.profileImage || 'default-avatar.png';
        
        // Specialty-related properties
        this.specialtyName = data.specialtyName || '';
    }

    /**
     * Save the doctor (create or update)
     * @returns {Promise<number>} Doctor ID
     */
    async save() {
        // If doctor has an ID, update, otherwise create
        if (this.doctorId) {
            // Update existing doctor
            const doctorData = {
                specialtyId: this.specialtyId,
                licenseNumber: this.licenseNumber,
                experience: this.experience,
                education: this.education,
                certifications: this.certifications,
                bio: this.bio
            };
            
            // Only include user data if it exists
            const userData = {};
            if (this.fullName) userData.fullName = this.fullName;
            if (this.phoneNumber) userData.phoneNumber = this.phoneNumber;
            if (this.address) userData.address = this.address;
            if (this.accountStatus) userData.accountStatus = this.accountStatus;
            if (this.gender) userData.gender = this.gender;
            if (this.dob) userData.dob = this.dob;
            if (this.profileImage && this.profileImage !== 'default-avatar.png') {
                userData.profileImage = this.profileImage;
            }
            
            await DoctorDAO.update(this.doctorId, doctorData, userData);
            return this.doctorId;
        } else {
            // Create new doctor
            if (!this.userId || !this.specialtyId) {
                throw new Error('Doctor must have a user ID and specialty ID');
            }
            
            const doctorData = {
                userId: this.userId,
                specialtyId: this.specialtyId,
                licenseNumber: this.licenseNumber,
                experience: this.experience,
                education: this.education,
                certifications: this.certifications,
                bio: this.bio
            };
            
            this.doctorId = await DoctorDAO.add(doctorData);
            return this.doctorId;
        }
    }

    /**
     * Delete the doctor
     * @returns {Promise<boolean>} True if successful
     */
    async delete() {
        if (!this.doctorId) {
            throw new Error('Cannot delete an unsaved doctor');
        }
        return await DoctorDAO.delete(this.doctorId);
    }

    /**
     * Find all doctors
     * @returns {Promise<Array<Doctor>>} Array of Doctor instances
     */
    static async findAll() {
        const doctors = await DoctorDAO.findAll();
        return doctors.map(doctor => new Doctor(doctor));
    }

    /**
     * Find all active doctors with basic information for dropdown lists
     * @returns {Promise<Array<Object>>} Array of doctor objects with basic info
     */
    static async findAllWithNames() {
        return await DoctorDAO.findAllWithNames();
    }

    /**
     * Find doctor by ID
     * @param {number} doctorId - Doctor ID
     * @returns {Promise<Doctor|null>} Doctor instance or null
     */
    static async findById(doctorId) {
        const doctor = await DoctorDAO.findById(doctorId);
        return doctor ? new Doctor(doctor) : null;
    }

    /**
     * Find doctor by user ID
     * @param {number} userId - User ID
     * @returns {Promise<Doctor|null>} Doctor instance or null
     */
    static async findByUserId(userId) {
        const doctor = await DoctorDAO.findByUserId(userId);
        return doctor ? new Doctor(doctor) : null;
    }

    /**
     * Find doctors by specialty
     * @param {number} specialtyId - Specialty ID
     * @returns {Promise<Array<Doctor>>} Array of Doctor instances
     */
    static async findBySpecialty(specialtyId) {
        const doctors = await DoctorDAO.findBySpecialty(specialtyId);
        return doctors.map(doctor => new Doctor(doctor));
    }

    /**
     * Search for doctors
     * @param {string} query - Search query
     * @returns {Promise<Array<Doctor>>} Array of Doctor instances
     */
    static async search(query) {
        const doctors = await DoctorDAO.search(query);
        return doctors.map(doctor => new Doctor(doctor));
    }

    /**
     * Count doctors by specialty
     * @returns {Promise<Array>} Count of doctors by specialty
     */
    static async countBySpecialty() {
        return await DoctorDAO.countBySpecialty();
    }

    /**
     * Count doctors by experience level
     * @returns {Promise<Array>} Count of doctors by experience range
     */
    static async countByExperience() {
        return await DoctorDAO.countByExperience();
    }

    /**
     * Get doctor with schedule
     * @param {number} doctorId - Doctor ID
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @returns {Promise<Object>} Doctor with schedule
     */
    static async getDoctorWithSchedule(doctorId, startDate, endDate) {
        const result = await DoctorDAO.getDoctorWithSchedule(doctorId, startDate, endDate);
        return {
            ...new Doctor(result),
            schedule: result.schedule
        };
    }

    /**
     * Get doctor with appointments
     * @param {number} doctorId - Doctor ID
     * @param {string} date - Date (YYYY-MM-DD)
     * @returns {Promise<Object>} Doctor with appointments
     */
    static async getDoctorWithAppointments(doctorId, date) {
        const result = await DoctorDAO.getDoctorWithAppointments(doctorId, date);
        return {
            ...new Doctor(result),
            appointments: result.appointments
        };
    }

    /**
     * Get available doctors for a specialty and date
     * @param {number} specialtyId - Specialty ID
     * @param {string} date - Date (YYYY-MM-DD)
     * @returns {Promise<Array>} Array of available doctors
     */
    static async getAvailableDoctors(specialtyId, date) {
        const doctors = await DoctorDAO.getAvailableDoctors(specialtyId, date);
        return doctors.map(doctor => ({
            ...new Doctor(doctor),
            schedule: doctor.schedule
        }));
    }

    /**
     * Check if the doctor has any dependencies (appointments, schedules, etc.)
     * @returns {Promise<boolean>} True if dependencies exist, false otherwise
     */
    async checkDependencies() {
        try {
            const appointments = await AppointmentDAO.findByDoctor(this.doctorId);
            if (appointments && appointments.length > 0) {
                return true;
            }
            return false;
        } catch (error) {
            console.error(`Error checking dependencies for doctor ${this.doctorId}:`, error);
            throw new Error('Failed to check dependencies: ' + error.message);
        }
    }

    /**
     * Delete all schedules associated with this doctor
     * @returns {Promise<boolean>} True if schedules were deleted successfully
     */
    async deleteSchedules() {
        try {
            // This assumes you have a ScheduleDAO with appropriate methods
            const success = await ScheduleDAO.deleteByDoctor(this.doctorId);
            return success;
        } catch (error) {
            console.error(`Error deleting schedules for doctor ${this.doctorId}:`, error);
            throw new Error('Failed to delete doctor schedules: ' + error.message);
        }
    }
}

export default Doctor; 