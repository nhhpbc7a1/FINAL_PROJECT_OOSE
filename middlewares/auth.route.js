export default function (req, res, next) {
    next();
    if (req.session.auth === false) {
      req.session.retUrl = req.originalUrl;  // Save the requested URL for later use.
      return res.redirect('/account/login');
    }
    next();      
}

export  function authAdmin(req, res, next) {
    next();   
    if (req.session.auth === false) {
        req.session.retUrl = req.originalUrl;  // Save the requested URL for later use.
        return res.redirect('/account/login');
    }

    if (req.session.authUser.role_id != 1) {
        // nên redirect 1 trang thông báo lỗi k đủ quyền
        return res.redirect('/');
    }
    next();
}
export  function authPatient(req, res, next) {
    next();   
    if (req.session.auth === false) {
        req.session.retUrl = req.originalUrl;  // Save the requested URL for later use.
        return res.redirect('/account/login');
    }

    if (req.session.authUser.role_id != 2) {
        // nên redirect 1 trang thông báo lỗi k đủ quyền
        return res.redirect('/');
    }
    next();
}
export  function authDoctor(req, res, next) {
    next();   
    if (req.session.auth === false) {
        req.session.retUrl = req.originalUrl;  // Save the requested URL for later use.
        return res.redirect('/account/login');
    }

    if (req.session.authUser.role_id != 3) {
        // nên redirect 1 trang thông báo lỗi k đủ quyền
        return res.redirect('/');
    }
    next();
}
export  function authLabtech(req, res, next) {
    next();   
    if (req.session.auth === false) {
        req.session.retUrl = req.originalUrl;  // Save the requested URL for later use.
        return res.redirect('/account/login');
    }

    if (req.session.authUser.role_id != 4) {
        // nên redirect 1 trang thông báo lỗi k đủ quyền
        return res.redirect('/');
    }
    next();
}