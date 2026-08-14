import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

const vercelConfigUrl = new URL("../../vercel.json", import.meta.url);

describe("Vercel deployment policy", () => {
  it("disables automatic Git deployments only for main", async () => {
    const configText = await readFile(vercelConfigUrl, "utf8");
    const config = JSON.parse(configText) as {
      git?: {
        deploymentEnabled?: boolean | Record<string, boolean>;
      };
    };
    const deploymentEnabled = config.git?.deploymentEnabled;

    expect(deploymentEnabled).not.toBe(false);
    expect(deploymentEnabled).toEqual({ main: false });

    if (!deploymentEnabled || typeof deploymentEnabled === "boolean") {
      throw new Error("Expected a branch-specific deployment policy");
    }

    const disabledBranches = Object.entries(deploymentEnabled)
      .filter(([, enabled]) => enabled === false)
      .map(([branch]) => branch);

    expect(disabledBranches).toEqual(["main"]);
    expect(deploymentEnabled.preview).not.toBe(false);
  });
});
