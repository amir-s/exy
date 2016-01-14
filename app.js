var naked = require('./naked');
    
require('./middlewares');
require('./router');
require('./services');


naked.service('count-model', ['db'], function*(db) {
    if (!(yield db.schema.hasTable('config'))) {
        yield db.schema.createTable('config', function (table) {
            table.string('key').primary();
            table.string('val');
        });
        yield db.insert({key: 'count', val: 0}).into('config');
    }
    return {
        get: function*() {
            var rows = yield db.select().from('config').where({key: 'count'});
            return ~~rows[0].val;
        },
        set: function*(n) {
            yield db.update({val: n}).from('config').where({key: 'count'});
        }
    }
});

naked.plugin('home-page', ['router', 'send', '@session', 'count-model'], function* (router, send, model) {
    router.get('/', function* (next) {
        yield send(this, './app/templates/home.html');
    });
    router.get('/count', function* (next) {
        this.session.count = this.session.count || 0;
        this.session.count++;
        this.body = 'N = ' + this.session.count;
    });
    router.get('/persistent-count', function* (next) {
        var n = yield model.get();
        n++;
        yield model.set(n);
        this.body = n;
    });
});


naked.run(3000);
console.log("http://localhost:3000");