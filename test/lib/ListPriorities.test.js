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
