import express from 'express';
import Specialty from '../../models/Specialty.js';

const router = express.Router();

// GET: Display all specialties
router.get('/', async function (req, res) {
  try {
    // Get all specialties with doctor counts and service counts
    const [specialties, specialtiesWithDoctorCounts, specialtiesWithServiceCounts] = await Promise.all([
      Specialty.findAll(),
      Specialty.countDoctorsBySpecialty(),
      Specialty.countServicesBySpecialty()
    ]);

    // Create a map of specialty IDs to doctor counts and service counts
    const doctorCountMap = new Map();
    specialtiesWithDoctorCounts.forEach(specialty => {
      doctorCountMap.set(specialty.specialtyId, specialty.doctorCount);
    });

    const serviceCountMap = new Map();
    specialtiesWithServiceCounts.forEach(specialty => {
      serviceCountMap.set(specialty.specialtyId, specialty.serviceCount);
    });

    // Add doctor count and service count to each specialty
    const specialtiesWithCounts = specialties.map(specialty => {
      return {
        ...specialty,
        doctorCount: doctorCountMap.get(specialty.specialtyId) || 0,
        serviceCount: serviceCountMap.get(specialty.specialtyId) || 0
      };
    });

    console.log('Specialties with counts:', specialtiesWithCounts);
    
    res.render('vwPatient/list/specialties_list', {
      specialties: specialtiesWithCounts,
      title: "Medical Specialties",
      description: "Explore our comprehensive range of medical specialties. Our expert doctors are here to provide the best care for your health needs."
    });
  } catch (error) {
    console.error('Error loading specialties list:', error);
    res.render('vwPatient/list/specialties_list', {
      specialties: [],
      error: 'Could not load specialties at this time. Please try again later.'
    });
  }
});

export default router; 