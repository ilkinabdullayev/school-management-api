module.exports = {
    create: [
        {
            path: 'name',
            required: true,
        },
        {
            path: 'schoolId',
            required: true,
        },
        {
            path: 'capacity',
            required: true,
        }
    ],
    update: [
        {
            path: 'name',
            required: true,
        },
        {
            path: 'schoolId',
            required: true,
        },
        {
            path: 'capacity',
            required: true,
        },
        {
            path: 'resources',
            required: true,
        }
    ],
    enroll: [
        {
            path: 'classroomId',
            required: true,
        },
        {
            path: 'studentId',
            required: true,
        }
    ],
    unregister: [
        {
            path: 'classroomId',
            required: true,
        },
        {
            path: 'studentId',
            required: true,
        }
    ]
}


