<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useConfigState } from './composables/useConfigState'
import { useJsonGenerator } from './composables/useJsonGenerator'
import { useDiffTracker } from './composables/useDiffTracker'
import { useManifestLoader } from './composables/useManifestLoader'
import JsonInput from './components/JsonInput.vue'
import ModuleList from './components/ModuleList.vue'
import PlatformConfig from './components/PlatformConfig.vue'
import JsonOutput from './components/JsonOutput.vue'
import DiffPreview from './components/DiffPreview.vue'
import ThemeToggle from './components/ThemeToggle.vue'
import GitHubTokenSetting from './components/GitHubTokenSetting.vue'
import ToastContainer from './components/ToastContainer.vue'
import SkeletonLoader from './components/SkeletonLoader.vue'
import { useToast } from './composables/useToast'
import { highlightJson } from './utils/jsonHighlight'

const { config, originalConfig, shouldSortModules, parseConfig, updateModule, updatePlatform, resetToOriginal } = useConfigState()
const { generateJson, copyToClipboard } = useJsonGenerator()
const { changes } = useDiffTracker(config, originalConfig)
const { isLoading, error, manifestUrl, fetchManifest, loadFromHistory, clearManifestUrl, getInitialUrl } = useManifestLoader()
const { addToast } = useToast()

const moduleListRef = ref<InstanceType<typeof ModuleList> | null>(null)
const platformConfigRef = ref<InstanceType<typeof PlatformConfig> | null>(null)

const json = computed(() => generateJson(config.value, shouldSortModules.value))
const jsonHtml = computed(() => highlightJson(json.value))

const hasInvalidInputs = computed(() =>
  moduleListRef.value?.hasInvalidInputs || platformConfigRef.value?.hasInvalidInputs
)

const initialUrl = getInitialUrl()
if (initialUrl) {
  fetchManifest(initialUrl).then(text => {
    if (text) parseConfig(text)
  })
}

const scrollToFirstInvalidInput = () => {
  if (platformConfigRef.value?.hasInvalidInputs) {
    platformConfigRef.value.scrollToFirstInvalidInput()
  } else if (moduleListRef.value?.hasInvalidInputs) {
    moduleListRef.value.scrollToFirstInvalidInput()
  }
}

const scrollToModule = (moduleId: string) => {
  const el = document.querySelector(`[data-module-id="${moduleId.trim()}"]`) as HTMLElement
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('highlight')
    setTimeout(() => el.classList.remove('highlight'), 2000)
  }
}

const handleJsonSubmit = (text: string) => parseConfig(text)
async function handleUrlSubmit(url: string) {
  const text = await fetchManifest(url)
  if (text) parseConfig(text)
}
async function handleHistoryClick(url: string) {
  const text = await loadFromHistory(url)
  if (text) parseConfig(text)
}
const showScrollTop = ref(false)
const showScrollBottom = ref(false)
const onScroll = () => {
  showScrollTop.value = window.scrollY > 300
  showScrollBottom.value = window.scrollY + window.innerHeight < document.body.scrollHeight - 300
}
onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
const scrollToBottom = () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })

const handleBack = () => {
  config.value = null
  originalConfig.value = null
  clearManifestUrl()
}
// Easter egg: click logo 7 times
const logoClicks = ref(0)
const logoParty = ref(false)
watch(logoClicks, (n) => {
  if (n >= 7) {
    logoParty.value = true
    addToast('🎉 Party mode activated!', 'success')
    spawnConfetti()
    spawnFireworks()
    setTimeout(() => {
      logoParty.value = false
      logoClicks.value = 0
    }, 4000)
  }
})

function spawnConfetti() {
  const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6fcf', '#845ef7', '#ff922b']
  const shapes = ['●', '■', '▲', '★', '♦', '❤']
  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div')
    const color = colors[Math.floor(Math.random() * colors.length)]
    const shape = shapes[Math.floor(Math.random() * shapes.length)]
    const x = 10 + Math.random() * 80
    const drift = (Math.random() - 0.5) * 400
    const duration = 2500 + Math.random() * 2000
    const delay = Math.random() * 600
    const spin = Math.random() * 1080 - 540
    Object.assign(el.style, {
      position: 'fixed',
      top: '-30px',
      left: `${x}%`,
      fontSize: `${14 + Math.random() * 18}px`,
      color,
      pointerEvents: 'none',
      zIndex: '99999',
    })
    el.textContent = shape
    document.body.appendChild(el)
    const anim = el.animate([
      { transform: 'translateX(0) translateY(0) rotate(0deg)', opacity: 1 },
      { transform: `translateX(${drift * 0.3}px) translateY(35vh) rotate(${spin * 0.3}deg)`, opacity: 1, offset: 0.3 },
      { transform: `translateX(${drift}px) translateY(110vh) rotate(${spin}deg)`, opacity: 0 },
    ], { duration, delay, easing: 'ease-in', fill: 'forwards' })
    anim.onfinish = () => el.remove()
  }
}

function spawnFireworks() {
  const colors = ['#ff2d2d', '#ffcc00', '#00e676', '#2979ff', '#ff4081', '#7c4dff', '#ff6d00']
  const bursts = [
    { x: 15, y: 30, delay: 0 },
    { x: 75, y: 20, delay: 300 },
    { x: 40, y: 15, delay: 600 },
    { x: 90, y: 35, delay: 900 },
    { x: 25, y: 22, delay: 1200 },
    { x: 60, y: 12, delay: 1500 },
    { x: 50, y: 28, delay: 1800 },
  ]
  bursts.forEach(({ x, y, delay }) => {
    setTimeout(() => {
      const color = colors[Math.floor(Math.random() * colors.length)]
      // Flash
      const flash = document.createElement('div')
      Object.assign(flash.style, {
        position: 'fixed',
        left: `${x}%`,
        top: `${y}%`,
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: '#fff',
        boxShadow: `0 0 30px 15px ${color}, 0 0 60px 30px ${color}80`,
        pointerEvents: 'none',
        zIndex: '99999',
        transform: 'translate(-50%, -50%)',
      })
      document.body.appendChild(flash)
      flash.animate([
        { transform: 'translate(-50%, -50%) scale(1)', opacity: '1' },
        { transform: 'translate(-50%, -50%) scale(3)', opacity: '0' },
      ], { duration: 400, fill: 'forwards' }).onfinish = () => flash.remove()

      // Sparks
      for (let i = 0; i < 36; i++) {
        const spark = document.createElement('div')
        const angle = (i / 36) * 360 + (Math.random() - 0.5) * 10
        const dist = 80 + Math.random() * 120
        const dx = Math.cos(angle * Math.PI / 180) * dist
        const dy = Math.sin(angle * Math.PI / 180) * dist + 30 // gravity
        const size = 3 + Math.random() * 4
        Object.assign(spark.style, {
          position: 'fixed',
          left: `${x}%`,
          top: `${y}%`,
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          background: i % 3 === 0 ? '#fff' : color,
          boxShadow: `0 0 ${size * 2}px ${color}, 0 0 ${size * 4}px ${color}80`,
          pointerEvents: 'none',
          zIndex: '99999',
          transform: 'translate(-50%, -50%)',
        })
        document.body.appendChild(spark)
        spark.animate([
          { transform: 'translate(-50%, -50%) scale(1)', opacity: '1' },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy * 0.5}px)) scale(0.8)`, opacity: '1', offset: 0.4 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0)`, opacity: '0' },
        ], { duration: 1000 + Math.random() * 500, easing: 'cubic-bezier(0, 0.9, 0.3, 1)', fill: 'forwards' })
          .onfinish = () => spark.remove()
      }
    }, delay)
  })
}

const copyState = ref<'idle' | 'success' | 'shake'>('idle')
const handleCopy = async () => {
  const ok = await copyToClipboard(json.value)
  if (ok) {
    copyState.value = 'success'
    setTimeout(() => {
      copyState.value = 'shake'
      setTimeout(() => { copyState.value = 'idle' }, 500)
    }, 1200)
  } else {
    addToast('Failed to copy', 'error')
  }
}
</script>

<template>
  <div class="app">
    <header class="app-header">
      <div class="header-left">
        <button v-if="config" class="back-button" @click="handleBack">Back</button>
        <img src="./assets/logo.png" alt="" class="app-logo" :class="{ party: logoParty }" @click="logoClicks++" />
        <h1>Module Configuration Manager</h1>
      </div>
      <div class="header-right">
        <ThemeToggle />
      </div>
    </header>

    <SkeletonLoader v-if="isLoading && !config" />

    <div v-else-if="!config" class="json-input-container">
      <JsonInput
        v-model:sort-modules="shouldSortModules"
        :is-loading="isLoading"
        :error="error"
        @submit="handleJsonSubmit"
        @fetch-url="handleUrlSubmit"
        @history-click="handleHistoryClick"
      />
    </div>

    <template v-else>
      <div v-if="manifestUrl" class="manifest-url-bar">
        <a :href="manifestUrl" target="_blank" rel="noopener noreferrer">{{ manifestUrl }}</a>
      </div>
      <div class="main-layout">
        <div class="config-column">
          <PlatformConfig ref="platformConfigRef" :config="config" @update="updatePlatform" />
          <ModuleList ref="moduleListRef" :config="config" :original-config="originalConfig" :sort-enabled="shouldSortModules" @module-update="updateModule" />
        </div>
        <div class="sidebar">
          <div class="sidebar-actions">
            <button class="action-button" popovertarget="json-preview">Preview</button>
            <button class="reset-button" :disabled="!changes.length" @click="resetToOriginal">Reset</button>
            <span class="spacer"></span>
            <button class="copy-button" :class="{ copied: copyState === 'success', shake: copyState === 'shake' }" @click="handleCopy">
              {{ copyState === 'success' ? 'Copied!' : 'Copy JSON' }}
            </button>
          </div>
          <button
            v-if="hasInvalidInputs"
            class="sidebar-error"
            @click="scrollToFirstInvalidInput"
          >Some fields have invalid values <small>(click to locate)</small></button>
          <DiffPreview
            :changes="changes"
            @scroll-to-module="scrollToModule"
          />
          <GitHubTokenSetting />
        </div>
      </div>
    </template>

    <!-- JSON Preview Popover -->
    <div id="json-preview" popover class="preview-popover">
      <div class="popover-content">
        <pre v-html="jsonHtml"></pre>
      </div>
    </div>

    <div class="scroll-buttons">
      <button v-if="showScrollTop" class="scroll-btn" @click="scrollToTop" title="Scroll to top">&uarr;</button>
      <button v-if="showScrollBottom" class="scroll-btn" @click="scrollToBottom" title="Scroll to bottom">&darr;</button>
    </div>
    <ToastContainer />
  </div>
</template>

<style scoped>
.app {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 20px 12px;
  box-sizing: border-box;
  container-type: inline-size;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-logo {
  width: 36px;
  height: 36px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.app-logo:active {
  transform: scale(0.85);
}

.app-logo.party {
  animation: logo-party 3s ease-in-out;
}

@keyframes logo-party {
  0% { transform: scale(1) rotate(0deg); filter: hue-rotate(0deg) drop-shadow(0 0 0 transparent); }
  5% { transform: scale(2) rotate(0deg); filter: hue-rotate(0deg) drop-shadow(0 0 20px #ff6b6b); }
  10% { transform: scale(1.8) rotate(360deg); filter: hue-rotate(60deg) drop-shadow(0 0 15px #ffd93d); }
  20% { transform: scale(1.5) rotate(-180deg); filter: hue-rotate(120deg) drop-shadow(0 0 20px #6bcb77); }
  30% { transform: scale(2.2) rotate(540deg); filter: hue-rotate(180deg) drop-shadow(0 0 25px #4d96ff); }
  40% { transform: scale(1.3) rotate(-360deg); filter: hue-rotate(240deg) drop-shadow(0 0 15px #ff6fcf); }
  50% { transform: scale(2.5) rotate(720deg); filter: hue-rotate(300deg) brightness(1.4) drop-shadow(0 0 30px #845ef7); }
  60% { transform: scale(1.6) rotate(-540deg); filter: hue-rotate(360deg) drop-shadow(0 0 20px #ff922b); }
  70% { transform: scale(2) rotate(900deg); filter: hue-rotate(180deg) drop-shadow(0 0 25px #ff6b6b); }
  80% { transform: scale(1.4) rotate(-720deg); filter: hue-rotate(90deg) drop-shadow(0 0 15px #ffd93d); }
  90% { transform: scale(1.2) rotate(1080deg); filter: hue-rotate(30deg) drop-shadow(0 0 8px #6bcb77); }
  100% { transform: scale(1) rotate(1080deg); filter: hue-rotate(0deg) drop-shadow(0 0 0 transparent); }
}


h1 {
  color: var(--text-on-app);
  font-size: 28px;
  font-weight: 600;
}

.back-button, .action-button {
  background: transparent;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  padding: 6px 12px;
  transition: all var(--transition-fast);
}

.back-button:hover, .action-button:hover {
  background: var(--surface-tertiary);
}

.error-button {
  color: var(--error-text);
  border-color: var(--error-border);
}

.error-button:hover {
  background: var(--error-bg);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reset-button {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid var(--error-border);
  border-radius: var(--radius-sm);
  color: var(--error-text);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.reset-button:hover {
  background: var(--error-bg);
}

.manifest-url-bar {
  margin-bottom: 16px;
  padding: 8px 14px;
  background: var(--surface-secondary);
  border-radius: var(--radius-sm);
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.manifest-url-bar a {
  color: var(--link);
  text-decoration: none;
  font-family: monospace;
}

.manifest-url-bar a:hover {
  color: var(--link-hover);
  text-decoration: underline;
}

.json-input-container {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
}

.main-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
  align-items: start;
}

.config-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sidebar {
  position: sticky;
  top: 20px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sidebar-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  overflow: clip;
  padding: 4px 0;
}

.sidebar-actions .spacer {
  flex: 1;
}

.copy-button {
  padding: 6px 12px;
  min-width: 90px;
  text-align: center;
  background: var(--primary);
  color: var(--text-on-primary);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.copy-button:hover {
  background: var(--primary-hover);
}

.copy-button.copied {
  background: var(--success);
  animation: copy-pop 0.6s ease;
}

@keyframes copy-pop {
  0% { transform: translateY(0); box-shadow: 0 0 0 0 var(--success); }
  20% { transform: translateY(-4px); box-shadow: 0 0 0 4px var(--success); }
  40% { transform: translateY(2px); box-shadow: 0 0 0 8px transparent; }
  55% { transform: translateY(-1px); }
  70% { transform: translateY(1px); }
  100% { transform: translateY(0); box-shadow: none; }
}

.copy-button.shake {
  animation: copy-shake 0.4s ease;
}

@keyframes copy-shake {
  0%, 100% { transform: translate(0, 0) rotate(0); }
  15% { transform: translate(-2px, 1px) rotate(-2deg); }
  30% { transform: translate(2px, -1px) rotate(2deg); }
  45% { transform: translate(-1px, 0) rotate(-1deg); }
  60% { transform: translate(1px, 1px) rotate(1deg); }
  80% { transform: translate(-1px, 0) rotate(-0.5deg); }
}

.sidebar-error {
  width: 100%;
  padding: 8px 12px;
  background: var(--error-bg);
  border: 1px solid var(--error-border);
  border-radius: var(--radius-sm);
  color: var(--error-text);
  font-size: 13px;
  cursor: pointer;
  text-align: left;
  transition: all var(--transition-fast);
}

.sidebar-error:hover {
  background: var(--error-bg-hover);
  border-color: var(--error);
}

.sidebar-error small {
  opacity: 0.7;
}

/* Popover */
.preview-popover {
  margin: auto;
  padding: 0;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--surface-card);
  box-shadow: var(--shadow-md);
  width: min(90vw, 800px);
  height: min(85vh, 800px);
  overflow: hidden;
}

.preview-popover::backdrop {
  background: rgba(0, 0, 0, 0.4);
}

.popover-content {
  height: 100%;
  overflow: auto;
  padding: 20px;
}

.popover-content pre {
  margin: 0;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

.popover-content :deep(.json-key) { color: var(--json-key); }
.popover-content :deep(.json-string) { color: var(--json-string); }
.popover-content :deep(.json-number) { color: var(--json-number); }
.popover-content :deep(.json-bool) { color: var(--json-bool); }
.popover-content :deep(.json-punct) { color: var(--text-tertiary); }

@keyframes highlight {
  0% { background-color: transparent; }
  20% { background-color: var(--warning-bg); }
  80% { background-color: var(--warning-bg); }
  100% { background-color: transparent; }
}

:deep(.highlight) {
  animation: highlight 2s ease-in-out;
}

.scroll-buttons {
  position: fixed;
  bottom: 24px;
  right: calc(50% - 660px);
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 50;
}

.scroll-btn {
  padding: 8px 12px;
  background: var(--surface-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.scroll-btn:hover {
  background: var(--surface-tertiary);
  color: var(--text-primary);
}

@media (max-width: 1380px) {
  .scroll-buttons {
    right: 12px;
  }
}

/* Responsive: stack layout when container is narrow */
@container (max-width: 800px) {
  .main-layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
    max-height: none;
  }

  .app-header {
    flex-wrap: wrap;
    gap: 8px;
  }

  h1 {
    font-size: 20px;
  }

  .json-input-container {
    max-width: 100%;
  }
}

@container (max-width: 500px) {
  .app {
    padding: 12px;
  }

  .app-header {
    margin-bottom: 16px;
  }
}
</style>
