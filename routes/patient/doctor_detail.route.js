import express from 'express';
import Doctor from '../../models/Doctor.js';
import Schedule from '../../models/Schedule.js';
import Service from '../../models/Service.js';

const router = express.Router();

// GET: Display doctor details and their schedule
router.get('/:doctorId', async function (req, res) {
  try {
    const doctorId = parseInt(req.params.doctorId, 10);
    
    if (isNaN(doctorId)) {
      return res.status(400).render('error', {
        message: 'Invalid doctor ID',
        error: { status: 400, stack: '' }
      });
    }
    
    // Get doctor details using Doctor model
    const doctor = await Doctor.findById(doctorId);
    
    if (!doctor) {
      return res.status(404).render('error', {
        message: 'Doctor not found',
        error: { status: 404, stack: '' }
      });
    }
    
    // Get doctor's specialties - since each doctor has one specialty in this system
    const specialties = [{
      specialtyId: doctor.specialtyId,
      name: doctor.specialtyName
    }];
    
    // Get doctor's schedule
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 14); // Get schedule for next 2 weeks
    
    // Format dates for query
    const startDateFormatted = today.toISOString().split('T')[0];
    const endDateFormatted = endDate.toISOString().split('T')[0];
    
    // Get doctor's schedules for the date range
    const doctorSchedules = await Schedule.findByDoctorAndDate(doctorId, startDateFormatted, endDateFormatted);
    
    // Create schedule days (next 14 days)
    const scheduleDays = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      scheduleDays.push({
        date: date.toISOString().split('T')[0],
        dayName: new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date)
      });
    }
    
    // Define common time slots
    const timeSlots = [
      { start: '07:00:00', end: '08:00:00' },
      { start: '08:00:00', end: '09:00:00' },
      { start: '09:00:00', end: '10:00:00' },
      { start: '10:00:00', end: '11:00:00' },
      { start: '13:00:00', end: '14:00:00' },
      { start: '14:00:00', end: '15:00:00' },
      { start: '15:00:00', end: '16:00:00' },
      { start: '16:00:00', end: '17:00:00' }
    ];
    
    // Get services by doctor's specialty
    const services = await Service.findBySpecialty(doctor.specialtyId);
    
    // In this implementation, we don't have reviews yet
    // For now, provide empty reviews or mock data if needed
    const reviews = [];
    const avgRating = 0;
    
    console.log(`[INFO] Doctor ${doctorId} - Schedule count: ${doctorSchedules.length}`);
    
    res.render('vwPatient/doctor/doctor_detail', {
      doctor,
      specialties,
      doctorSchedules,
      scheduleDays,
      timeSlots,
      services,
      reviews,
      avgRating,
      reviewCount: reviews.length,
      title: `Dr. ${doctor.fullName} - Doctor Profile`,
      description: `Learn more about Dr. ${doctor.fullName}, qualifications, specialties, and available appointments.`
    });
  } catch (error) {
    console.error('Error loading doctor details:', error);
    res.status(500).render('error', {
      message: 'Could not load doctor details at this time. Please try again later.',
      error: { status: 500, stack: process.env.NODE_ENV === 'development' ? error.stack : '' }
    });
  }
});

export default router; 