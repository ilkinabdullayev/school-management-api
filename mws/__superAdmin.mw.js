module.exports = ({ meta, config, managers }) =>{
    return ({req, res, next})=>{
        if(!req.headers.token){
            console.log('token required but not found')
            return managers.responseDispatcher.dispatch(res, {ok: false, code:401, errors: 'unauthorized'});
        }
        let decoded = null;
        try {
            decoded = managers.token.verifyShortToken({token: req.headers.token});
            console.log(decoded)
            if(!decoded){
                console.log('failed to decode-1')
                return managers.responseDispatcher.dispatch(res, {ok: false, code:401, errors: 'unauthorized'});
            };

            if (!decoded.sessionId || !decoded.deviceId) {
                return managers.responseDispatcher.dispatch(res, {ok: false, code:401, errors: 'unauthorized',  message: 'Generate short token by /api/token/v1_createShortToken',});
            }

            if (decoded.role !== 'SuperAdmin') {
                return managers.responseDispatcher.dispatch(res, {ok: false, code:403, errors: 'forbidden',  message: `${decoded.role} can't access to this method`,});
            }
        } catch(err){
            console.log('failed to decode-2')
            return managers.responseDispatcher.dispatch(res, {ok: false, code:401, errors: 'unauthorized'});
        }
        next(decoded);
    }
}