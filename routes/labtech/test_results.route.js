import express from 'express';
import moment from 'moment';
import TestResult from '../../models/TestResult.js';
import LabTechnician from '../../models/LabTechnician.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '../../public/uploads/test_results/');

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

// Set layout for all labtech routes
router.use((req, res, next) => {
    res.locals.layout = 'labtech';
    res.locals.activeRoute = 'test-results';
    
    // Handle flash messages
    if (req.session.flashMessage) {
        res.locals.flashMessage = req.session.flashMessage;
        delete req.session.flashMessage; // Clear after displaying
    }
    
    next();
});

// List test results with pagination and filtering
router.get('/', async (req, res) => {
    try {
        // Get logged in lab technician ID
        const userId = req.session.authUser.userId;
        const labTechnician = await LabTechnician.findByUserId(userId);
        
        if (!labTechnician) {
            return res.redirect('/account/login');
        }
        
        const technicianId = labTechnician.technicianId;
        
        // Parse filters from query parameters
        const filters = {
            search: req.query.search || '',
            testType: req.query.testType || '',
            resultType: req.query.resultType || '',
            dateFrom: req.query.dateFrom || '',
            dateTo: req.query.dateTo || ''
        };
        
        // Setup pagination
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        
        // Get test results using the model
        const { testResults, pagination, total } = await TestResult.getAll(
            filters,
            technicianId,
            page,
            limit
        );
        
        // Get test types for filter dropdown
        const testTypes = await TestResult.getTestTypesBySpecialty(labTechnician.specialtyId);
        res.render('vwLabtech/test_results', {
            testResults,
            filters,
            pagination,
            testTypes,
            total,
            helpers: {
                formatDate: function(date) {
                    return moment(date).format('DD/MM/YYYY');
                },
                eq: function(a, b) {
                    return a == b;
                }
            }
        });
    } catch (error) {
        console.error('Error loading test results:', error);
        res.status(500).render('error', { 
            layout: 'labtech',
            message: 'Failed to load test results' 
        });
    }
});

// View test result details
router.get('/:id', async (req, res) => {
    try {
        const resultId = req.params.id;
        
        // Get the test result with associated details using the model
        const testResult = await TestResult.findById(resultId);
        
        if (!testResult) {
            return res.status(404).render('error', {
                layout: 'labtech',
                message: 'Test result not found'
            });
        }
        
        res.render('vwLabtech/test_result_detail', {
            testResult,
            helpers: {
                formatDate: function(date) {
                    return moment(date).format('DD/MM/YYYY');
                },
                formatDateTime: function(date) {
                    return moment(date).format('DD/MM/YYYY HH:mm');
                }
            }
        });
    } catch (error) {
        console.error('Error loading test result details:', error);
        res.status(500).render('error', { 
            layout: 'labtech',
            message: 'Failed to load test result details' 
        });
    }
});

// Helper function to determine if a result is abnormal based on the numeric value and normal range
function isAbnormal(resultNumeric, normalRange) {
    if (!resultNumeric || !normalRange) return false;
    
    const [min, max] = normalRange.split('-').map(val => parseFloat(val.trim()));
    return resultNumeric < min || resultNumeric > max;
}

/**
 * GET /labtech/test-results/edit/:id
 * Load edit form for a test result
 */
router.get('/edit/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get logged in lab technician
        const userId = req.session.authUser.userId;
        const labTechnician = await LabTechnician.findByUserId(userId);
        
        if (!labTechnician) {
            return res.redirect('/account/login');
        }
        
        // Get the test result using the model
        const testResult = await TestResult.findById(id);
        
        if (!testResult) {
            req.session.flashMessage = { type: 'error', message: 'Test result not found' };
            return res.redirect('/labtech/test-results');
        }
        
        // Get lab rooms using the model
        const rooms = await TestResult.getLabRooms();
        
        // Format the date for the input field
        testResult.performedDate = moment(testResult.performedDate).format('YYYY-MM-DD');
        
        // Parse normal range if exists
        if (testResult.normalRange) {
            testResult.normalRangeMin = testResult.normalRange.split('-')[0].trim();
            testResult.normalRangeMax = testResult.normalRange.split('-')[1].trim();
        }

        console.log(testResult);
        
        res.render('vwLabtech/test_result_edit', {
            title: 'Edit Test Result',
            testResult,
            rooms,
            helpers: {
                splitRange: function(range, index) {
                    if (!range) return '';
                    const parts = range.split('-');
                    return parts[index] ? parts[index].trim() : '';
                },
                getFileIcon: function(fileType) {
                    const iconMap = {
                        'pdf': 'fas fa-file-pdf',
                        'doc': 'fas fa-file-word',
                        'docx': 'fas fa-file-word',
                        'jpg': 'fas fa-file-image',
                        'jpeg': 'fas fa-file-image',
                        'png': 'fas fa-file-image'
                    };
                    return iconMap[fileType] || 'fas fa-file';
                }
            }
        });
    } catch (error) {
        console.error('Error loading test result edit form:', error);
        req.session.flashMessage = { type: 'error', message: 'Failed to load the test result edit form' };
        res.redirect('/labtech/test-results');
    }
});

/**
 * POST /labtech/test-results/edit/:id
 * Handle form submission for updating a test result
 */
router.post('/edit/:id', async (req, res) => {
    try {
        console.log("Form data received:", req.body);
        
        const resultId = req.params.id;
        
        // Get logged in lab technician
        const userId = req.session.authUser.userId;
        const labTechnician = await LabTechnician.findByUserId(userId);
        
        if (!labTechnician) {
            return res.redirect('/account/login');
        }
        
        // Get the test result
        const testResult = await TestResult.findById(resultId);
        
        if (!testResult) {
            req.session.flashMessage = { type: 'error', message: 'Test result not found' };
            return res.redirect('/labtech/test-results');
        }
        
        // Parse form data
        const { 
            resultText, 
            resultNumeric, 
            normalRangeMin, 
            normalRangeMax, 
            unit, 
            interpretation, 
            roomId, 
            resultType 
        } = req.body;
        
        // Validate required data based on result type
        if (resultType === 'numeric' && (!resultNumeric || !normalRangeMin || !normalRangeMax || !unit)) {
            req.session.flashMessage = { type: 'error', message: 'For numeric results, please provide the value, normal range, and unit.' };
            return res.redirect(`/labtech/test-results/edit/${resultId}`);
        }
        
        if (resultType === 'text' && !resultText) {
            req.session.flashMessage = { type: 'error', message: 'Please provide the result text.' };
            return res.redirect(`/labtech/test-results/edit/${resultId}`);
        }
        
        // Handle file upload
        let fileData = null;
        
        if (req.files && req.files.resultFile) {
            const file = req.files.resultFile;
            
            // Validate file type
            const fileExtension = path.extname(file.name).toLowerCase();
            const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
            
            if (!allowedExtensions.includes(fileExtension)) {
                req.session.flashMessage = { type: 'error', message: 'Invalid file type. Only PDF, images, and documents are allowed.' };
                return res.redirect(`/labtech/test-results/edit/${resultId}`);
            }
            
            // Generate unique filename
            const timestamp = Date.now();
            const filename = `result_${resultId}_${timestamp}${fileExtension}`;
            const uploadPath = path.join(UPLOAD_DIR, filename);
            
            try {
                await file.mv(uploadPath);
                
                fileData = {
                    fileName: file.name,
                    filePath: `/public/uploads/test_results/${filename}`,
                    fileType: file.mimetype, // This is the MIME type (e.g., 'application/pdf')
                    fileSize: file.size,
                    uploadDate: new Date(),
                    description: `Test result file for test #${resultId}`,
                    uploadedByUserId: userId
                };
            } catch (uploadError) {
                console.error('Error uploading file:', uploadError);
                req.session.flashMessage = { type: 'error', message: 'Failed to upload file. Please try again.' };
                return res.redirect(`/labtech/test-results/edit/${resultId}`);
            }
        }
        
        // Prepare normalized data
        let normalRange = null;
        if (normalRangeMin && normalRangeMax) {
            normalRange = `${normalRangeMin}-${normalRangeMax}`;
        }
        
        // Update test result
        testResult.resultText = resultText;
        testResult.resultNumeric = resultNumeric ? parseFloat(resultNumeric) : null;
        testResult.normalRange = normalRange;
        testResult.unit = unit;
        testResult.interpretation = interpretation;
        testResult.roomId = roomId ? parseInt(roomId) : null;
        testResult.technicianId = labTechnician.technicianId;
        testResult.resultType = resultType;
        testResult.status = 'completed';
        testResult.performedDate = new Date();
        
        // Use the new saveWithFile method if we have a file, otherwise use regular save
        if (fileData) {
            await testResult.saveWithFile(fileData);
        } else {
            await testResult.save();
        }
        
        req.session.flashMessage = { type: 'success', message: 'Test result updated successfully!' };
        res.redirect('/labtech/test-results');
        
    } catch (error) {
        console.error('Error updating test result:', error);
        req.session.flashMessage = { type: 'error', message: 'Failed to update test result: ' + error.message };
        res.redirect('/labtech/test-results');
    }
});

// Generate and print test result
router.get('/print/:id', async (req, res) => {
    try {
        const resultId = req.params.id;
        
        // Get the printable test result using the model
        const printData = await TestResult.generatePrintableView(resultId);
        
        if (!printData || !printData.result) {
            req.session.flashMessage = { type: 'error', message: 'Test result not found' };
            return res.redirect('/labtech/test-results');
        }
        
        res.render('vwLabtech/test_result_print', {
            layout: 'print',
            ...printData,
            helpers: {
                formatDate: function(date) {
                    return moment(date).format('DD/MM/YYYY');
                },
                formatDateTime: function(date) {
                    return moment(date).format('DD/MM/YYYY HH:mm');
                }
            }
        });
    } catch (error) {
        console.error('Error generating printable test result:', error);
        req.session.flashMessage = { type: 'error', message: 'Failed to generate printable test result' };
        res.redirect('/labtech/test-results');
    }
});

export default router; 