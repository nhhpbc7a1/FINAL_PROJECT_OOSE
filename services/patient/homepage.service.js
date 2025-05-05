import db from '../../ultis/db.js';

const DEFAULT_SERVICE_IMAGE = '/public/images/services/default-service.jpg';
const DEFAULT_SPECIALTY_ICON = '/public/images/specialties/default-specialty.png';
const DEFAULT_DOCTOR_IMAGE = '/public/images/default-avatar.jpg';

const homepageService = {
    async getServices() {
        const services = await db('Service')
            .select('serviceId as id', 'name', 'description', 'price', 'duration', 'type', 'image')
            .where('status', 'active')
            .limit(4);
            
        // Add placeholder image for each service
        return services;
    },

    async getSpecialties() {
        const specialties = await db('Specialty')
            .select('specialtyId as id', 'name', 'description', 'icon')
            .limit(5);
            
        // Add placeholder icon for each specialty
        return specialties;
    },

    async getDoctors() {
        const doctors = await db('Doctor')
            .select(
                'Doctor.doctorId as id',
                'User.fullName as name',
                'Specialty.name as specialty_name',
                'User.profileImage as image'
            )
            .join('User', 'Doctor.userId', 'User.userId')
            .join('Specialty', 'Doctor.specialtyId', 'Specialty.specialtyId')
            .where('User.accountStatus', 'active')
            .limit(4);
            
        // Add placeholder image for each doctor
        return doctors;
    }
};

export default homepageService; 