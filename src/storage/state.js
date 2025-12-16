/**
 * State Storage Module
 * 
 * Persists state like last_audit_id to JSON file
 * Thread-safe for concurrent operations
 */

const fs = require('fs');
const path = require('path');
const { Logger } = require('../../logger');

class StateStorage {
    constructor(filename = 'state.json') {
        this.filePath = path.join(__dirname, '..', '..', filename);
        this.data = this.load();
        this.saveQueued = false;
    }

    /**
     * Load state from file
     */
    load() {
        try {
            if (fs.existsSync(this.filePath)) {
                const raw = fs.readFileSync(this.filePath, 'utf-8');
                const parsed = JSON.parse(raw);
                Logger.info(`📁 State loaded from ${this.filePath}`);
                return parsed;
            }
        } catch (error) {
            Logger.warn(`Failed to load state, starting fresh: ${error.message}`);
        }

        return {
            lastAuditId: 0,
            lastAuditSync: null,
            ticketStats: {
                created: 0,
                closed: 0
            }
        };
    }

    /**
     * Save state to file (debounced)
     */
    save() {
        if (this.saveQueued) return;

        this.saveQueued = true;
        setImmediate(() => {
            try {
                fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
                this.saveQueued = false;
            } catch (error) {
                Logger.error(`Failed to save state: ${error.message}`);
                this.saveQueued = false;
            }
        });
    }

    /**
     * Get last synced audit log ID
     */
    getLastAuditId() {
        return this.data.lastAuditId || 0;
    }

    /**
     * Set last synced audit log ID
     */
    setLastAuditId(id) {
        this.data.lastAuditId = id;
        this.data.lastAuditSync = new Date().toISOString();
        this.save();
    }

    /**
     * Increment ticket stats
     */
    incrementTicketStat(type) {
        if (!this.data.ticketStats) {
            this.data.ticketStats = { created: 0, closed: 0 };
        }
        this.data.ticketStats[type] = (this.data.ticketStats[type] || 0) + 1;
        this.save();
    }

    /**
     * Get all stats
     */
    getStats() {
        return {
            lastAuditId: this.data.lastAuditId,
            lastAuditSync: this.data.lastAuditSync,
            ticketStats: this.data.ticketStats
        };
    }

    /**
     * Store arbitrary key-value pair
     */
    set(key, value) {
        this.data[key] = value;
        this.save();
    }

    /**
     * Get arbitrary value
     */
    get(key, defaultValue = null) {
        return this.data[key] !== undefined ? this.data[key] : defaultValue;
    }
}

// Singleton instance
let instance = null;

function getInstance() {
    if (!instance) {
        instance = new StateStorage();
    }
    return instance;
}

module.exports = { StateStorage, getInstance };
