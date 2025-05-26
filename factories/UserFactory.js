import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import LabTechnician from '../models/LabTechnician.js';

/**
 * Factory class for creating different types of users
 */
class UserFactory {
    /**
     * Create a user instance based on role
     * @param {Object} userData - User data including roleId
     * @returns {User} Appropriate user instance
     * @throws {Error} If roleId is invalid
     */
    static createUser(userData) {
        // Validate required fields
        this.validateUserData(userData);
        
        // Create appropriate user instance based on role
        switch(userData.roleId) {
            case 1: // Admin
                userData.roleName = 'Administrator';
                return new User(userData);
                
            case 2: // Doctor
                userData.roleName = 'Doctor';
                return new Doctor(userData);
                
            case 3: // Patient
                userData.roleName = 'Patient';
                return new Patient(userData);
                
            case 4: // Lab Technician
                userData.roleName = 'Lab Technician';
                return new LabTechnician(userData);
                
            default:
                throw new Error(`Invalid role ID: ${userData.roleId}`);
        }
    }

}

export default UserFactory; 