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
        tracker.on('query', (query) => {
            expect(query.method).toEqual('select')
            query.response([
                {
                    id: 0,
                    name: 'Normal',
                },
                {
                    id: 1,
                    name: 'Urgent',
                },
            ])
        })

        const listPriorities = new ListPrioritiesLib()

        return listPriorities.getPriorities().then((response) => {
            expect(response).toEqual([
                {
                    id: 0,
                    name: 'Normal',
                },
                {
                    id: 1,
                    name: 'Urgent',
                },
            ])
        })
    })
})
