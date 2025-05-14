import express from 'express';
import serviceService from '../../services/service.service.js';
import specialtyService from '../../services/specialty.service.js'; // Needed for dropdown
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
        services = await serviceService.search(searchQuery);
    } else {
        // Fetch all services including inactive ones for the admin list view
        services = await serviceService.findAll(true);
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
    const specialties = await specialtyService.findAll(); // Get all specialties for dropdown

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
    const isUnique = await serviceService.isNameUnique(name.trim());
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

    // --- Prepare Data ---
    const serviceData = {
        name: name.trim(),
        description: description ? description.trim() : null,
        price: numericPrice,
        duration: duration ? parseInt(duration, 10) : null,
        type: type,
        category: category ? category.trim() : null,
        specialtyId: specialtyId || null, // Allow null specialty
        status: status || 'active',
        image: imagePath || '/public/images/services/default-service.jpg'
    };

    console.log('Saving service data:', serviceData);

    // --- Database Operation ---
    const result = await serviceService.add(serviceData);
    console.log('Database insert result:', result);

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

// GET: Display form to edit an existing service
router.get('/edit/:serviceId', async function (req, res) {
  try {
    res.locals.pageTitle = 'Edit Service';
    const serviceId = parseInt(req.params.serviceId, 10);

    if (isNaN(serviceId)) throw new Error('Invalid Service ID.');

    const service = await serviceService.findById(serviceId);
    if (!service) {
      req.session.flashMessage = { type: 'danger', message: 'Service not found.' };
      return res.redirect('/admin/manage_service');
    }

    // Make sure image path is absolute
    if (service.image && !service.image.startsWith('http')) {
      // Ensure the image property is properly formatted for display
      service.image = service.image.startsWith('/') ? service.image : `/${service.image}`;
    }

    const specialties = await specialtyService.findAll(); // Get all specialties for dropdown

    let error = null;
    if (req.session.flashMessage && req.session.flashMessage.type === 'danger') {
      error = req.session.flashMessage.message;
      delete req.session.flashMessage;
    }

    console.log('Service data being passed to template:', service);

    res.render('vwAdmin/manage_service/edit_service', {
      service,
      specialties,
      error
    });

  } catch (error) {
    console.error('Error loading edit service form:', error);
    req.session.flashMessage = { type: 'danger', message: 'Could not load the edit form. ' + error.message };
    res.redirect('/admin/manage_service');
  }
});

// POST: Handle updating an existing service
router.post('/update/:serviceId', async function (req, res) {
  const serviceId = parseInt(req.params.serviceId, 10);
  let imagePath = null;
  let oldImagePath = null;

  if (isNaN(serviceId)) {
      req.session.flashMessage = { type: 'danger', message: 'Invalid Service ID.' };
      return res.redirect('/admin/manage_service');
  }

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
    if (!status) throw new Error('Please select a status.');

    // Check uniqueness (excluding current ID)
    const isUnique = await serviceService.isNameUnique(name.trim(), serviceId);
    if (!isUnique) {
        throw new Error(`Service name "${name.trim()}" already exists.`);
    }

    // Get current service data to get existing image path
    const currentService = await serviceService.findById(serviceId);
    if (!currentService) {
        throw new Error('Service not found for update.');
    }
    
    console.log('Current service data:', currentService);
    oldImagePath = currentService.image;
    console.log('Old image path:', oldImagePath);

    // --- File Upload Handling (if new file provided) ---
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

      console.log('Uploading file to:', uploadPath);
      
      try {
        await image.mv(uploadPath);
        console.log('File uploaded successfully');
        imagePath = `/public/images/services/${filename}`;
        console.log('New image path for database:', imagePath);
      } catch (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw new Error('Failed to upload the image. Please try again.');
      }

      // Delete old image if it exists and is not the default image
      if (oldImagePath) {
        // Normalize the path for comparison - handle both absolute and relative paths
        const normalizedPath = oldImagePath.startsWith('/') ? oldImagePath : `/${oldImagePath}`;
        
        // Check against all possible variations of the default path
        const defaultPaths = [
          '/public/images/services/default-service.jpg',
          'public/images/services/default-service.jpg',
          '/public/images/services/default-service.png',
          'public/images/services/default-service.png'
        ];
        
        // Only delete if not a default image
        if (!defaultPaths.includes(normalizedPath)) {
          try {
            const fullOldPath = path.join(__dirname, '../../', oldImagePath);
            await fs.access(fullOldPath); // Check if file exists before attempting to delete
            await fs.unlink(fullOldPath);
            console.log('Deleted old service image:', oldImagePath);
          } catch (unlinkError) {
            console.error('Error deleting old service image:', unlinkError);
          }
        } else {
          console.log('Skipping deletion of default image:', oldImagePath);
        }
      }
    } else {
      // No new file uploaded, keep the old path
      console.log('No new image uploaded, keeping old path');
      imagePath = oldImagePath;
    }

    // --- Prepare Data ---
    const serviceData = {
        name: name.trim(),
        description: description ? description.trim() : null,
        price: numericPrice,
        duration: duration ? parseInt(duration, 10) : null,
        type: type,
        category: category ? category.trim() : null,
        specialtyId: specialtyId || null,
        status: status,
        image: imagePath
    };

    console.log('Updating service with data:', serviceData);

    // --- Database Operation ---
    const result = await serviceService.update(serviceId, serviceData);
    console.log('Database update result:', result);

    // --- Success Response ---
    req.session.flashMessage = { type: 'success', message: 'Service updated successfully!' };
    res.redirect('/admin/manage_service');

  } catch (error) {
    console.error(`Error updating service (serviceId: ${serviceId}):`, error);

    // Clean up new uploaded file if exists and update failed
    if (imagePath && imagePath !== oldImagePath) {
      try {
        const fullPath = path.join(__dirname, '../../', imagePath);
        await fs.unlink(fullPath);
        console.log('Cleaned up new uploaded file after error:', imagePath);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }

    req.session.flashMessage = { type: 'danger', message: error.message || 'Could not update service.' };
    res.redirect(`/admin/manage_service/edit/${serviceId}`);
  }
});

// DELETE: Handle service deletion
router.delete('/delete/:serviceId', async function (req, res) {
  try {
    const serviceId = parseInt(req.params.serviceId, 10);

    if (isNaN(serviceId)) {
      return res.status(400).json({ success: false, message: 'Invalid Service ID' });
    }

    // Get service to find the image path
    const service = await serviceService.findById(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Check dependencies
    const hasDependencies = await serviceService.checkDependencies(serviceId);
    if (hasDependencies) {
        return res.status(400).json({
            success: false,
            message: 'Cannot delete service. It is currently included in appointments or test results. Please remove these associations first.'
        });
    }

    // Delete the service
    const deleted = await serviceService.delete(serviceId);

    if (!deleted) {
        return res.status(404).json({ success: false, message: 'Service not found or already deleted.' });
    }

    // Delete associated image if it's not the default image
    if (service.image && service.image !== '/public/images/services/default-service.jpg') {
      try {
        const fullPath = path.join(__dirname, '../../', service.image);
        await fs.unlink(fullPath);
        console.log('Deleted service image:', service.image);
      } catch (unlinkError) {
        console.error('Error deleting service image:', unlinkError);
      }
    }

    // Return success response
    return res.json({
      success: true,
      message: 'Service deleted successfully',
      serviceId: serviceId
    });

  } catch (error) {
    console.error(`Error deleting service:`, error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while deleting the service.'
    });
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
         const isUnique = await serviceService.isNameUnique(name, excludeId);
         res.json({ isUnique });
     } catch (error) {
         console.error("API Check Service Name Error:", error);
         res.status(500).json({ isUnique: false, message: 'Server error checking name.' });
     }
 });

export default router;