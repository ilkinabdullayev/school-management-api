
module.exports = class Student {

    constructor({utils, cache, config, cortex, managers, validators, mongomodels }={}){
        this.config              = config;
        this.cortex              = cortex;
        this.validators          = validators; 
        this.mongomodels         = mongomodels;
        this.role               =  managers.role;
        this.responseDispatcher = managers.responseDispatcher;
        this.httpCollection     = "students";
        this.httpExposed         = [
            '__createStudent',
            'get=__getAllStudents',
            'delete=__deleteStudent',
            'put=__updateStudent'];
    }

    async __createStudent({ __token, firstname, lastname, classroomId, age, grade, res }){
        const student = {  firstname, lastname, classroomId, age, grade };
        const result = await this.validators.student.create(student);
        if(result) return { error : result };

        let classroom =  await this.mongomodels.classroom.findById(classroomId);
        if (!classroom) {
            this.responseDispatcher.dispatch(res, {
                code: 404,
                message: 'Classroom not found',
            });
            return { selfHandleResponse: true };
        }

        student.created_by = __token.userId;
        return this.mongomodels.student.create(student)
    }

    async __getAllStudents({__token, __query}){
        const { id, classroomId } = __query;
        if (id) {
            return await this.mongomodels.student.findById(id);
        }

        if (classroomId) {
            return await this.mongomodels.student.find({ classroomId });
        }

        return { error: 'either id or classroomId should be set' };
    }

    async __updateStudent({__token, __id, firstname, lastname, classroomId, age, grade, res}){
        const updatedStudent = {  firstname, lastname, classroomId, age, grade };
        const result = await this.validators.student.update(updatedStudent);
        if(result) return { error : result };

        let student =  await this.mongomodels.student.findById(__id);
        if (!student) {
            this.responseDispatcher.dispatch(res, {
                code: 404,
                message: 'Student not found',
            });
            return { selfHandleResponse: true };
        }

        let classroom =  await this.mongomodels.classroom.findById(classroomId);
        if (!classroom) {
            this.responseDispatcher.dispatch(res, {
                code: 404,
                message: 'Classroom not found',
            });
            return { selfHandleResponse: true };
        }

        student.firstname = updatedStudent.firstname;
        student.lastname = updatedStudent.lastname;
        student.classroomId = updatedStudent.classroomId;
        student.age = updatedStudent.age;
        student.grade = updatedStudent.grade;
        return await student.save();
    }

    async __deleteStudent({__token, __id, res}){
        let student =  await this.mongomodels.student.findById(__id);
        if (!student) {
            this.responseDispatcher.dispatch(res, {
                code: 404,
                message: 'Student not found',
            });
            return { selfHandleResponse: true };
        }

        await student.deleteOne( { id: __id });
        return student;
    }
}
