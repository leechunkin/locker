'use strict';
MODULE.define('operation', [], function () {

const database_js = require('database-js');
const process = require('process');

const URL = process.env['DATABASE_URL'] || 'sqlite:///locker.sqlite';

const database = new (database_js.Connection)(URL);

async function authorize(username, password) {
	const results = await authorize.statement.query(username);
	return results.findIndex(result => result['password'] == password) >= 0;
}
authorize.statement =
	database.prepareStatement('SELECT password FROM account WHERE name=?');

async function list(owner, directory) {
	const directories = await list.directories_statement.query(owner, directory);
	const files = await list.files_statement.query(owner, directory);
	return [null, {directories, files}];
}
list.directories_statement =
	database.prepareStatement('SELECT id,name FROM directory WHERE id<>0 AND owner=? AND parent=? ORDER BY name ASC');
list.files_statement =
	database.prepareStatement('SELECT name FROM data WHERE owner=? AND directory=? ORDER BY name ASC');

async function parent(owner, directory) {
	const results = await parent.statement.query(owner, directory);
	if (results.length < 1)
		return ['NONEXISTENT'];
	return [null, results[0]['parent']];
}
parent.statement =
	database.prepareStatement('SELECT parent FROM directory WHERE owner=? AND id=?');

async function erase(owner, directory, name) {
	try {
		await erase.statement.execute(owner, directory, name);
		return [null];
	} catch (error) {
		console.log('operation erase error:', error);
		return ['DATABASE', error];
	}
}
erase.statement =
	database.prepareStatement('DELETE FROM data WHERE owner=? AND directory=? AND name=?');

async function read(owner, directory, name) {
	try {
		const results = await read.statement.query(owner, directory, name);
		if (results.length === 1)
			return [null, results[0]];
		else if (results.length <= 0)
			return ['NONEXISTENT'];
		else
			return ['SUPERFLUOUS', result.length];
	} catch (error) {
		console.log('operation read error: %o', error);
		return ['DATABASE', error];
	}
}
read.statement =
	database.prepareStatement('SELECT nonce,content FROM data WHERE owner=? AND directory=? AND name=?');

async function create(owner, directory, name, nonce, content) {
	try {
		await create.statement.execute(owner, directory, name, nonce, content);
		return [null];
	} catch (error) {
		console.log('operation create error:', error);
		return ['DATABASE', error];
	}
}
create.statement =
	database.prepareStatement('INSERT INTO data (owner, directory, name, nonce, content) VALUES (?,?,?,?,?)');

async function change(owner, directory, origin, name, nonce, content) {
	try {
		await change.statement.execute(name, nonce, content, owner, directory, origin);
		return [null];
	} catch (error) {
		console.log('operation change error:', error);
		return ['DATABASE', error];
	}
}
change.statement =
	database.prepareStatement('UPDATE data SET name=?, nonce=?, content=? WHERE owner=? AND directory=? AND name=?');

return {authorize, list, parent, erase, read, create, change};

});
