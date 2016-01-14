'use strict';
var co = require('co');

Array.prototype.asyncMap = function (fn) {
    return new Promise((acc, rej) => {
        var self = this;
        var out = [];
        co(function*() {
            for (var i=0;i<self.length;i++) {
                var result = yield fn.call(null, self[i]);
                out.push(result);
            }
        }).then(function () {
            acc(out);
        })
    })
}


class Naked {
    constructor() {
        this.middlewares = {};
        this.services = {};
        this.plugins = {};
        this.blocks = {};
    }
    static fixDependencies(deps) {
        return deps.map(name => ({inject: !name.startsWith('@'), name: name.replace('@','')}));
    }
    middleware(name, deps, impl) {
        if (!Array.isArray(impl)) impl = [impl];
        if (this.blocks[name]) throw new Error(`The name ${name} already exists`);
        this.middlewares[name] = {
            deps: Naked.fixDependencies(deps),
            impl: impl,
            loaded: false,
            type: 'middleware'
        };
        this.blocks[name] = this.middlewares[name];
        return this;
    }
    service(name, deps, impl) {
        if (this.blocks[name]) throw new Error(`The name ${name} already exists`);
        this.services[name] = {
            deps: Naked.fixDependencies(deps),
            impl: impl,
            loaded: false,
            type: 'service'
        };
        this.blocks[name] = this.services[name];
        return this;
    }
    plugin(name, deps, impl) {
        if (this.blocks[name]) throw new Error(`The name ${name} already exists`);
        this.plugins[name] = {
            deps: Naked.fixDependencies(deps),
            impl: impl,
            loaded: false,
            type: 'plugin'
        };
        this.blocks[name] = this.plugins[name];
        return this;
    }
    *boot(port) {
        var koa = require('koa');
        var app = new koa();
        app.keys = ['keys'];
        var self = this;
        function* loader (name) {
            if (self.blocks[name] === undefined) throw Error(`dependency ${name} does not exists`);
            if (self.blocks[name].loaded === true) {
                return self.blocks[name].instance;
            }
            if (self.blocks[name].loaded === 'started') throw new Error(`block ${name} caused a cyclic dependency chain`);
            self.blocks[name].loaded = 'started';
            var instances = [];
            for (var i=0;i<self.blocks[name].deps.length;i++) {
                var instance = yield loader(self.blocks[name].deps[i].name);
                if (self.blocks[name].deps[i].inject) instances.push(instance);
            };
            self.blocks[name].loaded = true;
            if (self.blocks[name].type == 'middleware') {
                self.blocks[name].impl.forEach(_ => app.use(_));
            }else if (self.blocks[name].type == 'service') {
                self.blocks[name].instance = yield self.blocks[name].impl.apply(null, instances);
                return self.blocks[name].instance;
            }else if (self.blocks[name].type == 'plugin') {
                yield self.blocks[name].impl.apply(null, instances);
            }
        };

        yield Object.keys(this.middlewares).asyncMap(function* (mw) {
            return yield loader(mw);
        });
        yield Object.keys(this.services).asyncMap(function* (sr) {
            return yield loader(sr);
        });
        yield Object.keys(this.plugins).asyncMap(function* (pl) {
            return yield loader(pl);
        });
        app.listen(port);

    }
    run(port) {
        co(this.boot(port)).catch(function (e) {
            console.log(e);
        });
    }
}

module.exports = new Naked();