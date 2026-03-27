/// <reference types="vite/client" />

interface ViewTransition {
  ready: Promise<void>
  finished: Promise<void>
}

interface Document {
  startViewTransition?: (callback: () => void) => ViewTransition
}
