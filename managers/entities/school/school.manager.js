
module.exports = class School {

    constructor({utils, cache, config, cortex, managers, validators, mongomodels }={}){
        this.config              = config;
        this.cortex              = cortex;
        this.validators          = validators; 
        this.mongomodels         = mongomodels;
        this.role               =  managers.role;
        this.responseDispatcher = managers.responseDispatcher;
        this.httpCollection     = "schools";
        this.httpExposed         = [
            '__createSchool',
            'get=__getAllSchools',
            'delete=__deleteSchool',
            'put=__updateSchool'];
    }

    async __createSchool({ __superAdmin, name, fullAddress }){
        const school = { name, fullAddress };
        const result = await this.validators.school.create({...school});
        if(result) return { error : result };

        school.created_by = __superAdmin.userId;

        return this.mongomodels.school.create(school)
    }

    async __getAllSchools({__superAdmin, __query}){
        const { id } = __query;
        if (id) {
            return await this.mongomodels.school.findById(id);
        }

        return await this.mongomodels.school.find();
    }

    async __updateSchool({__id, __superAdmin, name, fullAddress, res}){
        const updatedSchool = {name, fullAddress };
        const result = await this.validators.school.update(updatedSchool);
        if(result) return { error : result };

        let school =  await this.mongomodels.school.findById(__id);
        if (!school) {
            this.responseDispatcher.dispatch(res, {
                code: 404,
                message: 'School not found',
            });
            return { selfHandleResponse: true };
        }

        school.name = updatedSchool.name;
        school.fullAddress = updatedSchool.fullAddress;
        return await school.save();
    }

    async __deleteSchool({__superAdmin, __id, res}){
        let school =  await this.mongomodels.school.findById(__id);
        if (!school) {
            this.responseDispatcher.dispatch(res, {
                code: 404,
                message: 'School not found',
            });
            return { selfHandleResponse: true };
        }

        await school.deleteOne( { id: __id });
        return school;
    }
}
