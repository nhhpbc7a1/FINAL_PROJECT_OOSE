import express from 'express';
import moment from 'moment';
import testResultsService from '../../services/labtech/test_results.service.js';
import labtechService from '../../services/lab-technician.service.js';
import upload from '../../middlewares/upload.middleware.js';

const router = express.Router();

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
        const labTechnician = await labtechService.findByUserId(userId);
        
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
        
        // Get test results using the service
        const { testResults, pagination, total } = await testResultsService.getAll(
            filters,
            technicianId,
            page,
            limit
        );
        
        // Get test types for filter dropdown
        const testTypes = await testResultsService.getTestTypesBySpecialty(labTechnician.specialtyId);
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
        
        // Get the test result with associated details using the service
        const testResult = await testResultsService.getTestResultById(resultId);
        
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
        const labTechnician = await labtechService.findByUserId(userId);
        
        if (!labTechnician) {
            return res.redirect('/account/login');
        }
        
        // Check if lab technician has an active schedule
        const hasActiveSchedule = await testResultsService.hasActiveSchedule(labTechnician.technicianId);
        
        if (!hasActiveSchedule) {
            req.session.flashMessage = { type: 'error', message: 'You cannot edit test results when you are not on duty. Please try again during your scheduled shift.' };
            return res.redirect('/labtech/test-results');
        }
        
        // Get the test result using the service
        const testResult = await testResultsService.getTestResultById(id);
        
        if (!testResult) {
            req.session.flashMessage = { type: 'error', message: 'Test result not found' };
            return res.redirect('/labtech/test-results');
        }
        
        // Get lab rooms using the service
        const rooms = await testResultsService.getLabRooms();
        
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
 * Handle test result edit form submission
 */
router.post('/edit/:id', upload.single('resultFile'), async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get logged in lab technician
        const userId = req.session.authUser.userId;
        const labTechnician = await labtechService.findByUserId(userId);
        
        if (!labTechnician) {
            return res.redirect('/account/login');
        }
        
        // Check if lab technician has an active schedule
        const hasActiveSchedule = await testResultsService.hasActiveSchedule(labTechnician.technicianId);
        
        if (!hasActiveSchedule) {
            req.session.flashMessage = { type: 'error', message: 'You cannot update test results when you are not on duty. Please try again during your scheduled shift.' };
            return res.redirect('/labtech/test-results');
        }
        
        const {
            resultType,
            performedDate,
            resultNumeric,
            unit,
            normalRangeMin,
            normalRangeMax,
            resultText,
            interpretation,
            roomId
        } = req.body;
        
        // Prepare update data
        const updateData = {
            performedDate: performedDate ? moment(performedDate).format('YYYY-MM-DD') : null,
            interpretation,
            status: 'in_progress'
        };
        
        if (roomId) {
            updateData.roomId = roomId;
        }
        
        // Handle different result types
        if (resultType === 'numeric') {
            updateData.resultNumeric = resultNumeric;
            updateData.unit = unit;
            updateData.resultType = 'numeric';
            
            // Combine normal range
            if (normalRangeMin && normalRangeMax) {
                updateData.normalRange = `${normalRangeMin} - ${normalRangeMax}`;
            }
            
            // Determine if result is abnormal
            if (resultNumeric && updateData.normalRange) {
                updateData.isAbnormal = isAbnormal(parseFloat(resultNumeric), updateData.normalRange);
            }
        } else if (resultType === 'text') {
            updateData.resultText = resultText;
            updateData.resultType = 'text';
        }
        
        // Update the test result using the service
        await testResultsService.updateTestResult(
            id, 
            updateData, 
            req.file, // Pass the file object directly
            userId    // Pass the user ID for file upload tracking
        );
        
        req.session.flashMessage = { type: 'success', message: 'Test result updated successfully' };
        res.redirect(`/labtech/test-results/${id}`);
    } catch (error) {
        console.error('Error updating test result:', error);
        req.session.flashMessage = { type: 'error', message: 'Failed to update test result' };
        res.redirect(`/labtech/test-results/${id}`);
    }
});

// Generate and print test result
router.get('/print/:id', async (req, res) => {
    try {
        const resultId = req.params.id;
        
        // Get the printable test result using the service
        const printData = await testResultsService.generatePrintableView(resultId);
        
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