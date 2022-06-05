import { CommitBytes, ClaimedChains, Medallion, ChainStart, Timestamp, Offset, CommitInfo }
    from "./typedefs";
import { Client } from "./declarations";
import { assert } from "./utils";
import { Commit } from "./Commit";


/**
 * Its expected that each thread will have a unique chain to add commits to.
 * The ChainManager class is expected to be this thread-specific class.
 */
 export class ChainManager {
    //#last: Promise<Timestamp>;
    #chainStart: Timestamp | undefined;
    #lastSeen: Timestamp | undefined;
    #medallion: Medallion;

    constructor(readonly client: Client, medallion: Medallion, chainStart?: ChainStart, lastSeen?: Timestamp) {
        // this.#last = new Promise((resolve, _reject) => { resolve(lastSeen) });
        this.#chainStart = chainStart;
        this.#lastSeen = lastSeen;
        this.#medallion = medallion;
    }

    get lastSeen(): Timestamp {
        return this.#lastSeen;
    }

    get chainStart(): Timestamp {
        return this.#chainStart;
    }

    get medallion(): Medallion {
        return this.#medallion;
    }

    startCommit(): Commit {
        return new Commit(this.#medallion);
    }

    /**
     * 
     * @param commit 
     * @returns A promise that will resolve to the commit timestamp once it's persisted/sent.
     */
    addCommit(commit: Commit, timestamp?: Timestamp): Promise<void> {
        if (!timestamp) {
            timestamp = Date.now() * 1000;
            if (this.#lastSeen && this.#lastSeen >= timestamp && this.#lastSeen - timestamp < 1000) {
                // If two or more commits happen in the same millisecond, just increment the microseconds.
                timestamp = this.#lastSeen + 1;
            }
        }
        assert((!this.#lastSeen) || timestamp > this.#lastSeen, "chain timestamps must increase");
        if (!this.#chainStart) {
            this.#chainStart = timestamp;
        }
        const commitInfo: CommitInfo = {
            timestamp, 
            chainStart: this.#chainStart,
            priorTime: this.#lastSeen,
            medallion: this.#medallion,
            comment: commit.comment,
        }
        commit.seal(commitInfo);
        this.#lastSeen = timestamp;
        return this.client.receiveCommit(commit.serialized);
    }
}