import express from 'express';
import labTechnicianService from '../../services/lab-technician.service.js'; // <--- Changed service
import specialtyService from '../../services/specialty.service.js';
import userService from '../../services/user.service.js';
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

    let labTechnicians = await labTechnicianService.findAll(); // <--- Changed service call

    const specialties = await specialtyService.findAll();

    labTechnicians = labTechnicians.map(tech => ({ // <--- Changed variable name
      ...tech,
      initials: tech.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      profilePictureUrl: tech.profileImage || '/public/images/default-avatar.png'
    }));

    res.render('vwAdmin/manage_labtech/labtech_list', { // <--- Changed view path
      labTechnicians, // <--- Changed variable name
      specialties,
      totalLabTechnicians: labTechnicians.length // <--- Changed variable name
    });
  } catch (error) {
    console.error('Error loading lab technicians:', error); // <--- Changed error message
    res.render('vwAdmin/manage_labtech/labtech_list', { error: 'Failed to load lab technicians' }); // <--- Changed view path and message
  }
});

// GET: Display form to add a new lab technician
router.get('/add', async function (req, res) {
  try {
    res.locals.pageTitle = 'Add New Lab Technician'; // <--- Changed title
    const specialties = await specialtyService.findAll();

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

    res.render('vwAdmin/manage_labtech/add_labtech', { // <--- Changed view path
      specialties,
      labTechnician: formData, // <--- Changed variable name (used in form)
      error
    });
  } catch (error) {
    console.error('Error loading add technician form:', error); // <--- Changed error message
    req.session.flashMessage = { type: 'danger', message: 'Không thể tải form thêm kỹ thuật viên.' }; // <--- Changed message
    res.redirect('/admin/manage_labtech'); // <--- Changed redirect path
  }
});

// POST: Handle adding a new lab technician
router.post('/add', async function (req, res, next) {
  let profileImagePath = null;

  req.session.returnTo = '/admin/manage_labtech/add'; // <--- Changed return path

  try {
    // Destructure fields relevant to User and LabTechnician
    const { fullName, email, phoneNumber, address, gender, dob, specialtyId, // Note: name changed from specialty to specialtyId based on add form
            specialization, // Technician specific field
            password, confirmPassword, // Assuming password fields are used
            accountStatus } = req.body;

    // --- Basic Validation ---
    if (!email || !fullName || !phoneNumber || !specialtyId || !password || !confirmPassword) {
      throw new Error('Vui lòng điền đầy đủ thông tin bắt buộc (Email, Tên, SĐT, Khoa, Mật khẩu).');
    }
    if (password !== confirmPassword) {
      throw new Error('Mật khẩu xác nhận không khớp.');
    }

    // --- File Upload Handling ---
    // Check using the name from the add_labtech.hbs form: 'profileImage'
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
    const hashedPassword = await userService.hashPassword(password);

    const userData = {
        email,
        password: hashedPassword,
        fullName,
        phoneNumber,
        address,
        profileImage: profileImagePath,
        gender,
        dob: dob ? new Date(dob) : null,
        roleId: 4, // Role ID for Lab Technician <--- IMPORTANT CHANGE
        accountStatus: accountStatus || 'active' // Default to active if not provided
    };
    const newUser = await userService.add(userData);

    if (!newUser || !newUser.userId) {
        throw new Error('Không thể tạo tài khoản người dùng.');
    }

    // 2. Create LabTechnician Record
    const labTechnicianData = { // <--- Changed variable name
        userId: newUser.userId,
        specialtyId: parseInt(specialtyId, 10),
        specialization: specialization || null // Technician specific field
    };
    await labTechnicianService.add(labTechnicianData); // <--- Changed service call

    // --- Success Response ---
    req.session.flashMessage = { type: 'success', message: 'Thêm kỹ thuật viên thành công!' }; // <--- Changed message
    res.redirect('/admin/manage_labtech'); // <--- Changed redirect path

  } catch (error) {
    console.error('Error adding lab technician:', error); // <--- Changed message

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
router.get('/edit/:technicianId', async function (req, res) { // <--- Changed param name
  try {
    res.locals.pageTitle = 'Edit Lab Technician'; // <--- Changed title
    const technicianId = parseInt(req.params.technicianId, 10); // <--- Changed param name

    if (isNaN(technicianId)) {
        throw new Error('Invalid Technician ID.'); // <--- Changed message
    }

    // Fetch the combined technician + user data using the technicianId
    const labTechnician = await labTechnicianService.findById(technicianId); // <--- Changed service call and var name

    if (!labTechnician) {
      req.session.flashMessage = { type: 'danger', message: 'Lab Technician not found.' }; // <--- Changed message
      return res.redirect('/admin/manage_labtech'); // <--- Changed redirect path
    }

    const userId = labTechnician.userId;
    if (!userId) {
      req.session.flashMessage = { type: 'danger', message: 'User ID not found for this technician.' }; // <--- Changed message
      return res.redirect('/admin/manage_labtech'); // <--- Changed redirect path
    }

    const specialties = await specialtyService.findAll();

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

    res.render('vwAdmin/manage_labtech/edit_labtech', { // <--- Changed view path
      specialties,
      labTechnician: { // <--- Changed variable name
          ...labTechnician,
          dob: formattedDob, // Pass formatted date
          specialty: labTechnician.specialtyId, // Ensure field matches select name if needed
          profilePictureUrl: labTechnician.profileImage || '/public/images/default-avatar.png'
      }
    });

  } catch (error) {
    console.error('Error loading edit technician form:', error); // <--- Changed message
    req.session.flashMessage = { type: 'danger', message: 'Could not load the edit form. ' + error.message };
    res.redirect('/admin/manage_labtech'); // <--- Changed redirect path
  }
});

// POST: Handle updating an existing lab technician
router.post('/update/:technicianId', async function (req, res) { // <--- Changed param name
  const technicianId = parseInt(req.params.technicianId, 10); // <--- Changed param name
  let profileImagePath = null;
  let oldImagePath = null;
  const specialties = await specialtyService.findAll(); // Fetch for error case

  if (isNaN(technicianId)) {
      req.session.flashMessage = { type: 'danger', message: 'Invalid Technician ID.' }; // <--- Changed message
      return res.redirect('/admin/manage_labtech'); // <--- Changed redirect path
  }

  const userId = parseInt(req.body.userId, 10);
  if (isNaN(userId)) {
      req.session.flashMessage = { type: 'danger', message: 'Invalid User ID in form submission.' };
      return res.redirect('/admin/manage_labtech'); // <--- Changed redirect path
  }

  try {
    // Destructure fields relevant to User and LabTechnician
    const { fullName, email, phoneNumber, address, gender, dob, specialtyId, // Using specialtyId based on form
            specialization, // Technician specific
            accountStatus } = req.body;

    // 1. Fetch current user data for old image path
    const currentUser = await userService.findById(userId);
    if (!currentUser) {
        throw new Error('Technician user account not found for update.'); // <--- Changed message
    }
    oldImagePath = currentUser.profileImage;

    // --- File Upload Handling (if new file provided - 'profileImage') ---
    if (req.files && req.files.profileImage) { // <--- Check form field name
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
        if (oldImagePath && oldImagePath !== profileImagePath) {
            try {
                 const fullOldPath = path.join(__dirname, '../../', oldImagePath);
                 await fs.unlink(fullOldPath);
                 console.log('Deleted old profile image:', oldImagePath);
             } catch (unlinkError) {
                  console.error('Error deleting old profile image:', unlinkError);
             }
         }
    } else {
        profileImagePath = oldImagePath; // Keep old path if no new file
    }

    // --- Database Operations ---
    // 2. Update User Record
    const userData = {
        // email, // Avoid updating email easily unless intended
        fullName,
        phoneNumber,
        address,
        profileImage: profileImagePath,
        gender,
        dob: dob ? new Date(dob) : null,
        accountStatus: accountStatus || 'active'
        // DO NOT update roleId or password here
    };
    await userService.update(userId, userData);

    // 3. Update LabTechnician Record
    const labTechnicianData = { // <--- Changed variable name
        specialtyId: parseInt(specialtyId, 10),
        specialization: specialization || null // Technician specific
    };

    try {
        // Use updateByUserId method from labTechnicianService
        const updated = await labTechnicianService.updateByUserId(userId, labTechnicianData); // <--- Changed service call
        if (!updated) {
            throw new Error('Failed to update technician-specific details.'); // <--- Changed message
        }
    } catch (techUpdateError) {
        console.error('Error updating technician record:', techUpdateError); // <--- Changed message
        throw new Error('Failed to update technician details: ' + techUpdateError.message); // <--- Changed message
    }

    // --- Success Response ---
    req.session.flashMessage = { type: 'success', message: 'Technician updated successfully!' }; // <--- Changed message
    res.redirect('/admin/manage_labtech'); // <--- Changed redirect path

  } catch (error) {
    console.error(`Error updating technician (technicianId: ${technicianId}, userId: ${userId}):`, error); // <--- Changed message

    // --- Error Response ---
    // Re-render edit form with submitted data and error message
     let technicianForForm = null;
     try {
         technicianForForm = await labTechnicianService.findById(technicianId); // <--- Changed service call
         if (!technicianForForm) {
             req.session.flashMessage = { type: 'danger', message: 'Technician not found after update attempt.' }; // <--- Changed message
             return res.redirect('/admin/manage_labtech'); // <--- Changed redirect path
         }
     } catch(fetchErr) {
         console.error('Error fetching technician data after update attempt:', fetchErr); // <--- Changed message
         req.session.flashMessage = { type: 'danger', message: 'Error updating technician and reloading data.' }; // <--- Changed message
         return res.redirect('/admin/manage_labtech'); // <--- Changed redirect path
     }

     let formattedDob = '';
     if (technicianForForm && technicianForForm.dob) {
         try {
             const dobDate = new Date(technicianForForm.dob);
             if (!isNaN(dobDate)) formattedDob = dobDate.toISOString().split('T')[0];
         } catch (e) { /* ignore */ }
     }

    res.locals.pageTitle = 'Edit Lab Technician'; // <--- Changed title
    res.render('vwAdmin/manage_labtech/edit_labtech', { // <--- Changed view path
      specialties,
      labTechnician: { // <--- Changed variable name
          ...technicianForForm, // Base fetched data
          ...req.body,         // Override with submitted values
          technicianId: technicianId, // Ensure ID is present
          userId: userId,        // Ensure userId is present
          dob: req.body.dob || formattedDob,
          profilePictureUrl: profileImagePath || oldImagePath || '/public/images/default-avatar.png'
      },
      error: 'Failed to update technician. ' + error.message // <--- Changed message
    });
  }
});


// DELETE: Handle lab technician deletion
router.delete('/delete/:technicianId', async function (req, res) { // <--- Changed param name
  try {
    const technicianId = parseInt(req.params.technicianId, 10); // <--- Changed param name

    if (isNaN(technicianId)) {
      return res.status(400).json({ success: false, message: 'Invalid Technician ID' }); // <--- Changed message
    }

    // Get the technician to find the associated userId
    const labTechnician = await labTechnicianService.findById(technicianId); // <--- Changed service call and var name

    if (!labTechnician) {
      return res.status(404).json({ success: false, message: 'Lab Technician not found' }); // <--- Changed message
    }

    const userId = labTechnician.userId;

    // Check if the technician has any related TestResults
    const hasTestResults = await db('TestResult') // <--- Check different dependency
      .where('technicianId', technicianId)
      .first();

    if (hasTestResults) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete technician with existing test results. Please reassign or manage results first.' // <--- Changed message
      });
    }

    // Start transaction
    const trx = await db.transaction();

    try {
      // 1. Delete related records (if any others, e.g., specific permissions - none obvious in schema)
      // No schedule or head-of-department equivalent to remove here

      // 2. Delete the LabTechnician record
      const deleted = await trx('LabTechnician') // <--- Delete from LabTechnician table
        .where('technicianId', technicianId)
        .delete();

      if (!deleted) {
        await trx.rollback();
        return res.status(500).json({ success: false, message: 'Không thể xóa kỹ thuật viên' }); // <--- Changed message
      }

      // 3. Update User account status to "inactive" and modify email
      const userUpdated = await trx('User')
        .where('userId', userId)
        .update({
          accountStatus: 'inactive',
          // Append suffix to email to allow reuse of the original email
          email: trx.raw(`CONCAT(email, '_deleted_', ?)`, [Date.now()])
        });

      if (!userUpdated) {
        await trx.rollback();
        return res.status(500).json({ success: false, message: 'Không thể cập nhật trạng thái tài khoản người dùng' });
      }

      // Commit transaction
      await trx.commit();
    } catch (error) {
      await trx.rollback();
      throw error; // Re-throw error to be caught by outer catch
    }

    // Return success response
    return res.json({
      success: true,
      message: 'Technician deleted successfully', // <--- Changed message
      technicianId: technicianId // <--- Changed id name
    });

  } catch (error) {
    console.error(`Error deleting technician:`, error); // <--- Changed message

    // Check for foreign key constraint errors specifically
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa kỹ thuật viên vì còn dữ liệu liên quan (vd: Kết quả xét nghiệm).' // <--- Changed message context
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa kỹ thuật viên. Vui lòng thử lại sau.' // <--- Changed message
    });
  }
});

// API endpoint for AJAX filtering/search (Optional - Adapt if needed)
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

    // Fetch data (Consider optimizing with direct DB query + filters)
    let labTechnicians = await labTechnicianService.findAll(); // <--- Changed service call

    // Apply filters
    let filteredLabTechnicians = labTechnicians; // <--- Changed variable name
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
            (tech.specialization && tech.specialization.toLowerCase().includes(searchTerm)) || // <--- Search specialization
            (tech.specialtyName && tech.specialtyName.toLowerCase().includes(searchTerm))
      );
    }

    const filteredTotal = filteredLabTechnicians.length;

    // Apply pagination *after* filtering
    const paginatedLabTechnicians = filteredLabTechnicians.slice(offset, offset + limit); // <--- Changed variable name

    // Add initials or other derived data
    const results = paginatedLabTechnicians.map(tech => ({
      ...tech,
      initials: tech.fullName ? tech.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??',
      profilePictureUrl: tech.profileImage || '/public/images/default-avatar.png'
    }));

    // Return JSON response
    res.json({
      labTechnicians: results, // <--- Changed key name
      totalLabTechnicians: filteredTotal, // <--- Changed key name & value
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(filteredTotal / limit),
        totalItems: filteredTotal
      }
    });
  } catch (error) {
    console.error('Error loading technicians via API:', error); // <--- Changed message
    res.status(500).json({ error: 'Failed to load technicians' }); // <--- Changed message
  }
});

export default router;