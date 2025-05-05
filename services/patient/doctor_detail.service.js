import db from '../../ultis/db.js';
import moment from 'moment';

const doctorDetailService = {
  /**
   * Get doctor information by ID
   * @param {number} doctorId - The doctor's ID
   * @returns {Promise<Object>} Doctor information
   */
  async getDoctorById(doctorId) {
    try {
      const doctor = await db('Doctor as d')
        .join('User as u', 'd.userId', '=', 'u.userId')
        .select(
          'd.doctorId as id',
          'u.fullName as name',
          'u.profileImage as image',
          'u.gender',
          'u.phoneNumber as phone_number',
          'u.email',
          'd.bio',
          'd.experience as experience_years',
          'd.education',
          'd.certifications'
        )
        .where('d.doctorId', doctorId)
        .first();
      
      return doctor || null;
    } catch (error) {
      console.error('Error fetching doctor details:', error);
      throw error;
    }
  },
  
  /**
   * Get specialty associated with a doctor
   * @param {number} doctorId - The doctor's ID
   * @returns {Promise<Object>} Specialty associated with the doctor
   */
  async getDoctorSpecialties(doctorId) {
    try {
      // Get the doctor record to find specialty ID
      const doctor = await db('Doctor')
        .select('specialtyId')
        .where('doctorId', doctorId)
        .first();
      
      if (!doctor || !doctor.specialtyId) {
        return [];
      }
      
      // Get the specialty details
      const specialty = await db('Specialty')
        .select('specialtyId as id', 'name', 'icon')
        .where('specialtyId', doctor.specialtyId)
        .first();
      
      return specialty ? [specialty] : [];
    } catch (error) {
      console.error('Error fetching doctor specialty:', error);
      throw error;
    }
  },
  
  /**
   * Get doctor's schedule for the next 7 days
   * @param {number} doctorId - The doctor's ID
   * @returns {Promise<Array>} Doctor's schedule
   */
  async getDoctorSchedule(doctorId) {
    try {
      const today = moment().startOf('day');
      const nextWeek = moment().add(7, 'days').endOf('day');
      
      const schedules = await db('Schedule as s')
        .select(
          's.scheduleId as id', 
          's.workDate as date', 
          's.startTime as start_time', 
          's.endTime as end_time', 
          's.status'
        )
        .where('s.doctorId', doctorId)
        .whereBetween('s.workDate', [today.format('YYYY-MM-DD'), nextWeek.format('YYYY-MM-DD')])
        .orderBy(['s.workDate', 's.startTime']);
      
      // Group schedules by date
      const groupedSchedules = [];
      const dateMap = new Map();
      
      schedules.forEach(schedule => {
        const dateStr = moment(schedule.date).format('YYYY-MM-DD');
        const dayName = moment(schedule.date).format('dddd');
        const dayDate = moment(schedule.date).format('DD/MM/YYYY');
        
        // Format times
        schedule.formattedStartTime = moment(schedule.start_time, 'HH:mm:ss').format('HH:mm');
        schedule.formattedEndTime = moment(schedule.end_time, 'HH:mm:ss').format('HH:mm');
        
        if (!dateMap.has(dateStr)) {
          const daySchedule = {
            date: schedule.date,
            dayName,
            dayDate,
            timeSlots: []
          };
          dateMap.set(dateStr, groupedSchedules.length);
          groupedSchedules.push(daySchedule);
        }
        
        const index = dateMap.get(dateStr);
        groupedSchedules[index].timeSlots.push(schedule);
      });
      
      return groupedSchedules;
    } catch (error) {
      console.error('Error fetching doctor schedule:', error);
      throw error;
    }
  },
  
  /**
   * Get services provided by the doctor based on appointments
   * @param {number} doctorId - The doctor's ID
   * @returns {Promise<Array>} Services provided by the doctor
   */
  async getDoctorServices(doctorId) {
    try {
      // Get service IDs from appointments linked to this doctor
      const serviceIds = await db('Appointment as a')
        .join('AppointmentServices as as', 'a.appointmentId', '=', 'as.appointmentId')
        .select('as.serviceId')
        .where('a.doctorId', doctorId)
        .groupBy('as.serviceId');
      
      if (!serviceIds.length) {
        return [];
      }
      
      // Get service details for these IDs
      const serviceIdList = serviceIds.map(item => item.serviceId);
      
      const services = await db('Service')
        .select(
          'serviceId as id',
          'name',
          'description',
          'price',
          'image',
          'type'
        )
        .whereIn('serviceId', serviceIdList)
        .where('status', 'active')
        .orderBy('name');
      
      // Format prices
      services.forEach(service => {
        service.formattedPrice = new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND'
        }).format(service.price);
      });
      
      return services;
    } catch (error) {
      console.error('Error fetching doctor services:', error);
      throw error;
    }
  },
  
  /**
   * Get reviews for a doctor (would need a Reviews table)
   * @param {number} doctorId - The doctor's ID
   * @returns {Promise<Array>} Reviews for the doctor
   */
  async getDoctorReviews(doctorId) {
    // Since there's no Reviews table in the schema, return an empty array
    return [];
  }
};

export default doctorDetailService; 