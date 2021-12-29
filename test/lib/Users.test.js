const { database } = require('./../../util/Database')
const { UsersLib } = require('../../lib/Users')
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
        expect.assertions(4)

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
                    expect(typeof query.bindings[0]).toEqual('string')
                    expect(query.bindings[1]).toEqual(userId)
                    query.response()
                },
            ][step - 1]()
        })

        const user = new UsersLib()

        return user.setPassword(userId, newPassword)
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

describe('getActiveUserById', () => {
    it('will get information for an active user by id', () => {
        expect.assertions(6)

        const userId = 20

        tracker.on('query', (query) => {
            expect(query.method).toEqual('first')
            query.response([
                {
                    id: userId,
                    email_address: 'test@example.com',
                    name: 'John Smith',
                    username: 'johnsmith123',
                },
            ])
        })

        const users = new UsersLib()

        return users.getActiveUserById(userId).then((user) => {
            expect(typeof user).toEqual('object')
            expect(user.emailAddress).toEqual('test@example.com')
            expect(user.id).toEqual(userId)
            expect(user.name).toEqual('John Smith')
            expect(user.username).toEqual('johnsmith123')
        })
    })

    it('will return null if no user is found', () => {
        expect.assertions(3)

        const userId = 20

        tracker.on('query', (query) => {
            expect(query.method).toEqual('first')
            query.response([])
        })

        const users = new UsersLib()

        return users.getActiveUserById(userId).catch((ex) => {
            expect(ex).toBeInstanceOf(Error)
            expect(ex.message).toEqual('User ID 20 not found')
        })
    })
})

describe('updateUsersName', () => {
    it('can update a users name', () => {
        expect.assertions(4)

        const userId = 20
        const userNewName = 'Tim Apple'

        tracker.on('query', (query) => {
            expect(query.method).toEqual('update')
            expect(query.sql).toEqual(
                'update "users" set "name" = $1 where "id" = $2',
            )
            expect(query.bindings).toEqual(['Tim Apple', userId])

            query.response()
        })

        const users = new UsersLib()

        const getActiveUserById = jest
            .spyOn(users, 'getActiveUserById')
            .mockResolvedValue({
                id: 20,
                emailAddress: 'test@example.com',
                name: 'John Smith',
                username: 'johnsmith123',
            })

        return users.updateUsersName(userId, userNewName).then(() => {
            expect(getActiveUserById.mock.calls[0][0]).toEqual(userId)
        })
    })

    it('will not update a user if the name is the same', () => {
        expect.assertions(2)

        const userId = 20
        const userNewName = 'John Smith'

        const users = new UsersLib()

        jest.spyOn(users, 'getActiveUserById').mockResolvedValue({
            id: 20,
            emailAddress: 'test@example.com',
            name: 'John Smith',
            username: 'johnsmith123',
        })

        return users.updateUsersName(userId, userNewName).catch((ex) => {
            expect(ex).toBeInstanceOf(Error)
            expect(ex.message).toEqual(
                'Old name and new name must not be the same',
            )
        })
    })

    it('will throw an error if it can not update the user', () => {
        expect.assertions(2)

        const userId = 20
        const userNewName = 'Tim Apple'

        tracker.on('query', (query) => {
            query.reject(new Error('test'))
        })

        const users = new UsersLib()

        jest.spyOn(users, 'getActiveUserById').mockResolvedValue({
            id: 20,
            emailAddress: 'test@example.com',
            name: 'John Smith',
            username: 'johnsmith123',
        })

        return users.updateUsersName(userId, userNewName).catch((ex) => {
            expect(ex).toBeInstanceOf(Error)
            expect(ex.message).toEqual('Could not update name for User ID 20')
        })
    })
})

describe('Users Lib', () => {
    it.todo('can add a fcm token to a userid')

    it.todo('can update a user with a new name')

    it.todo('can save a profile image for a user')

    it.todo('can generate a signed url link for a user')
})
