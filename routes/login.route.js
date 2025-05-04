import express from 'express';

const router = express.Router();

router.use((req, res, next) => {
    res.locals.layout = 'patient';
    next();
  });

router.get('/', async function (req, res) {
    res.render('login');
});

export default router;

