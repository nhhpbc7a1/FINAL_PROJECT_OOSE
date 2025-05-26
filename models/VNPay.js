import crypto from 'crypto';
import dotenv from 'dotenv';
import qs from 'qs';
import moment from 'moment';
import config from '../config/default.json' assert { type: "json" };

dotenv.config();

class VNPay {
    constructor() {
        this.tmnCode = config.vnp_TmnCode;
        this.hashSecret = config.vnp_HashSecret;
        this.url = config.vnp_Url;
        
        console.log('VNPay initialized with:', {
            tmnCode: this.tmnCode,
            hashSecret: this.hashSecret,
            url: this.url
        });
    }

    formatAmount(amount) {
        try {
            // Remove any non-numeric characters except decimal point
            const cleanAmount = amount.toString().replace(/[^0-9.]/g, '');
            const numAmount = parseFloat(cleanAmount);
            console.log('Amount formatting:', {
                original: amount,
                cleaned: cleanAmount,
                final: numAmount.toFixed(2)
            });
            return numAmount.toFixed(2);
        } catch (error) {
            console.error('Error formatting amount:', error);
            throw error;
        }
    }

    sortObject(obj) {
        let sorted = {};
        let str = [];
        let key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                str.push(encodeURIComponent(key));
            }
        }
        str.sort();
        for (key = 0; key < str.length; key++) {
            sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
        }
        return sorted;
    }

    async createPaymentUrl(appointmentId, amount, ipAddr) {
        try {
            if (ipAddr === '::1' || ipAddr === '::ffff:127.0.0.1') {
                ipAddr = '127.0.0.1';
            }

            // Remove any non-numeric characters and leading zeros
            const cleanAmount = amount.toString().replace(/[^0-9.]/g, '');
            const numAmount = Math.round(parseFloat(cleanAmount) * 100);
            
            const date = new Date();
            const createDate = moment(date).format('YYYYMMDDHHmmss');
            const orderId = moment(date).format('DDHHmmss');

            let vnp_Params = {
                vnp_Version: '2.1.0',
                vnp_Command: 'pay',
                vnp_TmnCode: this.tmnCode,
                vnp_Locale: 'vn',
                vnp_CurrCode: 'VND',
                vnp_TxnRef: orderId,
                vnp_OrderInfo: 'Thanh toan cho don kham benh ' + appointmentId,
                vnp_OrderType: 'other',
                vnp_Amount: numAmount,
                vnp_ReturnUrl: config.vnp_ReturnUrl,
                vnp_IpAddr: ipAddr,
                vnp_CreateDate: createDate
            };

            vnp_Params = this.sortObject(vnp_Params);
            
            const signData = Object.keys(vnp_Params)
                .map(key => `${key}=${vnp_Params[key]}`)
                .join('&');
            
            const hmac = crypto.createHmac('sha512', this.hashSecret);
            const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
            
            vnp_Params = {
                ...vnp_Params,
                vnp_SecureHash: signed
            };

            const finalUrl = this.url + '?' + 
                Object.keys(vnp_Params)
                    .map(key => `${key}=${vnp_Params[key]}`)
                    .join('&');

            return finalUrl;
        } catch (error) {
            console.error('Error creating payment URL:', error);
            throw new Error('Failed to create payment URL: ' + error.message);
        }
    }

    verifyReturnUrl(vnpParams) {
        try {
            const vnp_Params = { ...vnpParams };
            const secureHash = vnp_Params['vnp_SecureHash'];
            
            delete vnp_Params['vnp_SecureHash'];
            delete vnp_Params['vnp_SecureHashType'];

            const sortedParams = this.sortObject(vnp_Params);
            const signData = Object.keys(sortedParams)
                .map(key => `${key}=${sortedParams[key]}`)
                .join('&');

            const hmac = crypto.createHmac('sha512', this.hashSecret);
            const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

            return secureHash === signed;
        } catch (error) {
            console.error('Error verifying return URL:', error);
            return false;
        }
    }

    getPaymentStatus(vnpParams) {
        if (!this.verifyReturnUrl(vnpParams)) {
            return {
                status: false,
                message: 'Invalid signature'
            };
        }

        const responseCode = vnpParams['vnp_ResponseCode'];
        return {
            status: responseCode === '00',
            message: this.getResponseMessage(responseCode),
            transactionId: vnpParams['vnp_TransactionNo'],
            amount: parseInt(vnpParams['vnp_Amount']) / 100,
            orderInfo: vnpParams['vnp_OrderInfo']
        };
    }

    getResponseMessage(responseCode) {
        const messages = {
            '00': 'Giao dịch thành công',
            '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
            '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
            '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
            '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
            '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
            '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP).',
            '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
            '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
            '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
            '75': 'Ngân hàng thanh toán đang bảo trì.',
            '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định.',
            '99': 'Các lỗi khác'
        };
        
        return messages[responseCode] || 'Lỗi không xác định';
    }
}

export default new VNPay(); 