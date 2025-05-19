import express from 'express';
import Doctor from '../../models/Doctor.js';
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
    res.locals.currentRoute = 'doctors'; // Default route for doctor management
    next();
});

// GET: Display list of doctors
router.get('/', async function (req, res) {
  try {
    // Check for flash messages
    const flashMessage = req.session.flashMessage;
    if (flashMessage) {
      res.locals.flashMessage = flashMessage;
      delete req.session.flashMessage;
    }

    let doctors = await Doctor.findAll(); // Use Doctor model
    const specialties = await Specialty.findAll();

    doctors = doctors.map(doctor => ({
      ...doctor,
      initials: doctor.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      // Ensure profilePictureUrl is correctly mapped if needed
      profilePictureUrl: doctor.profileImage || '/public/images/default-avatar.png' // Example default
    }));

    res.render('vwAdmin/manage_doctor/doctor_list', {
      doctors,
      specialties,
      totalDoctors: doctors.length
    });
  } catch (error) {
    console.error('Error loading doctors:', error);
    res.render('vwAdmin/manage_doctor/doctor_list', { error: 'Failed to load doctors' });
  }
});

// GET: Display form to add a new doctor
router.get('/add', async function (req, res) {
  try {
    res.locals.pageTitle = 'Add New Doctor';
    const specialties = await Specialty.findAll();
    
    // Kiểm tra xem có dữ liệu form đã lưu từ lần submit trước không
    let formData = {};
    if (req.session.formData) {
      formData = req.session.formData;
      // Xóa dữ liệu form sau khi đã sử dụng
      delete req.session.formData;
    }
    
    // Kiểm tra xem có thông báo lỗi không
    let error = null;
    if (req.session.flashMessage && req.session.flashMessage.type === 'danger') {
      error = req.session.flashMessage.message;
      delete req.session.flashMessage;
    }

    res.render('vwAdmin/manage_doctor/add_doctor', {
      specialties,
      doctor: formData, // Sử dụng dữ liệu form đã lưu hoặc object rỗng
      error
    });
  } catch (error) {
    console.error('Error loading add doctor form:', error);
    // Add flash message for error redirection
    req.session.flashMessage = { type: 'danger', message: 'Không thể tải form thêm bác sĩ.' };
    res.redirect('/admin/manage_doctor');
  }
});

// POST: Handle adding a new doctor
router.post('/add', async function (req, res, next) {
  let profileImagePath = null; // Define outside try block
  
  // Lưu URL để quay lại form nếu có lỗi
  req.session.returnTo = '/admin/manage_doctor/add';

  try {
    const { fullName, email, phoneNumber, address, gender, dob, specialty,
            experience, education, certifications, licenseNumber, bio, accountStatus } = req.body;

    // --- Kiểm tra dữ liệu đầu vào ---
    if (!email || !fullName || !phoneNumber || !specialty || !licenseNumber) {
      throw new Error('Vui lòng điền đầy đủ thông tin bắt buộc.');
    }

    // --- File Upload Handling ---
    if (req.files && req.files.profilePhoto) {
      const profilePhoto = req.files.profilePhoto;
      
      // Kiểm tra loại file
      const fileExtension = path.extname(profilePhoto.name).toLowerCase();
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
      
      if (!allowedExtensions.includes(fileExtension)) {
        throw new Error('Chỉ chấp nhận file hình ảnh có định dạng JPG, JPEG, PNG hoặc GIF.');
      }
      
      // Kiểm tra kích thước file (giới hạn 5MB)
      if (profilePhoto.size > 5 * 1024 * 1024) {
        throw new Error('Kích thước file không được vượt quá 5MB.');
      }
      
      const timestamp = Date.now();
      const safeEmailPrefix = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_'); // Sanitize email for filename
      const filename = `${safeEmailPrefix}_${timestamp}${fileExtension}`;
      const uploadPath = path.join(UPLOAD_DIR, filename);

      await profilePhoto.mv(uploadPath);
      profileImagePath = `/public/uploads/profile_images/${filename}`; // Relative path for web access
    }

    // --- Database Operations ---
    // 1. Create User
    // Generate a default password (you might want to implement a more secure way to handle this)
    const defaultPassword = 'password123'; // In a real app, consider generating a random password
    const hashedPassword = await User.hashPassword(defaultPassword);

    const userData = {
        email,
        password: hashedPassword, // Store hashed password
        fullName,
        phoneNumber,
        address,
        profileImage: profileImagePath,
        gender,
        dob: dob ? new Date(dob) : null, // Store as Date object
        roleId: 2, // Role ID for doctor
        accountStatus: accountStatus || 'active'
    };
    
    const newUser = new User(userData);
    await newUser.save();

    if (!newUser || !newUser.userId) {
        throw new Error('Không thể tạo tài khoản người dùng.');
    }

    // 2. Create Doctor Record
    const doctorData = {
        userId: newUser.userId,
        specialtyId: parseInt(specialty, 10), // Ensure specialty is integer
        licenseNumber,
        experience: parseInt(experience, 10) || 0, // Ensure experience is integer, default to 0
        education,
        certifications,
        bio
    };
    
    // Create a new Doctor instance and save it
    const doctor = new Doctor(doctorData);
    await doctor.save();

    // --- Success Response ---
    req.session.flashMessage = { type: 'success', message: 'Thêm bác sĩ thành công!' };
    res.redirect('/admin/manage_doctor');

  } catch (error) {
    console.error('Error adding doctor:', error);

    // Optional: Clean up uploaded file if DB insert fails
    if (profileImagePath) {
      try {
        const fullPath = path.join(__dirname, '../../', profileImagePath); // Adjust path for deletion
        await fs.unlink(fullPath);
        console.log('Cleaned up uploaded file after error:', profileImagePath);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }

    // Lưu dữ liệu form để điền lại
    req.session.formData = req.body;
    
    // Chuyển lỗi cho middleware xử lý
    return next(error);
  }
});

// GET: Display form to edit an existing doctor
router.get('/edit/:doctorId', async function (req, res) {
  try {
    res.locals.pageTitle = 'Edit Doctor';
    const doctorId = parseInt(req.params.doctorId, 10);

    if (isNaN(doctorId)) {
        throw new Error('Invalid Doctor ID.');
    }

    // Fetch the doctor by ID using the Doctor model
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      req.session.flashMessage = { type: 'danger', message: 'Doctor not found.' };
      return res.redirect('/admin/manage_doctor');
    }

    // Get the userId from the doctor record for later use
    const userId = doctor.userId;

    if (!userId) {
      req.session.flashMessage = { type: 'danger', message: 'User ID not found for this doctor.' };
      return res.redirect('/admin/manage_doctor');
    }

    const specialties = await Specialty.findAll();

    // Format date for input type="date" (YYYY-MM-DD)
    let formattedDob = '';
    console.log("Original dob from database:", doctor.dob);

    // Try to format the date from dob field
    if (doctor.dob) {
        try {
            // MySQL DATE fields can sometimes be returned as strings in various formats
            // or as Date objects depending on the database driver
            let dobDate;

            if (doctor.dob instanceof Date) {
                // If it's already a Date object
                dobDate = doctor.dob;
            } else if (typeof doctor.dob === 'string') {
                // If it's a string, try to parse it
                // Handle MySQL date format (YYYY-MM-DD)
                if (/^\d{4}-\d{2}-\d{2}$/.test(doctor.dob)) {
                    // MySQL date format (YYYY-MM-DD)
                    dobDate = new Date(doctor.dob + 'T00:00:00');
                } else {
                    // Try standard parsing
                    dobDate = new Date(doctor.dob);
                }
            }

            console.log("Parsed date object:", dobDate);

            if (!isNaN(dobDate)) {
                // Format as YYYY-MM-DD for HTML date input
                const year = dobDate.getFullYear();
                // Month is 0-indexed in JS Date, so add 1 and pad with leading zero if needed
                const month = String(dobDate.getMonth() + 1).padStart(2, '0');
                // Pad day with leading zero if needed
                const day = String(dobDate.getDate()).padStart(2, '0');

                formattedDob = `${year}-${month}-${day}`;
                console.log("Formatted dob for form:", formattedDob);
            } else {
                console.log("Invalid date - could not parse:", doctor.dob);
            }
        } catch (dateError) {
            console.error('Error formatting date of birth:', dateError);
        }
    } else {
        console.log("No dob value found in doctor object");
    }

    // Make sure specialty is correctly passed for the select dropdown
    res.render('vwAdmin/manage_doctor/edit_doctor', {
      specialties,
      doctor: {
          ...doctor,
          dob: formattedDob,
          dateOfBirth: doctor.dob, // Keep the original date for debugging
          specialty: doctor.specialtyId, // Ensure specialty is correctly mapped
          profilePictureUrl: doctor.profileImage || '/public/images/default-avatar.png'
      }
    });

    // Debug log to check what's being passed to the template
    console.log("Profile image path:", doctor.profileImage);

  } catch (error) {
    console.error('Error loading edit doctor form:', error);
    req.session.flashMessage = { type: 'danger', message: 'Could not load the edit form. ' + error.message };
    res.redirect('/admin/manage_doctor');
  }
});

// POST: Handle updating an existing doctor
router.post('/update/:doctorId', async function (req, res) {
  const doctorId = parseInt(req.params.doctorId, 10);
  let profileImagePath = null; // To store new image path if uploaded
  let oldImagePath = null; // To store old image path for potential deletion
  const specialties = await Specialty.findAll(); // Fetch upfront for error case

  if (isNaN(doctorId)) {
      req.session.flashMessage = { type: 'danger', message: 'Invalid Doctor ID.' };
      return res.redirect('/admin/manage_doctor');
  }

  // Get the userId from the form submission
  const userId = parseInt(req.body.userId, 10);

  if (isNaN(userId)) {
      req.session.flashMessage = { type: 'danger', message: 'Invalid User ID in form submission.' };
      return res.redirect('/admin/manage_doctor');
  }

  try {
    const { fullName, phoneNumber, address, gender, dob, specialty,
            experience, education, certifications, licenseNumber, bio, accountStatus } = req.body;

    // 1. Fetch current user data to get existing image path
    const currentUser = await User.findById(userId);
    if (!currentUser) {
        throw new Error('Doctor user account not found for update.');
    }
    oldImagePath = currentUser.profileImage; // Store the old path

    // --- File Upload Handling (if new file provided) ---
    if (req.files && req.files.profilePhoto) {
        const profilePhoto = req.files.profilePhoto;
        const timestamp = Date.now();
        const safeEmailPrefix = currentUser.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_');
        const fileExtension = path.extname(profilePhoto.name);
        const filename = `${safeEmailPrefix}_${timestamp}${fileExtension}`;
        const uploadPath = path.join(UPLOAD_DIR, filename);

        await profilePhoto.mv(uploadPath);
        profileImagePath = `/public/uploads/profile_images/${filename}`; // New path

        // Delete old image *after* successfully uploading new one (optional)
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
              const fullOldPath = path.join(__dirname, '../../', oldImagePath); // Adjust base path
              await fs.access(fullOldPath); // Check if file exists before attempting to delete
              await fs.unlink(fullOldPath);
              console.log('Deleted old profile image:', oldImagePath);
            } catch (unlinkError) {
              // Log error but don't stop the update process if deletion fails
              console.error('Error deleting old profile image:', unlinkError);
            }
          } else {
            console.log('Skipping deletion of default or reused profile image:', oldImagePath);
          }
        }
    } else {
        // No new file uploaded, keep the old path
        profileImagePath = oldImagePath;
    }

    // --- Database Operations ---
    // 2. Update User Record
    currentUser.fullName = fullName;
    currentUser.phoneNumber = phoneNumber;
    currentUser.address = address;
    currentUser.profileImage = profileImagePath;
    currentUser.gender = gender;
    currentUser.dob = dob ? new Date(dob) : null;
    currentUser.accountStatus = accountStatus || 'active';
    await currentUser.save();

    // 3. Get existing doctor and update it
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
        throw new Error('Doctor record not found.');
    }
    
    // Update doctor properties
    doctor.specialtyId = parseInt(specialty, 10);
    doctor.licenseNumber = licenseNumber;
    doctor.experience = parseInt(experience, 10);
    doctor.education = education;
    doctor.certifications = certifications;
    doctor.bio = bio;
    
    // Save the updated doctor
    await doctor.save();

    // --- Success Response ---
    req.session.flashMessage = { type: 'success', message: 'Doctor updated successfully!' };
    res.redirect('/admin/manage_doctor');

  } catch (error) {
    console.error(`Error updating doctor (doctorId: ${doctorId}, userId: ${userId}):`, error);

    // --- Error Response ---
    // If update fails, DO NOT delete the old image even if a new one was uploaded momentarily
    // Re-render the edit form with the data the user tried to submit

    // We need to reconstruct the doctor object similar to the GET route for rendering
    // Fetch fresh data in case some partial update occurred or for consistency
     let doctorForForm = null;
     try {
         // Get the doctor data directly using doctorId
         doctorForForm = await Doctor.findById(doctorId);

         if (!doctorForForm) {
             // If not found, handle the error
             req.session.flashMessage = { type: 'danger', message: 'Doctor not found with this ID.' };
             return res.redirect('/admin/manage_doctor');
         }
     } catch(fetchErr) {
         // Handle case where fetching data even fails after an update attempt
         console.error('Error fetching doctor data after update attempt:', fetchErr);
         req.session.flashMessage = { type: 'danger', message: 'Error updating doctor and reloading data.' };
         return res.redirect('/admin/manage_doctor');
     }

     // Format DOB again for the form
     let formattedDob = '';
     if (doctorForForm && doctorForForm.dob) {
         try {
             const dobDate = new Date(doctorForForm.dob);
             if (!isNaN(dobDate)) formattedDob = dobDate.toISOString().split('T')[0];
         } catch (e) { /* ignore formatting error here */ }
     }

    res.locals.pageTitle = 'Edit Doctor'; // Set title again
    res.render('vwAdmin/manage_doctor/edit_doctor', {
      specialties,
      // Merge original doctor data (like ID, potentially unchanged email)
      // with the data submitted (req.body) to show what the user entered
      doctor: {
          ...doctorForForm, // Base with fetched data (includes ID, image)
          ...req.body,      // Override with submitted values
          doctorId: doctorId, // Ensure doctorId is present
          userId: userId,     // Ensure userId is present
          dob: req.body.dob || formattedDob, // Prioritize submitted dob format if valid
          profilePictureUrl: profileImagePath || oldImagePath || '/public/images/default-avatar.png' // Reflect potential new/old image
      },
      error: 'Failed to update doctor. ' + error.message
    });
  }
});


// DELETE: Handle doctor deletion
router.delete('/delete/:doctorId', async function (req, res) {
  try {
    const doctorId = parseInt(req.params.doctorId, 10);

    if (isNaN(doctorId)) {
      return res.status(400).json({ success: false, message: 'Invalid Doctor ID' });
    }

    // First, get the doctor to find the associated userId
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    
    const userId = doctor.userId;

    // Check if the doctor has any appointments or dependencies
    const hasDependencies = await doctor.checkDependencies();
    if (hasDependencies) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete doctor with existing appointments. Please reassign or cancel appointments first.'
      });
    }

    // Update specialty if doctor is head doctor
    const specialties = await Specialty.findAll();
    for (const specialty of specialties) {
      if (specialty.headDoctorId === doctorId) {
        specialty.headDoctorId = null;
        await specialty.save();
      }
    }

    // Delete schedules for this doctor
    await doctor.deleteSchedules();

    // Delete the doctor record
    await doctor.delete();

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
      message: 'Doctor deleted successfully',
      doctorId: doctorId
    });

  } catch (error) {
    console.error(`Error deleting doctor:`, error);

    // Kiểm tra lỗi khóa ngoại
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa bác sĩ vì còn dữ liệu liên quan. Vui lòng kiểm tra lịch hẹn hoặc các dữ liệu khác.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa bác sĩ. Vui lòng thử lại sau.'
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

    // Get all doctors using the Doctor model
    let doctors = await Doctor.findAll();

    // Apply filters if provided
    let filteredDoctors = doctors; // Start with all doctors
    if (specialty) {
      filteredDoctors = filteredDoctors.filter(doctor => doctor.specialtyId == specialty);
    }

    if (status) {
      // Ensure comparison is robust (e.g., handle case)
      filteredDoctors = filteredDoctors.filter(doctor => doctor.accountStatus && doctor.accountStatus.toLowerCase() === status.toLowerCase());
    }

    if (search) {
        const searchTerm = search.toLowerCase();
        filteredDoctors = filteredDoctors.filter(doctor =>
            (doctor.fullName && doctor.fullName.toLowerCase().includes(searchTerm)) ||
            (doctor.email && doctor.email.toLowerCase().includes(searchTerm)) ||
            (doctor.licenseNumber && doctor.licenseNumber.toLowerCase().includes(searchTerm)) ||
            (doctor.specialtyName && doctor.specialtyName.toLowerCase().includes(searchTerm)) // Assuming specialtyName is available
      );
    }

    const filteredTotal = filteredDoctors.length;

    // Apply pagination *after* filtering
    const paginatedDoctors = filteredDoctors.slice(offset, offset + limit);

    // Add initials or other derived data
    const results = paginatedDoctors.map(doctor => ({
      ...doctor,
      initials: doctor.fullName ? doctor.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??',
      profilePictureUrl: doctor.profileImage || '/public/images/default-avatar.png' // Consistent image URL
    }));

    // Return JSON response
    res.json({
      doctors: results,
      totalDoctors: filteredTotal, // Total *after* filtering
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(filteredTotal / limit),
        totalItems: filteredTotal
      }
    });
  } catch (error) {
    console.error('Error loading doctors via API:', error);
    res.status(500).json({ error: 'Failed to load doctors' });
  }
});

export default router;
