const { database } = require('../../util/Database')
const mockDb = require('mock-knex')
const { ListPrioritiesLib } = require('../../lib/ListPriorities')
const tracker = mockDb.getTracker()

beforeEach(() => {
    mockDb.mock(database)
    tracker.install()
})

afterEach(() => {
    tracker.uninstall()
    mockDb.unmock(database)
})

describe('getPriorities', () => {
    it('can get all priorities for a list', () => {
        const response = ListPrioritiesLib.getPriorities()

        expect(response.length).toBeGreaterThan(0)
        expect(Array.isArray(response)).toEqual(true)
    })
})

describe('getDefaultPriority', () => {
    it('can get a default priority', () => {
        const response = ListPrioritiesLib.getDefaultPriority()

        expect(typeof response).toEqual('number')
    })

    it('is included in getPriorities', () => {
        const defaultPriority = ListPrioritiesLib.getDefaultPriority()
        const allPriorities = ListPrioritiesLib.getPriorities()

        expect(allPriorities.includes(defaultPriority)).toEqual(true)
    })
})
