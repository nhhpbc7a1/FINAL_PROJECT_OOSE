import express from 'express';
const router = express.Router();

router.use((req, res, next) => {
    res.locals.layout = 'admin';
    next();
  });

router.get('/',async function (req, res){
    res.redirect('/admin/dashboard');
});

export default router;