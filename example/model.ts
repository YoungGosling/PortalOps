import { z } from "zod";

export const TagSchema = z.object({
    id: z.string(),
    tag: z.string(),
    slug: z.string(),
});

export const ApplicationWithEnrollmentSchema = z.object({
    id: z.string(),
    name: z.string(),
    url: z.string(),
    custom_url: z.string().nullable(),
    description: z.string(),
    logo: z.string(),
    tags: z.array(TagSchema),
    created_at: z.string(),
    updated_at: z.string(),
});

export const ApplicationWithEnrollmentResponseSchema = z.object({
    applications: z.array(ApplicationWithEnrollmentSchema),
    total_page: z.number(),
    page: z.number(),
    page_size: z.number(),
});

export type ApplicationWithEnrollment = z.infer<typeof ApplicationWithEnrollmentSchema>;