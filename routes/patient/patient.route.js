import express from 'express';
const router = express.Router();

router.use((req, res, next) => {
    res.locals.layout = 'patient';
    next();
  });

// router.get('/', (req, res) => {
//   res.render('patient'); // sẽ render views/patient.hbs
// });

router.get('/', async function (req, res) {
    res.render('homepage');
});
router.get('/', async function (req, res) {
  res.render('login');
});

export default router;