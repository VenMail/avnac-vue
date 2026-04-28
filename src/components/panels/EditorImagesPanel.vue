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
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto p-2">
        <p v-if="error" class="px-1 py-2 text-[12px] text-red-600">{{ error }}</p>

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
</script>
