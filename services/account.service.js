import db from '../ultis/db.js';
import bcrypt from 'bcryptjs';

export default {
    async getDoctorId(userId) {
        try {
            const [result] = await db('Doctor')
                .where('userId', userId)
                .select('doctorId');
            return result.doctorId;
        } catch (error) {
            console.error('Error getting doctor ID:', error);
            throw new Error('Unable to get doctor ID');
        }
    },
    async getDoctorSpecialtyName(userId) {
        try {
            const [result] = await db('Doctor')
                .join('Specialty', 'Doctor.specialtyId', '=', 'Specialty.specialtyId')
                .where('Doctor.userId', userId)
                .select('Specialty.name');
            return result.name;
        } catch (error) {
            console.error('Error getting doctor specialty name:', error);
        }
    }
}
