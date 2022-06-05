import { Commit as CommitMessage, Obj as ObjMessage } from "transactions_pb";
import { CommitBytes, ClaimedChains, Medallion, ChainStart, Timestamp, Offset }
    from "./typedefs";

export declare class Client {
    receiveCommit(commitBytes: CommitBytes, fromConnectionId?: number): Promise<void>;
}
export declare class Commit {
    addObj(_obj: Obj): Offset;
    seal(medallion: Medallion, chainStart: ChainStart, priorTimestamp: Timestamp, timestamp: Timestamp): CommitBytes;
    get timestamp(): Timestamp;
    get medallion(): Medallion;
    get sealed(): boolean;
}


export declare class Obj {
    toObjMessage(): ObjMessage;
}

export declare class ChainManager {
    get lastSeen(): Timestamp;
    get chainStart(): Timestamp;
    get medallion(): Medallion;

}