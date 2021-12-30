const { database } = require('../util/Database')

class ListPrioritiesLib {
    static NORMAL = 0
    static URGENT = 1

    async getPriorities() {
        return database.select('id', 'name').from('list_priorities')
    }
}

module.exports = { ListPrioritiesLib }
