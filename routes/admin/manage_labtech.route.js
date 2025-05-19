import express from 'express';
import LabTechnician from '../../models/LabTechnician.js';
import Specialty from '../../models/Specialty.js';
import User from '../../models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises'; // Import fs promises for file deletion
import db from '../../ultis/db.js'; // Import database connection for direct queries

// Định nghĩa __dirname cho ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Assuming same upload directory for profile images
const UPLOAD_DIR = path.join(__dirname, '../../public/uploads/profile_images/');

const router = express.Router();

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
ensureUploadDirExists(); // Call it once when the router loads

// Middleware để đặt layout và route mặc định
router.use((req, res, next) => {
    res.locals.layout = 'admin';
    res.locals.currentRoute = 'lab'; // <--- Changed default route
    next();
});

// GET: Display list of lab technicians
router.get('/', async function (req, res) {
  try {
    // Check for flash messages
    const flashMessage = req.session.flashMessage;
    if (flashMessage) {
      res.locals.flashMessage = flashMessage;
      delete req.session.flashMessage;
    }

    let labTechnicians = await LabTechnician.findAll();
    const specialties = await Specialty.findAll();

    labTechnicians = labTechnicians.map(tech => ({
      ...tech,
      initials: tech.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      profilePictureUrl: tech.profileImage || '/public/images/default-avatar.png'
    }));

    res.render('vwAdmin/manage_labtech/labtech_list', {
      labTechnicians,
      specialties,
      totalLabTechnicians: labTechnicians.length
    });
  } catch (error) {
    console.error('Error loading lab technicians:', error);
    res.render('vwAdmin/manage_labtech/labtech_list', { error: 'Failed to load lab technicians' });
  }
});

// GET: Display form to add a new lab technician
router.get('/add', async function (req, res) {
  try {
    res.locals.pageTitle = 'Add New Lab Technician';
    const specialties = await Specialty.findAll();

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

    res.render('vwAdmin/manage_labtech/add_labtech', {
      specialties,
      labTechnician: formData,
      error
    });
  } catch (error) {
    console.error('Error loading add technician form:', error);
    req.session.flashMessage = { type: 'danger', message: 'Không thể tải form thêm kỹ thuật viên.' };
    res.redirect('/admin/manage_labtech');
  }
});

// POST: Handle adding a new lab technician
router.post('/add', async function (req, res, next) {
  let profileImagePath = null;

  req.session.returnTo = '/admin/manage_labtech/add';

  try {
    // Destructure fields relevant to User and LabTechnician
    const { fullName, email, phoneNumber, address, gender, dob, specialtyId,
            specialization,
            password, confirmPassword,
            accountStatus } = req.body;

    // --- Basic Validation ---
    if (!email || !fullName || !phoneNumber || !specialtyId || !password || !confirmPassword) {
      throw new Error('Vui lòng điền đầy đủ thông tin bắt buộc (Email, Tên, SĐT, Khoa, Mật khẩu).');
    }
    if (password !== confirmPassword) {
      throw new Error('Mật khẩu xác nhận không khớp.');
    }

    // --- File Upload Handling ---
    if (req.files && req.files.profileImage) {
      const profilePhoto = req.files.profileImage;

      const fileExtension = path.extname(profilePhoto.name).toLowerCase();
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
      if (!allowedExtensions.includes(fileExtension)) {
        throw new Error('Chỉ chấp nhận file hình ảnh có định dạng JPG, JPEG, PNG hoặc GIF.');
      }
      if (profilePhoto.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('Kích thước file không được vượt quá 5MB.');
      }

      const timestamp = Date.now();
      const safeEmailPrefix = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${safeEmailPrefix}_${timestamp}${fileExtension}`;
      const uploadPath = path.join(UPLOAD_DIR, filename);

      await profilePhoto.mv(uploadPath);
      profileImagePath = `/public/uploads/profile_images/${filename}`;
    }

    // --- Database Operations ---
    // 1. Create User
    const hashedPassword = await User.hashPassword(password);

    const userData = {
        email,
        password: hashedPassword,
        fullName,
        phoneNumber,
        address,
        profileImage: profileImagePath,
        gender,
        dob: dob ? new Date(dob) : null,
        roleId: 4, // Role ID for Lab Technician
        accountStatus: accountStatus || 'active' // Default to active if not provided
    };
    
    const newUser = new User(userData);
    await newUser.save();

    if (!newUser || !newUser.userId) {
        throw new Error('Không thể tạo tài khoản người dùng.');
    }

    // 2. Create LabTechnician Record
    const labTechnicianData = {
        userId: newUser.userId,
        specialtyId: parseInt(specialtyId, 10),
        specialization: specialization || null
    };
    
    const labTechnician = new LabTechnician(labTechnicianData);
    await labTechnician.save();

    // --- Success Response ---
    req.session.flashMessage = { type: 'success', message: 'Thêm kỹ thuật viên thành công!' };
    res.redirect('/admin/manage_labtech');

  } catch (error) {
    console.error('Error adding lab technician:', error);

    // Clean up uploaded file if DB insert fails
    if (profileImagePath) {
      try {
        const fullPath = path.join(__dirname, '../../', profileImagePath);
        await fs.unlink(fullPath);
        console.log('Cleaned up uploaded file after error:', profileImagePath);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }

    // Save form data for re-population
    req.session.formData = req.body;

    // Pass error to middleware
    return next(error);
  }
});

// GET: Display form to edit an existing lab technician
router.get('/edit/:technicianId', async function (req, res) {
  try {
    res.locals.pageTitle = 'Edit Lab Technician';
    const technicianId = parseInt(req.params.technicianId, 10);

    if (isNaN(technicianId)) {
        throw new Error('Invalid Technician ID.');
    }

    // Fetch the combined technician + user data using the technicianId
    const labTechnician = await LabTechnician.findById(technicianId);

    if (!labTechnician) {
      req.session.flashMessage = { type: 'danger', message: 'Lab Technician not found.' };
      return res.redirect('/admin/manage_labtech');
    }

    const userId = labTechnician.userId;
    if (!userId) {
      req.session.flashMessage = { type: 'danger', message: 'User ID not found for this technician.' };
      return res.redirect('/admin/manage_labtech');
    }

    const specialties = await Specialty.findAll();

    // Format date for input type="date" (YYYY-MM-DD)
    let formattedDob = '';
    if (labTechnician.dob) {
        try {
            let dobDate;
            if (labTechnician.dob instanceof Date) dobDate = labTechnician.dob;
            else dobDate = new Date(labTechnician.dob); // Try parsing string

            if (!isNaN(dobDate)) {
                formattedDob = dobDate.toISOString().split('T')[0]; // Simple YYYY-MM-DD format
            }
        } catch (dateError) {
            console.error('Error formatting date of birth:', dateError);
        }
    }

    res.render('vwAdmin/manage_labtech/edit_labtech', {
      specialties,
      labTechnician: {
          ...labTechnician,
          dob: formattedDob, // Pass formatted date
          specialty: labTechnician.specialtyId, // Ensure field matches select name if needed
          profilePictureUrl: labTechnician.profileImage || '/public/images/default-avatar.png'
      }
    });

  } catch (error) {
    console.error('Error loading edit technician form:', error);
    req.session.flashMessage = { type: 'danger', message: 'Could not load the edit form. ' + error.message };
    res.redirect('/admin/manage_labtech');
  }
});

// POST: Handle updating an existing lab technician
router.post('/update/:technicianId', async function (req, res) {
  const technicianId = parseInt(req.params.technicianId, 10);
  let profileImagePath = null;
  let oldImagePath = null;
  const specialties = await Specialty.findAll(); // Fetch for error case

  if (isNaN(technicianId)) {
      req.session.flashMessage = { type: 'danger', message: 'Invalid Technician ID.' };
      return res.redirect('/admin/manage_labtech');
  }

  const userId = parseInt(req.body.userId, 10);
  if (isNaN(userId)) {
      req.session.flashMessage = { type: 'danger', message: 'Invalid User ID in form submission.' };
      return res.redirect('/admin/manage_labtech');
  }

  try {
    // Destructure fields relevant to User and LabTechnician
    const { fullName, email, phoneNumber, address, gender, dob, specialtyId,
            specialization,
            accountStatus } = req.body;

    // 1. Fetch current user data for old image path
    const currentUser = await User.findById(userId);
    if (!currentUser) {
        throw new Error('Technician user account not found for update.');
    }
    oldImagePath = currentUser.profileImage;

    // --- File Upload Handling (if new file provided - 'profileImage') ---
    if (req.files && req.files.profileImage) {
        const profilePhoto = req.files.profileImage;
        const timestamp = Date.now();
        // Use current email (or potentially submitted email if allowed to change)
        const safeEmailPrefix = (currentUser.email || 'user').split('@')[0].replace(/[^a-zA-Z0-9]/g, '_');
        const fileExtension = path.extname(profilePhoto.name);
        const filename = `${safeEmailPrefix}_${timestamp}${fileExtension}`;
        const uploadPath = path.join(UPLOAD_DIR, filename);

        await profilePhoto.mv(uploadPath);
        profileImagePath = `/public/uploads/profile_images/${filename}`;

        // Delete old image *after* successful upload
        if (oldImagePath) {
          // Normalize the path for comparison - handle both absolute and relative paths
          const normalizedPath = oldImagePath.startsWith('/') ? oldImagePath : `/${oldImagePath}`;
          
          // Check against all possible variations of the default path
          const defaultPaths = [
            '/public/images/default-avatar.png',
            'public/images/default-avatar.png',
            '/public/images/default-avatar.jpg',
            'public/images/default-avatar.jpg'
          ];
          
          // Only delete if not a default image and different from new image
          if (!defaultPaths.includes(normalizedPath) && oldImagePath !== profileImagePath) {
            try {
              const fullOldPath = path.join(__dirname, '../../', oldImagePath);
              await fs.access(fullOldPath); // Check if file exists before attempting to delete
              await fs.unlink(fullOldPath);
              console.log('Deleted old profile image:', oldImagePath);
            } catch (unlinkError) {
              console.error('Error deleting old profile image:', unlinkError);
            }
          } else {
            console.log('Skipping deletion of default or reused profile image:', oldImagePath);
          }
        }
    } else {
        profileImagePath = oldImagePath; // Keep old path if no new file
    }

    // --- Database Operations ---
    // 2. Update User Record
    const userData = {
        fullName,
        phoneNumber,
        address,
        profileImage: profileImagePath,
        gender,
        dob: dob ? new Date(dob) : null,
        accountStatus: accountStatus || 'active'
        // DO NOT update roleId or password here
    };
    
    // Get the user and update it
    const userToUpdate = await User.findById(userId);
    Object.assign(userToUpdate, userData);
    await userToUpdate.save();

    // 3. Update LabTechnician Record
    const labTechnicianData = {
        specialtyId: parseInt(specialtyId, 10),
        specialization: specialization || null // Technician specific
    };

    // Get the lab technician and update it
    const labTechnician = await LabTechnician.findById(technicianId);
    if (!labTechnician) {
        throw new Error('Failed to find lab technician to update.');
    }
    
    Object.assign(labTechnician, labTechnicianData);
    const updated = await labTechnician.save();
    
    if (!updated) {
        throw new Error('Failed to update technician-specific details.');
    }

    // --- Success Response ---
    req.session.flashMessage = { type: 'success', message: 'Technician updated successfully!' };
    res.redirect('/admin/manage_labtech');

  } catch (error) {
    console.error(`Error updating technician (technicianId: ${technicianId}, userId: ${userId}):`, error);

    // --- Error Response ---
    // Re-render edit form with submitted data and error message
     let technicianForForm = null;
     try {
         technicianForForm = await LabTechnician.findById(technicianId);
         if (!technicianForForm) {
             req.session.flashMessage = { type: 'danger', message: 'Technician not found after update attempt.' };
             return res.redirect('/admin/manage_labtech');
         }
     } catch(fetchErr) {
         console.error('Error fetching technician data after update attempt:', fetchErr);
         req.session.flashMessage = { type: 'danger', message: 'Error updating technician and reloading data.' };
         return res.redirect('/admin/manage_labtech');
     }

     let formattedDob = '';
     if (technicianForForm && technicianForForm.dob) {
         try {
             const dobDate = new Date(technicianForForm.dob);
             if (!isNaN(dobDate)) formattedDob = dobDate.toISOString().split('T')[0];
         } catch (e) { /* ignore */ }
     }

    res.locals.pageTitle = 'Edit Lab Technician';
    res.render('vwAdmin/manage_labtech/edit_labtech', {
      specialties,
      labTechnician: {
          ...technicianForForm, // Base fetched data
          ...req.body,         // Override with submitted values
          technicianId: technicianId, // Ensure ID is present
          userId: userId,        // Ensure userId is present
          dob: req.body.dob || formattedDob,
          profilePictureUrl: profileImagePath || oldImagePath || '/public/images/default-avatar.png'
      },
      error: 'Failed to update technician. ' + error.message
    });
  }
});

// DELETE: Handle lab technician deletion
router.delete('/delete/:technicianId', async function (req, res) {
  try {
    const technicianId = parseInt(req.params.technicianId, 10);

    if (isNaN(technicianId)) {
      return res.status(400).json({ success: false, message: 'Invalid Technician ID' });
    }

    // Get the technician to find the associated userId
    const labTechnician = await LabTechnician.findById(technicianId);

    if (!labTechnician) {
      return res.status(404).json({ success: false, message: 'Lab Technician not found' });
    }

    const userId = labTechnician.userId;

    // Check if the technician has dependencies
    const hasDependencies = await labTechnician.checkDependencies();

    if (hasDependencies) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete technician with existing test results. Please reassign or manage results first.'
      });
    }

    // Delete the lab technician
    await labTechnician.delete();
    
    // Update user account status to inactive
    const user = await User.findById(userId);
    if (user) {
      user.accountStatus = 'inactive';
      user.email = `${user.email}_deleted_${Date.now()}`;
      await user.save();
    }

    // Return success response
    return res.json({
      success: true,
      message: 'Technician deleted successfully',
      technicianId: technicianId
    });

  } catch (error) {
    console.error(`Error deleting technician:`, error);

    // Check for foreign key constraint errors specifically
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa kỹ thuật viên vì còn dữ liệu liên quan (vd: Kết quả xét nghiệm).'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa kỹ thuật viên. Vui lòng thử lại sau.'
    });
  }
});

// API endpoint for AJAX filtering/search
router.get('/api', async function (req, res) {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Filters
    const specialty = req.query.specialty || '';
    const status = req.query.status || '';
    const search = req.query.search || '';

    // Fetch all lab technicians
    let labTechnicians = await LabTechnician.findAll();

    // Apply filters
    let filteredLabTechnicians = labTechnicians;
    if (specialty) {
      filteredLabTechnicians = filteredLabTechnicians.filter(tech => tech.specialtyId == specialty);
    }
    if (status) {
      filteredLabTechnicians = filteredLabTechnicians.filter(tech => tech.accountStatus && tech.accountStatus.toLowerCase() === status.toLowerCase());
    }
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredLabTechnicians = filteredLabTechnicians.filter(tech =>
          (tech.fullName && tech.fullName.toLowerCase().includes(searchTerm)) ||
          (tech.email && tech.email.toLowerCase().includes(searchTerm)) ||
          (tech.specialization && tech.specialization.toLowerCase().includes(searchTerm)) ||
          (tech.specialtyName && tech.specialtyName.toLowerCase().includes(searchTerm))
      );
    }

    const filteredTotal = filteredLabTechnicians.length;

    // Apply pagination *after* filtering
    const paginatedLabTechnicians = filteredLabTechnicians.slice(offset, offset + limit);

    // Add initials or other derived data
    const results = paginatedLabTechnicians.map(tech => ({
      ...tech,
      initials: tech.fullName ? tech.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??',
      profilePictureUrl: tech.profileImage || '/public/images/default-avatar.png'
    }));

    // Return JSON response
    res.json({
      labTechnicians: results,
      totalLabTechnicians: filteredTotal,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(filteredTotal / limit),
        totalItems: filteredTotal
      }
    });
  } catch (error) {
    console.error('Error loading technicians via API:', error);
    res.status(500).json({ error: 'Failed to load technicians' });
  }
});

export default router;