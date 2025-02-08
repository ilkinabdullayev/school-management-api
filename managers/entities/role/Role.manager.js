module.exports = class Role {


    constructor({ mongomodels } ={}){
        this.mongomodels = mongomodels;
    }

    addPermission({userId, collection, action}) {
        console.log(`${userId} got access=${action} for ${collection} collection`)
        this.mongomodels.role.create({userId, collection, action})
    }
}