import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { RECORD_STATUSES } from "@manutencao/shared";
import { countsAsOpen, OPEN_RECORD_STATUS } from "./open-count";

describe("abertos", () => {
  it("conta só o status aberto", () => {
    assert.deepEqual(
      RECORD_STATUSES.filter(countsAsOpen),
      [OPEN_RECORD_STATUS],
    );
  });
});
