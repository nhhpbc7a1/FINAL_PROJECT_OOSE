import express from 'express';
import specialtyService from '../../services/specialty.service.js';
import doctorService from '../../services/doctor.service.js'; // Needed for head doctor dropdown
// import hospitalService from '../../services/hospital.service.js'; // Import if managing hospitals
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';

const router = express.Router();

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '../../public/images/specialties/');

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
    res.locals.currentRoute = 'specialty'; // Set current route highlight
    next();
});

// GET: Display list of specialties
router.get('/', async function (req, res) {
  try {
    const flashMessage = req.session.flashMessage;
    if (flashMessage) {
      res.locals.flashMessage = flashMessage;
      delete req.session.flashMessage;
    }

    const specialties = await specialtyService.findAll();

    res.render('vwAdmin/manage_specialty/specialty_list', {
      specialties,
      totalSpecialties: specialties.length
    });
  } catch (error) {
    console.error('Error loading specialties:', error);
    res.render('vwAdmin/manage_specialty/specialty_list', { error: 'Failed to load specialties' });
  }
});

// GET: Display form to add a new specialty
router.get('/add', async function (req, res) {
  try {
    res.locals.pageTitle = 'Add New Specialty';
    const allDoctors = await doctorService.findAll();
    const activeDoctors = allDoctors.filter(d => d.accountStatus === 'active');
    // const hospitals = await hospitalService.findAll();

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

    res.render('vwAdmin/manage_specialty/add_specialty', {
      doctors: activeDoctors,
      // hospitals,
      specialty: formData,
      error
    });
  } catch (error) {
    console.error('Error loading add specialty form:', error);
    // Translated message
    req.session.flashMessage = { type: 'danger', message: 'Could not load the add specialty form.' };
    res.redirect('/admin/manage_specialty');
  }
});

// POST: Handle adding a new specialty
router.post('/add', async function (req, res, next) {
  req.session.returnTo = '/admin/manage_specialty/add';
  let iconPath = null;

  try {
    const { name, description, headDoctorId /*, hospitalId */ } = req.body;

    // --- Validation ---
    if (!name || name.trim() === '') {
      // Translated message
      throw new Error('Please enter the specialty name.');
    }

    // Check uniqueness
    const isUnique = await specialtyService.isNameUnique(name.trim());
    if (!isUnique) {
        // Translated message
        throw new Error(`Specialty name "${name.trim()}" already exists.`);
    }

    // --- File Upload Handling ---
    if (req.files && req.files.icon) {
      const icon = req.files.icon;
      
      // Check file type
      const fileExtension = path.extname(icon.name).toLowerCase();
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg'];
      
      if (!allowedExtensions.includes(fileExtension)) {
        throw new Error('Only JPG, JPEG, PNG, SVG, or GIF files are allowed.');
      }
      
      // Check file size (2MB limit)
      if (icon.size > 2 * 1024 * 1024) {
        throw new Error('File size cannot exceed 2MB.');
      }
      
      const timestamp = Date.now();
      const safeName = name.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `specialty-${safeName}_${timestamp}${fileExtension}`;
      const uploadPath = path.join(UPLOAD_DIR, filename);

      await icon.mv(uploadPath);
      iconPath = `/public/images/specialties/${filename}`;
    }

    // --- Prepare Data ---
    const specialtyData = {
        name: name.trim(),
        description: description ? description.trim() : null,
        headDoctorId: headDoctorId || null,
        // hospitalId: hospitalId || 1
        icon: iconPath || '/public/images/specialties/default-specialty.jpg'
    };

    // --- Database Operation ---
    await specialtyService.add(specialtyData);

    // --- Success Response ---
    // Translated message
    req.session.flashMessage = { type: 'success', message: 'Specialty added successfully!' };
    res.redirect('/admin/manage_specialty');

  } catch (error) {
    console.error('Error adding specialty:', error);

    // Clean up uploaded file if exists
    if (iconPath) {
      try {
        const fullPath = path.join(__dirname, '../../', iconPath);
        await fs.unlink(fullPath);
        console.log('Cleaned up uploaded file after error:', iconPath);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }

    req.session.formData = req.body;
    // Translated fallback message
    req.session.flashMessage = { type: 'danger', message: error.message || 'Could not add specialty.' };
    res.redirect(req.session.returnTo);
    // Alternatively: return next(error);
  }
});

// GET: Display form to edit an existing specialty
router.get('/edit/:specialtyId', async function (req, res) {
  try {
    res.locals.pageTitle = 'Edit Specialty';
    const specialtyId = parseInt(req.params.specialtyId, 10);

    if (isNaN(specialtyId)) {
        throw new Error('Invalid Specialty ID.');
    }

    const specialty = await specialtyService.findById(specialtyId);

    if (!specialty) {
      req.session.flashMessage = { type: 'danger', message: 'Specialty not found.' };
      return res.redirect('/admin/manage_specialty');
    }

    // Make sure icon path is absolute
    if (specialty.icon && !specialty.icon.startsWith('http')) {
      // Ensure the icon property is properly formatted for display
      specialty.icon = specialty.icon.startsWith('/') ? specialty.icon : `/${specialty.icon}`;
    }

    const allDoctors = await doctorService.findAll();
    const activeDoctors = allDoctors.filter(d => d.accountStatus === 'active');
    // const hospitals = await hospitalService.findAll();

     let error = null;
     if (req.session.flashMessage && req.session.flashMessage.type === 'danger') {
       error = req.session.flashMessage.message;
       delete req.session.flashMessage;
     }

    console.log('Specialty data being passed to template:', specialty);

    res.render('vwAdmin/manage_specialty/edit_specialty', {
      specialty,
      doctors: activeDoctors,
      // hospitals,
      error
    });

  } catch (error) {
    console.error('Error loading edit specialty form:', error);
    // Message already in English
    req.session.flashMessage = { type: 'danger', message: 'Could not load the edit form. ' + error.message };
    res.redirect('/admin/manage_specialty');
  }
});

// POST: Handle updating an existing specialty
router.post('/update/:specialtyId', async function (req, res, next) {
  const specialtyId = parseInt(req.params.specialtyId, 10);
  req.session.returnTo = `/admin/manage_specialty/edit/${specialtyId}`;
  let iconPath = null;
  let oldIconPath = null;

  if (isNaN(specialtyId)) {
      req.session.flashMessage = { type: 'danger', message: 'Invalid Specialty ID.' };
      return res.redirect('/admin/manage_specialty');
  }

  try {
    const { name, description, headDoctorId /*, hospitalId */ } = req.body;

    // --- Validation ---
    if (!name || name.trim() === '') {
       // Translated message
      throw new Error('Please enter the specialty name.');
    }

    // Check uniqueness (excluding current ID)
    const isUnique = await specialtyService.isNameUnique(name.trim(), specialtyId);
    if (!isUnique) {
       // Translated message
        throw new Error(`Specialty name "${name.trim()}" already exists.`);
    }

    // Get current specialty data to get existing icon path
    const currentSpecialty = await specialtyService.findById(specialtyId);
    if (!currentSpecialty) {
        throw new Error('Specialty not found for update.');
    }
    oldIconPath = currentSpecialty.icon;

    // --- File Upload Handling (if new file provided) ---
    if (req.files && req.files.icon) {
      const icon = req.files.icon;
      
      // Check file type
      const fileExtension = path.extname(icon.name).toLowerCase();
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg'];
      
      if (!allowedExtensions.includes(fileExtension)) {
        throw new Error('Only JPG, JPEG, PNG, SVG, or GIF files are allowed.');
      }
      
      // Check file size (2MB limit)
      if (icon.size > 2 * 1024 * 1024) {
        throw new Error('File size cannot exceed 2MB.');
      }
      
      const timestamp = Date.now();
      const safeName = name.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `specialty-${safeName}_${timestamp}${fileExtension}`;
      const uploadPath = path.join(UPLOAD_DIR, filename);

      await icon.mv(uploadPath);
      iconPath = `/public/images/specialties/${filename}`;

      // Delete old icon if it exists and is not the default icon
      if (oldIconPath && oldIconPath !== '/public/images/specialties/default-specialty.jpg') {
        try {
          const fullOldPath = path.join(__dirname, '../../', oldIconPath);
          await fs.unlink(fullOldPath);
          console.log('Deleted old specialty icon:', oldIconPath);
        } catch (unlinkError) {
          console.error('Error deleting old specialty icon:', unlinkError);
        }
      }
    } else {
      // No new file uploaded, keep the old path
      iconPath = oldIconPath;
    }

    // --- Prepare Data ---
    const specialtyData = {
        name: name.trim(),
        description: description ? description.trim() : null,
        headDoctorId: headDoctorId || null,
        // hospitalId: hospitalId || 1
        icon: iconPath
    };

    // --- Database Operation ---
    const updated = await specialtyService.update(specialtyId, specialtyData);

    if (!updated) {
         console.warn(`Update operation reported no changes for specialty ID ${specialtyId}`);
        // Consider if a message is needed here, e.g., "No changes detected."
    }

    // --- Success Response ---
    // Translated message
    req.session.flashMessage = { type: 'success', message: 'Specialty updated successfully!' };
    res.redirect('/admin/manage_specialty');

  } catch (error) {
    console.error(`Error updating specialty ID ${specialtyId}:`, error);

    // Clean up new uploaded file if exists and update failed
    if (iconPath && iconPath !== oldIconPath) {
      try {
        const fullPath = path.join(__dirname, '../../', iconPath);
        await fs.unlink(fullPath);
        console.log('Cleaned up new uploaded file after error:', iconPath);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }

    req.session.formData = req.body;
    // Translated fallback message
    req.session.flashMessage = { type: 'danger', message: error.message || 'Could not update specialty.' };
    res.redirect(req.session.returnTo);
    // Alternatively: return next(error);
  }
});


// DELETE: Handle specialty deletion
router.delete('/delete/:specialtyId', async function (req, res) {
  try {
    const specialtyId = parseInt(req.params.specialtyId, 10);

    if (isNaN(specialtyId)) {
      // Message already English
      return res.status(400).json({ success: false, message: 'Invalid Specialty ID' });
    }

    // Get specialty to find the icon path
    const specialty = await specialtyService.findById(specialtyId);
    if (!specialty) {
      return res.status(404).json({ success: false, message: 'Specialty not found' });
    }

    // *** CRUCIAL: Dependency Check ***
    const dependencies = await specialtyService.checkDependencies(specialtyId);

    if (dependencies.hasAny) {
        // Message construction already English
        let message = 'Cannot delete specialty. It is currently assigned to:';
        if (dependencies.hasDoctors) message += ' Doctors,';
        if (dependencies.hasTechnicians) message += ' Lab Technicians,';
        if (dependencies.hasServices) message += ' Services,';
        if (dependencies.hasRooms) message += ' Rooms,';
        if (dependencies.hasAppointments) message += ' Appointments,';
        message = message.replace(/,\s*$/, '.');

        return res.status(400).json({
            success: false,
            message: message + ' Please reassign or remove these dependencies first.'
        });
    }

    // If checks pass, proceed with deletion
    const deleted = await specialtyService.delete(specialtyId);

    if (!deleted) {
        // Message already English
        return res.status(404).json({ success: false, message: 'Specialty not found or already deleted.' });
    }

    // Delete associated icon if it's not the default icon
    if (specialty.icon && specialty.icon !== '/public/images/specialties/default-specialty.jpg') {
      try {
        const fullPath = path.join(__dirname, '../../', specialty.icon);
        await fs.unlink(fullPath);
        console.log('Deleted specialty icon:', specialty.icon);
      } catch (unlinkError) {
        console.error('Error deleting specialty icon:', unlinkError);
      }
    }

    // Return success response
    return res.json({
      success: true,
      message: 'Specialty deleted successfully',
      specialtyId: specialtyId
    });

  } catch (error) {
    console.error(`Error deleting specialty:`, error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while deleting the specialty.'
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
         const isUnique = await specialtyService.isNameUnique(name, excludeId);
         res.json({ isUnique });
     } catch (error) {
         console.error("API Check Specialty Name Error:", error);
         res.status(500).json({ isUnique: false, message: 'Server error checking name.' });
     }
 });

export default router;