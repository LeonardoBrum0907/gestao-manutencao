import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FanOutErrorReporter } from "./error-reporter";
import { FakeErrorReporter } from "./fake-error-reporter";

describe("FanOutErrorReporter", () => {
  it("manda o mesmo erro para todos os destinos", () => {
    const first = new FakeErrorReporter();
    const second = new FakeErrorReporter();
    const error = new Error("x");
    new FanOutErrorReporter([first, second]).report(error, { method: "GET", route: "/" });
    assert.equal(first.reports[0]?.error, error);
    assert.equal(second.reports[0]?.error, error);
  });
});
