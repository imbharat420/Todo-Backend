const colors = require('colors/safe')
const errorMessages = require('../utils/error-messages')

const errorHandler = {
  duplicateError: err => {
    return `The given \`${Object.keys(err?.keyValue)}\` already exists`
  },

  validationError: err => {
    const messages = Object.values(err?.errors)?.map(error => {
      if (error.name === 'CastError') {
        return `Invalid input in \`${error.path}\``
      }
      return error?.message
    })
    return messages.length > 1 ? messages : messages[0]
  },

  castError: err => {
    return `Invalid input \`${err?.path}\``
  },

  objParamError: err => {
    return `Invalid input \`${err.message.match(/(?<=got ).*$/gm)[0]}\``
  },
}

module.exports = err => {
  if (err.isOperational) return [err.message, err.statusCode || 400]

  if (err.type === 'entity.parse.failed') {
    return ['Invalid data recieved', 400]
  }

  if (err.code === 11000) {
    return [errorHandler.duplicateError(err), 400]
  }

  switch (err.name) {
    case 'JsonWebTokenError':
      return errorMessages.auth.invalid

    case 'TokenExpiredError':
      return errorMessages.auth.jwtExpire

    case 'ObjectParameterError':
      return [errorHandler.objParamError(err), 400]

    case 'CastError':
      return [errorHandler.castError(err), 400]

    case 'ValidationError':
      return [errorHandler.validationError(err), 400]

    default:
      console.warn(colors.red(err))
      return ['Something went very wrong!', 500]
  }
}
