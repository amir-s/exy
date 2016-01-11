var koa = require('koa'),
    session = require('koa-generic-session'),
    router = require('koa-router')(),
    bodyParser = require('koa-body-parser'),
    static = require('koa-static'),
    send = require('koa-send');



router.get('/', function* (next) {
    yield send(this, './app/templates/home.html')
});

router.get('/count', function* (next) {
    this.session.count = this.session.count || 0;
    this.session.count++;
    this.body = 'N = ' + this.session.count;
});

var app = new koa();
app.keys = ['keys'];

app
    .use(static('./app/public/'))
    .use(static('./app/templates/'))
    .use(session())
    .use(bodyParser())
    .use(router.routes())
    .use(router.allowedMethods())
    
    .listen(3000);
