require('./naked')
    .middleware('static', [], [require('koa-static')('./app/public/'), require('koa-static')('./app/templates/')])
    .middleware('session', [], require('koa-generic-session')())
    .middleware('bodyParser', [], require('koa-body-parser')())
