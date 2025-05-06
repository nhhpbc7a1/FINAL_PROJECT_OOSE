import db from '../../ultis/db.js';

const doctorListService = {
  /**
   * Get all doctors with optional filtering by specialty
   * @param {number|null} specialtyId - Optional specialty ID to filter by
   * @returns {Promise<Array>} Array of doctor objects
   */
  async getAllDoctors(specialtyId = null) {
    try {
      // Build base query
      const query = db('Doctor as d')
        .join('User as u', 'd.userId', '=', 'u.userId')
        .select(
          'd.doctorId as id', 
          'u.fullName as name', 
          'u.profileImage as image', 
          'u.gender', 
          'd.experience as experience_years',
          'd.bio',
          'd.specialtyId'
        )
        .orderBy('u.fullName', 'asc');
      
      // Add filter if provided
      if (specialtyId) {
        query.where('d.specialtyId', specialtyId);
      }
      
      // Add specialty name
      const doctors = await query;
      
      for (const doctor of doctors) {
        // Get specialty name
        if (doctor.specialtyId) {
          const specialty = await db('Specialty')
            .select('name')
            .where('specialtyId', doctor.specialtyId)
            .first();
            
          doctor.specialties = specialty ? specialty.name : '';
        } else {
          doctor.specialties = '';
        }
        
        // Get service count
        const serviceCount = await db('AppointmentServices as aps')
          .join('Appointment as a', 'aps.appointmentId', '=', 'a.appointmentId')
          .where('a.doctorId', doctor.id)
          .countDistinct('aps.serviceId as count')
          .first();
        
        doctor.serviceCount = serviceCount ? serviceCount.count : 0;
        
        // Get average rating and review count (if you have a Reviews table)
        // Since Reviews table isn't in the SQL schema, we're setting default values
        doctor.avgRating = '0.0';
        doctor.reviewCount = 0;
      }
      
      return doctors;
    } catch (error) {
      console.error('Error fetching doctors:', error);
      throw error;
    }
  },
  
  /**
   * Get doctor count by specialty
   * @returns {Promise<Array>} Array of specialty objects with doctor counts
   */
  async getDoctorCountBySpecialty() {
    try {
      const counts = await db('Specialty as s')
        .leftJoin('Doctor as d', 's.specialtyId', '=', 'd.specialtyId')
        .select('s.specialtyId as id', 's.name')
        .count('d.doctorId as doctor_count')
        .groupBy('s.specialtyId', 's.name')
        .orderBy('s.name');
      
      return counts;
    } catch (error) {
      console.error('Error fetching doctor counts by specialty:', error);
      throw error;
    }
  }
};

export default doctorListService; 