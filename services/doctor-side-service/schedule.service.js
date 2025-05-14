import db from '../../ultis/db.js';
import moment from 'moment';

export default {
  async getDoctorSchedules(doctorId, date = null) {
    try {
      if (!doctorId) {
        console.error('getDoctorSchedules: No doctorId provided');
        return [];
      }
      
      let query = db('Schedule')
        .where('Schedule.doctorId', doctorId)
        .leftJoin('Room', 'Schedule.roomId', '=', 'Room.roomId')
        .select(
          'Schedule.*',
          'Room.roomNumber'
        )
        .orderBy('Schedule.workDate')
        .orderBy('Schedule.startTime');

      // Filter by specific date if provided
      if (date) {
        query = query.where('Schedule.workDate', date);
      }

      console.log('getDoctorSchedules query:', query.toString());
      const result = await query;
      console.log('getDoctorSchedules result count:', result.length);
      return result;
    } catch (error) {
      console.error(`Error fetching schedules for doctor ID ${doctorId}:`, error);
      throw new Error('Unable to find doctor schedules');
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
      
      const query = db('Schedule')
        .where('Schedule.doctorId', doctorId)
        .whereBetween('Schedule.workDate', [startDate, endDate])
        .leftJoin('Room', 'Schedule.roomId', '=', 'Room.roomId')
        .select(
          'Schedule.*',
          'Room.roomNumber'
        )
        .orderBy('Schedule.workDate')
        .orderBy('Schedule.startTime');
        
      console.log('getDoctorSchedulesByDateRange query:', query.toString());
      const result = await query;
      console.log('getDoctorSchedulesByDateRange result count:', result.length);
      return result;
    } catch (error) {
      console.error(`Error fetching schedules for doctor ID ${doctorId} in date range:`, error);
      throw new Error('Unable to find doctor schedules for the date range');
    }
  },

  async getDoctorAppointmentsByDate(doctorId, date) {
    try {
      return await db('Appointment')
        .where('Appointment.doctorId', doctorId)
        .where('Appointment.appointmentDate', date)
        .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
        .join('User', 'Patient.userId', '=', 'User.userId')
        .leftJoin('Room', 'Appointment.roomId', '=', 'Room.roomId')
        .leftJoin('Specialty', 'Appointment.specialtyId', '=', 'Specialty.specialtyId')
        .select(
          'Appointment.*',
          'User.fullName as patientName',
          'Room.roomNumber',
          'Specialty.name as specialtyName'
        )
        .orderBy('Appointment.appointmentTime');
    } catch (error) {
      console.error(`Error fetching appointments for doctor ID ${doctorId} on date ${date}:`, error);
      throw new Error('Unable to find doctor appointments for the date');
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
      
      // Get total number of schedules
      const totalSchedules = await db('Schedule')
        .where('doctorId', doctorId)
        .whereBetween('workDate', [startDate, endDate])
        .count('scheduleId as total')
        .first();

      // Get count by status
      const availableSchedules = await db('Schedule')
        .where('doctorId', doctorId)
        .whereBetween('workDate', [startDate, endDate])
        .where('status', 'available')
        .count('scheduleId as count')
        .first();

      const fullfilledSchedules = await db('Schedule')
        .where('doctorId', doctorId)
        .whereBetween('workDate', [startDate, endDate])
        .where('status', 'fullfilled')
        .count('scheduleId as count')
        .first();

      return {
        total: parseInt(totalSchedules?.total || 0),
        available: parseInt(availableSchedules?.count || 0),
        fullfilled: parseInt(fullfilledSchedules?.count || 0)
      };
    } catch (error) {
      console.error(`Error getting schedule summary for doctor ID ${doctorId}:`, error);
      throw new Error('Unable to get schedule summary');
    }
  }
}; 