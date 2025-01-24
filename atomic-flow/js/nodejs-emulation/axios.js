// emulates axios node.js module, keeping code browser and node.js compatible

class Axios {

    async get(url, config) {

        const response = await fetch(url, config);

        return {

            data: await response.json(),
            status: response.status,
        };
    }
}

const axios = new Axios();
export default axios;