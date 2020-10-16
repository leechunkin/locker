'use strict';

globalThis.MODULE = require('../../common/module.js');

MODULE.define('electron', [], function () {
	return require('electron');
});
