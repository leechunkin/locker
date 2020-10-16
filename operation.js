'use strict';
MODULE.define('operation', [], function () {

const database_js = require('database-js');
const process = require('process');

const URL = process.env['DATABASE_URL'] || 'postgres:///localhost/locker';

const database = new (database_js.Connection)(URL);

async function authorize(username, password) {
	const results = await authorize.statement.query(username);
	return results.findIndex(result => result['password'] == password) >= 0;
}
authorize.statement =
	database.prepareStatement('SELECT password FROM account WHERE name=?');

async function parent(owner, directory) {
	const results = await parent.statement.query(owner, directory);
	return results[0]['parent'];
}
parent.statement =
	database.prepareStatement('SELECT parent FROM directory WHERE owner=? AND id=?');

async function list(owner, directory) {
	const directories = await list.directories_statement.query(owner, directory);
	const files = await list.files_statement.query(owner, directory);
	return {directories, files};
}
list.directories_statement =
	database.prepareStatement('SELECT id,name FROM directory WHERE id<>0 AND owner=? AND parent=? ORDER BY name ASC');
list.files_statement =
	database.prepareStatement('SELECT name FROM data WHERE owner=? AND directory=? ORDER BY name ASC');

async function erase(owner, directory, name) {
	try {
		await erase.statement.execute(owner, directory, name);
		return true;
	} catch (error) {
		console.log('operation erase error:', error);
		return false;
	}
}
erase.statement =
	database.prepareStatement('DELETE FROM data WHERE owner=? AND directory=? AND name=?');

async function read(owner, directory, name) {
	try {
		const results = await read.statement.query(owner, directory, name);
		if (results.length <= 0)
			return false;
		return results[0];
	} catch (error) {
		console.log('operation read error: %o', error);
		return false;
	}
}
read.statement =
	database.prepareStatement('SELECT nonce,content FROM data WHERE owner=? AND directory=? AND name=?');

async function create(owner, directory, name, nonce, content) {
	try {
		await create.statement.execute(owner, directory, name, nonce, content);
		return true;
	} catch (error) {
		console.log('operation create error:', error);
		return false;
	}
}
create.statement =
	database.prepareStatement('INSERT INTO data (owner, directory, name, nonce, content) VALUES (?,?,?,?,?)');

async function change(owner, directory, origin, name, nonce, content) {
	try {
		await change.statement.execute(name, nonce, content, owner, directory, origin);
		return true;
	} catch (error) {
		console.log('operation change error:', error);
		return false;
	}
}
change.statement =
	database.prepareStatement('UPDATE data SET name=?, nonce=?, content=? WHERE owner=? AND directory=? AND name=?');

return {authorize, parent, list, erase, read, create, change};

});
