import express from 'express';
import Service from '../../models/Service.js';
import Specialty from '../../models/Specialty.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';

const router = express.Router();

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '../../public/images/services/');

// Ensure upload directory exists
const ensureUploadDirExists = async () => {
  try {
    await fs.access(UPLOAD_DIR);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      console.log(`Created upload directory: ${UPLOAD_DIR}`);
    } else {
      console.error('Error checking/creating upload directory:', error);
    }
  }
};
ensureUploadDirExists();

// Middleware for layout and current route
router.use((req, res, next) => {
    res.locals.layout = 'admin';
    res.locals.currentRoute = 'services'; // Set current route highlight
    next();
});

// GET: Display list of services
router.get('/', async function (req, res) {
  try {
    const flashMessage = req.session.flashMessage;
    if (flashMessage) {
      res.locals.flashMessage = flashMessage;
      delete req.session.flashMessage;
    }

    // Check for search query
    const searchQuery = req.query.search || '';
    let services;
    if (searchQuery) {
        services = await Service.search(searchQuery);
    } else {
        // Fetch all services including inactive ones for the admin list view
        services = await Service.findAll(true);
    }

    res.render('vwAdmin/manage_service/service_list', {
      services,
      totalServices: services.length,
      searchQuery
    });
  } catch (error) {
    console.error('Error loading services:', error);
    res.render('vwAdmin/manage_service/service_list', { error: 'Failed to load services' });
  }
});

// GET: Display form to add a new service
router.get('/add', async function (req, res) {
  try {
    res.locals.pageTitle = 'Add New Service';
    const specialties = await Specialty.findAll(); // Get all specialties for dropdown

    let formData = {};
    if (req.session.formData) {
      formData = req.session.formData;
      delete req.session.formData;
    }

    let error = null;
    if (req.session.flashMessage && req.session.flashMessage.type === 'danger') {
      error = req.session.flashMessage.message;
      delete req.session.flashMessage;
    }

    res.render('vwAdmin/manage_service/add_service', {
      specialties,
      service: formData, // Repopulate form on error
      error
    });
  } catch (error) {
    console.error('Error loading add service form:', error);
    req.session.flashMessage = { type: 'danger', message: 'Could not load the add service form.' };
    res.redirect('/admin/manage_service');
  }
});

// POST: Handle adding a new service
router.post('/add', async function (req, res) {
  let imagePath = null;
  req.session.returnTo = '/admin/manage_service/add';

  try {
    const { name, description, price, duration, type, category, specialtyId, status } = req.body;

    // --- Validation ---
    if (!name || name.trim() === '') throw new Error('Please enter the service name.');
    if (!price || price.trim() === '') throw new Error('Please enter the service price.');
    if (!type) throw new Error('Please select a service type.');
    if (duration && (isNaN(parseInt(duration, 10)) || parseInt(duration, 10) < 0)) {
        throw new Error('Duration must be a non-negative number.');
    }
    const numericPrice = parseFloat(price);
     if (isNaN(numericPrice) || numericPrice < 0) {
          throw new Error('Price must be a non-negative number.');
     }

    // Check uniqueness
    const isUnique = await Service.isNameUnique(name.trim());
    if (!isUnique) {
        throw new Error(`Service name "${name.trim()}" already exists.`);
    }

    // --- File Upload Handling ---
    if (req.files && req.files.image) {
      const image = req.files.image;
      
      // Check file type
      const fileExtension = path.extname(image.name).toLowerCase();
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
      
      if (!allowedExtensions.includes(fileExtension)) {
        throw new Error('Only JPG, JPEG, PNG or GIF files are allowed.');
      }
      
      // Check file size (2MB limit)
      if (image.size > 2 * 1024 * 1024) {
        throw new Error('File size cannot exceed 2MB.');
      }
      
      const timestamp = Date.now();
      const safeName = name.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `service-${safeName}_${timestamp}${fileExtension}`;
      const uploadPath = path.join(UPLOAD_DIR, filename);

      // Log the upload path for debugging
      console.log('Uploading file to:', uploadPath);
      
      try {
        await image.mv(uploadPath);
        console.log('File uploaded successfully');
        imagePath = `/public/images/services/${filename}`;
        console.log('Image path for database:', imagePath);
      } catch (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw new Error('Failed to upload the image. Please try again.');
      }
    }

    // --- Create and save service ---
    const service = new Service({
        name: name.trim(),
        description: description ? description.trim() : null,
        price: numericPrice,
        duration: duration ? parseInt(duration, 10) : null,
        type: type,
        category: category ? category.trim() : null,
        specialtyId: specialtyId || null, // Allow null specialty
        status: status || 'active',
        image: imagePath || '/public/images/services/default-service.jpg'
    });

    console.log('Saving service data:', service);
    await service.save();

    // --- Success Response ---
    req.session.flashMessage = { type: 'success', message: 'Service added successfully!' };
    res.redirect('/admin/manage_service');

  } catch (error) {
    console.error('Error adding service:', error);

    // Clean up uploaded file if exists
    if (imagePath) {
      try {
        const fullPath = path.join(__dirname, '../../', imagePath);
        await fs.unlink(fullPath);
        console.log('Cleaned up uploaded file after error:', imagePath);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }

    req.session.formData = req.body;
    req.session.flashMessage = { type: 'danger', message: error.message || 'Could not add service.' };
    res.redirect(req.session.returnTo);
  }
});

// GET: Display form to edit a service
router.get('/edit/:id', async function (req, res) {
  try {
    res.locals.pageTitle = 'Edit Service';
    const serviceId = parseInt(req.params.id, 10);
    
    if (isNaN(serviceId)) throw new Error('Invalid Service ID.');

    const service = await Service.findById(serviceId);
    if (!service) {
      req.session.flashMessage = { type: 'danger', message: 'Service not found.' };
      return res.redirect('/admin/manage_service');
    }

    const specialties = await Specialty.findAll(); // Get all specialties for dropdown

    let error = null;
    if (req.session.flashMessage && req.session.flashMessage.type === 'danger') {
      error = req.session.flashMessage.message;
      delete req.session.flashMessage;
    }

    // Restore form data if available (from failed submission)
    const serviceData = req.session.formData || service;
    if (req.session.formData) {
      delete req.session.formData;
    }

    // Set active tab
    res.locals.activeTab = 'basic'; // Default tab
    if (req.query.tab) {
      res.locals.activeTab = req.query.tab;
    }

    res.render('vwAdmin/manage_service/edit_service', {
      service: serviceData,
      specialties,
      error
    });
  } catch (error) {
    console.error('Error loading edit service form:', error);
    req.session.flashMessage = { type: 'danger', message: 'Could not load the edit service form.' };
    res.redirect('/admin/manage_service');
  }
});

// POST: Handle updating a service
router.post('/edit/:id', async function (req, res) {
  let imagePath = null;
  req.session.returnTo = `/admin/manage_service/edit/${req.params.id}`;
  
  try {
    const serviceId = parseInt(req.params.id, 10);
    if (isNaN(serviceId)) throw new Error('Invalid Service ID.');
    
    const { name, description, price, duration, type, category, specialtyId, status } = req.body;

    // --- Validation ---
    if (!name || name.trim() === '') throw new Error('Please enter the service name.');
    if (!price || price.trim() === '') throw new Error('Please enter the service price.');
    if (!type) throw new Error('Please select a service type.');
    if (duration && (isNaN(parseInt(duration, 10)) || parseInt(duration, 10) < 0)) {
        throw new Error('Duration must be a non-negative number.');
    }
    const numericPrice = parseFloat(price);
     if (isNaN(numericPrice) || numericPrice < 0) {
          throw new Error('Price must be a non-negative number.');
     }

    // Check uniqueness (excluding current ID)
    const isUnique = await Service.isNameUnique(name.trim(), serviceId);
    if (!isUnique) {
        throw new Error(`Service name "${name.trim()}" already exists.`);
    }

    // Get current service to start with existing data
    const currentService = await Service.findById(serviceId);
    if (!currentService) {
        throw new Error('Service not found for update.');
    }

    // --- File Upload Handling ---
    if (req.files && req.files.image) {
      const image = req.files.image;
      
      // Check file type
      const fileExtension = path.extname(image.name).toLowerCase();
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
      
      if (!allowedExtensions.includes(fileExtension)) {
        throw new Error('Only JPG, JPEG, PNG or GIF files are allowed.');
      }
      
      // Check file size (2MB limit)
      if (image.size > 2 * 1024 * 1024) {
        throw new Error('File size cannot exceed 2MB.');
      }
      
      const timestamp = Date.now();
      const safeName = name.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `service-${safeName}_${timestamp}${fileExtension}`;
      const uploadPath = path.join(UPLOAD_DIR, filename);
      
      try {
        await image.mv(uploadPath);
        console.log('File uploaded successfully');
        imagePath = `/public/images/services/${filename}`;
        
        // Delete old image if it's not the default
        if (currentService.image && 
            !currentService.image.includes('default-service.jpg') && 
            fs.existsSync(path.join(__dirname, '../../', currentService.image))) {
          await fs.unlink(path.join(__dirname, '../../', currentService.image));
          console.log('Old image deleted:', currentService.image);
        }
      } catch (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw new Error('Failed to upload the image. Please try again.');
      }
    }

    // Update service with form data
    currentService.name = name.trim();
    currentService.description = description ? description.trim() : null;
    currentService.price = numericPrice;
    currentService.duration = duration ? parseInt(duration, 10) : null;
    currentService.type = type;
    currentService.category = category ? category.trim() : null;
    currentService.specialtyId = specialtyId || null;
    currentService.status = status;
    
    // Only update image if a new one was uploaded
    if (imagePath) {
      currentService.image = imagePath;
    }
    
    // Save the updated service
    await currentService.save();

    // --- Success Response ---
    req.session.flashMessage = { type: 'success', message: 'Service updated successfully!' };
    res.redirect('/admin/manage_service');

  } catch (error) {
    console.error('Error updating service:', error);

    // Clean up uploaded file if there was an error and we uploaded a new file
    if (imagePath) {
      try {
        const fullPath = path.join(__dirname, '../../', imagePath);
        if (await fs.access(fullPath).then(() => true).catch(() => false)) {
          await fs.unlink(fullPath);
          console.log('Cleaned up uploaded file after error:', imagePath);
        }
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }

    req.session.formData = req.body;
    req.session.flashMessage = { type: 'danger', message: error.message || 'Could not update service.' };
    res.redirect(req.session.returnTo);
  }
});

// DELETE: Handle deleting a service
router.delete('/delete/:id', async function (req, res) {
  try {
    const serviceId = parseInt(req.params.id, 10);
    if (isNaN(serviceId)) {
      return res.status(400).json({ success: false, message: 'Invalid Service ID' });
    }

    // Get service instance
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Check dependencies
    const dependencies = await service.checkDependencies();
    if (dependencies.hasAppointments) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete this service because it is used in appointments. Consider marking it as inactive instead.'
        });
    }

    // If service has a custom image, delete it
    if (service.image && 
        !service.image.includes('default-service.jpg') && 
        fs.existsSync(path.join(__dirname, '../../', service.image))) {
      try {
        await fs.unlink(path.join(__dirname, '../../', service.image));
        console.log('Service image deleted:', service.image);
      } catch (unlinkError) {
        console.error('Error deleting service image:', unlinkError);
        // Continue with service deletion even if image deletion fails
      }
    }

    // Delete the service
    const deleted = await service.delete();

    if (!deleted) {
      return res.status(500).json({ success: false, message: 'Failed to delete service' });
    }

    return res.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    return res.status(500).json({ success: false, message: error.message || 'An error occurred while deleting the service' });
  }
});

// API endpoint for AJAX name uniqueness check
router.get('/api/check-name', async (req, res) => {
     const name = req.query.name;
     const excludeId = req.query.excludeId ? parseInt(req.query.excludeId, 10) : null;

     if (!name) {
         return res.status(400).json({ isUnique: false, message: 'Name parameter is required.' });
     }

     try {
         const isUnique = await Service.isNameUnique(name, excludeId);
         res.json({ isUnique });
     } catch (error) {
         console.error("API Check Service Name Error:", error);
         res.status(500).json({ isUnique: false, message: 'Server error checking name.' });
     }
 });

export default router;