"use client";

import { createOpenAPIPage } from "fumadocs-openapi/ui";

export const OpenAPIPage = createOpenAPIPage({});

// §14.1: /v1/me and /v1/admin only accept the main site's origin, so a Send button here could only ever fail
export const OpenAPIPageNoPlayground = createOpenAPIPage({ playground: { enabled: false } });
