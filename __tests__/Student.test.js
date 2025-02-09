const Student = require('../managers/entities/student/student.manager');

describe('Student', () => {
    let student;
    let mockUtils, mockCache, mockConfig, mockCortex, mockManagers, mockValidators, mockMongoModels;

    beforeEach(() => {
        mockValidators = {
            student: {
                create: jest.fn(),
                update: jest.fn()
            }
        };

        mockMongoModels = {
            student: {
                create: jest.fn(),
                findById: jest.fn(),
                find: jest.fn(),
            },
            classroom: {
                findById: jest.fn()
            }
        };

        mockManagers = {
            role: {},
            responseDispatcher: {
                dispatch: jest.fn()
            }
        };

        student = new Student({
            utils: mockUtils,
            cache: mockCache,
            config: mockConfig,
            cortex: mockCortex,
            managers: mockManagers,
            validators: mockValidators,
            mongomodels: mockMongoModels
        });
    });

    describe('__createStudent', () => {
        const mockStudentData = {
            __token: { userId: 'user123' },
            firstname: 'John',
            lastname: 'Doe',
            classroomId: 'class123',
            age: 10,
            grade: 5,
            res: {}
        };

        it('should create a student successfully', async () => {
            mockValidators.student.create.mockResolvedValue(null);
            mockMongoModels.classroom.findById.mockResolvedValue({ id: 'class123' });
            mockMongoModels.student.create.mockResolvedValue({ ...mockStudentData, id: 'student123' });

            const result = await student.__createStudent(mockStudentData);

            expect(mockValidators.student.create).toHaveBeenCalled();
            expect(mockMongoModels.classroom.findById).toHaveBeenCalledWith('class123');
            expect(mockMongoModels.student.create).toHaveBeenCalledWith({
                firstname: 'John',
                lastname: 'Doe',
                classroomId: 'class123',
                age: 10,
                grade: 5,
                created_by: 'user123'
            });
            expect(result).toEqual({ ...mockStudentData, id: 'student123' });
        });

        it('should return error if validation fails', async () => {
            const validationError = { message: 'Validation failed' };
            mockValidators.student.create.mockResolvedValue(validationError);

            const result = await student.__createStudent(mockStudentData);

            expect(result).toEqual({ error: validationError });
        });

        it('should return error if classroom not found', async () => {
            mockValidators.student.create.mockResolvedValue(null);
            mockMongoModels.classroom.findById.mockResolvedValue(null);

            const result = await student.__createStudent(mockStudentData);

            expect(mockManagers.responseDispatcher.dispatch).toHaveBeenCalledWith(
                mockStudentData.res,
                {
                    code: 404,
                    message: 'Classroom not found',
                }
            );
            expect(result).toEqual({ selfHandleResponse: true });
        });
    });

    describe('__getAllStudents', () => {
        it('should get student by id', async () => {
            const mockStudent = { id: 'student123', firstname: 'John' };
            mockMongoModels.student.findById.mockResolvedValue(mockStudent);

            const result = await student.__getAllStudents({
                __token: {},
                __query: { id: 'student123' }
            });

            expect(mockMongoModels.student.findById).toHaveBeenCalledWith('student123');
            expect(result).toEqual(mockStudent);
        });

        it('should get students by classroomId', async () => {
            const mockStudents = [
                { id: 'student123', firstname: 'John' },
                { id: 'student456', firstname: 'Jane' }
            ];
            mockMongoModels.student.find.mockResolvedValue(mockStudents);

            const result = await student.__getAllStudents({
                __token: {},
                __query: { classroomId: 'class123' }
            });

            expect(mockMongoModels.student.find).toHaveBeenCalledWith({ classroomId: 'class123' });
            expect(result).toEqual(mockStudents);
        });

        it('should return error if neither id nor classroomId provided', async () => {
            const result = await student.__getAllStudents({
                __token: {},
                __query: {}
            });

            expect(result).toEqual({ error: 'either id or classroomId should be set' });
        });
    });

    describe('__updateStudent', () => {
        const mockUpdateData = {
            __token: { userId: 'user123' },
            __id: 'student123',
            firstname: 'John',
            lastname: 'Doe',
            classroomId: 'class123',
            age: 10,
            grade: 5,
            res: {}
        };

        it('should update student successfully', async () => {
            const mockExistingStudent = {
                save: jest.fn().mockResolvedValue({ ...mockUpdateData, id: 'student123' })
            };
            mockValidators.student.update.mockResolvedValue(null);
            mockMongoModels.student.findById.mockResolvedValue(mockExistingStudent);
            mockMongoModels.classroom.findById.mockResolvedValue({ id: 'class123' });

            const result = await student.__updateStudent(mockUpdateData);

            expect(mockValidators.student.update).toHaveBeenCalled();
            expect(mockMongoModels.student.findById).toHaveBeenCalledWith('student123');
            expect(mockMongoModels.classroom.findById).toHaveBeenCalledWith('class123');
            expect(mockExistingStudent.save).toHaveBeenCalled();
            expect(result).toEqual({ ...mockUpdateData, id: 'student123' });
        });

        it('should return error if validation fails', async () => {
            const validationError = { message: 'Validation failed' };
            mockValidators.student.update.mockResolvedValue(validationError);

            const result = await student.__updateStudent(mockUpdateData);

            expect(result).toEqual({ error: validationError });
        });

        it('should return error if student not found', async () => {
            mockValidators.student.update.mockResolvedValue(null);
            mockMongoModels.student.findById.mockResolvedValue(null);

            const result = await student.__updateStudent(mockUpdateData);

            expect(mockManagers.responseDispatcher.dispatch).toHaveBeenCalledWith(
                mockUpdateData.res,
                {
                    code: 404,
                    message: 'Student not found',
                }
            );
            expect(result).toEqual({ selfHandleResponse: true });
        });

        it('should return error if classroom not found', async () => {
            mockValidators.student.update.mockResolvedValue(null);
            mockMongoModels.student.findById.mockResolvedValue({});
            mockMongoModels.classroom.findById.mockResolvedValue(null);

            const result = await student.__updateStudent(mockUpdateData);

            expect(mockManagers.responseDispatcher.dispatch).toHaveBeenCalledWith(
                mockUpdateData.res,
                {
                    code: 404,
                    message: 'Classroom not found',
                }
            );
            expect(result).toEqual({ selfHandleResponse: true });
        });
    });

    describe('__deleteStudent', () => {
        const mockDeleteData = {
            __token: { userId: 'user123' },
            __id: 'student123',
            res: {}
        };

        it('should delete student successfully', async () => {
            const mockExistingStudent = {
                deleteOne: jest.fn().mockResolvedValue({ ok: 1 })
            };
            mockMongoModels.student.findById.mockResolvedValue(mockExistingStudent);

            const result = await student.__deleteStudent(mockDeleteData);

            expect(mockMongoModels.student.findById).toHaveBeenCalledWith('student123');
            expect(mockExistingStudent.deleteOne).toHaveBeenCalledWith({ id: 'student123' });
            expect(result).toEqual(mockExistingStudent);
        });

        it('should return error if student not found', async () => {
            mockMongoModels.student.findById.mockResolvedValue(null);

            const result = await student.__deleteStudent(mockDeleteData);

            expect(mockManagers.responseDispatcher.dispatch).toHaveBeenCalledWith(
                mockDeleteData.res,
                {
                    code: 404,
                    message: 'Student not found',
                }
            );
            expect(result).toEqual({ selfHandleResponse: true });
        });
    });
});