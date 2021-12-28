const { database } = require('./../../util/Database')
const { UsersLib } = require('./../../lib/Users')
const mockDb = require('mock-knex')
const bcrypt = require('bcrypt')
const tracker = mockDb.getTracker()

beforeEach(() => {
    mockDb.mock(database)
    tracker.install()
})

afterEach(() => {
    tracker.uninstall()
    mockDb.unmock(database)
})

describe('setPassword', () => {
    it('can set the password for a user', () => {
        expect.assertions(3)

        const userId = 1
        const newPassword = 'new-password'

        tracker.on('query', (query, step) => {
            ;[
                () => {
                    expect(query.method).toEqual('first')

                    query.response([
                        {
                            id: 1,
                            password: 'test-password',
                        },
                    ])
                },
                () => {
                    expect(query.method).toEqual('update')
                    expect(query.bindings).toEqual([userId])
                    query.response()
                },
            ][step - 1]()
        })

        const validate

        const user = new UsersLib()

        return user.setPassword(userId, newPassword).then(() => {})
    })

    it('will not change the password for the user if it is the same', () => {
        expect.assertions(2)

        const userId = 1
        const newPassword = 'new-password'
        const dbPassword = bcrypt.hashSync('new-password', 12)

        tracker.on('query', (query, step) => {
            ;[
                () => {
                    expect(query.method).toEqual('first')
                    query.response([
                        {
                            id: 1,
                            password: dbPassword,
                        },
                    ])
                },
            ][step - 1]()
        })

        const users = new UsersLib()

        return users.setPassword(userId, newPassword).catch((ex) => {
            expect(ex.message).toEqual(
                'Your New Password must be different from your old password',
            )
        })
    })
})

describe('Users Lib', () => {
    it.todo('can get information for a userid')

    it.todo('can add a fcm token to a userid')

    it.todo('can update a user with a new name')

    it.todo('can set the password for a user')

    it.todo('check if a user exists')

    it.todo('get the active status for a userid')

    it.todo('can save a profile image for a user')

    it.todo('can generate a signed url link for a user')
})
