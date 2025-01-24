// emulates EventEmitter from events node.js module, keeping code browser and node.js compatible

class EventEmitter {

	constructor() {

		this.listeners = {};        
	}

	on(eventName, listener) {

		if (!this.listeners[eventName]) {

			this.listeners[eventName] = [];
		}

		this.listeners[eventName].push(listener);
	}

	off(eventName, listener) {

		if (this.listeners[eventName]) {

			const index = this.listeners[eventName].indexOf(listener);

			if (index >= 0) {

				this.listeners[eventName].splice(index, 1);
			}
		}
	}

	emit(eventName, ...args) {

		if (this.listeners[eventName]) {

			this.listeners[eventName].forEach((listener) => listener(...args));
		}
	}
}

export default EventEmitter;