import crypto from 'crypto';
import dotenv from 'dotenv';
import querystring from 'qs';
import moment from 'moment';

dotenv.config();

const VNP_TMN_CODE = 'FPW38P4B';
const VNP_HASH_SECRET = 'NO3ME71EJH2LQPMZ0GG0777V67MZ1F0V';
const VNP_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
const VNP_VERSION = '2.1.0';
const VNP_COMMAND = 'pay';

function sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    
    for (const key of keys) {
        if (obj[key]) {
            sorted[key] = obj[key];
        }
    }
    return sorted;
}

const vnpayService = {
    createPaymentUrl: async function(appointmentId, amount, ipAddr) {
        const date = new Date();
        const createDate = moment(date).format('YYYYMMDDHHmmss');
        const orderId = moment(date).format('HHmmss');

        const currCode = 'VND';
        const locale = 'vn';

        let vnpParams = {
            vnp_Version: VNP_VERSION,
            vnp_Command: VNP_COMMAND,
            vnp_TmnCode: VNP_TMN_CODE,
            vnp_Locale: locale,
            vnp_CurrCode: currCode,
            vnp_TxnRef: `${appointmentId}-${orderId}`,
            vnp_OrderInfo: `Thanh toan cho don kham benh #${appointmentId}`,
            vnp_OrderType: 'other',
            vnp_Amount: amount * 100, // Convert to smallest currency unit
            vnp_ReturnUrl: `${process.env.APP_URL}/patient/book-appointment/vnpay-return`,
            vnp_IpAddr: ipAddr,
            vnp_CreateDate: createDate
        };

        vnpParams = sortObject(vnpParams);
        
        const signData = querystring.stringify(vnpParams, { encode: false });
        const hmac = crypto.createHmac('sha512', VNP_HASH_SECRET);
        const signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest('hex');
        
        vnpParams['vnp_SecureHash'] = signed;
        
        const paymentUrl = `${VNP_URL}?${querystring.stringify(vnpParams, { encode: false })}`;
        return paymentUrl;
    },

    verifyReturnUrl: function(vnpParams) {
        const secureHash = vnpParams['vnp_SecureHash'];
        delete vnpParams['vnp_SecureHash'];
        delete vnpParams['vnp_SecureHashType'];

        vnpParams = sortObject(vnpParams);
        
        const signData = querystring.stringify(vnpParams, { encode: false });
        const hmac = crypto.createHmac('sha512', VNP_HASH_SECRET);
        const signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest('hex');

        return secureHash === signed;
    }
};

export default vnpayService; 