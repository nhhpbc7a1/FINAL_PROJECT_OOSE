import express from 'express';
import doctorListService from '../../services/patient/doctor_list.service.js';
import specialtyService from '../../services/specialty.service.js';

const router = express.Router();

// GET: Display all doctors with optional specialty filter
router.get('/', async function (req, res) {
  try {
    // Get query parameters
    const specialtyId = req.query.specialty ? parseInt(req.query.specialty, 10) : null;
    
    // Get doctors, optionally filtered by specialty
    const doctors = await doctorListService.getAllDoctors(specialtyId);
    
    // Get specialties with doctor counts for the filter
    const specialties = await doctorListService.getDoctorCountBySpecialty();
    
    // Get selected specialty name if filter is active
    let selectedSpecialty = null;
    if (specialtyId) {
      const specialty = await specialtyService.findById(specialtyId);
      if (specialty) {
        selectedSpecialty = specialty.name;
      }
    }
    
    res.render('vwPatient/list/doctors_list', {
      doctors,
      specialties,
      selectedSpecialtyId: specialtyId,
      selectedSpecialty,
      title: selectedSpecialty ? `Doctors - ${selectedSpecialty}` : "Our Medical Team",
      description: "Meet our highly qualified doctors who are dedicated to providing excellent healthcare services. Filter by specialty to find the right doctor for your needs."
    });
  } catch (error) {
    console.error('Error loading doctors list:', error);
    res.render('vwPatient/list/doctors_list', {
      doctors: [],
      specialties: [],
      error: 'Could not load doctors at this time. Please try again later.'
    });
  }
});

export default router; 