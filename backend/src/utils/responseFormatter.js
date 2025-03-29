module.exports = {
    success: (res, data, message = 'Success') => {
        return res.status(200).json({
            status: 'success',
            message,
            data
        });
    },
    error: (res, error, message = 'An error occurred') => {
        return res.status(500).json({
            status: 'error',
            message,
            error: error.message || error
        });
    },
    notFound: (res, message = 'Resource not found') => {
        return res.status(404).json({
            status: 'error',
            message
        });
    },
    validationError: (res, errors) => {
        return res.status(400).json({
            status: 'error',
            message: 'Validation error',
            errors
        });
    }
};