import express from 'express';
import serviceListService from '../../services/patient/service_list.service.js';
import specialtyService from '../../services/specialty.service.js';

const router = express.Router();

// GET: Display all services with optional filters
router.get('/', async function (req, res) {
  try {
    // Get query parameters
    const specialtyId = req.query.specialty ? parseInt(req.query.specialty, 10) : null;
    const type = req.query.type || null;
    
    // Get all services, optionally filtered
    const services = await serviceListService.getAllServices(specialtyId, type);
    
    // Get all specialties for the filter dropdown
    const specialties = await specialtyService.findAll();
    
    // Get selected specialty name if filter is active
    let selectedSpecialty = null;
    if (specialtyId) {
      const specialty = await specialtyService.findById(specialtyId);
      if (specialty) {
        selectedSpecialty = specialty.name;
      }
    }
    
    // Service types for filter
    const serviceTypes = [
      { value: 'service', label: 'Services' },
      { value: 'test', label: 'Tests' },
      { value: 'procedure', label: 'Procedures' }
    ];
    
    res.render('vwPatient/list/services_list', {
      services,
      specialties,
      serviceTypes,
      selectedSpecialtyId: specialtyId,
      selectedSpecialty,
      selectedType: type,
      title: "Our Medical Services",
      description: "Explore our comprehensive range of medical services, tests, and procedures. Use the filters to find exactly what you need."
    });
  } catch (error) {
    console.error('Error loading services list:', error);
    res.render('vwPatient/list/services_list', {
      services: [],
      specialties: [],
      serviceTypes: [],
      error: 'Could not load services at this time. Please try again later.'
    });
  }
});

export default router; 