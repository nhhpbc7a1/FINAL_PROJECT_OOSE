import express from 'express';
import Doctor from '../../models/Doctor.js';
import Schedule from '../../models/Schedule.js';
import Appointment from '../../models/Appointment.js';
import moment from 'moment';

const router = express.Router();

// Middleware for layout and active sidebar item
router.use((req, res, next) => {
  res.locals.layout = 'doctor';
  res.locals.active = 'schedule'; 
  next();
});

// Handlebars helpers for date and time formatting
router.use((req, res, next) => {
  res.locals.helpers = {
    ...res.locals.helpers,
    formatDate: (date) => {
      try {
        return moment(date).format('DD MMM YYYY');
      } catch (error) {
        console.error('Error formatting date:', date, error);
        return 'Invalid date';
      }
    },
    formatTime: (time) => {
      try {
        if (!time) return 'N/A';
        return moment(time, 'HH:mm:ss').format('h:mm A');
      } catch (error) {
        console.error('Error formatting time:', time, error);
        return 'Invalid time';
      }
    }
  };
  next();
});

router.get('/', async (req, res) => {
  try {
    // Get doctor ID from session
    const doctorId = req.session.authUser?.doctorId;
    console.log('Doctor ID from session:', doctorId);
    
    // Check if doctor is logged in
    if (!doctorId) {
      return res.redirect('/account/login'); // Redirect to login page if not logged in
    }
    
    // Get date from query params or use current date
    const selectedDate = req.query.date || moment().format('YYYY-MM-DD');
    console.log('Selected Date:', selectedDate);
    
    // For calendar view, get schedules for the month
    const monthStart = moment(selectedDate).startOf('month').format('YYYY-MM-DD');
    const monthEnd = moment(selectedDate).endOf('month').format('YYYY-MM-DD');
    console.log('Date Range:', monthStart, 'to', monthEnd);
    
    // Query schedules from database
    let todaySchedules = [];
    let monthSchedules = [];
    
    try {
      todaySchedules = await Schedule.findByDoctorAndDate(doctorId, selectedDate);
      console.log(`Found ${todaySchedules.length} schedules for today`);
      
      // Check if we have data
      if (todaySchedules.length === 0) {
        console.log('No schedules found for today, this is expected if no schedules were created');
      }
    } catch (error) {
      console.error('Error fetching today schedules:', error.message);
    }
    
    try {
      monthSchedules = await Schedule.findByDoctorAndDateRange(doctorId, monthStart, monthEnd);
      console.log(`Found ${monthSchedules.length} schedules for month`);
    } catch (error) {
      console.error('Error fetching month schedules:', error.message);
    }
    
    // Format schedules for calendar
    let scheduleEvents = [];
    try {
      scheduleEvents = Schedule.formatSchedulesForCalendar(monthSchedules);
      console.log(`Formatted ${scheduleEvents.length} events for calendar`);
    } catch (error) {
      console.error('Error formatting schedules for calendar:', error.message);
    }
    
    // Get summary of schedules
    let summary = { total: 0, available: 0, fullfilled: 0, booked: 0, unavailable: 0 };
    try {
      summary = await Schedule.getSummaryByDoctorAndDateRange(
        doctorId, 
        moment().startOf('month').format('YYYY-MM-DD'),
        moment().endOf('month').format('YYYY-MM-DD')
      );
      console.log('Schedule Summary:', summary);
    } catch (error) {
      console.error('Error getting schedule summary:', error.message);
    }
    
    // Get doctor details to display name
    let doctorDetails = null;
    try {
      doctorDetails = await Doctor.findById(doctorId);
      console.log('Doctor details loaded:', doctorDetails ? 'Yes' : 'No');
    } catch (error) {
      console.error('Error loading doctor details:', error.message);
    }
    
    res.render('vwDoctor/schedule', {
      doctorSchedules: todaySchedules,
      selectedDate: selectedDate,
      scheduleEvents: JSON.stringify(scheduleEvents),
      summary: summary,
      doctor: doctorDetails,
      formatDate: (date) => moment(date).format('DD MMM YYYY'),
      formatTime: (time) => time ? moment(time, 'HH:mm:ss').format('h:mm A') : 'N/A'
    });
    
  } catch (error) {
    console.error('Error loading doctor schedules:', error);
    res.render('vwDoctor/schedule', { 
      error: 'Could not load schedule data',
      doctorSchedules: [],
      scheduleEvents: JSON.stringify([])
    });
  }
});

export default router; 