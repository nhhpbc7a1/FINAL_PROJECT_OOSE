import express from 'express';
import specialtyListService from '../../services/patient/specialty_list.service.js';

const router = express.Router();

// GET: Display all specialties
router.get('/', async function (req, res) {
  try {
    // Get all specialties
    const specialties = await specialtyListService.getAllSpecialties();
    
    res.render('vwPatient/list/specialties_list', {
      specialties,
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