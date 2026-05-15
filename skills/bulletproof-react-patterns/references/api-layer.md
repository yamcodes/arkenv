# API Layer

## Single API Client Instance

Use a single, pre-configured API client instance throughout the application. This can be built with the native fetch API or libraries like axios, graphql-request, or apollo-client.

```typescript
// src/lib/api-client.ts
import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const message = error.response?.data?.message || error.message;
        // Trigger notification toast
        // Log out on 401
        return Promise.reject(error);
    },
);

export { api };
```

## Request Declaration Pattern

Every API request declaration consists of:

1. **Types and validation schemas** for request and response data
2. **A fetcher function** that calls an endpoint using the API client
3. **A hook** that consumes the fetcher via react-query, swr, etc.

### Query Example

```typescript
// features/discussions/api/get-discussions.ts
import { useQuery, type QueryConfig } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

type Discussion = {
    id: string;
    title: string;
    body: string;
    createdAt: string;
};

type GetDiscussionsParams = {
    teamId: string;
};

function getDiscussions(params: GetDiscussionsParams): Promise<Discussion[]> {
    return api.get("/discussions", { params });
}

type UseDiscussionsOptions = {
    params: GetDiscussionsParams;
    queryConfig?: QueryConfig<typeof getDiscussions>;
};

export function useDiscussions({ params, queryConfig }: UseDiscussionsOptions) {
    return useQuery({
        queryKey: ["discussions", params],
        queryFn: () => getDiscussions(params),
        ...queryConfig,
    });
}
```

### Mutation Example

```typescript
// features/discussions/api/create-discussion.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

type CreateDiscussionInput = {
    title: string;
    body: string;
    teamId: string;
};

function createDiscussion(data: CreateDiscussionInput): Promise<Discussion> {
    return api.post("/discussions", data);
}

export function useCreateDiscussion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createDiscussion,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["discussions"] });
        },
    });
}
```

## File Organization

```
features/users/api/
├── get-users.ts       # useUsers query hook + API function
├── get-user.ts        # useUser query hook + API function
├── create-user.ts     # useCreateUser mutation hook + API function
├── update-user.ts     # useUpdateUser mutation hook + API function
└── index.ts           # re-exports all hooks
```

In some cases it may be more practical to keep shared API calls in a dedicated top-level `api/` folder rather than inside features.

## Key Principles

- Keep API functions pure — they return promises with no framework dependencies.
- Type all responses and infer types down the application for type safety.
- Handle errors centrally in the API client via interceptors.
- Colocate API declarations with the features that use them.
