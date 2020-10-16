CREATE TABLE account (
	name TEXT NOT NULL,
	password TEXT NOT NULL,
	PRIMARY KEY (name)
);

CREATE TABLE directory (
	owner TEXT NOT NULL,
	id INTEGER NOT NULL,
	name TEXT NOT NULL,
	parent INTEGER NOT NULL,
	PRIMARY KEY (owner, id),
	FOREIGN KEY (owner) REFERENCES account (name)
		ON DELETE CASCADE
		ON UPDATE CASCADE,
	FOREIGN KEY (owner, parent) REFERENCES directory (owner, id)
		ON DELETE CASCADE
		ON UPDATE CASCADE
);

CREATE TABLE data (
	owner TEXT NOT NULL,
	directory INTEGER NOT NULL,
	name TEXT NOT NULL,
	nonce TEXT NOT NULL,
	content TEXT NOT NULL,
	PRIMARY KEY (owner, directory, name),
	FOREIGN KEY (owner) REFERENCES account (name)
		ON DELETE CASCADE
		ON UPDATE CASCADE,
	FOREIGN KEY (owner, directory) REFERENCES directory (owner, id)
		ON DELETE CASCADE
		ON UPDATE CASCADE
);
