import { SubRound } from "./SubRound.js";

/**
 * A named round group containing one or more sub-rounds (each with its own target).
 * e.g. group "Characters" with sub-rounds "Cartoon", "Actor/Actress".
 */
export class RoundGroup {
  constructor({ index, title = null, durationSeconds }) {
    this.index = index;
    this.title = title;
    this.durationSeconds = durationSeconds;
    this.subRounds = [];
  }

  addSubRound({ title = null } = {}) {
    const subRound = new SubRound({
      index: this.subRounds.length,
      durationSeconds: this.durationSeconds,
      title,
    });
    this.subRounds.push(subRound);
    return subRound;
  }

  removeSubRound(index) {
    if (index < 0 || index >= this.subRounds.length) return false;
    this.subRounds.splice(index, 1);
    this.subRounds.forEach((sr, i) => (sr.index = i));
    return true;
  }

  updateSubRound(index, { title }) {
    const subRound = this.subRounds[index];
    if (!subRound) return null;
    if (title !== undefined) subRound.title = title;
    return subRound;
  }

  reorderSubRounds(newOrder) {
    if (!Array.isArray(newOrder) || newOrder.length !== this.subRounds.length) {
      return false;
    }
    const reordered = newOrder
      .map((idx) => this.subRounds[idx])
      .filter(Boolean);
    if (reordered.length !== this.subRounds.length) return false;
    this.subRounds = reordered;
    this.subRounds.forEach((sr, i) => (sr.index = i));
    return true;
  }

  allSubRoundsReady() {
    return (
      this.subRounds.length > 0 && this.subRounds.every((sr) => sr.hasTarget)
    );
  }

  toHostPublic() {
    return {
      index: this.index,
      title: this.title,
      subRounds: this.subRounds.map((sr) => sr.toHostPublic()),
    };
  }
}
