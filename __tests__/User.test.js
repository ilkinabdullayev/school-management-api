const User = require('../managers/entities/user/user.manager');
const bcrypt = require('bcrypt');

jest.mock('bcrypt');

describe('User', () => {
    let user;
    let mockUtils, mockCache, mockConfig, mockCortex, mockManagers, mockValidators, mockMongoModels;

    beforeEach(() => {
        // Mock dependencies
        mockValidators = {
            user: {
                create: jest.fn(),
                update: jest.fn()
            }
        };

        mockMongoModels = {
            user: {
                create: jest.fn(),
                findOne: jest.fn(),
                findById: jest.fn(),
                find: jest.fn()
            }
        };

        mockManagers = {
            token: {
                genLongToken: jest.fn()
            },
            role: {},
            responseDispatcher: {
                dispatch: jest.fn()
            }
        };

        user = new User({
            utils: mockUtils,
            cache: mockCache,
            config: mockConfig,
            cortex: mockCortex,
            managers: mockManagers,
            validators: mockValidators,
            mongomodels: mockMongoModels
        });

        // Reset bcrypt mock
        bcrypt.hash.mockReset();
        bcrypt.compare.mockReset();
    });

    describe('__createUser', () => {
        const mockUserData = {
            username: 'testuser',
            email: 'test@test.com',
            password: 'password123',
            role: 'user',
            res: {}
        };

        it('should create a user successfully', async () => {
            const hashedPassword = 'hashedPassword123';
            const createdUser = {
                _id: 'user123',
                username: mockUserData.username,
                email: mockUserData.email,
                role: mockUserData.role
            };
            const mockToken = 'longtoken123';

            mockValidators.user.create.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue(hashedPassword);
            mockMongoModels.user.create.mockResolvedValue(createdUser);
            mockManagers.token.genLongToken.mockReturnValue(mockToken);

            const expectedCreateData = {
                username: mockUserData.username,
                email: mockUserData.email,
                password: mockUserData.password,
                role: mockUserData.role
            };

            const result = await user.__createUser(mockUserData);

            expect(mockValidators.user.create).toHaveBeenCalledWith({
                username: mockUserData.username,
                email: mockUserData.email,
                password: mockUserData.password, // Expecting the raw password before hashing
                role: mockUserData.role
            });

            const expectedMongoData = {
                username: mockUserData.username,
                email: mockUserData.email,
                password: hashedPassword,
                role: mockUserData.role
            };

            expect(mockMongoModels.user.create).toHaveBeenCalledWith(expectedMongoData);
            expect(mockManagers.token.genLongToken).toHaveBeenCalledWith({
                userId: createdUser._id,
                userKey: createdUser.username,
                role: mockUserData.role
            });
            expect(result).toEqual({
                user: createdUser,
                longToken: mockToken
            });
        });

        it('should return validation error if validation fails', async () => {
            const validationError = { message: 'Validation failed' };
            mockValidators.user.create.mockResolvedValue(validationError);

            const result = await user.__createUser(mockUserData);

            expect(result).toEqual({ error: validationError });
            expect(mockMongoModels.user.create).not.toHaveBeenCalled();
        });

        it('should handle duplicate user error', async () => {
            mockValidators.user.create.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hashedPassword');
            mockMongoModels.user.create.mockRejectedValue({
                errorResponse: { code: 11000 }
            });

            const result = await user.__createUser(mockUserData);

            expect(mockManagers.responseDispatcher.dispatch).toHaveBeenCalledWith(
                mockUserData.res,
                {
                    code: 409,
                    message: 'User already exist'
                }
            );
            expect(result).toEqual({ selfHandleResponse: true });
        });
    });

    describe('login', () => {
        const mockLoginData = {
            email: 'test@test.com',
            password: 'password123',
            res: {}
        };

        it('should login user successfully', async () => {
            const mockUser = {
                _id: 'user123',
                username: 'testuser',
                password: 'hashedPassword',
                role: 'user'
            };
            const mockToken = 'longtoken123';

            mockMongoModels.user.findOne.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(true);
            mockManagers.token.genLongToken.mockReturnValue(mockToken);

            const result = await user.login(mockLoginData);

            expect(mockMongoModels.user.findOne).toHaveBeenCalledWith({ email: mockLoginData.email });
            expect(bcrypt.compare).toHaveBeenCalledWith(mockLoginData.password, mockUser.password);
            expect(mockManagers.token.genLongToken).toHaveBeenCalledWith({
                userId: mockUser._id,
                userKey: mockUser.username,
                role: mockUser.role
            });
            expect(result).toEqual({
                user: mockUser,
                longToken: mockToken
            });
        });

        it('should handle user not found', async () => {
            mockMongoModels.user.findOne.mockResolvedValue(null);

            const result = await user.login(mockLoginData);

            expect(mockManagers.responseDispatcher.dispatch).toHaveBeenCalledWith(
                mockLoginData.res,
                {
                    code: 404,
                    message: 'User not found'
                }
            );
            expect(result).toEqual({ selfHandleResponse: true });
        });

        it('should handle invalid password', async () => {
            const mockUser = {
                password: 'hashedPassword'
            };

            mockMongoModels.user.findOne.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(false);

            const result = await user.login(mockLoginData);

            expect(mockManagers.responseDispatcher.dispatch).toHaveBeenCalledWith(
                mockLoginData.res,
                {
                    code: 401,
                    message: 'Invalid password'
                }
            );
            expect(result).toEqual({ selfHandleResponse: true });
        });
    });

    describe('whoAmI', () => {
        it('should return current user', async () => {
            const mockUser = { _id: 'user123', username: 'testuser' };
            const token = { userId: 'user123' };

            mockMongoModels.user.findOne.mockResolvedValue(mockUser);

            const result = await user.whoAmI({ __token: token });

            expect(mockMongoModels.user.findOne).toHaveBeenCalledWith({ _id: token.userId });
            expect(result).toEqual(mockUser);
        });
    });

    describe('__getAllUsers', () => {
        it('should get all users when no id is provided', async () => {
            const mockUsers = [{ id: 1 }, { id: 2 }];
            mockMongoModels.user.find.mockResolvedValue(mockUsers);

            const result = await user.__getAllUsers({ __superAdmin: true, __query: {} });

            expect(mockMongoModels.user.find).toHaveBeenCalled();
            expect(result).toEqual(mockUsers);
        });

        it('should get specific user when id is provided', async () => {
            const mockUser = { id: 'user123' };
            mockMongoModels.user.findById.mockResolvedValue(mockUser);

            const result = await user.__getAllUsers({
                __superAdmin: true,
                __query: { id: 'user123' }
            });

            expect(mockMongoModels.user.findById).toHaveBeenCalledWith('user123');
            expect(result).toEqual(mockUser);
        });
    });

    describe('__updateUser', () => {
        const mockUpdateData = {
            __id: 'user123',
            __superAdmin: true,
            username: 'updateduser',
            email: 'updated@test.com',
            password: 'newpassword123',
            role: 'admin',
            res: {}
        };

        it('should update user successfully', async () => {
            const hashedPassword = 'newhashedpassword123';
            const mockUser = {
                save: jest.fn().mockResolvedValue({
                    username: mockUpdateData.username,
                    email: mockUpdateData.email,
                    role: mockUpdateData.role
                })
            };

            mockValidators.user.update.mockResolvedValue(null);
            mockMongoModels.user.findById.mockResolvedValue(mockUser);
            bcrypt.hash.mockResolvedValue(hashedPassword);

            const result = await user.__updateUser(mockUpdateData);

            expect(mockValidators.user.update).toHaveBeenCalled();
            expect(mockMongoModels.user.findById).toHaveBeenCalledWith('user123');
            expect(bcrypt.hash).toHaveBeenCalledWith(mockUpdateData.password, 10);
            expect(mockUser.save).toHaveBeenCalled();
            expect(result).toEqual({
                username: mockUpdateData.username,
                email: mockUpdateData.email,
                role: mockUpdateData.role
            });
        });

        it('should handle validation error', async () => {
            const validationError = { message: 'Validation failed' };
            mockValidators.user.update.mockResolvedValue(validationError);

            const result = await user.__updateUser(mockUpdateData);

            expect(result).toEqual({ error: validationError });
        });

        it('should handle user not found', async () => {
            mockValidators.user.update.mockResolvedValue(null);
            mockMongoModels.user.findById.mockResolvedValue(null);

            const result = await user.__updateUser(mockUpdateData);

            expect(mockManagers.responseDispatcher.dispatch).toHaveBeenCalledWith(
                mockUpdateData.res,
                {
                    code: 404,
                    message: 'User not found'
                }
            );
            expect(result).toEqual({ selfHandleResponse: true });
        });

        it('should handle duplicate user error on update', async () => {
            const mockUser = {
                save: jest.fn().mockRejectedValue({
                    errorResponse: { code: 11000 }
                })
            };

            mockValidators.user.update.mockResolvedValue(null);
            mockMongoModels.user.findById.mockResolvedValue(mockUser);
            bcrypt.hash.mockResolvedValue('hashedPassword');

            const result = await user.__updateUser(mockUpdateData);

            expect(mockManagers.responseDispatcher.dispatch).toHaveBeenCalledWith(
                mockUpdateData.res,
                {
                    code: 409,
                    message: 'User already exist'
                }
            );
            expect(result).toEqual({ selfHandleResponse: true });
        });
    });

    describe('__deleteUser', () => {
        const mockDeleteData = {
            __superAdmin: true,
            __id: 'user123',
            res: {}
        };

        it('should delete user successfully', async () => {
            const mockUser = {
                deleteOne: jest.fn().mockResolvedValue(true)
            };
            mockMongoModels.user.findById.mockResolvedValue(mockUser);

            const result = await user.__deleteUser(mockDeleteData);

            expect(mockMongoModels.user.findById).toHaveBeenCalledWith('user123');
            expect(mockUser.deleteOne).toHaveBeenCalledWith({ id: 'user123' });
            expect(result).toEqual(mockUser);
        });

        it('should handle user not found', async () => {
            mockMongoModels.user.findById.mockResolvedValue(null);

            const result = await user.__deleteUser(mockDeleteData);

            expect(mockManagers.responseDispatcher.dispatch).toHaveBeenCalledWith(
                mockDeleteData.res,
                {
                    code: 404,
                    message: 'User not found'
                }
            );
            expect(result).toEqual({ selfHandleResponse: true });
        });
    });
});