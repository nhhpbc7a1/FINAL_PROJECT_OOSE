import express from 'express';
import numeral from 'numeral';
import { dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { engine } from 'express-handlebars';
import hbs_sections from 'express-handlebars-sections';
import moment from 'moment';
import session from 'express-session';
import fileUpload from 'express-fileupload';
import { authAdmin, authDoctor, authLabtech, authPatient } from './middlewares/auth.route.js';
const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(express.urlencoded({
    extended: true,
}));

// Add JSON body parser middleware for AJAX requests
app.use(express.json());

// File upload middleware
app.use(fileUpload({
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    useTempFiles: true,
    tempFileDir: '/tmp/',
    createParentPath: true, // Tự động tạo thư mục cha nếu không tồn tại
    debug: false // Enable debugging để xem logs
}));

app.engine('hbs', engine({
    extname: '.hbs',
    defaultLayout: 'patient',
    partialsDir: __dirname + '/views/partials',
    helpers: {
        format_price(value) {
            return numeral(value).format('0,000') + ' VNĐ';
        },
        section: function(name, options) {
            if (!this._sections) this._sections = {};
            this._sections[name] = options.fn(this);
            return null;
        },
        eq: function(v1, v2) {
            return v1 === v2;
        },
        ne: function(v1, v2) {
            return v1 !== v2;
        },
        lt: function(v1, v2) {
            return v1 < v2;
        },
        gt: function(v1, v2) {
            return v1 > v2;
        },
        lte: function(v1, v2) {
            return v1 <= v2;
        },
        gte: function(v1, v2) {
            return v1 >= v2;
        },
        and: function() {
            return Array.prototype.slice.call(arguments, 0, -1).every(Boolean);
        },
        or: function() {
            return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
        },
        formatDate: function(date, format) {
            if (!date) return '';

            // Kiểm tra xem date có phải là đối tượng Date hay không
            try {
                return moment(date).format(format || 'DD/MM/YYYY');
            } catch (error) {
                console.error('Error formatting date:', error);
                return 'Invalid date';
            }
        },
        formatDateTime: function(date, format) {
            if (!date) return '';

            try {
                return moment(date).format(format || 'DD/MM/YYYY HH:mm');
            } catch (error) {
                console.error('Error formatting datetime:', error);
                return 'Invalid date';
            }
        },
        formatTime: function(time, format) {
            if (!time) return '';

            try {
                // Kiểm tra xem time có phải là chuỗi hh:mm:ss không
                if (typeof time === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(time)) {
                    // Thêm ngày hiện tại để tạo thành datetime đầy đủ
                    const today = moment().format('YYYY-MM-DD');
                    return moment(`${today} ${time}`).format(format || 'HH:mm');
                }
                
                return moment(time).format(format || 'HH:mm');
            } catch (error) {
                console.error('Error formatting time:', error);
                return 'Invalid time';
            }
        },
        formatCurrency: function(value) {
            if (value === undefined || value === null) return '0 VNĐ';
            return numeral(value).format('0,0') + ' VNĐ';
        },
        startsWith: function(str, prefix) {
            if (!str || !prefix) return false;
            return String(str).startsWith(prefix);
        },
        ifCond: function(v1, v2, options) {
            if (v1 === v2) {
                return options.fn(this);
            }
            return options.inverse(this);
        },
        substring: function(str, start, end) {
            if (!str) return '';
            if (end) {
                return String(str).substring(start, end);
            } else {
                return String(str).substring(start);
            }
        },
        toLowerCase: function(str) {
            return str ? str.toLowerCase() : '';
        },
        toUpperCase: function(str) {
            return str ? str.toUpperCase() : '';
        },
        add: function(a, b) {
            return a + b;
        },
        subtract: function(a, b) {
            return a - b;
        },
        multiply: function(a, b) {
            return a * b;
        },
        divide: function(a, b) {
            return a / b;
        },
        min: function(a, b) {
            return Math.min(a, b);
        },
        max: function(a, b) {
            return Math.max(a, b);
        },
        round: function(value) {
            return Math.round(value);
        },
        range: function(start, end) {
            let result = [];
            for (let i = start; i < end; i++) {
                result.push(i);
            }
            return result;
        },
        json: function(obj) {
            return JSON.stringify(obj);
        },
        truncate: function (str, len) {
            // Kiểm tra xem str có phải là string và có tồn tại không
            if (str && typeof str === 'string' && str.length > len) {
                // Cắt chuỗi và thêm dấu "..."
                return str.substring(0, len) + '...';
            }
            // Trả về chuỗi gốc nếu không cần cắt hoặc không hợp lệ
            return typeof str === 'string' ? str : ''; // Trả về rỗng nếu không phải string
        },
        limitTo: function(arr, limit) {
            // Check if arr is an array and has length
            if (Array.isArray(arr) && arr.length > 0) {
                return arr.slice(0, limit);
            }
            return arr || [];
        },
        moment: function(date, format) {
            // Helper to use moment.js operations in templates
            if (!date) return moment();
            if (!format) return moment(date);
            return moment(date, format);
        },
        now: function() {
            return new Date();
        }
    },
}));

app.set('view engine', 'hbs');
app.set('views', './views');

app.use('/public', express.static('public'));

app.set('trust proxy', 1) // trust first proxy
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: {}
}))

app.use(async function (req, res, next) {
    if (!req.session.auth) {
        req.session.auth = false;
    }
    else {
        console.log(req.session.auth);
        console.log(req.session.authUser);
    }
    res.locals.auth = req.session.auth;
    res.locals.authUser = req.session.authUser;
    next();
});


app.get('/', (_req, res) => {
    res.redirect('/patient');
});


import accountRouter from './routes/account.route.js';
app.use('/account', accountRouter);

import patientRouter from './routes/patient/patient.route.js';
app.use('/patient', patientRouter);

import doctorRouter from './routes/doctor/doctor.route.js'
// app.use('/doctor', authDoctor, doctorRouter);
app.use('/doctor', doctorRouter);

import labtechRouter from './routes/labtech/labtech.route.js'
// app.use('/labtech', authLabtech, labtechRouter);
app.use('/labtech', labtechRouter);

import adminRouter from './routes/admin/admin.route.js'
// app.use('/admin', authAdmin, adminRouter);
app.use('/admin', adminRouter);


app.listen(3000, function () {
    console.log('Server is running at http://localhost:3000');
});