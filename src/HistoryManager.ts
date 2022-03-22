export interface UndoState {
    name: string,
    undo: () => void,
    redo: () => void
}

export class HistoryManager {
    states: UndoState[] = [];
    pointer = -1;

    pushState(state: UndoState) {
        if (this.pointer !== this.states.length - 1) {
            this.states.splice(this.pointer + 1);
        }
        this.states.push(state);
        this.pointer++;
    }

    undo() {
        if (this.pointer < 0) return;
        this.states[this.pointer].undo();
        this.pointer--;
    }

    redo() {
        if (this.pointer + 1 === this.states.length) return;
        this.states[this.pointer + 1].redo();
        this.pointer++;
    }
}