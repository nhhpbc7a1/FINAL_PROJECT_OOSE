import db from '../ultis/db.js';

export default {
    async findAll() {
        try {
            return await db('Specialty')
                .select('*')
                .orderBy('name');
        } catch (error) {
            console.error('Error fetching specialties:', error);
            throw new Error('Unable to load specialties');
        }
    },

    async findById(specialtyId) {
        try {
            const specialty = await db('Specialty')
                .where('specialtyId', specialtyId)
                .first();
            return specialty || null;
        } catch (error) {
            console.error(`Error fetching specialty with ID ${specialtyId}:`, error);
            throw new Error('Unable to find specialty');
        }
    },

    async findByName(name) {
        try {
            return await db('Specialty')
                .where('name', 'like', `%${name}%`)
                .orderBy('name');
        } catch (error) {
            console.error(`Error searching specialties with name "${name}":`, error);
            throw new Error('Unable to search specialties');
        }
    },

    async search(query) {
        try {
            return await db('Specialty')
                .where('name', 'like', `%${query}%`)
                .orWhere('description', 'like', `%${query}%`)
                .orderBy('name');
        } catch (error) {
            console.error(`Error searching specialties with query "${query}":`, error);
            throw new Error('Unable to search specialties');
        }
    },

    async add(specialty) {
        try {
            const [specialtyId] = await db('Specialty').insert(specialty);
            return specialtyId;
        } catch (error) {
            console.error('Error adding specialty:', error);
            throw new Error('Unable to add specialty');
        }
    },

    async update(specialtyId, specialty) {
        try {
            const result = await db('Specialty')
                .where('specialtyId', specialtyId)
                .update(specialty);
            return result > 0;
        } catch (error) {
            console.error(`Error updating specialty with ID ${specialtyId}:`, error);
            throw new Error('Unable to update specialty');
        }
    },

    async delete(specialtyId) {
        try {
            // Check if specialty is in use by any doctors
            const doctorsCount = await db('Doctor')
                .where('specialtyId', specialtyId)
                .count('doctorId as count')
                .first();
            
            if (doctorsCount && doctorsCount.count > 0) {
                throw new Error(`Cannot delete specialty as it is assigned to ${doctorsCount.count} doctors`);
            }
            
            const result = await db('Specialty')
                .where('specialtyId', specialtyId)
                .delete();
            return result > 0;
        } catch (error) {
            console.error(`Error deleting specialty with ID ${specialtyId}:`, error);
            throw error;
        }
    },

    async getDoctorCountBySpecialty() {
        try {
            return await db('Doctor')
                .join('Specialty', 'Doctor.specialtyId', '=', 'Specialty.specialtyId')
                .select('Specialty.specialtyId', 'Specialty.name')
                .count('Doctor.doctorId as doctorCount')
                .groupBy('Specialty.specialtyId', 'Specialty.name')
                .orderBy('doctorCount', 'desc');
        } catch (error) {
            console.error('Error counting doctors by specialty:', error);
            throw new Error('Unable to count doctors by specialty');
        }
    },

    async getAppointmentCountBySpecialty(dateRange = null) {
        try {
            let query = db('Appointment')
                .join('Specialty', 'Appointment.specialtyId', '=', 'Specialty.specialtyId')
                .select('Specialty.specialtyId', 'Specialty.name')
                .count('Appointment.appointmentId as appointmentCount')
                .groupBy('Specialty.specialtyId', 'Specialty.name');
            
            // Add date range filter if provided
            if (dateRange && dateRange.start && dateRange.end) {
                query = query.whereBetween('Appointment.appointmentDate', [dateRange.start, dateRange.end]);
            }
            
            return await query.orderBy('appointmentCount', 'desc');
        } catch (error) {
            console.error('Error counting appointments by specialty:', error);
            throw new Error('Unable to count appointments by specialty');
        }
    },

    async getSpecialtiesWithServicesCount() {
        try {
            return await db('Specialty')
                .leftJoin('Service', 'Specialty.specialtyId', '=', 'Service.specialtyId')
                .select('Specialty.*')
                .count('Service.serviceId as serviceCount')
                .groupBy('Specialty.specialtyId')
                .orderBy('Specialty.name');
        } catch (error) {
            console.error('Error fetching specialties with service counts:', error);
            throw new Error('Unable to get specialties with service counts');
        }
    },

    async getMostPopularSpecialties(limit = 5) {
        try {
            return await db('Doctor')
                .join('Specialty', 'Doctor.specialtyId', '=', 'Specialty.specialtyId')
                .select('Specialty.specialtyId', 'Specialty.name')
                .count('Doctor.doctorId as doctorCount')
                .groupBy('Specialty.specialtyId', 'Specialty.name')
                .orderBy('doctorCount', 'desc')
                .limit(limit);
        } catch (error) {
            console.error(`Error fetching most popular specialties:`, error);
            throw new Error('Unable to get most popular specialties');
        }
    },

    async getSpecialtyWithDoctors(specialtyId) {
        try {
            // Get specialty details
            const specialty = await this.findById(specialtyId);
            
            if (!specialty) return null;
            
            // Get doctors in specialty
            const doctors = await db('Doctor')
                .join('User', 'Doctor.userId', '=', 'User.userId')
                .select(
                    'Doctor.*',
                    'User.email',
                    'User.fullName',
                    'User.phoneNumber',
                    'User.address',
                    'User.accountStatus'
                )
                .where('Doctor.specialtyId', specialtyId)
                .orderBy('User.fullName');
            
            // Return specialty with doctors
            return {
                ...specialty,
                doctors
            };
        } catch (error) {
            console.error(`Error fetching specialty with doctors for ID ${specialtyId}:`, error);
            throw new Error('Unable to get specialty with doctors');
        }
    },

    async getSpecialtyStats() {
        try {
            const stats = await db('Specialty')
                .leftJoin('Doctor', 'Specialty.specialtyId', '=', 'Doctor.specialtyId')
                .leftJoin('Appointment', 'Doctor.doctorId', '=', 'Appointment.doctorId')
                .select(
                    'Specialty.specialtyId',
                    'Specialty.name'
                )
                .count('Doctor.doctorId as doctorCount')
                .countDistinct('Appointment.appointmentId as appointmentCount')
                .groupBy('Specialty.specialtyId', 'Specialty.name')
                .orderBy('doctorCount', 'desc');
            
            return stats;
        } catch (error) {
            console.error('Error fetching specialty statistics:', error);
            throw new Error('Unable to get specialty statistics');
        }
    }
}; 