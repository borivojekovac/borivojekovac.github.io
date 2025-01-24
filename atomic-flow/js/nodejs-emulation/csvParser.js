function csvParser(text) {
    return text.split("\n").map(line => {
        const cols = line.split(",");
        const obj = {};
        cols.forEach((col, index) => obj[`col${index}`] = col);
        return obj;
    });
}

export default csvParser;