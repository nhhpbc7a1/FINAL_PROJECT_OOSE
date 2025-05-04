import express from 'express';
const router = express.Router();

router.use((req, res, next) => {
    res.locals.layout = 'doctor';
    next();
  });

router.get('/',async function (req, res){
    res.redirect('/doctor/dashboard');

});
router.get('/dashboard', async function (req, res) {
  res.render('vwDoctor/dashboard');  
});

export default router;