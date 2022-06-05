import { Obj as ObjMessage, Node as NodeMessage, Entry as EntryMessage, Muid as MuidMessage } from "transactions_pb";
import { Value } from "./values";
import { CommitBytes, ClaimedChains, Medallion, ChainStart, Timestamp, Offset }
    from "./typedefs";
import { Commit } from "./declarations";
import { assert } from "./utils";

export abstract class Obj {
    readonly offset: Offset;
    constructor(readonly commit: Commit) {
        this.offset = commit.addObj(this);
    }
    abstract toObjMessage(): ObjMessage;
    
    computeReference(from?: Obj): MuidMessage {
        const muidMessage = new MuidMessage();
        muidMessage.setOffset(this.offset);
        if (from === undefined) {
            assert(this.commit.sealed, "Can't get an absolute reference to an uncommited object!");
            muidMessage.setTimestamp(this.commit.timestamp);
            muidMessage.setMedallion(this.commit.medallion);
            return muidMessage;
        }
        if (from.commit === this.commit) {
            return muidMessage; // timestamp and medallion unset within the same commit    
        }
        if (from.commit.medallion === this.commit.medallion) {
            
        }
    }
}

export abstract class Node extends Obj {
    constructor(commit: Commit) {
        super(commit);
    }
    toObjMessage(): ObjMessage {
        const objMessage = new ObjMessage();
        objMessage.setNode(this.toNodeMessage());
        return objMessage;
    }
    abstract toNodeMessage(): NodeMessage;
}

export abstract class Entry extends Obj {
    constructor(commit: Commit) {
        super(commit);
    }

    abstract toEntryMessage(): EntryMessage;

    toObjMessage(): ObjMessage {
        const objMessage = new ObjMessage();
        objMessage.setNode(this.toEntryMessage());
        return objMessage;
    }
}

export class SchemaEntry extends Entry {

    constructor(commit: Commit, readonly src: Schema, readonly key: Value,
        readonly value?: boolean | null | Node | string | number | Value) {
        super(commit);
    }
    toEntryMessage(): EntryMessage {
        const entryMessage = new EntryMessage();

    }
}

export class Schema extends Node {
    constructor(commit: Commit) {
        super(commit);
    }
    toNodeMessage(): NodeMessage {
        const nodeMesssage = new NodeMessage();
        nodeMesssage.setBehavior(NodeMessage.Behavior.STREAM);
        return nodeMesssage;
    }
}