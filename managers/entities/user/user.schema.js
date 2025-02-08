

module.exports = {
    create: [
        {
            model: 'username',
            path: 'username',
            required: true,
        },
        {
            model: 'password',
            path: 'password',
            required: true,
        },
        {
            path: 'email',
            model: 'email',
            required: true,
        },
        {
            required: true,
            path: 'role',
            type: 'String',
            oneOf: ['SuperAdmin', 'SchoolAdmin'],
        },
    ],
    update: [
        {
            model: 'username',
            path: 'username',
            required: true,
        },
        {
            model: 'password',
            path: 'password',
            required: true,
        },
        {
            path: 'email',
            model: 'email',
            required: true,
        },
        {
            required: true,
            path: 'role',
            type: 'String',
            oneOf: ['SuperAdmin', 'SchoolAdmin'],
        },
    ],
}


