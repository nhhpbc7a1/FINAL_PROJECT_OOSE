import db from '../../ultis/db.js';
import emailService from '../email.service.js';
import { 
    generateVerificationCode, 
    parseDateString
} from '../../ultis/helpers.js';

const bookAppointmentService = {
    // Hàm tính thời gian dự kiến khám
    async calculateEstimatedTime(doctorId, appointmentDate, queueNumber, trx) {
        try {
            // Lấy thông tin ca trực của bác sĩ vào ngày đã chọn
            const doctorSchedule = await trx('Schedule')
                .select('startTime')
                .where({
                    doctorId: doctorId,
                    workDate: appointmentDate,
                    status: 'available'
                })
                .orderBy('startTime', 'asc')
                .first();

            if (!doctorSchedule) {
                console.log('Không tìm thấy lịch trực của bác sĩ vào ngày đã chọn');
                return null;
            }

            // Tính toán thời gian dự kiến: startTime + (queueNumber - 1) * 20 phút
            const startTime = new Date(`${appointmentDate}T${doctorSchedule.startTime}`);
            const estimatedMinutes = (queueNumber - 1) * 20; // Mỗi bệnh nhân mất 20 phút
            
            startTime.setMinutes(startTime.getMinutes() + estimatedMinutes);
            
            // Format thời gian để lưu vào database
            const hours = startTime.getHours().toString().padStart(2, '0');
            const minutes = startTime.getMinutes().toString().padStart(2, '0');
            const seconds = startTime.getSeconds().toString().padStart(2, '0');
            
            return `${hours}:${minutes}:${seconds}`;
        } catch (error) {
            console.error('Lỗi khi tính thời gian dự kiến khám:', error);
            return null;
        }
    },

    // Hàm kiểm tra và phân công bác sĩ dựa trên chuyên khoa và ngày khám
    async assignDoctorAndRoom(specialtyId, appointmentDate, trx) {
        try {
            // Lấy danh sách bác sĩ được phân công cho chuyên khoa này vào ngày đã chọn
            const assignedDoctors = await trx('Schedule')
                .select(
                    'Schedule.*', 
                    'Doctor.doctorId',
                    'Doctor.specialtyId',
                    'Room.roomId',
                    'Room.roomNumber'
                )
                .join('Doctor', 'Schedule.doctorId', 'Doctor.doctorId')
                .join('Room', 'Schedule.roomId', 'Room.roomId')
                .where({
                    'Doctor.specialtyId': specialtyId,
                    'Schedule.workDate': parseDateString(appointmentDate),
                    'Schedule.status': 'available'
                });

            if (!assignedDoctors || assignedDoctors.length === 0) {
                console.log('Không tìm thấy bác sĩ được phân công cho chuyên khoa này vào ngày đã chọn');
                return null;
            }

            // Đếm số lượng cuộc hẹn hiện tại của mỗi bác sĩ trong ngày được chọn
            const doctorAppointmentCounts = await Promise.all(
                assignedDoctors.map(async (doctor) => {
                    const appointmentCount = await trx('Appointment')
                        .count('appointmentId as count')
                        .where({
                            'doctorId': doctor.doctorId,
                            'appointmentDate': parseDateString(appointmentDate)
                        })
                        .first();
                    
                    return {
                        ...doctor,
                        appointmentCount: appointmentCount ? parseInt(appointmentCount.count) : 0
                    };
                })
            );

            // Sắp xếp bác sĩ theo số lượng cuộc hẹn tăng dần để chọn bác sĩ có ít lịch nhất
            doctorAppointmentCounts.sort((a, b) => a.appointmentCount - b.appointmentCount);
            
            // Chọn bác sĩ có ít cuộc hẹn nhất
            const selectedDoctor = doctorAppointmentCounts[0];
            
            if (!selectedDoctor) {
                console.log('Không thể chọn được bác sĩ phù hợp');
                return null;
            }

            // Lấy số hàng đợi tiếp theo cho chuyên khoa này trong ngày
            const highestQueue = await trx('Appointment')
                .max('queueNumber as maxQueue')
                .where({
                    'specialtyId': specialtyId,
                    'appointmentDate': parseDateString(appointmentDate)
                })
                .first();
            
            const nextQueueNumber = highestQueue && highestQueue.maxQueue ? parseInt(highestQueue.maxQueue) + 1 : 1;
            
            // Tính thời gian dự kiến khám
            const estimatedTime = await this.calculateEstimatedTime(
                selectedDoctor.doctorId,
                parseDateString(appointmentDate),
                nextQueueNumber,
                trx
            );

            return {
                doctorId: selectedDoctor.doctorId,
                roomId: selectedDoctor.roomId,
                roomNumber: selectedDoctor.roomNumber, // Lưu lại để hiển thị
                queueNumber: nextQueueNumber,
                appointmentDate: parseDateString(appointmentDate),
                estimatedTime: estimatedTime
            };
        } catch (error) {
            console.error('Lỗi khi phân công bác sĩ và phòng khám:', error);
            return null;
        }
    },

    async createAppointment(appointmentData) {
        try {
            // Start a transaction
            const trx = await db.transaction();

            try {
                // Check if user already exists with the given email
                let userId;
                const existingUser = await trx('User')
                    .where('email', appointmentData.email)
                    .first();
                
                if (existingUser) {
                    userId = existingUser.userId;
                    
                    // Update user information if needed
                    await trx('User')
                        .where('userId', userId)
                        .update({
                            fullName: appointmentData.fullName || existingUser.fullName,
                            phoneNumber: appointmentData.phoneNumber || existingUser.phoneNumber,
                            address: appointmentData.address || existingUser.address,
                        });
                } else {
                    // Create new user record
                    [userId] = await trx('User').insert({
                        fullName: appointmentData.fullName,
                        email: appointmentData.email,
                        phoneNumber: appointmentData.phoneNumber,
                        address: appointmentData.address,
                        roleId: 3,
                    });
                }

                // Check if patient exists for this user
                let patientId = appointmentData.patientId;
                if (!patientId) {
                    const existingPatient = await trx('Patient')
                        .where('userId', userId)
                        .first();
                    
                    if (existingPatient) {
                        patientId = existingPatient.patientId;
                        
                        // Update patient information if needed
                        await trx('Patient')
                            .where('patientId', patientId)
                            .update({
                                dob: parseDateString(appointmentData.birthday) || existingPatient.dob,
                                gender: appointmentData.gender || existingPatient.gender,
                            });
                    } else {
                        // Create new patient record
                        const [newPatient] = await trx('Patient').insert({
                            userId: userId,
                            dob: parseDateString(appointmentData.birthday),
                            gender: appointmentData.gender,
                        });
                        patientId = newPatient;
                    }
                }

                // Format appointment date if needed
                const formattedAppointmentDate = parseDateString(appointmentData.appointmentDate);

                // Phân công bác sĩ, phòng và số hàng đợi
                let doctorId = appointmentData.doctorId;
                let roomId = null;
                let queueNumber = null;
                let estimatedTime = null;

                // Nếu không chỉ định bác sĩ cụ thể, hệ thống sẽ tự động phân công
                if (!doctorId) {
                    const assignment = await this.assignDoctorAndRoom(
                        appointmentData.specialtyId, 
                        appointmentData.appointmentDate,
                        trx
                    );

                    if (assignment) {
                        doctorId = assignment.doctorId;
                        roomId = assignment.roomId;
                        queueNumber = assignment.queueNumber;
                        estimatedTime = assignment.estimatedTime;
                    }
                } else {
                    // Nếu đã chỉ định bác sĩ, lấy phòng của bác sĩ đó
                    const doctorRoom = await trx('Schedule')
                        .select('Schedule.roomId')
                        .where({
                            'Schedule.doctorId': doctorId,
                            'Schedule.workDate': formattedAppointmentDate
                        })
                        .first();

                    // Lấy số hàng đợi tiếp theo cho chuyên khoa này trong ngày
                    const highestQueue = await trx('Appointment')
                        .max('queueNumber as maxQueue')
                        .where({
                            'specialtyId': appointmentData.specialtyId,
                            'appointmentDate': formattedAppointmentDate
                        })
                        .first();

                    roomId = doctorRoom ? doctorRoom.roomId : null;
                    queueNumber = highestQueue && highestQueue.maxQueue ? parseInt(highestQueue.maxQueue) + 1 : 1;
                    
                    // Tính thời gian dự kiến khám cho trường hợp chọn bác sĩ cụ thể
                    estimatedTime = await this.calculateEstimatedTime(
                        doctorId,
                        formattedAppointmentDate,
                        queueNumber,
                        trx
                    );
                }

                // Create appointment
                const [appointmentId] = await trx('Appointment').insert({
                    patientId: patientId,
                    specialtyId: appointmentData.specialtyId,
                    appointmentDate: formattedAppointmentDate,
                    appointmentTime: formattedAppointmentDate, // Using same date for time as per schema requirement
                    reason: appointmentData.symptom,
                    doctorId: doctorId,
                    status: 'pending',
                    emailVerified: false,
                    roomId: roomId,
                    queueNumber: queueNumber,
                    estimatedTime: estimatedTime
                });

                // If there are services, add them
                if (appointmentData.services && appointmentData.services.length > 0) {
                    const servicePromises = appointmentData.services.map(async serviceId => {
                        // Get service details
                        const service = await trx('Service')
                            .where('serviceId', serviceId)
                            .first();
                            
                        if (service) {
                            return {
                                appointmentId,
                                serviceId: service.serviceId,
                                price: service.price
                            };
                        }
                        return null;
                    });
                    
                    const appointmentServices = (await Promise.all(servicePromises)).filter(s => s !== null);
                    
                    if (appointmentServices.length > 0) {
                        await trx('AppointmentServices').insert(appointmentServices);
                    }
                }

                // Generate and save email verification code
                const verificationCode = generateVerificationCode();
                await trx('EmailVerification').insert({
                    email: appointmentData.email,
                    verificationCode: verificationCode,
                    appointmentId: appointmentId,
                    expiresAt: new Date(Date.now() + 30 * 60000) // 30 minutes expiration
                });

                // Send verification email
                await emailService.sendVerificationEmail(appointmentData.email, verificationCode);

                // Commit transaction
                await trx.commit();

                return {
                    success: true,
                    appointmentId,
                    email: appointmentData.email
                };
            } catch (error) {
                await trx.rollback();
                console.error('Transaction error:', error);
                return {
                    success: false,
                    message: 'Failed to create appointment: ' + error.message
                };
            }
        } catch (error) {
            console.error('Error creating appointment:', error);
            return {
                success: false,
                message: 'Failed to create appointment: Database error'
            };
        }
    },

    async verifyEmail(email, code) {
        try {
            // Check verification code
            const verification = await db('EmailVerification')
                .where({
                    email: email,
                    verificationCode: code
                })
                .where('expiresAt', '>', new Date())
                .first();

            if (!verification) {
                return {
                    success: false,
                    message: 'Invalid or expired verification code'
                };
            }
            
            if (!verification.appointmentId) {
                return {
                    success: false,
                    message: 'No appointment associated with this verification code'
                };
            }

            // Get the appointment details
            const appointment = await db('Appointment')
                .where('appointmentId', verification.appointmentId)
                .first();
                
            if (!appointment) {
                return {
                    success: false,
                    message: 'Appointment not found'
                };
            }

            // Update verification status
            await db.transaction(async trx => {
                await trx('EmailVerification')
                    .where('email', email)
                    .where('verificationCode', code)
                    .update({ verified: true });

                await trx('Appointment')
                    .where('appointmentId', verification.appointmentId)
                    .update({ 
                        emailVerified: true,
                        status: 'waiting_payment'
                    });
            });

            return {
                success: true,
                appointmentId: verification.appointmentId,
                message: 'Email verified successfully'
            };
        } catch (error) {
            console.error('Error verifying email:', error);
            return {
                success: false,
                message: 'Failed to verify email: ' + error.message
            };
        }
    },

    async processPayment(appointmentId, paymentData) {
        try {
            const trx = await db.transaction();

            try {
                // Create payment record
                const [paymentId] = await trx('Payment').insert({
                    appointmentId: appointmentId,
                    amount: paymentData.amount,
                    method: paymentData.method,
                    status: 'completed',
                    transactionId: paymentData.transactionId
                });

                // Lấy thông tin cuộc hẹn hiện tại
                const appointment = await trx('Appointment')
                    .where('appointmentId', appointmentId)
                    .first();

                // Nếu chưa có phòng hoặc số hàng đợi, phân công lại
                let roomId = appointment.roomId;
                let queueNumber = appointment.queueNumber;
                let estimatedTime = appointment.estimatedTime;

                if (!roomId || !queueNumber || !estimatedTime) {
                    // Lấy thông tin bác sĩ và phòng nếu đã có bác sĩ được phân công
                    if (appointment.doctorId) {
                        const doctorRoom = await trx('Schedule')
                            .select('Schedule.roomId')
                            .where({
                                'Schedule.doctorId': appointment.doctorId,
                                'Schedule.workDate': appointment.appointmentDate
                            })
                            .first();

                        roomId = doctorRoom ? doctorRoom.roomId : null;
                    }

                    // Lấy số hàng đợi mới nếu chưa có
                    if (!queueNumber) {
                        const highestQueue = await trx('Appointment')
                            .max('queueNumber as maxQueue')
                            .where({
                                'specialtyId': appointment.specialtyId,
                                'appointmentDate': appointment.appointmentDate
                            })
                            .first();

                        queueNumber = highestQueue && highestQueue.maxQueue ? parseInt(highestQueue.maxQueue) + 1 : 1;
                    }
                    
                    // Tính lại thời gian dự kiến khám nếu chưa có
                    if (!estimatedTime && appointment.doctorId) {
                        estimatedTime = await this.calculateEstimatedTime(
                            appointment.doctorId,
                            appointment.appointmentDate,
                            queueNumber,
                            trx
                        );
                    }
                }

                // Update appointment status
                await trx('Appointment')
                    .where('appointmentId', appointmentId)
                    .update({
                        status: 'confirmed',
                        paymentStatus: 'completed',
                        roomId: roomId,
                        queueNumber: queueNumber,
                        estimatedTime: estimatedTime
                    });

                await trx.commit();

                return {
                    success: true,
                    paymentId,
                    roomId,
                    queueNumber
                };
            } catch (error) {
                await trx.rollback();
                console.error('Transaction error:', error);
                return {
                    success: false,
                    message: 'Failed to process payment: ' + error.message
                };
            }
        } catch (error) {
            console.error('Error processing payment:', error);
            return {
                success: false,
                message: 'Failed to process payment: Database error'
            };
        }
    },

    async getAppointmentDetails(appointmentId) {
        try {
            // Try to get from the database
            try {
                const appointment = await db('Appointment')
                    .select(
                        'Appointment.*',
                        'Patient.dob as birthday',
                        'Patient.gender',
                        'User.fullName',
                        'User.email',
                        'User.phoneNumber',
                        'User.address',
                        'Specialty.name as specialtyName',
                        'Doctor.doctorId',
                        'DoctorUser.fullName as doctorName',
                        'Room.roomNumber'
                    )
                    .leftJoin('Patient', 'Appointment.patientId', 'Patient.patientId')
                    .leftJoin('User', 'Patient.userId', 'User.userId')
                    .leftJoin('Specialty', 'Appointment.specialtyId', 'Specialty.specialtyId')
                    .leftJoin('Doctor', 'Appointment.doctorId', 'Doctor.doctorId')
                    .leftJoin('User as DoctorUser', 'Doctor.userId', 'DoctorUser.userId')
                    .leftJoin('Room', 'Appointment.roomId', 'Room.roomId')
                    .where('Appointment.appointmentId', appointmentId)
                    .first();

                if (!appointment) {
                    throw new Error('Appointment not found');
                }

                // Đảm bảo birthday là chuỗi DD/MM/YYYY nếu có
                if (appointment.birthday) {
                    if (appointment.birthday instanceof Date) {
                        const day = appointment.birthday.getDate().toString().padStart(2, '0');
                        const month = (appointment.birthday.getMonth() + 1).toString().padStart(2, '0');
                        const year = appointment.birthday.getFullYear();
                        appointment.birthday = `${day}/${month}/${year}`;
                    } else if (typeof appointment.birthday === 'string' && appointment.birthday.includes('-')) {
                        // Nếu là chuỗi định dạng YYYY-MM-DD, đổi sang DD/MM/YYYY
                        const parts = appointment.birthday.split('-');
                        if (parts.length === 3) {
                            appointment.birthday = `${parts[2].substring(0,2)}/${parts[1]}/${parts[0]}`;
                        }
                    }
                }
                
                // Đảm bảo appointmentDate là chuỗi DD/MM/YYYY nếu có
                if (appointment.appointmentDate) {
                    if (appointment.appointmentDate instanceof Date) {
                        const day = appointment.appointmentDate.getDate().toString().padStart(2, '0');
                        const month = (appointment.appointmentDate.getMonth() + 1).toString().padStart(2, '0');
                        const year = appointment.appointmentDate.getFullYear();
                        appointment.appointmentDate = `${day}/${month}/${year}`;
                    } else if (typeof appointment.appointmentDate === 'string' && appointment.appointmentDate.includes('-')) {
                        // Nếu là chuỗi định dạng YYYY-MM-DD, đổi sang DD/MM/YYYY
                        const parts = appointment.appointmentDate.split('-');
                        if (parts.length === 3) {
                            appointment.appointmentDate = `${parts[2].substring(0,2)}/${parts[1]}/${parts[0]}`;
                        }
                    }
                }

                // Đảm bảo có roomNumber để hiển thị
                if (!appointment.roomNumber && appointment.roomId) {
                    appointment.roomNumber = `Room ${appointment.roomId}`;
                }

                // Get appointment services
                const services = await db('AppointmentServices')
                    .select('Service.*', 'AppointmentServices.price as bookedPrice')
                    .join('Service', 'AppointmentServices.serviceId', 'Service.serviceId')
                    .where('AppointmentServices.appointmentId', appointmentId);

                // Calculate services price
                const servicesPrice = services.reduce((sum, service) => sum + service.bookedPrice, 0);

                // Calculate total amount
                const totalAmount = servicesPrice;

                return {
                    ...appointment,
                    services,
                    servicesPrice,
                    totalAmount
                };
            } catch (error) {
                console.error('Database error:', error);
                
                // If database error or no data found, return mock data for demo
                return this.getMockAppointmentDetails(appointmentId);
            }
        } catch (error) {
            console.error('Error getting appointment details:', error);
            return this.getMockAppointmentDetails(appointmentId);
        }
    },

    // Mock data generator for demo purposes
    getMockAppointmentDetails(appointmentId) {
        const specialties = ['Cardiology', 'Neurology', 'Pediatrics', 'Dermatology', 'Oncology'];
        const doctorNames = ['John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis', 'Robert Wilson'];
        
        const specialtyName = specialties[Math.floor(Math.random() * specialties.length)];
        const doctorName = doctorNames[Math.floor(Math.random() * doctorNames.length)];
        
        // Mô phỏng roomId với số từ 1-10
        const roomId = Math.floor(1 + Math.random() * 10);
        
        // Số hàng đợi nên bắt đầu từ 1 và có giá trị hợp lý
        const queueNumber = Math.floor(1 + Math.random() * 20); // Giả lập số từ 1-20
        
        // Tạo thời gian dự kiến ngẫu nhiên
        const hours = Math.floor(8 + Math.random() * 8).toString().padStart(2, '0'); // 8h-16h
        const minutes = Math.floor(Math.random() * 60).toString().padStart(2, '0');
        const estimatedTime = `${hours}:${minutes}:00`;
        
        // Mock services
        const mockServices = [
            { serviceId: 1, name: 'Blood Test', price: 50000 },
            { serviceId: 2, name: 'X-ray', price: 120000 },
            { serviceId: 3, name: 'ECG', price: 100000 }
        ];
        
        // Randomly select 0-2 services
        const serviceCount = Math.floor(Math.random() * 3);
        const services = mockServices.slice(0, serviceCount);
        
        // Calculate services price
        const servicesPrice = services.reduce((sum, service) => sum + service.price, 0);
        
        // Calculate total amount
        const totalAmount = servicesPrice;
        
        return {
            appointmentId: appointmentId,
            fullName: 'Patient Demo',
            email: 'patient@example.com',
            phoneNumber: '0123456789',
            address: '123 Sample Street, District 1, HCMC',
            birthday: '01/01/1990',
            gender: 'male',
            specialtyName: specialtyName,
            doctorName: doctorName,
            appointmentDate: '20/05/2024',
            reason: 'General checkup',
            status: 'confirmed',
            roomId: roomId,
            roomNumber: `Room ${roomId}`, // Thêm roomNumber để hiển thị
            queueNumber: queueNumber,
            estimatedTime: estimatedTime,
            services: services,
            servicesPrice: servicesPrice,
            totalAmount: totalAmount
        };
    }
};

export default bookAppointmentService; 