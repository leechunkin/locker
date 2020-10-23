'use strict';
MODULE.define('operation', [], function () {

const process = require('process');
const database_js = require('database-js');
const argon2 = require('argon2');

const URL = process.env['DATABASE_URL'] || 'sqlite:///locker.sqlite';

const database = new (database_js.Connection)(URL);

async function authorize(username, password) {
	const results = await authorize.statement.query(username);
	if (results.length <= 0) return false;
	const stored = results[0]['password'];
	if (stored.startsWith('$0$')) {
		return '$0$' + password === stored;
	} else if (stored.startsWith('$argon2i$')) {
		return argon2.verify(stored, password).then(
			result => result,
			error => {
				console.error('authorize argon2 error:', error);
				return false
			}
		);
	} else {
		console.error('authorize unknown password hash: %s', stored);
		return false
	}
}
authorize.statement =
	database.prepareStatement('SELECT password FROM account WHERE name=?');

async function passwd(username, password) {
	if (password.length <= 0) return ['CONTENT', 'password'];
	return argon2.hash(password).then(
		hash =>
			passwd.statement.execute(hash, username).then(
				() => [null],
				error => {
					console.log('operation passwd database error:', error);
					return ['DATABASE', error];
				}
			),
		error => {
			console.log('operation passwd hash error:', error);
			return ['HASH', error];
		}
	);
}
passwd.statement =
	database.prepareStatement('UPDATE account SET password=? WHERE name=?');

async function userdel(username) {
	return userdel.data_statement.execute(username).then(
		() =>
			userdel.directory_statement.execute(username).then(
				() =>
					userdel.account_statement.execute(username).then(
						() => [null],
						error => {
							console.log('operation userdel account error:', error);
							return ['DATABASE', error];
						}
					),
				error => {
					console.log('operation userdel directory error:', error);
					return ['DATABASE', error];
				}
			),
		error => {
			console.log('operation userdel data error:', error);
			return ['DATABASE', error];
		}
	);
}
userdel.data_statement =
	database.prepareStatement('DELETE FROM data WHERE owner=?');
userdel.directory_statement =
	database.prepareStatement('DELETE FROM directory WHERE owner=?');
userdel.account_statement =
	database.prepareStatement('DELETE FROM account WHERE name=?');

async function useradd(username, password) {
	if (username.length <= 0) return ['CONTENT', 'username'];
	if (password.length <= 0) return ['CONTENT', 'password'];
	return argon2.hash(password).then(
		hash =>
			useradd.account_statement.execute(username, hash).then(
				() =>
					useradd.directory_statement.execute(username).then(
						() => [null],
						error => {
							console.log('operation useradd database directory error:', error);
							return ['DATABASE', error];
						}
					),
				error => {
					console.log('operation useradd database account error:', error);
					return ['DATABASE', error];
				}
			),
		error => {
			console.log('operation useradd hash error:', error);
			return ['HASH', error];
		}
	);
}
useradd.account_statement =
	database.prepareStatement('INSERT INTO account (name, password) VALUES (?,?)');
useradd.directory_statement =
	database.prepareStatement('INSERT INTO directory (owner, id, name, parent) VALUES (?,0,\'\',0)');

async function list(owner, directory) {
	try {
		const directories = await list.directories_statement.query(owner, directory);
		const files = await list.files_statement.query(owner, directory);
		return [null, {directories, files}];
	} catch (error) {
		console.log('operation list error:', error);
		return ['DATABASE', error];
	}
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

async function mkdir(owner, directory, name) {
	return mkdir.statement.execute(owner, name, directory).then(
		() => [null],
		error => {
			console.log('operation mkdir error:', error);
			return ['DATABASE', error];
		}
	);
}
mkdir.statement =
	database.prepareStatement(
		'WITH w(owner, id) AS (SELECT owner, max(id)+1 FROM directory WHERE owner=?)'
			+ ' INSERT INTO directory (owner, id, name, parent) SELECT owner, id, ?, ? FROM w;'
	);

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
	return read.statement.query(owner, directory, name).then(
		results => {
			if (results.length === 1)
				return [null, results[0]];
			else if (results.length <= 0)
				return ['NONEXISTENT'];
			else
				return ['SUPERFLUOUS', result.length];
		},
		error => {
			console.log('operation read error: %o', error);
			return ['DATABASE', error];
		}
	);
}
read.statement =
	database.prepareStatement('SELECT nonce,content FROM data WHERE owner=? AND directory=? AND name=?');

async function create(owner, directory, name, nonce, content) {
	return create.statement.execute(owner, directory, name, nonce, content).then(
		() => [null],
		error => {
			console.log('operation create error:', error);
			return ['DATABASE', error];
		}
	);
}
create.statement =
	database.prepareStatement('INSERT INTO data (owner, directory, name, nonce, content) VALUES (?,?,?,?,?)');

async function change(owner, directory, origin, name, nonce, content) {
	return change.statement.execute(name, nonce, content, owner, directory, origin).then(
		() => [null],
		error => {
			console.log('operation change error:', error);
			return ['DATABASE', error];
		}
	);
}
change.statement =
	database.prepareStatement('UPDATE data SET name=?, nonce=?, content=? WHERE owner=? AND directory=? AND name=?');

return {authorize, passwd, userdel, useradd, list, parent, mkdir, erase, read, create, change};

});
