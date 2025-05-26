/**
 * Abstract base class for booking process using Template Method Pattern
 */
export default class BookingProcess {
    constructor(req, res) {
        this.req = req;
        this.res = res;
        if (this.constructor === BookingProcess) {
            throw new Error("Abstract class cannot be instantiated");
        }
    }

    /**
     * Template method that defines the booking process algorithm
     */
    async execute() {
        try {
            // 1. Validate request
            await this.validateRequest();

            // 2. Process data
            const data = await this.processData();

            // 3. Save to database
            await this.saveToDatabase(data);

            // 4. Handle next step
            await this.handleNextStep(data);

        } catch (error) {
            await this.handleError(error);
        }
    }

    /**
     * Abstract method to validate request
     * @throws {Error} When not implemented
     */
    async validateRequest() {
        throw new Error("validateRequest() must be implemented");
    }

    /**
     * Abstract method to process data
     * @throws {Error} When not implemented
     */
    async processData() {
        throw new Error("processData() must be implemented");
    }

    /**
     * Abstract method to save data to database
     * @param {Object} data - Data to save
     * @throws {Error} When not implemented
     */
    async saveToDatabase(data) {
        throw new Error("saveToDatabase() must be implemented");
    }

    /**
     * Abstract method to handle next step
     * @param {Object} data - Data for next step
     * @throws {Error} When not implemented
     */
    async handleNextStep(data) {
        throw new Error("handleNextStep() must be implemented");
    }

    /**
     * Default error handler that can be overridden
     * @param {Error} error - Error to handle
     */
    async handleError(error) {
        console.error('Error in booking process:', error);
        if (this.res.headersSent) return;
        
        this.res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
} 