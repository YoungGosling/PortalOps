"use server";

import { triggerHrOffboarding } from "./fetcher";
import type { HrOffboardingRequest } from "./model";

async function triggerHrOffboardingAction(
  data: HrOffboardingRequest,
  apiKey?: string
) {
  return await triggerHrOffboarding(data, apiKey);
}

export { triggerHrOffboardingAction };

