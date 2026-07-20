<template>
  <div class="tool-panel privacy-page">
    <header class="tool-hero">
      <h1>Nothing leaves your browser</h1>
      <p>DevYantra has no backend, no telemetry, and no third-party requests. Here is exactly what that means — and how to check it yourself.</p>
    </header>

    <section class="privacy-section" aria-labelledby="how-it-works">
      <h2 id="how-it-works">How it works</h2>
      <p>DevYantra is a static site. When you load a page, your browser downloads HTML, CSS, JavaScript, and font files — and that's the last time the network is involved. There is no server application behind it: nothing to receive your data, nothing to log it.</p>
      <p>Every tool computes its result on your device. Hashing uses your browser's built-in Web Crypto API, formatting and encoding run in your tab, and large text comparisons run in a Web Worker — a background thread that is still inside your browser. The text you paste into a tool is processed in memory on your machine and is never transmitted anywhere.</p>
    </section>

    <section class="privacy-section" aria-labelledby="what-we-dont-do">
      <h2 id="what-we-dont-do">What we don't do</h2>
      <ul>
        <li><strong>No telemetry or analytics.</strong> There is no usage tracking of any kind — no page-view beacons, no error reporting, no product analytics, first-party or otherwise.</li>
        <li><strong>No cookies.</strong> The site sets none. Your tool inputs are kept in your browser's own local storage so they survive a reload, and that data stays on your device.</li>
        <li><strong>No third-party requests.</strong> Fonts are self-hosted and ship with the app, so nothing is fetched from Google Fonts or any CDN. No external scripts, no trackers, no embeds.</li>
        <li><strong>No forms that post anywhere.</strong> The feedback page is a set of plain links to the project's GitHub issues — following one opens GitHub in a new tab; nothing is submitted from this site.</li>
      </ul>
    </section>

    <section class="privacy-section" aria-labelledby="verify-it-yourself">
      <h2 id="verify-it-yourself">Verify it yourself</h2>
      <p>Don't take our word for it — your browser can show you every request a page makes.</p>
      <ol>
        <li>Open your browser's developer tools (<kbd>F12</kbd>, or <kbd>Cmd</kbd>+<kbd>Option</kbd>+<kbd>I</kbd> on macOS) and switch to the <strong>Network</strong> tab.</li>
        <li>Clear the request log.</li>
        <li>Use any tool: paste some text, generate a hash, beautify JSON, run a comparison.</li>
        <li>Watch the Network panel — zero new rows appear. No request leaves your browser while you work.</li>
      </ol>
      <p>This is enforced, not just promised: the site is served with a <code>Content-Security-Policy</code> header that restricts every kind of request — scripts, styles, images, fonts, connections, workers — to the site's own origin. Even if a bug or a compromised dependency tried to send data elsewhere, your browser would block the request before it left.</p>
    </section>

    <section class="privacy-section" aria-labelledby="open-source">
      <h2 id="open-source">Open source</h2>
      <p>The entire application is open source. You can read every line that runs in your browser, audit the claims on this page against the code, or build and host it yourself: <a href="https://github.com/sg-open/devyantra-ui" target="_blank" rel="noopener">github.com/sg-open/devyantra-ui</a>.</p>
    </section>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.privacy-page {
  max-width: 640px;
}

.privacy-section {
  margin-top: var(--space-xl, 2rem);
  color: var(--dt-text-secondary);
  font-size: 0.9rem;
  line-height: 1.6;
}

.privacy-section h2 {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--dt-text-primary);
  margin: 0 0 var(--space-sm, 0.5rem);
}

.privacy-section p {
  margin: 0 0 var(--space-md, 0.75rem);
}

.privacy-section p:last-child {
  margin-bottom: 0;
}

.privacy-section ul,
.privacy-section ol {
  margin: 0 0 var(--space-md, 0.75rem);
  padding-left: 1.5em;
}

.privacy-section li {
  margin-bottom: 0.4em;
}

.privacy-section strong {
  color: var(--dt-text-primary);
  font-weight: 600;
}

.privacy-section code {
  font-family: var(--font-mono);
  font-size: 0.85em;
  background: var(--dt-surface-2);
  border: 1px solid var(--dt-border);
  border-radius: var(--radius-sm, 4px);
  padding: 1px 5px;
  color: var(--dt-text-primary);
}

.privacy-section kbd {
  font-family: var(--font-mono);
  font-size: 0.8em;
  background: var(--dt-surface-2);
  border: 1px solid var(--dt-border);
  border-bottom-width: 2px;
  border-radius: var(--radius-sm, 4px);
  padding: 1px 5px;
  color: var(--dt-text-primary);
}

.privacy-section a {
  color: var(--dt-brand);
  text-decoration: none;
  font-weight: 500;
}

.privacy-section a:hover {
  text-decoration: underline;
}
</style>
