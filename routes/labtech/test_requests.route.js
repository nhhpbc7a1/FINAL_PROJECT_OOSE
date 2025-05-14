import express from 'express';
import moment from 'moment';
import testRequestsService from '../../services/labtech/test_requests.service.js';
import labtechService from '../../services/lab-technician.service.js';

const router = express.Router();

// Set layout for all labtech routes
router.use((req, res, next) => {
    res.locals.layout = 'labtech';
    res.locals.activeRoute = 'test-requests';
    next();
});

// List test requests with pagination and filtering
router.get('/', async (req, res) => {
    try {
        // Get logged in lab technician ID and specialty
        const userId = req.session.authUser.userId;
        const labTechnician = await labtechService.findByUserId(userId);
        
        if (!labTechnician) {
            return res.redirect('/account/login');
        }
        
        // Parse filters from query parameters
        const filters = {
            search: req.query.search || '',
            testType: req.query.testType || '',
            status: req.query.status || '',
            dateFrom: req.query.dateFrom || '',
            dateTo: req.query.dateTo || ''
        };
        
        // Setup pagination
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        
        // Get test requests from service
        const { testRequests, pagination, total } = await testRequestsService.getAll(
            filters,
            labTechnician.technicianId,
            labTechnician.specialtyId,
            page,
            limit
        );
        
        // Get test types for filter dropdown
        const testTypes = await testRequestsService.getTestTypesBySpecialty(labTechnician.specialtyId);

        console.log('testRequests:', testRequests);
        
        res.render('vwLabtech/test_requests', {
            testRequests,
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
        console.error('Error loading test requests:', error);
        res.status(500).render('error', { 
            layout: 'labtech',
            message: 'Failed to load test requests' 
        });
    }
});

// View a single test request
router.get('/:id', async (req, res) => {
    try {
        const requestId = req.params.id;
        
        // Get detailed information about the test request from service
        const testRequest = await testRequestsService.getById(requestId);
        
        if (!testRequest) {
            return res.status(404).render('error', {
                layout: 'labtech',
                message: 'Test request not found'
            });
        }
        
        // Check if there's already a test result for this request
        const testResult = await testRequestsService.getTestResult(requestId);
        
        // Format the request date for display
        const formattedRequest = {
            ...testRequest,
            formattedDate: moment(testRequest.requestDate).format('DD/MM/YYYY'),
            formattedAppointmentDate: moment(testRequest.appointmentDate).format('DD/MM/YYYY HH:mm'),
            formattedPatientDob: testRequest.patientDob ? moment(testRequest.patientDob).format('DD/MM/YYYY') : 'N/A'
        };
        
        res.render('vwLabtech/test_request_detail', {
            testRequest: formattedRequest,
            testResult,
            helpers: {
                formatDate: function(date) {
                    return moment(date).format('DD/MM/YYYY');
                }
            }
        });
    } catch (error) {
        console.error(`Error fetching test request with ID ${req.params.id}:`, error);
        res.status(500).render('error', { 
            layout: 'labtech',
            message: 'Failed to load test request details' 
        });
    }
});

// Start processing a test
router.get('/start/:id', async (req, res) => {
    try {
        const requestId = req.params.id;
        
        // Get logged in lab technician ID
        const userId = req.session.authUser.userId;
        const labTechnician = await labtechService.findByUserId(userId);
        
        if (!labTechnician) {
            return res.redirect('/account/login');
        }
        
        // Start processing using service
        await testRequestsService.startProcessing(
            requestId,
            labTechnician.technicianId
        );
        
        // Redirect to the result entry form
        res.redirect(`/labtech/test-results/edit/${requestId}`);
    } catch (error) {
        console.error(`Error starting test for request ID ${req.params.id}:`, error);
        res.status(500).render('error', { 
            layout: 'labtech',
            message: 'Failed to start test processing' 
        });
    }
});


export default router; 