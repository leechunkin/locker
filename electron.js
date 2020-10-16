'use strict';

globalThis.MODULE = require('./common/module.js');

MODULE.define('electron', [], function (electron) {
	return require('electron');
});

require('./operation.js');
require('./electron/API.js');

const electron = require('electron');
const path = require('path');

electron.app.whenReady().then(
	function () {
		electron.Menu.setApplicationMenu(
			new electron.Menu.buildFromTemplate(
				[
					{
						label: 'Program',
						submenu: [
							{role: 'toggleDevTools'},
							{type: 'separator'},
							{role: 'quit'}
						]
					}
				]
			)
		);
		const browser =
			new electron.BrowserWindow(
				{
					width: 800,
					height: 600,
					webPreferences: {
						preload: path.join(electron.app.getAppPath(), 'electron/browser/preload.js'),
						//	nodeIntegration: true,
						//	devTools: false,
						spellcheck: false
					}
				}
			);
		//	browser.webContents.openDevTools();
		return browser.loadFile('electron/browser/index.xhtml');
	}
);
