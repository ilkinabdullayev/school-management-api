const Classroom = require('../managers/entities/classroom/classroom.manager');

describe('Classroom', () => {
    let classroom;
    let mockUtils, mockCache, mockConfig, mockCortex, mockManagers, mockValidators, mockMongoModels;

    beforeEach(() => {
        // Mock dependencies
        mockValidators = {
            classroom: {
                create: jest.fn(),
                update: jest.fn(),
                enroll: jest.fn()
            }
        };

        mockMongoModels = {
            classroom: {
                create: jest.fn(),
                findById: jest.fn(),
                find: jest.fn()
            },
            school: {
                findById: jest.fn()
            },
            student: {
                findById: jest.fn(),
                find: jest.fn()
            }
        };

        mockManagers = {
            role: {},
            responseDispatcher: {
                dispatch: jest.fn()
            }
        };

        classroom = new Classroom({
            utils: mockUtils,
            cache: mockCache,
            config: mockConfig,
            cortex: mockCortex,
            managers: mockManagers,
            validators: mockValidators,
            mongomodels: mockMongoModels
        });
    });

    describe('__createClassroom', () => {
        const mockClassroomData = {
            __token: { userId: 'user123' },
            name: 'Test Classroom',
            schoolId: 'school123',
            capacity: 30,
            resources: ['computers', 'books'],
            res: {}
        };

        const expectedCreateData = {
            name: mockClassroomData.name,
            schoolId: mockClassroomData.schoolId,
            capacity: mockClassroomData.capacity,
            resources: mockClassroomData.resources,
            created_by: mockClassroomData.__token.userId
        };

        it('should create a classroom successfully', async () => {
            mockValidators.classroom.create.mockResolvedValue(null);
            mockMongoModels.school.findById.mockResolvedValue({ _id: 'school123' });
            mockMongoModels.classroom.create.mockResolvedValue(expectedCreateData);

            const result = await classroom.__createClassroom(mockClassroomData);

            expect(mockValidators.classroom.create).toHaveBeenCalled();
            expect(mockMongoModels.school.findById).toHaveBeenCalledWith('school123');
            expect(mockMongoModels.classroom.create).toHaveBeenCalledWith(expectedCreateData);
            expect(result).toEqual(expectedCreateData);
        });

        it('should return validation error if validation fails', async () => {
            const validationError = { message: 'Validation failed' };
            mockValidators.classroom.create.mockResolvedValue(validationError);

            const result = await classroom.__createClassroom(mockClassroomData);

            expect(result).toEqual({ error: validationError });
            expect(mockMongoModels.classroom.create).not.toHaveBeenCalled();
        });

        it('should handle school not found', async () => {
            mockValidators.classroom.create.mockResolvedValue(null);
            mockMongoModels.school.findById.mockResolvedValue(null);

            const result = await classroom.__createClassroom(mockClassroomData);

            expect(mockManagers.responseDispatcher.dispatch).toHaveBeenCalledWith(
                mockClassroomData.res,
                {
                    code: 404,
                    message: 'School not found'
                }
            );
            expect(result).toEqual({ selfHandleResponse: true });
        });
    });

    describe('__getAllClassrooms', () => {
        it('should get all classrooms when no id is provided', async () => {
            const mockClassrooms = [{ id: 1 }, { id: 2 }];
            mockMongoModels.classroom.find.mockResolvedValue(mockClassrooms);

            const result = await classroom.__getAllClassrooms({ __token: {}, __query: {} });

            expect(mockMongoModels.classroom.find).toHaveBeenCalled();
            expect(result).toEqual(mockClassrooms);
        });

        it('should get specific classroom when id is provided', async () => {
            const mockClassroom = { id: 'classroom123' };
            mockMongoModels.classroom.findById.mockResolvedValue(mockClassroom);

            const result = await classroom.__getAllClassrooms({
                __token: {},
                __query: { id: 'classroom123' }
            });

            expect(mockMongoModels.classroom.findById).toHaveBeenCalledWith('classroom123');
            expect(result).toEqual(mockClassroom);
        });
    });

    describe('__updateClassroom', () => {
        const mockUpdateData = {
            __token: {},
            __id: 'classroom123',
            name: 'Updated Classroom',
            schoolId: 'school123',
            capacity: 35,
            resources: ['computers', 'books', 'projector'],
            res: {}
        };

        it('should update classroom successfully', async () => {
            const mockClassroom = {
                save: jest.fn().mockResolvedValue({
                    name: mockUpdateData.name,
                    schoolId: mockUpdateData.schoolId,
                    capacity: mockUpdateData.capacity,
                    resources: mockUpdateData.resources
                })
            };
            mockValidators.classroom.update.mockResolvedValue(null);
            mockMongoModels.classroom.findById.mockResolvedValue(mockClassroom);
            mockMongoModels.school.findById.mockResolvedValue({ _id: 'school123' });

            const result = await classroom.__updateClassroom(mockUpdateData);

            expect(mockValidators.classroom.update).toHaveBeenCalled();
            expect(mockMongoModels.classroom.findById).toHaveBeenCalledWith('classroom123');
            expect(mockMongoModels.school.findById).toHaveBeenCalledWith('school123');
            expect(mockClassroom.save).toHaveBeenCalled();
            expect(result).toEqual({
                name: mockUpdateData.name,
                schoolId: mockUpdateData.schoolId,
                capacity: mockUpdateData.capacity,
                resources: mockUpdateData.resources
            });
        });

        it('should handle validation error', async () => {
            const validationError = { message: 'Validation failed' };
            mockValidators.classroom.update.mockResolvedValue(validationError);

            const result = await classroom.__updateClassroom(mockUpdateData);

            expect(result).toEqual({ error: validationError });
        });

        it('should handle classroom not found', async () => {
            mockValidators.classroom.update.mockResolvedValue(null);
            mockMongoModels.classroom.findById.mockResolvedValue(null);

            const result = await classroom.__updateClassroom(mockUpdateData);

            expect(mockManagers.responseDispatcher.dispatch).toHaveBeenCalledWith(
                mockUpdateData.res,
                {
                    code: 404,
                    message: 'Classroom not found'
                }
            );
            expect(result).toEqual({ selfHandleResponse: true });
        });

        it('should handle school not found', async () => {
            mockValidators.classroom.update.mockResolvedValue(null);
            mockMongoModels.classroom.findById.mockResolvedValue({});
            mockMongoModels.school.findById.mockResolvedValue(null);

            const result = await classroom.__updateClassroom(mockUpdateData);

            expect(mockManagers.responseDispatcher.dispatch).toHaveBeenCalledWith(
                mockUpdateData.res,
                {
                    code: 404,
                    message: 'School not found'
                }
            );
            expect(result).toEqual({ selfHandleResponse: true });
        });
    });

    describe('__deleteClassroom', () => {
        const mockDeleteData = {
            __token: {},
            __id: 'classroom123',
            res: {}
        };

        it('should delete classroom successfully', async () => {
            const mockClassroom = {
                deleteOne: jest.fn().mockResolvedValue(true)
            };
            mockMongoModels.classroom.findById.mockResolvedValue(mockClassroom);

            const result = await classroom.__deleteClassroom(mockDeleteData);

            expect(mockMongoModels.classroom.findById).toHaveBeenCalledWith('classroom123');
            expect(mockClassroom.deleteOne).toHaveBeenCalledWith({ id: 'classroom123' });
            expect(result).toEqual(mockClassroom);
        });

        it('should handle classroom not found', async () => {
            mockMongoModels.classroom.findById.mockResolvedValue(null);

            const result = await classroom.__deleteClassroom(mockDeleteData);

            expect(mockManagers.responseDispatcher.dispatch).toHaveBeenCalledWith(
                mockDeleteData.res,
                {
                    code: 404,
                    message: 'Classroom not found'
                }
            );
            expect(result).toEqual({ selfHandleResponse: true });
        });
    });

    describe('enroll', () => {
        const mockEnrollData = {
            __token: {},
            classroomId: 'classroom123',
            studentId: 'student123',
            res: {}
        };

        it('should enroll student successfully', async () => {
            const mockClassroom = { id: 'classroom123' };
            const mockStudent = {
                save: jest.fn().mockResolvedValue(true)
            };
            const mockStudents = [{ id: 'student123' }];

            mockValidators.classroom.enroll.mockResolvedValue(null);
            mockMongoModels.classroom.findById.mockResolvedValue(mockClassroom);
            mockMongoModels.student.findById.mockResolvedValue(mockStudent);
            mockMongoModels.student.find.mockResolvedValue(mockStudents);

            const result = await classroom.enroll(mockEnrollData);

            expect(mockValidators.classroom.enroll).toHaveBeenCalled();
            expect(mockMongoModels.classroom.findById).toHaveBeenCalledWith('classroom123');
            expect(mockMongoModels.student.findById).toHaveBeenCalledWith('student123');
            expect(mockStudent.save).toHaveBeenCalled();
            expect(mockMongoModels.student.find).toHaveBeenCalledWith({ classroomId: 'classroom123' });
            expect(result).toEqual({
                classroom: mockClassroom,
                students: mockStudents
            });
        });

        it('should handle validation error', async () => {
            const validationError = { message: 'Validation failed' };
            mockValidators.classroom.enroll.mockResolvedValue(validationError);

            const result = await classroom.enroll(mockEnrollData);

            expect(result).toEqual({ error: validationError });
        });

        it('should handle classroom not found', async () => {
            mockValidators.classroom.enroll.mockResolvedValue(null);
            mockMongoModels.classroom.findById.mockResolvedValue(null);

            const result = await classroom.enroll(mockEnrollData);

            expect(mockManagers.responseDispatcher.dispatch).toHaveBeenCalledWith(
                mockEnrollData.res,
                {
                    code: 404,
                    message: 'Classroom not found'
                }
            );
            expect(result).toEqual({ selfHandleResponse: true });
        });

        it('should handle student not found', async () => {
            mockValidators.classroom.enroll.mockResolvedValue(null);
            mockMongoModels.classroom.findById.mockResolvedValue({ id: 'classroom123' });
            mockMongoModels.student.findById.mockResolvedValue(null);

            const result = await classroom.enroll(mockEnrollData);

            expect(mockManagers.responseDispatcher.dispatch).toHaveBeenCalledWith(
                mockEnrollData.res,
                {
                    code: 404,
                    message: 'Student not found'
                }
            );
            expect(result).toEqual({ selfHandleResponse: true });
        });
    });
});
