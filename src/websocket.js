import * as controls from './controls.js';
import * as history from './history.js'
import { elements } from './elements.js';
import { options, STG_OPTIONS_KEY } from "./options.js";
import { getNowDateStr } from './helpers.js';
import * as storage from "./storage.js";

let client = {
    get connectionAlive() {
        return typeof client.ws === 'object'
            && client.ws !== null
            && 'readyState' in client.ws
            && client.ws.readyState === client.ws.OPEN
    }
};


client.connect = (url, binary) => {
    client.ws = new WebSocket(url);
    controls.connectionOpening();

    if (binary) {
        client.ws.binaryType = 'arraybuffer';
    }

    client.ws.onopen = controls.connectionOpened;
    client.ws.onclose = controls.connectionClosed;

    client.ws.onerror = () => {
        client.ws.onclose = () => {};
        controls.connectionError();
    };

    client.ws.onmessage = message => {
        let { data } = message;
        if (elements.serverSchema.binaryType.value) {
            const buffer = new Uint8Array(message.data);
            data = new TextDecoder().decode(buffer).slice(1);
        }

        const msg = { type: 'RECEIVED', data, timestamp: getNowDateStr(true) };
        history.add(msg);
        options.messageHistory.push(msg);
        options.lastResponse = js_beautify(data);

        if (options.messageHistory.length > options.showLimit) {
            options.messageHistory.shift();
        }

        storage.set(STG_OPTIONS_KEY, options);
    }
};

export default client;
