const School = require('../managers/entities/school/school.manager');

describe('School', () => {
    let schoolInstance;
    let mockUtils, mockCache, mockConfig, mockCortex, mockManagers, mockValidators, mockMongoModels;

    beforeEach(() => {
        // Mock dependencies
        mockValidators = {
            school: {
                create: jest.fn(),
                update: jest.fn()
            }
        };

        mockMongoModels = {
            school: {
                create: jest.fn(),
                find: jest.fn(),
                findById: jest.fn()
            }
        };

        mockManagers = {
            role: {},
            responseDispatcher: {
                dispatch: jest.fn()
            }
        };

        // Initialize school instance with mocks
        schoolInstance = new School({
            utils: mockUtils,
            cache: mockCache,
            config: mockConfig,
            cortex: mockCortex,
            managers: mockManagers,
            validators: mockValidators,
            mongomodels: mockMongoModels
        });
    });

    describe('__createSchool', () => {
        const mockSchoolData = {
            __superAdmin: { userId: 'admin123' },
            name: 'Test School',
            fullAddress: '123 Test St'
        };

        it('should create a school successfully when validation passes', async () => {
            mockValidators.school.create.mockResolvedValue(null);
            mockMongoModels.school.create.mockResolvedValue(mockSchoolData);

            const result = await schoolInstance.__createSchool(mockSchoolData);

            expect(mockValidators.school.create).toHaveBeenCalledWith({
                name: mockSchoolData.name,
                fullAddress: mockSchoolData.fullAddress
            });
            expect(mockMongoModels.school.create).toHaveBeenCalledWith({
                name: mockSchoolData.name,
                fullAddress: mockSchoolData.fullAddress,
                created_by: mockSchoolData.__superAdmin.userId
            });
            expect(result).toEqual(mockSchoolData);
        });

        it('should return error when validation fails', async () => {
            const validationError = 'Validation failed';
            mockValidators.school.create.mockResolvedValue(validationError);

            const result = await schoolInstance.__createSchool(mockSchoolData);

            expect(result).toEqual({ error: validationError });
            expect(mockMongoModels.school.create).not.toHaveBeenCalled();
        });
    });

    describe('__getAllSchools', () => {
        it('should return all schools when no id is provided', async () => {
            const mockSchools = [
                { name: 'School 1', fullAddress: 'Address 1' },
                { name: 'School 2', fullAddress: 'Address 2' }
            ];
            mockMongoModels.school.find.mockResolvedValue(mockSchools);

            const result = await schoolInstance.__getAllSchools({
                __superAdmin: {},
                __query: {}
            });

            expect(mockMongoModels.school.find).toHaveBeenCalled();
            expect(result).toEqual(mockSchools);
        });

        it('should return specific school when id is provided', async () => {
            const mockSchool = {
                id: 'school123',
                name: 'School 1',
                fullAddress: 'Address 1'
            };
            mockMongoModels.school.findById.mockResolvedValue(mockSchool);

            const result = await schoolInstance.__getAllSchools({
                __superAdmin: {},
                __query: { id: 'school123' }
            });

            expect(mockMongoModels.school.findById).toHaveBeenCalledWith('school123');
            expect(result).toEqual(mockSchool);
        });
    });

    describe('__updateSchool', () => {
        const mockUpdateData = {
            __id: 'school123',
            __superAdmin: { userId: 'admin123' },
            name: 'Updated School',
            fullAddress: 'Updated Address',
            res: {}
        };

        it('should update school successfully when validation passes', async () => {
            const mockSchool = {
                save: jest.fn().mockResolvedValue(mockUpdateData)
            };
            mockValidators.school.update.mockResolvedValue(null);
            mockMongoModels.school.findById.mockResolvedValue(mockSchool);

            const result = await schoolInstance.__updateSchool(mockUpdateData);

            expect(mockValidators.school.update).toHaveBeenCalledWith({
                name: mockUpdateData.name,
                fullAddress: mockUpdateData.fullAddress
            });
            expect(mockSchool.save).toHaveBeenCalled();
            expect(result).toEqual(mockUpdateData);
        });

        it('should return error when school is not found', async () => {
            mockValidators.school.update.mockResolvedValue(null);
            mockMongoModels.school.findById.mockResolvedValue(null);

            const result = await schoolInstance.__updateSchool(mockUpdateData);

            expect(mockManagers.responseDispatcher.dispatch).toHaveBeenCalledWith(
                mockUpdateData.res,
                {
                    code: 404,
                    message: 'School not found',
                }
            );
            expect(result).toEqual({ selfHandleResponse: true });
        });

        it('should return error when validation fails', async () => {
            const validationError = 'Validation failed';
            mockValidators.school.update.mockResolvedValue(validationError);

            const result = await schoolInstance.__updateSchool(mockUpdateData);

            expect(result).toEqual({ error: validationError });
            expect(mockMongoModels.school.findById).not.toHaveBeenCalled();
        });
    });

    describe('__deleteSchool', () => {
        const mockDeleteData = {
            __id: 'school123',
            __superAdmin: { userId: 'admin123' },
            res: {}
        };

        it('should delete school successfully', async () => {
            const mockSchool = {
                deleteOne: jest.fn().mockResolvedValue(true)
            };
            mockMongoModels.school.findById.mockResolvedValue(mockSchool);

            const result = await schoolInstance.__deleteSchool(mockDeleteData);

            expect(mockSchool.deleteOne).toHaveBeenCalledWith({
                id: mockDeleteData.__id
            });
            expect(result).toEqual(mockSchool);
        });

        it('should return error when school is not found', async () => {
            mockMongoModels.school.findById.mockResolvedValue(null);

            const result = await schoolInstance.__deleteSchool(mockDeleteData);

            expect(mockManagers.responseDispatcher.dispatch).toHaveBeenCalledWith(
                mockDeleteData.res,
                {
                    code: 404,
                    message: 'School not found',
                }
            );
            expect(result).toEqual({ selfHandleResponse: true });
        });
    });
});