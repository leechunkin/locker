'use strict';
MODULE.define(
	'API',
	[         'electron'],
	function ({ipcRenderer: IPC}) {

async function login(username, password) {
	return IPC.invoke('API', {action: 'login', username, password});
}

async function parent(username, password, directory) {
	return IPC.invoke('API', {action: 'parent', username, password, directory});
}

async function list(username, password, directory) {
	return IPC.invoke('API', {action: 'list', username, password, directory});
}

async function erase(username, password, directory, name) {
	return IPC.invoke('API', {action: 'erase', username, password, directory, name});
}

async function read(username, password, directory, name) {
	return IPC.invoke('API', {action: 'read', username, password, directory, name});
}

async function create(username, password, directory, name, nonce, content) {
	return IPC.invoke('API', {action: 'create', username, password, directory, name, nonce, content});
}

async function change(username, password, directory, origin, name, nonce, content) {
	return IPC.invoke('API', {action: 'change', username, password, directory, origin, name, nonce, content});
}

return {login, parent, list, erase, read, create, change};

});
