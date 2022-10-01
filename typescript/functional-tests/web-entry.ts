eval("globalThis.test = function() {};");
import { IndexedDbStore } from "../library-code/IndexedDbStore";

import { CommitInfo } from "../library-code/typedefs";
import { GinkInstance } from "../library-code/GinkInstance";
import { ChangeSet } from "../library-code/ChangeSet";

function getWebsocketTarget(): string {
    const loc = window.location;
    let target = "";
    if (loc.protocol === "https:") {
        target = "wss:";
    } else {
        target = "ws:";
    }
    target += "//" + loc.host;
    target += loc.pathname + "/";
    return target;
}

async function onCommit(commitInfo: CommitInfo) {
    document.getElementById('messages').innerHTML +=
        `${commitInfo.medallion}, ${commitInfo.timestamp}, ` +
        `"${commitInfo.comment}"\n`;
}

(async () => {
    const instance = new GinkInstance(new IndexedDbStore(), "browser instance");
    await instance.initialized;
    instance.addListener(onCommit);
    await instance.addChangeSet(new ChangeSet("Hello, Universe!"));
    await instance.connectTo(getWebsocketTarget());
})();
