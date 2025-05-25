import express from 'express';
import Doctor from '../../models/Doctor.js';
import Specialty from '../../models/Specialty.js';

const router = express.Router();

// GET: Display all doctors with optional specialty filter
router.get('/', async function (req, res) {
  try {
    // Get query parameters
    const specialtyId = req.query.specialty ? parseInt(req.query.specialty, 10) : null;
    
    // Get doctors, optionally filtered by specialty
    let doctors;
    if (specialtyId) {
      doctors = await Doctor.findBySpecialty(specialtyId);
    } else {
      doctors = await Doctor.findAll();
    }
    
    // Get all specialties for the filter
    const specialties = await Specialty.findAll();
    
    // Get selected specialty name if filter is active
    let selectedSpecialty = null;
    if (specialtyId) {
      const specialty = await Specialty.findById(specialtyId);
      if (specialty) {
        selectedSpecialty = specialty.name;
      }
    }
    
    // Format specialties with doctor counts
    const specialtiesWithCounts = await Doctor.countBySpecialty();
    
    res.render('vwPatient/list/doctors_list', {
      doctors,
      specialties: specialtiesWithCounts,
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