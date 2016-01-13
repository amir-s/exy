var naked = require('./naked');
    


naked
    .middleware('static', [], [require('koa-static')('./app/public/'), require('koa-static')('./app/templates/')])
    .middleware('session', [], require('koa-generic-session')())
    .middleware('bodyParser', [], require('koa-body-parser')())



var router = require('koa-router')();

naked
    .middleware('router-mw', ['session', 'bodyParser', 'static'], [router.routes(), router.allowedMethods()])
    .service('router', ['router-mw'], function () {
        return router;
    });


naked.service('send', [], function () {
    return require('koa-send');
});


naked.plugin('home-page', ['router', 'send'], function (router, send) {
    router.get('/', function* (next) {
        yield send(this, './app/templates/home.html');
    });
    router.get('/count', function* (next) {
        this.session.count = this.session.count || 0;
        this.session.count++;
        this.body = 'N = ' + this.session.count;
    });
});


naked.boot(3000);
console.log("http://localhost:3000");