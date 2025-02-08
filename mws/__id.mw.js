module.exports = ({ meta, config, managers }) =>{
    return ({req, res, next})=>{
        if(!req.query.id){
            console.log('id query param should be present')
            return managers.responseDispatcher.dispatch(res, {ok: false, code:400, message: 'id query param should be sent'});
        }

        next(req.query.id);
    }
}