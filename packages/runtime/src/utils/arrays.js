export const ARRAY_DIFF_OP = {
  ADD: "add",
  REMOVE: "remove",
  MOVE: "move",
  NOOP: "noop",
};

export function filterNulls(arr) {
  return arr.filter((item) => item != null);
}

// TODO: Implement index-based comparison to preserve order, since order matters when comparing class lists.
export function arraysDiff(oldArray, newArray) {
  return {
    added: newArray.filter((newItem) => !oldArray.includes(newItem)),
    removed: oldArray.filter((oldItem) => !newArray.includes(oldItem)),
  };
}

/**
 * A working copy of the old array that `arraysDiffSequence` mutates as it
 * decides each operation, while remembering where every item started.
 *
 * Each slot is an `entry` = `{ item, originalIndex }`, where `originalIndex`
 * is the item's position in the pristine old array (or -1 if it was newly
 * added and never existed there).
 *
 * `originalIndex` matters because `patch-dom.js` uses it to fetch the real,
 * already-mounted old vdom node (the one holding a live `.el`) out of the
 * untouched children array. 
 *
 */
class ArrayWithOriginalIndices {
  #entries;
  #equalsFn;

  constructor(array, equalsFn) {
    this.#entries = array.map((item, index) => ({ item, originalIndex: index }));
    this.#equalsFn = equalsFn;
  }

  get #length() {
    return this.#entries.length;
  }

  #itemAt(index) {
    return this.#entries[index].item;
  }

  #originalIndexAt(index) {
    return this.#entries[index].originalIndex;
  }

  /**
   * Locates `item` in the working copy, scanning forward only from
   * `fromIndex`.  Returns the found index, or -1 if `item` is absent
   * from `fromIndex` onward.
   */
  #findIndexFrom(item, fromIndex) {
    for (let i = fromIndex; i < this.#length; i++) {
      if (this.#equalsFn(item, this.#itemAt(i))) {
        return i;
      }
    }

    return -1;
  }

  // isRemoval / isNoop are asked about a position that indexes the NEW
  // array, which can run past the end of what's left of the old working
  // copy. Those trailing positions are pure additions — never a removal or
  // a no-op — so both bail out early once `index` is off the end.

  /**
   * Classifies the position as a REMOVE: the old item at `index` has
   * disappeared from `newArray` entirely. 
   */
  isRemoval(index, newArray) {
    if (index >= this.#length) {
      return false;
    }
    const item = this.#itemAt(index);
    return !newArray.some((newItem) => this.#equalsFn(item, newItem));
  }

  /**
   * Classifies the position as a NOOP: the old item already at `index` is
   * the same item `newArray` wants at `index`, so it stays put.
   */
  isNoop(index, newArray) {
    if (index >= this.#length) {
      return false;
    }
    return this.#equalsFn(this.#itemAt(index), newArray[index]);
  }

  /**
   * Classifies the position as an ADD: `item` appears nowhere from
   * `fromIndex` onward in the working copy.
   */
  isAddition(item, fromIndex) {
    return this.#findIndexFrom(item, fromIndex) === -1;
  }

  /**
   * Applies a REMOVE: drops the entry at `index` from the working copy and
   * returns the operation describing it.
   */
  removeItem(index) {
    const [{ item }] = this.#entries.splice(index, 1);
    return { op: ARRAY_DIFF_OP.REMOVE, index, item };
  }

  /**
   * Applies a NOOP: leaves the working copy untouched and just returns the
   * operation, carrying `originalIndex` so patch-dom can find the existing
   * mounted node to patch in place.
   */
  noopItem(index) {
    return {
      op: ARRAY_DIFF_OP.NOOP,
      originalIndex: this.#originalIndexAt(index),
      index,
      item: this.#itemAt(index),
    };
  }

  /**
   * Applies an ADD: inserts a new entry at `index` (with `originalIndex`
   * -1, since it has no counterpart in the old array) and returns the
   * operation describing it.
   */
  addItem(item, index) {
    this.#entries.splice(index, 0, { item, originalIndex: -1 });
    return { op: ARRAY_DIFF_OP.ADD, index, item };
  }

  /**
   * Applies a MOVE: finds the existing entry matching `item` further along
   * (from `toIndex` onward) and splices it back in at `toIndex`.
   *
   */
  moveItem(item, toIndex) {
    const fromIndex = this.#findIndexFrom(item, toIndex);
    const [entry] = this.#entries.splice(fromIndex, 1);
    this.#entries.splice(toIndex, 0, entry);

    return {
      op: ARRAY_DIFF_OP.MOVE,
      originalIndex: entry.originalIndex,
      from: fromIndex,
      index: toIndex,
      item: entry.item,
    };
  }

  /**
   * Final sweep after the main pass: the new array has been fully walked,
   * so any entries still left from `index` on are old items with no
   * counterpart in the new array. Removes them all, one REMOVE op each.
   */
  removeItemsAfter(index) {
    const operations = [];
    while (this.#length > index) {
      operations.push(this.removeItem(index));
    }
    return operations;
  }
}

/**
 * Diffs two arrays (typically vdom child lists) and returns the ordered
 * sequence of operations that turns `oldArray` into `newArray`, matching
 * items with `equalsFn` instead of strict identity.
 *
 * @param {Array} oldArray - The previous list.
 * @param {Array} newArray - The current list to reconcile against it.
 * @param {(a: *, b: *) => boolean} [equalsFn] - Decides whether two items are "the same" item. Defaults to `===`.
 * @returns {Array<{op: string, index: number, item: *, originalIndex?: number}>} Ops to apply, in order: `add`, `remove`, `move`, or `noop`.
 */
export function arraysDiffSequence(
  oldArray,
  newArray,
  equalsFn = (a, b) => a === b
) {
  const sequence = [];
  const array = new ArrayWithOriginalIndices(oldArray, equalsFn);

  for (let index = 0; index < newArray.length; index++) {
    if (array.isRemoval(index, newArray)) {
      sequence.push(array.removeItem(index));
      // Removing shifts every later item one slot to the left, so the
      // item that used to be at `index + 1` is now at `index`. Cancel out
      // the loop's index++ so the next iteration re-examines this same
      // position instead of skipping over it.
      index--;
      continue;
    }

    if (array.isNoop(index, newArray)) {
      sequence.push(array.noopItem(index));
      continue;
    }

    const item = newArray[index];
    if (array.isAddition(item, index)) {
      sequence.push(array.addItem(item, index));
      continue;
    }

    // No isMove() check needed: by elimination, an item that isn't a
    // removal, isn't already in place, and isn't brand new must already
    // exist somewhere later in the working copy — the only thing left to
    // do with it is move it here.
    sequence.push(array.moveItem(item, index));
  }

  sequence.push(...array.removeItemsAfter(newArray.length));

  return sequence;
}
