import { z } from "zod";

import { lessonSchema } from "../src/features/italian-corner/academy/lesson-schema.ts";

process.stdout.write(
  `${JSON.stringify(z.toJSONSchema(lessonSchema), null, 2)}\n`,
);
