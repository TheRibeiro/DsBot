/**
 * Logger estruturado
 */

class Logger {
    static levels = {
        debug: 0,
        info: 1,
        warn: 2,
        error: 3
    };

    static currentLevel = process.env.LOG_LEVEL || 'info';

    static log(level, ...args) {
        if (this.levels[level] < this.levels[this.currentLevel]) {
            return;
        }

        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

        console.log(prefix, ...args);
    }

    static debug(...args) {
        this.log('debug', ...args);
    }

    static info(...args) {
        this.log('info', ...args);
    }

    static warn(...args) {
        this.log('warn', ...args);
    }

    static error(...args) {
        this.log('error', ...args);
    }
}

module.exports = { Logger };
