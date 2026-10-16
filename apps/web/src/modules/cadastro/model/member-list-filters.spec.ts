import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { memberPositionFilter } from "./member-list-filters";

describe("memberPositionFilter", () => {
  it("returns the position asked in the URL", () => {
    assert.equal(memberPositionFilter("technician"), "technician");
    assert.equal(memberPositionFilter("supervisor"), "supervisor");
  });

  it("ignores a missing or unknown value", () => {
    assert.equal(memberPositionFilter(null), "");
    assert.equal(memberPositionFilter(""), "");
    assert.equal(memberPositionFilter("tecnico"), "");
  });
});
