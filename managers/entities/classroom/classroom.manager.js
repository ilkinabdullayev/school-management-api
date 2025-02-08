
module.exports = class Classroom {

    constructor({utils, cache, config, cortex, managers, validators, mongomodels }={}){
        this.config              = config;
        this.cortex              = cortex;
        this.validators          = validators; 
        this.mongomodels         = mongomodels;
        this.role               =  managers.role;
        this.responseDispatcher = managers.responseDispatcher;
        this.httpCollection     = "classrooms";
        this.httpExposed         = [
            '__createClassroom',
            'get=__getAllClassrooms',
            'delete=__deleteClassroom',
            'put=__updateClassroom'];
    }

    async __createClassroom({ __token, name, schoolId, capacity, resources, res }){
        const classroom = { name, schoolId, capacity, resources };
        const result = await this.validators.classroom.create(classroom);
        if(result) return { error : result };

        let school =  await this.mongomodels.school.findById(schoolId);
        if (!school) {
            this.responseDispatcher.dispatch(res, {
                code: 404,
                message: 'School not found',
            });
            return { selfHandleResponse: true };
        }

        classroom.created_by = __token.userId;
        return this.mongomodels.classroom.create(classroom)
    }

    async __getAllClassrooms({__token, __query}){
        const { id } = __query;
        if (id) {
            return await this.mongomodels.classroom.findById(id);
        }

        return await this.mongomodels.classroom.find();
    }

    async __updateClassroom({__token, __query, name, schoolId, capacity, resources, res}){
        const updatedClassroom = { name, schoolId, capacity, resources };
        const result = await this.validators.classroom.update(updatedClassroom);
        if(result) return { error : result };

        let classroom =  await this.mongomodels.classroom.findById(__query.id);
        if (!classroom) {
            this.responseDispatcher.dispatch(res, {
                code: 404,
                message: 'Classroom not found',
            });
            return { selfHandleResponse: true };
        }

        let school =  await this.mongomodels.school.findById(schoolId);
        if (!school) {
            this.responseDispatcher.dispatch(res, {
                code: 404,
                message: 'School not found',
            });
            return { selfHandleResponse: true };
        }

        classroom.name = updatedClassroom.name;
        classroom.schoolId = updatedClassroom.schoolId;
        classroom.capacity = updatedClassroom.capacity;
        classroom.resources = updatedClassroom.resources;
        return await classroom.save();
    }

    async __deleteClassroom({__token, __query, res}){
        let classroom =  await this.mongomodels.classroom.findById(__query.id);
        if (!classroom) {
            this.responseDispatcher.dispatch(res, {
                code: 404,
                message: 'Classroom not found',
            });
            return { selfHandleResponse: true };
        }

        await classroom.deleteOne( { id: __query.id });
        return classroom;
    }
}
