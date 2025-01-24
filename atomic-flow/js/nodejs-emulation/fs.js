const localStorage = window.localStorage;
const fs = {
	readFile(filename) {
		return new Promise((resolve, reject) => {
			try {
				const data = localStorage.getItem(`filesystem-${filename}`);
				if (data === null) {
					reject(new Error(`File not found: ${filename}`));
				} else {
					resolve(JSON.parse(data));
				}
			} catch (error) {
				reject(error);
			}
		});
	},
	writeFile(filename, data) {
		return new Promise((resolve, reject) => {
			try {
				localStorage.setItem(`filesystem-${filename}`, JSON.stringify(data));
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	},
	existsSync(filename) {
		return localStorage.getItem(`filesystem-${filename}`) !== null;
	},
};

export default fs;