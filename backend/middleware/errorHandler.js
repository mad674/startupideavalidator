
class ErrorHandler {
    static errorHandler(err, req, res, next) {
        console.error(err.stack);// Log the error
        res.status(500).json({ message: err.message });
    };
}

module.exports = ErrorHandler;