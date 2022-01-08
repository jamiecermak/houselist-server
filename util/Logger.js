const winston = require('winston')

const Logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'houselist-server' },
    transports: [
        new winston.transports.File({
            filename: 'log/error.log',
            level: 'error',
        }),
        new winston.transports.File({ filename: 'log/combined.log' }),
    ],
})

module.exports = {
    Logger,
}
