const { database } = require('../../util/Database')
const mockDb = require('mock-knex')
const tracker = mockDb.getTracker()
const sinon = require('sinon')

const FirebaseApp = require('../../util/FirebaseApp')
const { FirebaseLib } = require('../../lib/Firebase')
const {
    ServerDatabaseError,
    ServerGeneralError,
} = require('../../util/ServerErrors')

beforeEach(() => {
    mockDb.mock(database)
    tracker.install()
})

afterEach(() => {
    tracker.uninstall()
    mockDb.unmock(database)
})

describe('addFCMTokenToUser', () => {
    it('will create a fcm token record for a user', () => {
        const userId = 20
        const fcmToken = 'fcm-token'

        tracker.on('query', (query) => {
            expect(query.method).toEqual('insert')
            query.response()
        })

        const firebase = new FirebaseLib()

        return firebase.addFCMTokenToUser(userId, fcmToken)
    })

    it('will throw an exception if the record fails to insert', () => {
        const userId = 20
        const fcmToken = 'fcm-token'

        tracker.on('query', (query) => {
            query.reject(new Error('test'))
        })

        const firebase = new FirebaseLib()

        return firebase.addFCMTokenToUser(userId, fcmToken).catch((ex) => {
            expect(ex).toBeInstanceOf(ServerDatabaseError)
            expect(ex.message).toContain('test')
        })
    })
})

describe('getAllFCMTokensForUsers', () => {
    it('will get an array of tokens for a user', () => {
        expect.assertions(2)
        const userIds = [20, 30]

        tracker.on('query', (query) => {
            expect(query.bindings).toEqual([20, 30, 1, 1])

            query.response([
                {
                    id: 1,
                    token: 'token1',
                },
                {
                    id: 2,
                    token: 'token2',
                },
                {
                    id: 3,
                    token: 'token3',
                },
            ])
        })

        const firebase = new FirebaseLib()

        return firebase.getAllFCMTokensForUsers(userIds).then((response) => {
            expect(response).toEqual(['token1', 'token2', 'token3'])
        })
    })

    it('will return an empty array if no tokens are present', () => {
        expect.assertions(1)
        const userId = 20

        tracker.on('query', (query) => {
            query.response([])
        })

        const firebase = new FirebaseLib()

        return firebase.getAllFCMTokensForUsers(userId).then((response) => {
            expect(response).toEqual([])
        })
    })
})

describe('sendFCMPayloadToTokens', () => {
    it('can send messages to multiple tokens', () => {
        expect.assertions(3)

        const tokens = ['token1', 'token2', 'token3']
        const payload = {
            data: {
                score: '850',
            },
        }

        const sendMulticast = sinon.stub().callsFake(async () => {})

        const getMessaging = sinon
            .stub(FirebaseApp, 'getFirebaseMessaging')
            .returns({
                sendMulticast,
            })

        const firebase = new FirebaseLib()

        return firebase.sendFCMPayloadToTokens(payload, tokens).then(() => {
            expect(getMessaging.calledOnce).toEqual(true)
            expect(sendMulticast.callCount).toEqual(1)
            expect(
                sendMulticast.calledOnceWith({
                    data: {
                        score: '850',
                    },
                    tokens,
                }),
            ).toEqual(true)

            getMessaging.restore()
        })
    })
})

describe('sendFCMPayloadToUsers', () => {
    it('will send messages to tokens from the users', () => {
        expect.assertions(4)

        const userIds = [10, 20, 30]
        const payload = {
            data: {
                score: '850',
            },
        }

        const firebase = new FirebaseLib()

        const getAllFCMTokensForUsers = jest
            .spyOn(firebase, 'getAllFCMTokensForUsers')
            .mockResolvedValue(['token1', 'token2', 'token3'])

        const sendFCMPayloadToTokens = jest
            .spyOn(firebase, 'sendFCMPayloadToTokens')
            .mockResolvedValue()

        return firebase.sendFCMPayloadToUsers(payload, userIds).then(() => {
            expect(getAllFCMTokensForUsers).toBeCalledTimes(1)
            expect(getAllFCMTokensForUsers.mock.calls[0][0]).toEqual([
                10, 20, 30,
            ])

            expect(sendFCMPayloadToTokens).toBeCalledTimes(1)
            expect(sendFCMPayloadToTokens.mock.calls[0][1]).toEqual([
                'token1',
                'token2',
                'token3',
            ])
        })
    })

    it('will throw an error if it fails', () => {
        expect.assertions(2)

        const userIds = [10, 20, 30]
        const payload = {
            data: {
                score: '850',
            },
        }

        const firebase = new FirebaseLib()

        jest.spyOn(firebase, 'getAllFCMTokensForUsers').mockResolvedValue(
            'token1',
            'token2',
            'token3',
        )

        jest.spyOn(firebase, 'sendFCMPayloadToTokens').mockRejectedValue(
            new Error('test'),
        )

        return firebase.sendFCMPayloadToUsers(payload, userIds).catch((ex) => {
            expect(ex).toBeInstanceOf(ServerGeneralError)
            expect(ex.message).toContain('Failed to send FCM Payloads')
        })
    })
})
