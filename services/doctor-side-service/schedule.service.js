import Doctor from '../../models/Doctor.js';
import ScheduleDAO from '../../dao/ScheduleDAO.js';
import AppointmentDAO from '../../dao/AppointmentDAO.js';
import moment from 'moment';

export default {
  async getDoctorSchedules(doctorId, date = null) {
    try {
      if (!doctorId) {
        console.error('getDoctorSchedules: No doctorId provided');
        return [];
      }
      
      // Validate doctor exists
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        throw new Error(`Doctor with ID ${doctorId} not found`);
      }

      // Get schedules from DAO
      return await ScheduleDAO.findByDoctor(doctorId, date);
    } catch (error) {
      console.error(`Error fetching schedules for doctor ID ${doctorId}:`, error);
      throw new Error('Unable to find doctor schedules: ' + error.message);
    }
  },

  async getDoctorSchedulesByDateRange(doctorId, startDate, endDate) {
    try {
      if (!doctorId) {
        console.error('getDoctorSchedulesByDateRange: No doctorId provided');
        return [];
      }
      
      if (!startDate || !endDate) {
        console.error('getDoctorSchedulesByDateRange: Missing date range');
        return [];
      }
      
      // Validate doctor exists
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        throw new Error(`Doctor with ID ${doctorId} not found`);
      }
      
      // Get schedules from DAO
      return await ScheduleDAO.findByDoctorAndDateRange(doctorId, startDate, endDate);
    } catch (error) {
      console.error(`Error fetching schedules for doctor ID ${doctorId} in date range:`, error);
      throw new Error('Unable to find doctor schedules for the date range: ' + error.message);
    }
  },

  async getDoctorAppointmentsByDate(doctorId, date) {
    try {
      // Validate doctor exists
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        throw new Error(`Doctor with ID ${doctorId} not found`);
      }
      
      // Use AppointmentDAO to get the data
      return await AppointmentDAO.findByDoctorAndDate(doctorId, date);
    } catch (error) {
      console.error(`Error fetching appointments for doctor ID ${doctorId} on date ${date}:`, error);
      throw new Error('Unable to find doctor appointments for the date: ' + error.message);
    }
  },

  // Transform schedules for FullCalendar
  formatSchedulesForCalendar(schedules) {
    if (!Array.isArray(schedules) || schedules.length === 0) {
      console.log('No schedules to format');
      return [];
    }
    
    return schedules.map(schedule => {
      try {
        // Ensure date is in correct format YYYY-MM-DD
        const workDate = moment(schedule.workDate).format('YYYY-MM-DD');
        
        // Ensure times are valid time strings
        const startTime = schedule.startTime ? schedule.startTime.toString() : '00:00:00';
        const endTime = schedule.endTime ? schedule.endTime.toString() : '00:00:00';
        
        // Create ISO strings for start and end times
        const startDateTime = `${workDate}T${startTime}`;
        const endDateTime = `${workDate}T${endTime}`;
        
        console.log('Formatting schedule:', {
          id: schedule.scheduleId,
          date: workDate,
          start: startDateTime,
          end: endDateTime
        });
        
        return {
          id: schedule.scheduleId,
          title: `Room ${schedule.roomNumber || 'N/A'}`,
          start: startDateTime,
          end: endDateTime,
          status: schedule.status || 'available',
          backgroundColor: schedule.status === 'available' ? '#28a745' : '#FF9800'
        };
      } catch (error) {
        console.error('Error formatting schedule:', error, schedule);
        return null;
      }
    }).filter(Boolean); // Filter out any null entries
  },

  async getSummaryByDoctorAndDateRange(doctorId, startDate, endDate) {
    try {
      if (!doctorId) {
        return { total: 0, available: 0, fullfilled: 0 };
      }
      
      // Validate doctor exists
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        throw new Error(`Doctor with ID ${doctorId} not found`);
      }
      
      // Get summary from DAO
      return await ScheduleDAO.getSummaryByDoctorAndDateRange(doctorId, startDate, endDate);
    } catch (error) {
      console.error(`Error getting schedule summary for doctor ID ${doctorId}:`, error);
      throw new Error('Unable to get schedule summary: ' + error.message);
    }
  }
}; 