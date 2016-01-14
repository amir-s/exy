var co = require('co');
'use strict';

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

function* f(n) {
	if (n == 1) return 0;
	var t = yield f(n-1);
	console.log("t = " + t)
	return (t)*n;
}
var getFunction = function(n) {
	return function*() {
		var a = yield Promise.resolve(n);
		return a;
	}
}

var arr = [
	{
		id: 1,
		code: getFunction(1),
		childs: [
			{
				id: 2,
				code: getFunction(2),
				childs: []
			},
			{
				id: 3,
				code: getFunction(3),
				childs: [
					{
						id: 4,
						code: getFunction(4),
						childs: []
					},
					{
						id: 5,
						code: getFunction(5),
						childs: []
					}
				]
			},
			{
				id: 6,
				code: getFunction(6),
				childs: [
					{
						id: 7,
						code: getFunction(7),
						childs: []
					}
				]
			}
		]
	},
	{
		id: 8,
		code: getFunction(8),
		childs: [{
			id: 9,
			code: getFunction(9),
			childs: []
		}]
	}
];


var dfs = function* (at) {
	console.log('started at: ' + at.id);
	yield at.childs.asyncMap(function*(c) {
		// console.log('going to call dfs on ' + c.id);
		return yield dfs(c);
	});
	// console.log('finished childs at: ' + at.id);
	var ret = yield at.code();
	console.log('ret ' + ret);
}

co(function*() {
	yield arr.asyncMap(dfs);

})