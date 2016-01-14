var router = require('koa-router')();

require('./naked')
    .middleware('router-mw', ['@session', '@bodyParser', '@static'], [router.routes(), router.allowedMethods()])
    .service('router', ['@router-mw'], function* () {
        return router;
    });
