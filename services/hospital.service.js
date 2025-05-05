import db from '../ultis/db.js';

export default {
    async findAll() {
        try {
            return await db('Hospital')
                .orderBy('name');
        } catch (error) {
            console.error('Error fetching hospitals:', error);
            throw new Error('Unable to load hospitals');
        }
    },

    async findById(hospitalId) {
        try {
            const hospital = await db('Hospital')
                .where('hospitalId', hospitalId)
                .first();
            return hospital || null;
        } catch (error) {
            console.error(`Error fetching hospital with ID ${hospitalId}:`, error);
            throw new Error('Unable to find hospital');
        }
    },

    async getHospitalWithDepartments(hospitalId) {
        try {
            // Get hospital details
            const hospital = await this.findById(hospitalId);
            
            if (!hospital) return null;
            
            // Get all specialties/departments in the hospital
            const specialties = await db('Specialty')
                .leftJoin('Doctor as HeadDoctor', 'Specialty.headDoctorId', '=', 'HeadDoctor.doctorId')
                .leftJoin('User as HeadDoctorUser', 'HeadDoctor.userId', '=', 'HeadDoctorUser.userId')
                .select(
                    'Specialty.*',
                    'HeadDoctorUser.fullName as headDoctorName'
                )
                .where('Specialty.hospitalId', hospitalId)
                .orderBy('Specialty.name');
            
            // Get counts of doctors per specialty
            const doctorCounts = await db('Doctor')
                .join('Specialty', 'Doctor.specialtyId', '=', 'Specialty.specialtyId')
                .select('Specialty.specialtyId')
                .count('Doctor.doctorId as count')
                .where('Specialty.hospitalId', hospitalId)
                .groupBy('Specialty.specialtyId');
            
            // Add doctor counts to specialties
            const specialtiesWithCounts = specialties.map(specialty => {
                const count = doctorCounts.find(item => item.specialtyId === specialty.specialtyId);
                return {
                    ...specialty,
                    doctorCount: count ? count.count : 0
                };
            });
            
            // Return hospital with specialties
            return {
                ...hospital,
                specialties: specialtiesWithCounts
            };
        } catch (error) {
            console.error(`Error fetching hospital with departments for ID ${hospitalId}:`, error);
            throw new Error('Unable to get hospital with departments');
        }
    },

    async add(hospital) {
        try {
            const [hospitalId] = await db('Hospital').insert(hospital);
            return hospitalId;
        } catch (error) {
            console.error('Error adding hospital:', error);
            throw new Error('Unable to add hospital');
        }
    },

    async update(hospitalId, hospital) {
        try {
            const result = await db('Hospital')
                .where('hospitalId', hospitalId)
                .update(hospital);
            return result > 0;
        } catch (error) {
            console.error(`Error updating hospital with ID ${hospitalId}:`, error);
            throw new Error('Unable to update hospital');
        }
    },

    async delete(hospitalId) {
        try {
            const result = await db('Hospital')
                .where('hospitalId', hospitalId)
                .delete();
            return result > 0;
        } catch (error) {
            console.error(`Error deleting hospital with ID ${hospitalId}:`, error);
            throw new Error('Unable to delete hospital');
        }
    },

    async getStatistics(hospitalId) {
        try {
            // Get specialty count
            const [specialtyCount] = await db('Specialty')
                .where('hospitalId', hospitalId)
                .count('specialtyId as count');
            
            // Get doctor count
            const [doctorCount] = await db('Doctor')
                .join('Specialty', 'Doctor.specialtyId', '=', 'Specialty.specialtyId')
                .where('Specialty.hospitalId', hospitalId)
                .count('Doctor.doctorId as count');
            
            // Get room count
            const [roomCount] = await db('Room')
                .join('Specialty', 'Room.specialtyId', '=', 'Specialty.specialtyId')
                .where('Specialty.hospitalId', hospitalId)
                .count('Room.roomId as count');
            
            // Get appointment count for current month
            const firstDayOfMonth = new Date();
            firstDayOfMonth.setDate(1);
            firstDayOfMonth.setHours(0, 0, 0, 0);
            
            const [appointmentCount] = await db('Appointment')
                .join('Specialty', 'Appointment.specialtyId', '=', 'Specialty.specialtyId')
                .where('Specialty.hospitalId', hospitalId)
                .where('Appointment.appointmentDate', '>=', firstDayOfMonth)
                .count('Appointment.appointmentId as count');
            
            return {
                specialtyCount: specialtyCount.count,
                doctorCount: doctorCount.count,
                roomCount: roomCount.count,
                monthlyAppointments: appointmentCount.count
            };
        } catch (error) {
            console.error(`Error getting statistics for hospital ID ${hospitalId}:`, error);
            throw new Error('Unable to get hospital statistics');
        }
    }
}; 