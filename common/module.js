'use strict';

var MODULE = new function () {
	this.list = Object.create(null);
	this.queue = new Array;
	this.fulfilled = function (dependents) {
		var list = this.list;
		return dependents.every(function (d) {return d in list})
	};
	this.define = function (name, dependents, factory) {
		var o, n, s, l, f;
		if (!this.fulfilled(dependents)) {
			this.queue.push(
				{
					name: name,
					dependents: dependents,
					factory: factory
				}
			)
		} else {
			l = this.list;
			function list(d) {
				return l[d]
			}
			f = this.fulfilled.bind(this);
			function fulfilled(q) {
				return f(q.dependents)
			}
			for (;;) {
				o = factory.apply(this, dependents.map(list));
				if (name !== null && typeof name !== 'undefined')
					this.list[name] = o;
				n = this.queue.findIndex(fulfilled);
				if (n < 0)
					break;
				s = this.queue.splice(n, 1)[0];
				name = s.name;
				dependents = s.dependents;
				factory = s.factory
			}
		}
	};
	this.rename = function (oldname, newname) {
		var m;
		if (oldname in this.list) {
			m = this.list[oldname];
			delete this.list[oldname];
			this.list[newname] = m
		}
	};
	this.exclude = function (module) {
		if (module in this.list) delete this.list[module]
	};
	this.include = function (module, translator) {
		var name, new_name;
		if (translator === null || typeof translator === 'undefined')
			translator = function (x) {return x};
		for (name in module.list) {
			new_name = translator(name);
			if (new_name !== null)
				this.list[new_name] = module.list[name]
		}
	};
	return this
};

if (typeof document === 'object')
	if (document.readyState === 'loading')
		document.addEventListener('DOMContentLoaded', function () {
			MODULE.define('document', [], function () {return document})
		});
	else
		MODULE.define('document', [], function () {return document});

/* for CommonJS */
if (
	typeof module === 'object'
	&& module !== null
	&& typeof exports !== 'undefined'
	&& module.exports === exports
) module.exports = MODULE
