import db from '../../ultis/db.js';
import specialtyService from '../specialty.service.js';
import doctorService from '../doctor.service.js';
import scheduleService from '../schedule.service.js';
import serviceService from '../service.service.js';

const specialtyDetailService = {
    async getSpecialtyDetails(specialtyId) {
        try {
            // Get specialty information
            const specialty = await specialtyService.findById(specialtyId);
            
            if (!specialty) {
                return {
                    specialty: null,
                    doctors: [],
                    services: []
                };
            }

            // Get doctors in this specialty
            const doctors = await doctorService.findBySpecialty(specialtyId);
            
            // Get services in this specialty
            const allServices = await serviceService.findAll(true); // Get all active services
            const services = allServices.filter(service => service.specialtyId === specialtyId);
            
            return {
                specialty,
                doctors,
                services
            };
        } catch (error) {
            console.error(`Error getting specialty details for ID ${specialtyId}:`, error);
            throw new Error('Unable to get specialty details');
        }
    },
    
    async getDoctorSchedules(specialtyId, startDate, endDate) {
        try {
            // Get all doctors in the specialty
            const doctors = await doctorService.findBySpecialty(specialtyId);
            
            if (!doctors || doctors.length === 0) {
                return [];
            }
            
            // Create a date array for the next 7 days
            const dates = [];
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            // Create proper date objects for each day in the range
            for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
                // Store the actual Date object, not just the string
                const newDate = new Date(date);
                dates.push(newDate);
            }
            
            // For each doctor, get their schedule for the next 7 days
            const schedulesByDoctor = [];
            
            for (const doctor of doctors) {
                // Kiểm tra xem doctor có id hay không
                const doctorId = doctor.id || doctor.doctorId;
                
                if (!doctorId) {
                    console.log('Doctor ID is missing:', doctor);
                    continue; // Bỏ qua nếu không có doctorId
                }
                
                try {
                    // Get schedules for this doctor in the date range
                    const doctorWithSchedule = await doctorService.getDoctorWithSchedule(
                        doctorId,
                        startDate,
                        endDate
                    );
                    
                    if (doctorWithSchedule && doctorWithSchedule.schedules) {
                        // Group schedules by date
                        const schedulesByDate = {};
                        
                        for (const date of dates) {
                            // Convert date to string format for comparison with schedule data
                            const dateStr = date.toISOString().split('T')[0];
                            
                            // Filter schedules for this date
                            const schedulesForDate = doctorWithSchedule.schedules.filter(
                                schedule => schedule.workDate === dateStr
                            );
                            
                            schedulesByDate[dateStr] = schedulesForDate;
                        }
                        
                        schedulesByDoctor.push({
                            doctor: doctorWithSchedule,
                            schedulesByDate
                        });
                    }
                } catch (error) {
                    console.error(`Error getting schedule for doctor ID ${doctorId}:`, error);
                    // Continue with next doctor rather than failing the entire request
                }
            }
            
            return {
                dates,
                schedulesByDoctor
            };
        } catch (error) {
            console.error(`Error getting doctor schedules for specialty ID ${specialtyId}:`, error);
            throw new Error('Unable to get doctor schedules');
        }
    }
};

export default specialtyDetailService; 