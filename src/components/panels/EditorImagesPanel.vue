<template>
  <div
    v-if="open"
    data-avnac-chrome
    class="pointer-events-auto fixed z-40 flex w-[min(100vw-1.5rem,340px)] max-h-[min(92dvh,720px)] flex-col overflow-hidden rounded-3xl border border-black/[0.08] bg-white/95 backdrop-blur-md"
    :style="panelStyle"
    role="dialog"
    aria-label="Images"
  >
    <!-- Header -->
    <div class="flex shrink-0 items-start justify-between border-b border-black/[0.06] px-3 py-2">
      <div class="min-w-0">
        <div class="text-sm font-semibold text-neutral-800">Images</div>
        <p class="mt-0.5 text-[11px] text-neutral-500">
          <a
            :href="unsplashReferralLink('https://unsplash.com/')"
            target="_blank"
            rel="noreferrer"
            class="text-neutral-600 underline-offset-2 hover:underline"
          >
            Powered by Unsplash
          </a>
        </p>
      </div>
      <button
        type="button"
        class="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-600 hover:bg-black/[0.06]"
        aria-label="Close images"
        @click="emit('close')"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <!-- Search + grid -->
    <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div class="shrink-0 border-b border-black/[0.06] p-2">
        <label class="relative block">
          <span class="sr-only">Search Unsplash</span>
          <svg class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            v-model="input"
            type="search"
            placeholder="Search Unsplash…"
            autocomplete="off"
            class="h-10 w-full rounded-xl border border-black/[0.08] bg-white pl-9 pr-3 text-[13px] text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/45"
          />
        </label>
        <div class="mt-2 grid grid-cols-[1fr_auto] gap-2">
          <input
            v-model="manualUrl"
            type="url"
            placeholder="Paste image URL"
            class="h-9 rounded-xl border border-black/[0.08] bg-white px-3 text-[12px] text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/45"
            @keydown.enter.prevent="addManualUrl"
          />
          <button
            type="button"
            class="rounded-xl border border-black/[0.08] bg-neutral-900 px-3 text-[12px] font-semibold text-white disabled:opacity-40"
            :disabled="addingManual"
            @click="addManualUrl"
          >Add</button>
        </div>
        <button
          type="button"
          class="mt-2 flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-black/[0.14] bg-neutral-50 text-[12px] font-medium text-neutral-700 hover:bg-neutral-100"
          @click="pickLocalFile"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
          </svg>
          Upload from device
        </button>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto p-2">
        <p v-if="error" class="px-1 py-2 text-[12px] text-red-600">{{ error }}</p>
        <p v-if="error" class="px-1 pb-2 text-[12px] leading-snug text-neutral-500">
          You can still upload from your device or paste a direct image URL above.
        </p>

        <p v-if="photos.length === 0 && !loading && !error" class="px-1 py-6 text-center text-[12px] text-neutral-500">
          No photos found.
        </p>

        <ul v-else class="grid grid-cols-2 gap-2">
          <li v-for="photo in photos" :key="photo.id">
            <button
              type="button"
              :disabled="addingId === photo.id"
              class="group flex w-full flex-col overflow-hidden rounded-xl border border-black/[0.06] bg-white text-left transition-colors hover:border-black/[0.12] disabled:opacity-60"
              @click="addPhoto(photo)"
            >
              <span class="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
                <img
                  :src="photo.urls.small"
                  :alt="photo.description ?? photo.alt_description ?? 'Unsplash photo'"
                  loading="lazy"
                  class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                />
                <span v-if="addingId === photo.id" class="absolute inset-0 flex items-center justify-center bg-black/35 text-[11px] font-medium text-white">
                  Adding…
                </span>
              </span>
              <span class="border-t border-black/[0.06] px-1.5 py-1.5">
                <span class="line-clamp-2 text-[10.5px] leading-snug text-neutral-600">
                  <a
                    :href="unsplashReferralLink(photo.user.links.html)"
                    target="_blank"
                    rel="noreferrer"
                    class="font-medium text-neutral-800 underline-offset-2 hover:underline"
                    @click.stop
                  >{{ photo.user.name }}</a>
                  <span class="text-neutral-400"> on </span>
                  <a
                    :href="unsplashReferralLink('https://unsplash.com/')"
                    target="_blank"
                    rel="noreferrer"
                    class="underline-offset-2 hover:underline"
                    @click.stop
                  >Unsplash</a>
                </span>
              </span>
            </button>
          </li>
        </ul>

        <div v-if="hasMore && photos.length > 0" class="p-2 pt-1">
          <button
            type="button"
            :disabled="loadingMore"
            class="w-full rounded-xl border border-black/[0.08] bg-[var(--surface-subtle)] px-3 py-2 text-[12px] font-medium text-neutral-800 transition-colors hover:bg-black/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
            @click="loadMore"
          >
            {{ loadingMore ? 'Loading…' : 'Load more' }}
          </button>
        </div>

        <p v-if="loading && photos.length === 0" class="py-8 text-center text-[12px] text-neutral-500">Loading…</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { UnsplashPhoto } from '#/lib/unsplash-api'
import {
  fetchUnsplashPopular,
  fetchUnsplashSearch,
  scaleUnsplashToPlaceBox,
  trackUnsplashDownload,
  UNSPLASH_PLACE_MAX_EDGE_PX,
} from '#/lib/unsplash-api'

const DEBOUNCE_MS = 380

const props = defineProps<{
  open: boolean
  panelLeft?: string
  panelTop?: string
  onAddImageFromUrl?: (opts: { url: string; origin: 'center'; width: number; height: number }) => Promise<boolean | null>
  onAddImageFromFile?: (file: File) => void
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const panelStyle = computed(() => ({
  left: props.panelLeft ?? '4rem',
  top: props.panelTop ?? '4rem',
}))

const input = ref('')
const committedQ = ref('')
const page = ref(1)
const photos = ref<UnsplashPhoto[]>([])
const hasMore = ref(false)
const loading = ref(false)
const loadingMore = ref(false)
const error = ref<string | null>(null)
const addingId = ref<string | null>(null)
const manualUrl = ref('')
const addingManual = ref(false)

let debounceTimer: ReturnType<typeof setTimeout> | null = null
let currentFetch: { cancelled: boolean } | null = null

watch(input, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    const next = input.value.trim()
    if (next !== committedQ.value) {
      committedQ.value = next
      page.value = 1
    }
  }, DEBOUNCE_MS)
})

async function runFetch() {
  if (!props.open) return
  const token = { cancelled: false }
  currentFetch = token

  const pg = page.value
  const q = committedQ.value

  if (pg === 1) loading.value = true
  else loadingMore.value = true
  error.value = null

  const res = q.length === 0
    ? await fetchUnsplashPopular(pg)
    : await fetchUnsplashSearch(q, pg)

  if (token.cancelled) return

  if (res.error) {
    error.value = res.error
    loading.value = false
    loadingMore.value = false
    return
  }

  photos.value = pg === 1 ? res.photos : [...photos.value, ...res.photos]
  hasMore.value = res.hasMore
  loading.value = false
  loadingMore.value = false
}

watch([() => props.open, committedQ, page], ([open]) => {
  if (!open) return
  if (currentFetch) currentFetch.cancelled = true
  void runFetch()
}, { immediate: true })

watch(() => props.open, (open) => {
  if (!open) {
    input.value = ''
    committedQ.value = ''
    page.value = 1
    photos.value = []
    hasMore.value = false
    error.value = null
    addingId.value = null
    if (currentFetch) currentFetch.cancelled = true
  }
})

function loadMore() {
  page.value++
}

function unsplashReferralLink(absoluteUrl: string): string {
  try {
    const u = new URL(absoluteUrl)
    u.searchParams.set('utm_source', 'avnac')
    u.searchParams.set('utm_medium', 'referral')
    return u.toString()
  } catch {
    return absoluteUrl
  }
}

async function addPhoto(photo: UnsplashPhoto) {
  addingId.value = photo.id
  error.value = null
  try {
    try {
      await trackUnsplashDownload(photo.links.download_location)
    } catch {
      // placement still allowed
    }
    const { width, height } = scaleUnsplashToPlaceBox(photo.width, photo.height, UNSPLASH_PLACE_MAX_EDGE_PX)
    if (props.onAddImageFromUrl) {
      const ok = await props.onAddImageFromUrl({ url: photo.urls.regular, origin: 'center', width, height })
      if (!ok) {
        error.value = 'Could not add this image to the canvas.'
        return
      }
    }
    emit('close')
  } finally {
    addingId.value = null
  }
}

async function addManualUrl() {
  const url = manualUrl.value.trim()
  if (!url || !props.onAddImageFromUrl) return
  addingManual.value = true
  error.value = null
  try {
    const ok = await props.onAddImageFromUrl({ url, origin: 'center', width: 900, height: 600 })
    if (!ok) {
      error.value = 'Could not load that image. Download it and use upload if the host blocks cross-origin image access.'
      return
    }
    manualUrl.value = ''
    emit('close')
  } finally {
    addingManual.value = false
  }
}

function pickLocalFile() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = () => {
    const file = input.files?.[0]
    if (!file) return
    props.onAddImageFromFile?.(file)
    emit('close')
  }
  input.click()
}
</script>
