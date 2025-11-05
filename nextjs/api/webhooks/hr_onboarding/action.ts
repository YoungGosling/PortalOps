"use server";

import { triggerHrOnboarding } from "./fetcher";
import type { HrOnboardingRequest } from "./model";

async function triggerHrOnboardingAction(
  data: HrOnboardingRequest,
  apiKey?: string
) {
  return await triggerHrOnboarding(data, apiKey);
}

export { triggerHrOnboardingAction };






