'use strict';
MODULE.define(
	'API',
	[         'electron'],
	function ({ipcRenderer: IPC}) {

async function login(identify) {
	return IPC.invoke('API', {action: 'login', identify});
}

async function passwd(identify, password) {
	return IPC.invoke('API', {action: 'passwd', identify, password});
}

async function userdel(identify) {
	return IPC.invoke('API', {action: 'userdel', identify});
}

async function useradd(identify, username, password) {
	return IPC.invoke('API', {action: 'useradd', identify, username, password});
}

async function list(identify, directory) {
	return IPC.invoke('API', {action: 'list', identify, directory});
}

async function parent(identify, directory) {
	return IPC.invoke('API', {action: 'parent', identify, directory});
}

async function mkdir(identify, directory, name) {
	return IPC.invoke('API', {action: 'mkdir', identify, directory, name});
}

async function rename_dir(identify, directory, name) {
	return IPC.invoke('API', {action: 'rename_dir', identify, directory, name});
}

async function rmdir(identify, directory) {
	return IPC.invoke('API', {action: 'rmdir', identify, directory});
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

return {login, passwd, userdel, useradd, list, parent, mkdir, rename_dir, rmdir, erase, read, create, change};

});
