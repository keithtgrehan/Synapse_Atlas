import { loadSnapshotCatalogue } from "../../lib/snapshots/catalogue";
import { loadCatalogueManifest, validateCollectionMembership } from "../../lib/catalogue/load";
import { CatalogueWorkspace } from "./workspace";
import { Suspense } from "react";
export const metadata = { title: "Trial catalogue · Synapse Atlas" };
export default async function CataloguePage() {
  const [catalogue, manifest] = await Promise.all([loadSnapshotCatalogue(), loadCatalogueManifest()]);
  validateCollectionMembership(manifest, catalogue);
  return <Suspense fallback={<main id="main-content" className="shell"><p role="status">Loading the saved catalogue…</p></main>}><CatalogueWorkspace catalogue={catalogue} manifest={manifest} /></Suspense>;
}
