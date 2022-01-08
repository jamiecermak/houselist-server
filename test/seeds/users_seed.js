exports.seed = function (knex) {
    // Deletes ALL existing entries
    return knex('users')
        .del()
        .then(function () {
            // Inserts seed entries
            return knex('users').insert([
                {
                    id: 1,
                    name: 'John Smith',
                    email_address: 'johnsmith@example.com',
                    username: 'johnsmith',
                    password:
                        '$2a$12$MP/nEmfwoDgBoiVJoUm8D.0Yg8tubX7KQLm/IeFrPqR4laumh5ULG',
                    is_active: true,
                    profile_image_bucket: null,
                    profile_image_key: null,
                },
                {
                    id: 2,
                    name: 'Jane Doe',
                    email_address: 'janedoe@example.com',
                    username: 'janedoe',
                    password:
                        '$2a$12$MP/nEmfwoDgBoiVJoUm8D.0Yg8tubX7KQLm/IeFrPqR4laumh5ULG',
                    is_active: true,
                    profile_image_bucket: null,
                    profile_image_key: null,
                },
                {
                    id: 3,
                    name: 'Tim Apple',
                    email_address: 'timapple@example.com',
                    username: 'timapple',
                    password:
                        '$2a$12$MP/nEmfwoDgBoiVJoUm8D.0Yg8tubX7KQLm/IeFrPqR4laumh5ULG',
                    is_active: true,
                    profile_image_bucket: null,
                    profile_image_key: null,
                },
            ])
        })
}
