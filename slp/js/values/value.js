class Value {

    value = {
    }
    source = null;

    constructor(type, source) {

        this.value.type = type;
        this.source = source;
    }

    toString() {

        throw new Error(`Value type ${this.value.type} doesn't implement toString method.`);
    }

    viewDom() {

        return "";
    }
}

export default Value;