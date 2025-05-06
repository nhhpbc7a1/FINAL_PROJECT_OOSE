import express from 'express';
import expressFileUpload from 'express-fileupload'; // Thêm import express-fileupload
import numeral from 'numeral';
import { dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { engine } from 'express-handlebars';
import hbs_sections from 'express-handlebars-sections';
import moment from 'moment';
import session from 'express-session';
import { authAdmin, authDoctor, authLabtech, authPatient } from './middlewares/auth.route.js';

import { formatDate, formatDay, times, arrayFind, removeFilterUrl, eq, lte, subtract, or } from './views/helpers/hbs_helpers.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(express.urlencoded({
    extended: true,
}));


// Add JSON body parser middleware for AJAX requests
app.use(express.json());

app.engine('hbs', engine({
    extname: '.hbs',
    defaultLayout: 'labtech',
    partialsDir: __dirname + '/views/partials',
    helpers: {
        format_price(value) {
            return numeral(value).format('0,000') + ' VNĐ';
        },
        format_date(date) {
            return moment(date).format('DD/MM/YYYY');
        },
        eq(a, b) {
            return a === b;
        },
        section: function(name, options) {
            if (!this._sections) this._sections = {};
            this._sections[name] = options.fn(this);
            return null;
        },
        eq: eq,
        ne: function(v1, v2) {
            return v1 !== v2;
        },
        lt: function(v1, v2) {
            return v1 < v2;
        },
        gt: function(v1, v2) {
            return v1 > v2;
        },
        lte: lte,
        gte: function(v1, v2) {
            return v1 >= v2;
        },
        and: function() {
            return Array.prototype.slice.call(arguments, 0, -1).every(Boolean);
        },
        or: or,
        formatDate(date) {
            return moment(date).format('DD/MM/YYYY');
        },

        formatDay: formatDay,
        times: times,
        arrayFind: arrayFind,
        removeFilterUrl: removeFilterUrl,
        subtract: subtract,
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
app.use('/uploads', express.static('uploads'));

app.set('trust proxy', 1);
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: {}
}));


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