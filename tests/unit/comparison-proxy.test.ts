import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { proxy } from "../../src/proxy";

describe("comparison query sanitization proxy", () => {
  it("passes valid selection states through without rewriting them", () => {
    for (const path of [
      "/compare",
      "/compare?programme=usona-psilocybin-mdd",
      "/compare?programme=usona-psilocybin-mdd&programme=comp360-treatment-resistant-depression",
      "/compare?selectionState=invalid",
    ]) {
      const response = proxy(new NextRequest(`https://example.test${path}`));

      expect(response.headers.get("x-middleware-next")).toBe("1");
    }
  });

  it("redirects invalid input before rendering without echoing its values", async () => {
    for (const path of [
      "/compare?programme=unknown-programme",
      "/compare?programme=usona-psilocybin-mdd&programme=usona-psilocybin-mdd",
      "/compare?programme=",
      "/compare?programme=bad%00value",
      "/compare?unexpected=raw-secret-value",
    ]) {
      const response = proxy(new NextRequest(`https://example.test${path}`));
      const responseBody = await response.text();

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        "https://example.test/compare?selectionState=invalid",
      );
      expect(responseBody).not.toMatch(
        /unknown-programme|raw-secret-value|bad\u0000value/,
      );
    }
  });
});
