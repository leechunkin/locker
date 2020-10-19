'use strict';
MODULE.define('DOM', [], function () {

return function (document) {
	function T(text) {
		return document.createTextNode(text);
	}

	function beE(x) {
		if (typeof x === 'string' || x instanceof String)
			return T(x);
		else if (x instanceof Array)
			return F(x);
		else
			return x;
	}

	function E(tagname, attributes, ...children) {
		const element =
			document.documentElement !== null
				? document.createElementNS(document.documentElement.namespaceURI, tagname)
				: document.createElement(tagname);
		if (typeof attributes !== 'undefined')
			for (const attribute in attributes)
				switch (attribute) {
					case 'event$': {
						const handlers = attributes[attribute];
						for (const event in handlers)
							element.addEventListener(event, handlers[event]);
						break;
					}
					case 'style$': {
						const styles = attributes[attribute];
						for (const property in styles)
							element.style.setProperty(property, styles[property]);
						break;
					}
					default:
						element.setAttribute(attribute, attributes[attribute]);
				}
		for (const child of children)
			element.appendChild(beE(child));
		return element;
	}

	function F(elements) {
		const fragment = document.createDocumentFragment();
		for (const element of elements)
			fragment.appendChild(beE(element));
		return fragment;
	}

	function Fs(...elements) {
		return F(elements);
	}

	return {T, E, F, Fs};
};

});
