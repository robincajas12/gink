var W3cWebSocket = typeof WebSocket == 'function' ? WebSocket :
    eval("require('websocket').w3cwebsocket");
import { Peer } from "./Peer";
import { Store } from "./Store";
import { makeMedallion, assert, extractCommitInfo, info } from "./utils";
import { CommitBytes, ClaimedChains, Medallion, ChainStart, Timestamp, Offset }
    from "./typedefs";
import { Message } from "messages_pb";
import { Commit as CommitMessage, Obj as ObjMessage } from "transactions_pb";
import { HasMap } from "./HasMap";
import { ChainManager } from "./ChainManager";

export class Client {

    initialized: Promise<void>;
    #store: Store;
    #countConnections: number = 0; // Includes disconnected clients.
    #availableChains: ClaimedChains;
    #iHave: HasMap;
    readonly peers: Map<number, Peer> = new Map();

    constructor(store: Store) {
        this.#store = store;
        this.initialized = this.#initialize();
    }

    /**
     * 
     * @returns Promise of a new chain manager that can be used to create new commits.
     */
    async getChainManager(): Promise<ChainManager> {
        let medallion: number;
        let chainStart: number;
        let seenTo: number;
        if (this.#availableChains.size == 0) {
            medallion = makeMedallion();
            seenTo = chainStart = Date.now() * 1000;
            const startCommit = new CommitMessage();
            startCommit.setTimestamp(seenTo);
            startCommit.setChainStart(chainStart);
            startCommit.setMedallion(medallion);
            startCommit.setComment("<start>");
            const startCommitBytes = startCommit.serializeBinary();
            await this.receiveCommit(startCommitBytes);
            await this.#store.claimChain(medallion, chainStart);
        } else {
            const iterator = this.#availableChains.entries();
            [medallion, chainStart] = iterator.next().value;
            seenTo = this.#iHave.getSeenTo(medallion, chainStart)
            assert(seenTo);
            this.#availableChains.delete(medallion);
        }
        return new ChainManager(this, medallion, chainStart, seenTo);
    }

    async close() {
        for (const [_peerId, peer] of this.peers) {
            peer.close();
        }
        await this.#store.close();
    }

    async #initialize() {
        await this.#store.initialized;
        this.#availableChains = await this.#store.getClaimedChains();
        this.#iHave = await this.#store.getHasMap();
    }

    // returns a truthy number that can be used as a connection id
    createConnectionId(): number {
        return ++this.#countConnections;
    }

    /**
     * Tries to add a commit to the local store.  If successful (i.e. it hasn't seen it before)
     * then it will also publish that commit to the connected peers.
     * 
     * @param commitBytes The bytes that correspond to this transaction.
     * @param fromConnectionId The (truthy) connectionId if it came from a peer.
     * @returns 
     */
    async receiveCommit(commitBytes: CommitBytes, fromConnectionId?: number) {
        const commitInfo = extractCommitInfo(commitBytes);
        this.peers.get(fromConnectionId)?.hasMap?.markIfNovel(commitInfo);
        info(`received commit: ${JSON.stringify(commitInfo)}`);
        const added = await this.#store.addCommit(commitBytes, commitInfo);
        // If this commit isn't new to this instance, then it will have already been 
        // sent to the connected peers and doesn't need to be sent again.
        if (!added) return;
        for (const [peerId, peer] of this.peers) {
            if (peerId != fromConnectionId)
                peer.sendIfNeeded(commitBytes, commitInfo);
        }
    }

    receiveMessage(messageBytes: Uint8Array, fromConnectionId: number) {
        const peer = this.peers.get(fromConnectionId);
        if (!peer) throw Error("Got a message from a peer I don't have a proxy for?")
        try {
            const parsed = Message.deserializeBinary(messageBytes);
            if (parsed.hasCommit()) {
                const commitBytes: CommitBytes = parsed.getCommit_asU8();
                // TODO: chain these receiveCommit class to ensure they get processed
                // in the order of being received.
                this.receiveCommit(commitBytes, fromConnectionId);
                return;
            }
            if (parsed.hasGreeting()) {
                const greeting = parsed.getGreeting();
                peer.receiveHasMap(new HasMap({ greeting }));
                // TODO: figure out how to block processing of receiving other messages while sending
                this.#store.getCommits(peer.sendIfNeeded.bind(peer));
                return;
            }
        } catch (e) {
            //TODO: Send some sensible code to the peer to say what went wrong.
            this.peers.get(fromConnectionId)?.close();
            this.peers.delete(fromConnectionId);
        }
    }

    getGreetingMessageBytes(): Uint8Array {
        const greeting = this.#iHave.constructGreeting();
        const msg = new Message();
        msg.setGreeting(greeting);
        return msg.serializeBinary();
    }

    async connectTo(target: string): Promise<Peer> {
        await this.initialized;
        const thisClient = this;
        return new Promise<Peer>((resolve, reject) => {
            let opened = false;
            const connectionId = this.createConnectionId();
            const websocketClient: WebSocket = new W3cWebSocket(target, "gink");
            websocketClient.binaryType = "arraybuffer";
            const peer = new Peer(
                websocketClient.send.bind(websocketClient),
                websocketClient.close.bind(websocketClient));
            websocketClient.onopen = function (_ev: Event) {
                info(`opened connection ${connectionId} to ${target}`);
                websocketClient.send(thisClient.getGreetingMessageBytes());
                thisClient.peers.set(connectionId, peer);
                opened = true;
                resolve(peer);
            }
            websocketClient.onerror = function (ev: Event) {
                console.error(`error on connection ${connectionId} to ${target}, ${ev}`)
            }
            websocketClient.onclose = function (ev: CloseEvent) {
                info(`closed connection ${connectionId} to ${target}`);
                if (opened) {
                    thisClient.peers.delete(connectionId);
                } else {
                    reject(ev);
                }
            }
            websocketClient.onmessage = function (ev: MessageEvent) {
                const data = ev.data;
                if (data instanceof ArrayBuffer) {
                    const uint8View = new Uint8Array(data);
                    thisClient.receiveMessage(uint8View, connectionId);
                } else {
                    console.error(`got non-arraybuffer message: ${data}`)
                }
            }
        });
    }
}

