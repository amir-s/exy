require('./naked')
    .service('send', [], function* () {
        return require('koa-send');
    })
    .service('db', [], function* () {
        var knex = require('knex')({
            client: 'sqlite3',
            connection: {
                filename: "./data/database.sqlite"
            }
        });
        return knex;
    });