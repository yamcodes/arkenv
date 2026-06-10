<script setup lang="ts">
import { ref } from "vue";
import { env } from "./env";

const secretError = ref<string | null>(null);
const dbUrlOnServer = process.server ? env.DATABASE_URL : "(Hidden on client)";

const tryAccessSecret = () => {
	try {
		// This should throw a runtime error on the client
		const dbUrl = env.DATABASE_URL;
		alert(`Secret accessed successfully: ${dbUrl}`);
	} catch (e: any) {
		secretError.value = e.message || String(e);
	}
};
</script>

<template>
  <main style="padding: 40px; font-family: sans-serif; max-width: 600px; margin: 0 auto;">
    <h1>ArkEnv Nuxt Playground</h1>
    <p>
      Demonstrating compile-time and runtime validation for Nuxt environment variables.
    </p>

    <!-- SSR Context -->
    <div style="padding: 16px; border: 1px solid #cbd5e1; border-radius: 8px;">
      <h3>SSR Context (Server-only data rendered to HTML)</h3>
      <p>
        <strong>Database URL (SSR):</strong> <code>{{ dbUrlOnServer }}</code>
      </p>
      <p>
        <strong>API URL:</strong> <code>{{ env.NUXT_PUBLIC_API_URL }}</code>
      </p>
      <p>
        <strong>Node Env:</strong> <code>{{ env.NODE_ENV }}</code>
      </p>
    </div>

    <!-- Client Interactive Context -->
    <div style="margin-top: 24px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h3>Client Context</h3>
      <p>
        <strong>Client Variable:</strong> <code>{{ env.NUXT_PUBLIC_API_URL }}</code>
      </p>
      <p>
        <strong>Shared Variable:</strong> <code>{{ env.NODE_ENV }}</code>
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
