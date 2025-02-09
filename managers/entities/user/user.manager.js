const bcrypt = require("bcrypt");

module.exports = class User {

    constructor({utils, cache, config, cortex, managers, validators, mongomodels }={}){
        this.config              = config;
        this.cortex              = cortex;
        this.validators          = validators; 
        this.mongomodels         = mongomodels;
        this.tokenManager        = managers.token;
        this.role               =  managers.role;
        this.responseDispatcher = managers.responseDispatcher;
        this.httpCollection     = "users";
        this.httpExposed         = [
            '__createUser',
            'get=__getAllUsers',
            'delete=__deleteUser',
            'login',
            'get=whoAmI',
            'put=__updateUser'];
    }

    async __createUser({username, email, password, role, res}){
        const user = {username, email, password, role};
        const result = await this.validators.user.create(user);
        if(result) return { error : result };

        let createdUser;
        try {
            user.password = await bcrypt.hash(user.password, 10);
            createdUser =  await this.mongomodels.user.create(user)
        } catch (e) {
            if (e.errorResponse.code === 11000) {
                this.responseDispatcher.dispatch(res, {
                    code: 409,
                    message: 'User already exist',
                });
                return { selfHandleResponse: true };
            }
        }

        const longToken  = this.tokenManager.genLongToken({userId: createdUser._id, userKey: createdUser.username, role });
        return {
            user: createdUser, 
            longToken 
        };
    }


    async login({ email, password, res}) {
        let user =  await this.mongomodels.user.findOne({ email });
        if (!user) {
            this.responseDispatcher.dispatch(res, {
                code: 404,
                message: 'User not found',
            });
            return { selfHandleResponse: true };
        }


        const matched = await bcrypt.compare(password, user.password)
        if (!matched) {
            this.responseDispatcher.dispatch(res, {
                code: 401,
                message: 'Invalid password',
            });
            return { selfHandleResponse: true };
        }

        const longToken  = this.tokenManager.genLongToken({userId: user._id, userKey: user.username, role: user.role });
        return {
            user,
            longToken
        };
    }

    async whoAmI({__token}){
        return await this.mongomodels.user.findOne({ _id: __token.userId });
    }

    async __getAllUsers({__superAdmin, __query}){
        const { id } = __query;
        if (id) {
            return await this.mongomodels.user.findById(id);
        }

        return await this.mongomodels.user.find();
    }

    async __updateUser({__id, __superAdmin, role, username, email, password, res}){
        const updatedUser = {username, email, password, role};
        const result = await this.validators.user.update(updatedUser);
        if(result) return { error : result };

        let user =  await this.mongomodels.user.findById(__id);
        if (!user) {
            this.responseDispatcher.dispatch(res, {
                code: 404,
                message: 'User not found',
            });
            return { selfHandleResponse: true };
        }

        user.password = await bcrypt.hash(password, 10);
        user.email = updatedUser.email;
        user.username = updatedUser.username;
        user.role = updatedUser.role;

        try {
            user = await user.save();
            return user;
        } catch (e) {
            if (e.errorResponse.code === 11000) {
                this.responseDispatcher.dispatch(res, {
                    code: 409,
                    message: 'User already exist',
                });
                return { selfHandleResponse: true };
            }
        }
    }

    async __deleteUser({__superAdmin, __id, res}){
        let user =  await this.mongomodels.user.findById(__id);
        if (!user) {
            this.responseDispatcher.dispatch(res, {
                code: 404,
                message: 'User not found',
            });
            return { selfHandleResponse: true };
        }

        await user.deleteOne( { id: __id });
        return user;
    }
}
