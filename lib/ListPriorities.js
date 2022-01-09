class ListPrioritiesLib {
    static NORMAL = 0
    static URGENT = 1

    /**
     * Get the default priority ID
     *
     * @returns {number} Priority ID
     */
    static getDefaultPriority() {
        return ListPrioritiesLib.NORMAL
    }

    /**
     * Get all Priority IDs
     *
     * @returns {Array<number>} All Priority IDs
     */
    static getPriorities() {
        return [ListPrioritiesLib.NORMAL, ListPrioritiesLib.URGENT]
    }
}

module.exports = { ListPrioritiesLib }
