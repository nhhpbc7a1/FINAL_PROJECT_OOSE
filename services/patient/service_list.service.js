import db from '../../ultis/db.js';

const serviceListService = {
  /**
   * Get all services with optional filtering by specialty or type
   * @param {number|null} specialtyId - Optional specialty ID to filter by
   * @param {string|null} type - Optional service type to filter by (service, test, procedure)
   * @returns {Promise<Array>} Array of service objects
   */
  async getAllServices(specialtyId = null, type = null) {
    try {
      // Start building the query
      const query = db('Service as s')
        .leftJoin('Specialty as sp', 's.specialtyId', '=', 'sp.specialtyId')
        .select(
          's.serviceId as id', 
          's.name', 
          's.description', 
          's.price', 
          's.image', 
          's.type',
          'sp.name as specialtyName'
        )
        .where('s.status', 'active')
        .orderBy('s.name', 'asc');
      
      // Add filters if provided
      if (specialtyId) {
        query.where('s.specialtyId', specialtyId);
      }
      
      if (type) {
        query.where('s.type', type);
      }
      
      // Execute the query
      const services = await query;
      
      // Format prices
      services.forEach(service => {
        service.formattedPrice = new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND'
        }).format(service.price);
      });
      
      return services;
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  },
  
  /**
   * Get service types for filtering
   * @returns {Promise<Array>} Array of service type objects
   */
  async getServiceTypes() {
    try {
      const types = await db('Service')
        .distinct('type')
        .orderBy('type');
      
      return types.map(t => t.type);
    } catch (error) {
      console.error('Error fetching service types:', error);
      throw error;
    }
  },
  
  /**
   * Get services by specialty ID
   * @param {number} specialtyId - Specialty ID to filter by
   * @returns {Promise<Array>} Array of service objects
   */
  async getServicesBySpecialty(specialtyId) {
    try {
      const services = await db('Service')
        .where('specialtyId', specialtyId)
        .where('status', 'active')
        .orderBy('name');
      
      // Format prices
      services.forEach(service => {
        service.formattedPrice = new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND'
        }).format(service.price);
      });
      
      return services;
    } catch (error) {
      console.error(`Error fetching services for specialty ${specialtyId}:`, error);
      throw error;
    }
  }
};

export default serviceListService;