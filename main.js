import express from 'express';
import numeral from 'numeral';
import { dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { engine } from 'express-handlebars';
import hbs_sections from 'express-handlebars-sections';
import moment from 'moment';
import session from 'express-session';
import { authAdmin, authDoctor, authLabtech, authPatient } from './middlewares/auth.route.js';
const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(express.urlencoded({
    extended: true,
}));

app.engine('hbs', engine({
    extname: '.hbs',
    defaultLayout: 'patient',
    partialsDir: __dirname + '/views/partials',
    helpers: {
        format_price(value) {
            return numeral(value).format('0,000') + ' VNĐ';
        },
    },
}));

app.set('view engine', 'hbs');
app.set('views', './views');

app.use('/public', express.static('public'));
app.use('/uploads', express.static('uploads'));

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


app.get('/', async function (req, res) {
    res.redirect('/patient');
});



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


// 6LcynaMqAAAAAAPYVUVSXJSUNkNj7ggkTVWJIxlj
// 6LcynaMqAAAAALy_DhSeh1s1dVepKLOSD-QGr1Fc