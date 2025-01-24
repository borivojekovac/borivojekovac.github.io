import EventEmitter from "./nodejs-emulation/eventEmitter.js";

class Observable {
	constructor() {
		this.eventEmitter = new EventEmitter();
	}

	onDebug(message) {
		this.eventEmitter.emit("debug", message);
	}

	onInfo(message) {
		this.eventEmitter.emit("info", message);
	}

	onWarning(message) {
		this.eventEmitter.emit("warning", message);
	}

	onError(message) {
		this.eventEmitter.emit("error", message);
	}

	onProgress(source, progress, estimatedTimeLeft) {
		this.eventEmitter.emit("progress", {
			source,
			progress,
			estimatedTimeLeft
		});
	}
}

export default Observable;
