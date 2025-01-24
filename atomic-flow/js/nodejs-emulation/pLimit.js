// p-limit is a module that limits the number of concurrently running promises.
// Since it's not available in the browser directly, we need to implement a simple version.

function pLimit(concurrency) {
    const queue = [];
    let activeCount = 0;

    const next = () => {
        if (queue.length === 0 || activeCount >= concurrency) {
            return;
        }

        activeCount++;
        const { fn, resolve, reject } = queue.shift();
        fn().then(resolve).catch(reject).finally(() => {
            activeCount--;
            next();
        });
    };

    return (fn) => new Promise((resolve, reject) => {
        queue.push({ fn, resolve, reject });
        next();
    });
}

export default pLimit;