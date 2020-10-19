'use strict';
MODULE.define(
	'API',
	[         'electron'],
	function ({ipcRenderer: IPC}) {

async function login(identify) {
	return IPC.invoke('API', {action: 'login', identify});
}

async function list(identify, directory) {
	return IPC.invoke('API', {action: 'list', identify, directory});
}

async function parent(identify, directory) {
	return IPC.invoke('API', {action: 'parent', identify, directory});
}

async function erase(identify, directory, name) {
	return IPC.invoke('API', {action: 'erase', identify, directory, name});
}

async function read(identify, directory, name) {
	return IPC.invoke('API', {action: 'read', identify, directory, name});
}

async function create(identify, directory, name, nonce, content) {
	return IPC.invoke('API', {action: 'create', identify, directory, name, nonce, content});
}

async function change(identify, directory, origin, name, nonce, content) {
	return IPC.invoke('API', {action: 'change', identify, directory, origin, name, nonce, content});
}

return {login, list, parent, erase, read, create, change};

});
