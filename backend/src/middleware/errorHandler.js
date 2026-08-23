import multer from 'multer';

/**
 * Centralized error handling middleware for MeetAura API
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  // Handle Multer Errors
  if (err instanceof multer.MulterError) {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File too large. Maximum supported audio file size is 100 MB.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = `Unexpected form field: ${err.field}. Please use 'audio' field.`;
    } else {
      message = `Upload error: ${err.message}`;
    }
  }

  // Handle Custom File Filter or Invalid File Type Errors
  if (err.code === 'INVALID_FILE_TYPE' || err.status === 400) {
    statusCode = 400;
  }

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = 'Invalid meeting ID format.';
  }

  // Handle Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }

  res.status(statusCode).json({
    status: 'error',
    message
  });
};

export default errorHandler;
