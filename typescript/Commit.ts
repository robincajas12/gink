import { CommitBytes,  Medallion, ChainStart, Timestamp, Offset, PriorTime, CommitInfo }
    from "./typedefs";
import { assert, not } from "./utils";
import { Commit as CommitMessage } from "transactions_pb";
import { Obj } from "./declarations";
/**
 * An open transaction that you can add objects to.  It's a little funky because the timestamp
 * of the commit will be determined when it's closed, so the ID of any object added to the commit
 * isn't completely known until after it's closed.  (That's required to avoid objects referencing 
 * other objects with timestamps in the future).
 */
 export class Commit {
    #sealed: boolean = false;
    #commitInfo: CommitInfo | undefined;
    #comment: string | undefined = undefined;
    #serialized: Uint8Array | undefined = undefined;
    #medallion: Medallion | undefined = undefined;


    constructor(medallion?: Medallion) {
        this.#medallion = medallion;
    }

    set comment(value: string) {
        assert(!this.#sealed);
        this.#comment = value;
    }

    get comment() {
        return this.#comment;
    }

    addObj(_obj: Obj): Offset {
        throw new Error("not implemented");
    }

    seal(commitInfo: CommitInfo) {
        assert(not(this.#sealed));
        assert(not(this.#medallion) || this.#medallion === commitInfo.medallion);
        assert(commitInfo.chainStart <= commitInfo.timestamp);
        assert(not(commitInfo.priorTime) || commitInfo.priorTime < commitInfo.timestamp)
        this.#medallion = commitInfo.medallion;
        const commitMessage = new CommitMessage();
        commitMessage.setTimestamp(commitInfo.timestamp);
        commitMessage.setChainStart(commitInfo.chainStart);
        commitMessage.setMedallion(commitInfo.medallion);
        if (commitInfo.priorTime) commitMessage.setPreviousTimestamp(commitInfo.priorTime)
        if (this.#comment) { commitMessage.setComment(this.#comment); }
        this.#serialized = commitMessage.serializeBinary();
        this.#sealed = true;
        this.#commitInfo = commitInfo;
    }

    get timestamp(): Timestamp {
        assert(this.#sealed);
        return this.#commitInfo.timestamp;
    }

    get serialized(): CommitBytes {
        assert(this.#sealed);
        return this.#serialized;
    }

    get sealed(): boolean {
        return this.#sealed;
    }

    get medallion(): Medallion {
        return this.#medallion;
    }
}
