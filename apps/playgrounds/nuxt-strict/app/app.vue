<script setup lang="ts">
import { ref } from "vue";
import { env as clientEnv } from "~~/env/client";

const secretError = ref<string | null>(null);

let dbUrlOnServer = "(Hidden on client)";
if (import.meta.server) {
	const { env } = await import("~~/env/server");
	dbUrlOnServer = env.DATABASE_URL;
}

const tryAccessSecret = async () => {
	try {
		const { env } = await import("~~/env/server");
		alert(`Secret accessed successfully: ${env.DATABASE_URL}`);
	} catch (e) {
		const err = e as Error;
		secretError.value = err.message || String(e);
	}
};
</script>

<template>
  <main style="padding: 40px; font-family: sans-serif; max-width: 600px; margin: 0 auto;">
    <h1>ArkEnv Nuxt Playground (Strict Mode)</h1>
    <p>
      Demonstrating strict-layout auto-extend: <code>env/server.ts</code> omits
      manual <code>extends: [clientEnv]</code>.
    </p>

    <div style="padding: 16px; border: 1px solid #cbd5e1; border-radius: 8px;">
      <h3>SSR Context (Server-only data rendered to HTML)</h3>
      <p>
        <strong>Database URL (SSR):</strong> <code>{{ dbUrlOnServer }}</code>
      </p>
      <p>
        <strong>API URL:</strong> <code>{{ clientEnv.NUXT_PUBLIC_API_URL }}</code>
      </p>
      <p>
        <strong>Node Env:</strong> <code>{{ clientEnv.NODE_ENV }}</code>
      </p>
    </div>

    <div style="margin-top: 24px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h3>Client Context</h3>
      <p>
        <strong>Client Variable:</strong> <code>{{ clientEnv.NUXT_PUBLIC_API_URL }}</code>
      </p>
      <p>
        <strong>Shared Variable:</strong> <code>{{ clientEnv.NODE_ENV }}</code>
      </p>

      <button
        type="button"
        @click="tryAccessSecret"
        style="padding: 8px 16px; background-color: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;"
      >
        Try accessing DATABASE_URL (Secret)
      </button>

      <div
        v-if="secretError"
        style="margin-top: 12px; padding: 8px; background-color: #fee2e2; color: #991b1b; border-radius: 4px;"
      >
        <strong>Blocked Runtime Error:</strong>
        <pre style="white-space: pre-wrap; margin: 4px 0 0 0;">{{ secretError }}</pre>
      </div>
    </div>
  </main>
</template>
