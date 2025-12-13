// vitest.setup.ts
import * as matchers from "@testing-library/jest-dom/matchers";
import { expect } from "vitest";

// Vitest v4 要這樣手動擴充 matchers
expect.extend(matchers);
