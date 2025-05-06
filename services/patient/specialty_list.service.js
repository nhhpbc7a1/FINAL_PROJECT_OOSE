import db from '../../ultis/db.js';

const specialtyListService = {
  /**
   * Get all specialties with additional information
   * @returns {Promise<Array>} Array of specialty objects
   */
  async getAllSpecialties() {
    try {
      // Get all specialties with doctor count
      const specialties = await db('Specialty as s')
        .leftJoin('Doctor as d', 's.specialtyId', '=', 'd.specialtyId')
        .select(
          's.specialtyId as id', 
          's.name', 
          's.description', 
          's.icon'
        )
        .count('d.doctorId as doctor_count')
        .groupBy('s.specialtyId', 's.name', 's.description', 's.icon')
        .orderBy('s.name', 'asc');
      
      // For each specialty, get the associated services count
      for (const specialty of specialties) {
        const serviceCount = await db('Service')
          .where('specialtyId', specialty.id)
          .where('status', 'active')
          .count('* as count')
          .first();
        
        specialty.serviceCount = serviceCount ? serviceCount.count : 0;
      }
      
      return specialties;
    } catch (error) {
      console.error('Error fetching specialties:', error);
      throw error;
    }
  },
  
  /**
   * Get popular specialties (with the most doctors)
   * @param {number} limit - Maximum number of specialties to return
   * @returns {Promise<Array>} Array of popular specialty objects
   */
  async getPopularSpecialties(limit = 5) {
    try {
      const specialties = await db('Specialty as s')
        .leftJoin('Doctor as d', 's.specialtyId', '=', 'd.specialtyId')
        .select(
          's.specialtyId as id', 
          's.name', 
          's.description', 
          's.icon'
        )
        .count('d.doctorId as doctor_count')
        .groupBy('s.specialtyId', 's.name', 's.description', 's.icon')
        .orderBy('doctor_count', 'desc')
        .limit(limit);
      
      return specialties;
    } catch (error) {
      console.error('Error fetching popular specialties:', error);
      throw error;
    }
  }
};

export default specialtyListService; 