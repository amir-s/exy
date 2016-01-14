'use strict';
var co = require('co');

class Naked {
    constructor() {
        this.middlewares = {};
        this.services = {};
        this.plugins = {};
        this.blocks = {};
    }
    middleware(name, deps, impl) {
        if (!Array.isArray(impl)) impl = [impl];
        if (this.blocks[name]) throw new Error(`The name ${name} already exists`);
        this.middlewares[name] = {
            deps: deps,
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
            deps: deps,
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
            deps: deps,
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
            if (self.blocks[name].loaded === true) return;
            if (self.blocks[name].loaded === 'started') throw new Error(`block ${name} caused a cyclic dependency chain`);
            self.blocks[name].loaded = 'started';
            for (var i=0;i<self.blocks[name].deps.length;i++) {
                yield loader(self.blocks[name].deps[i]);
            };
            self.blocks[name].loaded = true;
            if (self.blocks[name].type == 'middleware') {
                self.blocks[name].impl.forEach(_ => app.use(_));
            }else if (self.blocks[name].type == 'service') {
                self.blocks[name].instance = yield self.blocks[name].impl.call();
            }
        };

        yield Object.keys(this.middlewares).map(mw => loader(mw))
        yield Object.keys(this.services).map(sr => loader(sr));
        yield Object.keys(this.plugins).map(pl => {
            this.plugins[pl].deps.filter(d => d.startsWith('@')).map(d => d.substr(1)).map(loader);
            return this.plugins[pl].impl.apply(null, this.plugins[pl].deps.filter(d => !d.startsWith('@')).map(d => this.blocks[d].instance));
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