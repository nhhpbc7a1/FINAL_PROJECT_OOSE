// Generate a random 6-digit verification code
export function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Format currency to VND
export function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// Format currency without currency symbol
export function formatNumberWithCommas(amount) {
    return new Intl.NumberFormat('vi-VN').format(amount);
}

// Format date to display format
export function formatDate(date) {
    return new Date(date).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// Format time to display format
export function formatTime(time) {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Validate email format
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate phone number format (Vietnam)
export function isValidPhoneNumber(phone) {
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    return phoneRegex.test(phone);
}

// Calculate age from date of birth
export function calculateAge(dob) {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

// Generate a random appointment reference number
export function generateAppointmentReference() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `APT${timestamp}${random}`;
}

// Calculate total amount for appointment
export function calculateTotalAmount(services = []) {
    return services.reduce((sum, service) => sum + (service.price || 0), 0);
}

// Parse date string in DD/MM/YYYY format to ISO format
export function parseDateString(dateString) {
    if (!dateString) return null;
    
    // Handle DD/MM/YYYY format
    const parts = dateString.split('/');
    if (parts.length === 3) {
        const day = parts[0];
        const month = parts[1];
        const year = parts[2];
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return dateString;
}

// Generate a random room number
export function generateRoomNumber() {
    const buildings = ['A', 'B', 'C'];
    const floors = ['1', '2', '3', '4', '5'];
    const rooms = ['01', '02', '03', '04', '05'];
    
    const building = buildings[Math.floor(Math.random() * buildings.length)];
    const floor = floors[Math.floor(Math.random() * floors.length)];
    const room = rooms[Math.floor(Math.random() * rooms.length)];
    
    return `${building}${floor}-${room}`;
}

// Generate a random queue number
export function generateQueueNumber() {
    return Math.floor(1 + Math.random() * 100);
} 