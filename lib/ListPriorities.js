class ListPrioritiesLib {
    static NORMAL = 0
    static URGENT = 1

    static getDefaultPriority() {
        return ListPrioritiesLib.NORMAL
    }

    static getPriorities() {
        return [ListPrioritiesLib.NORMAL, ListPrioritiesLib.URGENT]
    }
}

module.exports = { ListPrioritiesLib }
