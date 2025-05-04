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
<<<<<<< HEAD
import { errorHandler, apiErrorHandler } from './middlewares/error-handler.js';
=======
import labtechRouter from './routes/labtech/labtech.route.js';
import patientRouter from './routes/patient/patient.route.js';
import doctorRouter from './routes/doctor/doctor.route.js';
import adminRouter from './routes/admin/admin.route.js';
>>>>>>> a6d37a8ff93b87dba1d33beecf883f87a93cf1d9
const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(express.urlencoded({
    extended: true,
}));

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
    defaultLayout: 'labtech',
    partialsDir: __dirname + '/views/partials',
    helpers: {
        format_price(value) {
            return numeral(value).format('0,000') + ' VNĐ';
        },
   
        format_date(date) {
            return moment(date).format('DD/MM/YYYY');
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
            return moment(date).format(format || 'DD/MM/YYYY');
        },
        formatDateTime: function(date, format) {
            if (!date) return '';
            return moment(date).format(format || 'DD/MM/YYYY HH:mm');
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
        range: function(start, end) {
            let result = [];
            for (let i = start; i < end; i++) {
                result.push(i);
            }
            return result;
        },
        json: function(obj) {
            return JSON.stringify(obj);

        }
    },
}));

app.set('view engine', 'hbs');
app.set('views', './views');

app.use('/public', express.static('public'));

app.set('trust proxy', 1);
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: {}
<<<<<<< HEAD
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

    // Truyền thông báo flash đến view
    if (req.session.flashMessage) {
        res.locals.flashMessage = req.session.flashMessage;
        delete req.session.flashMessage;
    }

    next();
});

=======
}));
>>>>>>> a6d37a8ff93b87dba1d33beecf883f87a93cf1d9

app.get('/', async function (req, res) {
    res.redirect('/labtech');
});

app.get('/labtech', async function (req, res) {
    res.render('vwLabtech/pending_test', {
        title: 'Pending Test List',
        activeRoute: 'pending'
    });
});

app.use('/patient', patientRouter);
app.use('/doctor', doctorRouter);
app.use('/labtech', labtechRouter);
app.use('/admin', adminRouter);

<<<<<<< HEAD
// Thêm middleware xử lý lỗi - phải đặt sau tất cả các routes
app.use(errorHandler);
// Middleware xử lý lỗi cho API
app.use('/api', apiErrorHandler);

=======
>>>>>>> a6d37a8ff93b87dba1d33beecf883f87a93cf1d9
app.listen(3000, function () {
    console.log('Server is running at http://localhost:3000');

});
