import rawDataset from "../../../data/program-mappings/v1.json";

import { programmeMappingDatasetSchema } from "../domain/programs";

export const programmeMappingDataset = programmeMappingDatasetSchema.parse(
  rawDataset,
);
