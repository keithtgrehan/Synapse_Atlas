import rawDataset from "../../../data/program-mappings/v2.json";

import { programmeMappingDatasetSchema } from "../domain/programs";

export const programmeMappingDataset = programmeMappingDatasetSchema.parse(
  rawDataset,
);
