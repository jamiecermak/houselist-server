const { database } = require('../../util/Database')
const { UsersLib } = require('../../lib/Users')
const mockDb = require('mock-knex')
const bcrypt = require('bcrypt')
const sinon = require('sinon')
const { UserProfileImagesLib } = require('../../lib/UserProfileImages')
const tracker = mockDb.getTracker()

jest.mock('../../util/Secrets')

jest.mock('../../util/AWS')
const AWS = require('../../util/AWS')
const {
    ServerValidationError,
    ServerNotFoundError,
    ServerDatabaseError,
} = require('../../util/ServerErrors')

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
            expect(user.email_address).toEqual('test@example.com')
            expect(user.id).toEqual(userId)
            expect(user.name).toEqual('John Smith')
            expect(user.username).toEqual('johnsmith123')
        })
    })

    it('will return null if no user is found', () => {
        expect.assertions(4)

        const userId = 20

        tracker.on('query', (query) => {
            expect(query.method).toEqual('first')
            query.response([])
        })

        const users = new UsersLib()

        return users.getActiveUserById(userId).catch((ex) => {
            expect(ex).toBeInstanceOf(ServerNotFoundError)
            expect(ex.message.toLowerCase()).toContain('user')
            expect(ex.humanMessage.toLowerCase()).toContain('user')
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
                email_address: 'test@example.com',
                name: 'John Smith',
                username: 'johnsmith123',
            })

        return users.updateUsersName(userId, userNewName).then(() => {
            expect(getActiveUserById.mock.calls[0][0]).toEqual(userId)
        })
    })

    it('will not update a user if the name is the same', () => {
        expect.assertions(3)

        const userId = 20
        const userNewName = 'John Smith'

        const users = new UsersLib()

        jest.spyOn(users, 'getActiveUserById').mockResolvedValue({
            id: 20,
            email_address: 'test@example.com',
            name: 'John Smith',
            username: 'johnsmith123',
        })

        return users.updateUsersName(userId, userNewName).catch((ex) => {
            expect(ex).toBeInstanceOf(ServerValidationError)
            expect(ex.message).toContain(
                'Old name and new name must not be the same',
            )
            expect(ex.humanMessage).toContain(
                'Old name and new name must not be the same',
            )
        })
    })

    it('will throw an error if it can not update the user', () => {
        expect.assertions(2)

        const userId = 20
        const userNewName = 'Tim Apple'

        tracker.on('query', (query) => {
            query.reject(new Error('error 123'))
        })

        const users = new UsersLib()

        jest.spyOn(users, 'getActiveUserById').mockResolvedValue({
            id: 20,
            email_address: 'test@example.com',
            name: 'John Smith',
            username: 'johnsmith123',
        })

        return users.updateUsersName(userId, userNewName).catch((ex) => {
            expect(ex).toBeInstanceOf(ServerDatabaseError)
            expect(ex.message).toContain('error 123')
        })
    })
})

describe('changeUserProfileImage', () => {
    it('will update a users profile image with a new uploaded one', () => {
        expect.assertions(4)

        const userId = 20
        const s3Path = 'profile-images/test.jpg'
        const testImageBuffer = Buffer.from('test-buffer')

        tracker.on('query', (query) => {
            expect(query.method).toEqual('update')
            query.response()
        })

        const uploadProfileImageToS3 = sinon
            .stub(UserProfileImagesLib.prototype, 'uploadProfileImageToS3')
            .resolves(s3Path)

        const generateProfileImageName = sinon
            .stub(UserProfileImagesLib.prototype, 'generateProfileImageName')
            .returns(s3Path)

        const users = new UsersLib()

        return users
            .changeUserProfileImage(userId, testImageBuffer)
            .then((response) => {
                expect(response).toEqual({
                    bucket: 'storage-s3-bucket',
                    key: s3Path,
                })
                expect(uploadProfileImageToS3.callCount).toEqual(1)
                expect(
                    uploadProfileImageToS3.calledWith(
                        'storage-s3-bucket',
                        s3Path,
                        testImageBuffer,
                    ),
                ).toEqual(true)
            })
            .finally(() => {
                uploadProfileImageToS3.restore()
                generateProfileImageName.restore()
            })
    })

    it('will throw an error if the upload fails', () => {
        expect.assertions(3)

        const userId = 20
        const s3Path = 'profile-images/test.jpg'
        const testImageBuffer = Buffer.from('test-buffer')

        const uploadProfileImageToS3 = sinon
            .stub(UserProfileImagesLib.prototype, 'uploadProfileImageToS3')
            .rejects(new Error('test'))

        const generateProfileImageName = sinon
            .stub(UserProfileImagesLib.prototype, 'generateProfileImageName')
            .returns(s3Path)

        const users = new UsersLib()

        return users
            .changeUserProfileImage(userId, testImageBuffer)
            .catch((ex) => {
                expect(ex).toBeInstanceOf(ServerValidationError)
                expect(ex.message).toContain('AWS S3 Upload Failed')
                expect(ex.humanMessage).not.toContain('AWS S3 Upload Failed')
            })
            .finally(() => {
                uploadProfileImageToS3.restore()
                generateProfileImageName.restore()
            })
    })

    it('will throw an error if the database update fails', () => {
        expect.assertions(2)

        const userId = 20
        const s3Path = 'profile-images/test.jpg'
        const testImageBuffer = Buffer.from('test-buffer')

        tracker.on('query', (query) => {
            query.reject(new Error('test 123'))
        })

        const uploadProfileImageToS3 = sinon
            .stub(UserProfileImagesLib.prototype, 'uploadProfileImageToS3')
            .resolves(s3Path)

        const generateProfileImageName = sinon
            .stub(UserProfileImagesLib.prototype, 'generateProfileImageName')
            .returns(s3Path)

        const users = new UsersLib()

        return users
            .changeUserProfileImage(userId, testImageBuffer)
            .catch((ex) => {
                expect(ex).toBeInstanceOf(ServerDatabaseError)
                expect(ex.message).toContain('test 123')
            })
            .finally(() => {
                uploadProfileImageToS3.restore()
                generateProfileImageName.restore()
            })
    })
})

describe('getUsersByIds', () => {
    it('can get a list of users with pre-signed profile image urls', () => {
        const userIds = [10, 20, 30]

        tracker.on('query', (query) => {
            expect(query.method).toEqual('select')
            query.response([
                {
                    id: 10,
                    name: 'John Smith',
                    profile_image_bucket: 'test-bucket-10',
                    profile_image_key: 'test-key-10',
                },
                {
                    id: 20,
                    name: 'Jane Doe',
                    profile_image_bucket: null,
                    profile_image_key: null,
                },
                {
                    id: 30,
                    name: 'Tim Apple',
                    profile_image_bucket: 'test-bucket-30',
                    profile_image_key: 'test-key-30',
                },
            ])
        })

        const users = new UsersLib()

        return users.getUsersByIds(userIds).then((response) => {
            expect(AWS.generateSignedUrl).toBeCalledTimes(2)
            expect(AWS.generateSignedUrl).toHaveBeenNthCalledWith(
                1,
                'test-bucket-10',
                'test-key-10',
            )
            expect(AWS.generateSignedUrl).toHaveBeenNthCalledWith(
                2,
                'test-bucket-30',
                'test-key-30',
            )
            expect(response).toEqual([
                {
                    id: 10,
                    name: 'John Smith',
                    profile_image_url: 'test-bucket-10/test-key-10',
                },
                {
                    id: 20,
                    name: 'Jane Doe',
                    profile_image_url: null,
                },
                {
                    id: 30,
                    name: 'Tim Apple',
                    profile_image_url: 'test-bucket-30/test-key-30',
                },
            ])
        })
    })
})

describe('getUserIdByEmailAddress', () => {
    it('will return a user id if the user exists', () => {
        expect.assertions(1)

        const emailAddress = 'johnsmith@example.com'

        tracker.on('query', (query) => {
            query.response([
                {
                    id: 1,
                },
            ])
        })

        const users = new UsersLib()

        return users.getUserIdByEmailAddress(emailAddress).then((userId) => {
            expect(userId).toEqual(1)
        })
    })

    it('will throw an error if the user does not exist', () => {
        expect.assertions(1)

        const emailAddress = 'johnsmith@example.com'

        tracker.on('query', (query) => {
            query.response([])
        })

        const users = new UsersLib()

        return users.getUserIdByEmailAddress(emailAddress).catch((ex) => {
            expect(ex).toBeInstanceOf(ServerValidationError)
        })
    })
})

describe('createUser', () => {
    it('will create a new user', () => {
        const users = new UsersLib()

        tracker.on('query', (query) => {
            query.response([20])
        })

        const userEmailAddressExists = jest
            .spyOn(users, 'userEmailAddressExists')
            .mockResolvedValue(false)

        return users
            .createUser(
                'John Smith',
                'johnsmith',
                'johnsmith@example.com',
                'password',
            )
            .then((result) => {
                expect(userEmailAddressExists).toHaveBeenCalledWith(
                    'johnsmith@example.com',
                )
                expect(typeof result).toEqual('number')
                expect(result).toEqual(20)
            })
    })

    it('will fail if the user email address already exists', () => {
        const users = new UsersLib()

        jest.spyOn(users, 'userEmailAddressExists').mockResolvedValue(true)

        return users
            .createUser(
                'John Smith',
                'johnsmith',
                'johnsmith@example.com',
                'password',
            )
            .catch((ex) => {
                expect(ex).toBeInstanceOf(ServerValidationError)
                expect(ex.message).toContain(
                    'Invalid Request (User already exists)',
                )
            })
    })
})

describe('userEmailAddressExists', () => {
    it('will return true if the user exists', () => {
        const users = new UsersLib()

        const getUserIdByEmailAddress = jest
            .spyOn(users, 'getUserIdByEmailAddress')
            .mockResolvedValue(1)

        return users
            .userEmailAddressExists('johnsmith@example.com')
            .then((result) => {
                expect(getUserIdByEmailAddress).toHaveBeenCalledWith(
                    'johnsmith@example.com',
                )
                expect(result).toEqual(true)
            })
    })

    it('will return false if the user does not exist', () => {
        const users = new UsersLib()

        jest.spyOn(users, 'getUserIdByEmailAddress').mockRejectedValue(
            new ServerValidationError(),
        )

        return users
            .userEmailAddressExists('johnsmith@example.com')
            .then((result) => {
                expect(result).toEqual(false)
            })
    })
})
