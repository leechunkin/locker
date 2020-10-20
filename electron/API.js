'use strict';
MODULE.define(
	'API',
	[         'electron',    'operation'],
	function ({ipcMain: IPC}, operation) {

const handle = {
	__proto__: null,
	async login() {
		return [null];
	},
	async passwd({identify: {username}, password}) {
		return operation.passwd(username, password);
	},
	async list({identify: {username}, directory}) {
		return operation.list(username, directory);
	},
	async parent({identify: {username}, directory}) {
		return operation.parent(username, directory);
	},
	async erase({identify: {username}, directory, name}) {
		return operation.erase(username, directory, name);
	},
	async read({identify: {username}, directory, name}) {
		return operation.read(username, directory, name);
	},
	async create({identify: {username}, directory, name, nonce, content}) {
		return operation.create(username, directory, name, nonce, content);
	},
	async change({identify: {username}, directory, origin, name, nonce, content}) {
		return operation.change(username, directory, origin, name, nonce, content);
	}
};

IPC.handle(
	'API',
	async function (event, request) {
		if (request.identify == null || !await operation.authorize(request.identify.username, request.identify.password))
			return ['UNAUTHORIZED'];
		const action = handle[request.action];
		if (typeof action !== 'function')
			return console.error('Unknown request action: "%o"', request.action);
		return action(request);
	}
);

});
