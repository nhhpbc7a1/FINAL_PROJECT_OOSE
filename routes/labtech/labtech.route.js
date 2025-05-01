import express from 'express';
const router = express.Router();

router.use((req, res, next) => {
    res.locals.layout = 'labtech';
    next();
  });

router.get('/',async function (req, res){
    res.redirect('/labtech/dashboard');
});

export default router;