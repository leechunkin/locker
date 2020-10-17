'use strict';
MODULE.define(
	'API',
	[         'electron',    'operation'],
	function ({ipcMain: IPC}, operation) {

const handle = {
	__proto__: null,
	async login() {
		return true;
	},
	async parent({username, directory}) {
		return operation.parent(username, directory);
	},
	async list({username, directory}) {
		return operation.list(username, directory);
	},
	async erase({username, directory, name}) {
		return operation.erase(username, directory, name);
	},
	async read({username, directory, name}) {
		return operation.read(username, directory, name);
	},
	async create({username, directory, name, nonce, content}) {
		return operation.create(username, directory, name, nonce, content);
	},
	async change({username, directory, origin, name, nonce, content}) {
		return operation.change(username, directory, origin, name, nonce, content);
	}
};

IPC.handle('API', async function (event, request) {
	if (!await operation.authorize(request.username, request.password))
		return null;
	const action = handle[request.action];
	if (typeof action !== 'function')
		return console.error('Unknown request action: "%o"', request.action);
	return action(request);
});

});
