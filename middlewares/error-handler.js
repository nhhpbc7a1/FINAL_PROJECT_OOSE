// Middleware xử lý lỗi chung
export const errorHandler = (err, req, res, next) => {
    // Ghi log lỗi chi tiết vào console (trong môi trường thực tế nên ghi vào file log)
    console.error('Error details:', err);

    // Kiểm tra loại lỗi và trả về thông báo phù hợp
    if (err.code === 'ER_DUP_ENTRY') {
        // Xử lý lỗi trùng lặp email
        if (err.sqlMessage && err.sqlMessage.includes('email')) {
            req.session.flashMessage = { 
                type: 'danger', 
                message: 'Email đã tồn tại trong hệ thống. Vui lòng sử dụng email khác.' 
            };
        } 
        // Xử lý lỗi trùng lặp số điện thoại
        else if (err.sqlMessage && err.sqlMessage.includes('phoneNumber')) {
            req.session.flashMessage = { 
                type: 'danger', 
                message: 'Số điện thoại đã tồn tại trong hệ thống. Vui lòng sử dụng số điện thoại khác.' 
            };
        }
        // Xử lý lỗi trùng lặp số giấy phép
        else if (err.sqlMessage && err.sqlMessage.includes('licenseNumber')) {
            req.session.flashMessage = { 
                type: 'danger', 
                message: 'Số giấy phép đã tồn tại trong hệ thống. Vui lòng kiểm tra lại.' 
            };
        }
        // Trường hợp trùng lặp khác
        else {
            req.session.flashMessage = { 
                type: 'danger', 
                message: 'Thông tin đã tồn tại trong hệ thống. Vui lòng kiểm tra lại.' 
            };
        }
    } else {
        // Thông báo lỗi chung cho các lỗi khác
        req.session.flashMessage = { 
            type: 'danger', 
            message: 'Đã xảy ra lỗi khi xử lý yêu cầu. Vui lòng thử lại sau.' 
        };
    }

    // Chuyển hướng về trang trước đó hoặc trang chỉ định
    if (req.session.returnTo) {
        const returnUrl = req.session.returnTo;
        delete req.session.returnTo;
        return res.redirect(returnUrl);
    }
    
    return res.redirect('/admin/manage_doctor');
};

// Middleware xử lý lỗi cho API
export const apiErrorHandler = (err, req, res, next) => {
    // Ghi log lỗi chi tiết
    console.error('API Error details:', err);

    // Kiểm tra loại lỗi và trả về thông báo phù hợp
    if (err.code === 'ER_DUP_ENTRY') {
        if (err.sqlMessage && err.sqlMessage.includes('email')) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email đã tồn tại trong hệ thống.' 
            });
        } else if (err.sqlMessage && err.sqlMessage.includes('phoneNumber')) {
            return res.status(400).json({ 
                success: false, 
                message: 'Số điện thoại đã tồn tại trong hệ thống.' 
            });
        } else {
            return res.status(400).json({ 
                success: false, 
                message: 'Thông tin đã tồn tại trong hệ thống.' 
            });
        }
    } else {
        return res.status(500).json({ 
            success: false, 
            message: 'Đã xảy ra lỗi khi xử lý yêu cầu.' 
        });
    }
};
