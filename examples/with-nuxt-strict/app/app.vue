<script setup lang="ts">
import { env as clientEnv } from "~~/env/client";

const { data: health } = await useFetch("/api/health");
</script>

<template>
  <main style="padding: 40px; font-family: sans-serif; max-width: 600px; margin: 0 auto;">
    <h1>ArkEnv Nuxt Playground (Strict Mode)</h1>
    <p>
      Demonstrating strict-layout auto-extend: <code>env/server.ts</code> omits
      manual <code>extends: [clientEnv]</code>. Server validation runs at build
      time via the module, and the health endpoint reads shared env through the
      auto-extended server env.
    </p>

    <div style="padding: 16px; border: 1px solid #cbd5e1; border-radius: 8px;">
      <h3>Client Context</h3>
      <p>
        <strong>API URL:</strong> <code>{{ clientEnv.NUXT_PUBLIC_API_URL }}</code>
      </p>
      <p>
        <strong>Node Env:</strong> <code>{{ clientEnv.NODE_ENV }}</code>
      </p>
    </div>

    <div style="padding: 16px; border: 1px solid #cbd5e1; border-radius: 8px; margin-top: 16px;">
      <h3>Server Health</h3>
      <p>
        <strong>Status:</strong> <code>{{ health?.status }}</code>
      </p>
      <p>
        <strong>Environment:</strong> <code>{{ health?.environment }}</code>
      </p>
      <p>
        <strong>Database configured:</strong>
        <code>{{ health?.databaseConfigured }}</code>
      </p>
    </div>
  </main>
</template>
