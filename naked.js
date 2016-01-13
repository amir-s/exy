'use strict';

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
    boot(port) {
        var koa = require('koa')
        var app = new koa();
        app.keys = ['keys'];

        var loader = name => {
            if (this.blocks[name] === undefined) throw new Error(`dependency ${name} does not exists`);
            if (this.blocks[name].loaded === true) return;
            if (this.blocks[name].loaded === 'started') throw new Error(`block ${name} caused a cyclic dependency chain`);
            this.blocks[name].loaded = 'started';
            this.blocks[name].deps.forEach(loader);
            this.blocks[name].loaded = true;
            if (this.blocks[name].type == 'middleware') {
                this.blocks[name].impl.forEach(_ => app.use(_));
            }else if (this.blocks[name].type == 'service') {
                this.blocks[name].instance = this.blocks[name].impl.call();
            }
        }

        Object.keys(this.middlewares).forEach(mw => loader(mw))
        Object.keys(this.services).forEach(sr => loader(sr));
        
        Object.keys(this.plugins).forEach(pl => {
            this.plugins[pl].impl.apply(null, this.plugins[pl].deps.map(d => this.blocks[d].instance));
        });

        app.listen(port);

    }
}

module.exports = new Naked();