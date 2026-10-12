// PDF.js is shipped locally as a browser asset, outside Astro's type checker.
type PdfPage = {
  getViewport: (options: { scale: number }) => { width: number; height: number };
  render: (options: Record<string, unknown>) => { promise: Promise<void> };
  cleanup: () => void;
};
type PdfDocument = {
  numPages: number;
  getPage: (number: number) => Promise<PdfPage>;
  destroy: () => Promise<void>;
};
type PdfLibrary = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (options: Record<string, unknown>) => {
    promise: Promise<PdfDocument>;
    destroy: () => Promise<void>;
  };
};
type Preview = {
  document: PdfDocument;
  urls: Set<string>;
  observer: IntersectionObserver | null;
  closed: boolean;
  queue: Promise<void>;
};

const initialised = new WeakSet<HTMLElement>();

function attachLiveCv(root: HTMLElement) {
  if (initialised.has(root)) return;
  initialised.add(root);
  const pages = root.querySelector<HTMLOListElement>('[data-cv-pages]');
  const message = root.querySelector<HTMLElement>('[data-cv-message]');
  const status = root.querySelector<HTMLElement>('[data-cv-status]');
  const retry = root.querySelector<HTMLButtonElement>('[data-cv-retry]');
  const endpoint = root.dataset['cvEndpoint'];
  const libraryBase = root.dataset['cvPdfjs'];
  if (!pages || !message || !status || !retry || !endpoint || !libraryBase) return;

  const refreshMs = Number(root.dataset['cvRefreshMs']) || 300000;
  let libraryPromise: Promise<PdfLibrary> | null = null;
  let preview: Preview | null = null;
  let currentVersion: string | null = null;
  let lastChecked = 0;
  let inFlight: Promise<void> | null = null;
  let started = false;
  let disposed = false;
  let interval: number | undefined;
  let pendingFetch: AbortController | null = null;

  const release = async (old: Preview | null) => {
    if (!old) return;
    old.closed = true;
    old.observer?.disconnect();
    await old.queue.catch(() => undefined);
    await old.document.destroy();
    old.urls.forEach((url) => URL.revokeObjectURL(url));
  };

  const renderImage = async (document: PdfDocument, number: number, model: Preview) => {
    const page = await document.getPage(number);
    try {
      const normal = page.getViewport({ scale: 1 });
      const width = Math.min(1360, Math.max(720, Math.round(pages.clientWidth * Math.min(devicePixelRatio, 2))));
      const viewport = page.getViewport({ scale: width / normal.width });
      const canvas = window.document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) throw new Error('Canvas rendering is unavailable.');
      await page.render({ canvasContext: context, viewport, background: '#ffffff' }).promise;
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => result ? resolve(result) : reject(new Error('Could not render the CV page.')), 'image/webp', 0.9);
      });
      const image = window.document.createElement('img');
      const url = URL.createObjectURL(blob);
      model.urls.add(url);
      image.src = url;
      image.width = canvas.width;
      image.height = canvas.height;
      image.alt = `Page ${number} of Bodhi McNally's curriculum vitae`;
      image.decoding = 'async';
      await image.decode();
      canvas.width = 0;
      canvas.height = 0;
      return image;
    } finally {
      page.cleanup();
    }
  };

  const showLive = () => {
    root.dataset['cvState'] = 'live';
    message.hidden = true;
    retry.hidden = true;
    status.textContent = 'The latest CV is displayed.';
  };

  const refresh = async (force = false) => {
    if (disposed || inFlight) return inFlight;
    if (!force && Date.now() - lastChecked < refreshMs) return;
    lastChecked = Date.now();
    inFlight = (async () => {
      let candidate: Preview | null = null;
      let loadingTask: ReturnType<PdfLibrary['getDocument']> | null = null;
      const controller = new AbortController();
      pendingFetch = controller;
      const timer = window.setTimeout(() => controller.abort(), 25000);
      try {
        if (!preview) {
          root.dataset['cvState'] = 'loading';
          message.hidden = false;
          retry.hidden = true;
          status.textContent = 'Loading the latest CV…';
        }
        const url = force ? `${endpoint}?refresh=${Date.now()}` : endpoint;
        const response = await fetch(url, { cache: 'no-cache', signal: controller.signal });
        if (!response.ok || !response.headers.get('content-type')?.includes('application/pdf')) {
          throw new Error('The live PDF is unavailable.');
        }
        const version = response.headers.get('etag');
        if (version && version === currentVersion && preview) {
          await response.body?.cancel();
          showLive();
          return;
        }
        const data = new Uint8Array(await response.arrayBuffer());
        if (data.byteLength > 4 * 1024 * 1024) throw new Error('The PDF is too large to preview.');
        libraryPromise ??= import(/* @vite-ignore */ `${libraryBase}pdf.min.mjs`) as Promise<PdfLibrary>;
        const pdfjs = await libraryPromise;
        pdfjs.GlobalWorkerOptions.workerSrc = `${libraryBase}pdf.worker.min.mjs`;
        loadingTask = pdfjs.getDocument({
          data,
          cMapUrl: `${libraryBase}cmaps/`,
          cMapPacked: true,
          standardFontDataUrl: `${libraryBase}standard_fonts/`,
          isEvalSupported: false,
        });
        const document = await loadingTask.promise;
        if (document.numPages < 1 || document.numPages > 30) throw new Error('The PDF must have 1–30 pages.');
        candidate = { document, urls: new Set(), observer: null, closed: false, queue: Promise.resolve() };
        // Render the first page before replacing any saved or previously live pages.
        const firstImage = await renderImage(document, 1, candidate);
        if (disposed) return;
        const model = candidate;
        const slots: HTMLLIElement[] = [];
        for (let number = 1; number <= document.numPages; number += 1) {
          const slot = window.document.createElement('li');
          slot.dataset['cvPage'] = String(number);
          if (number === 1) {
            slot.append(firstImage);
            slot.dataset['cvRendered'] = 'true';
          } else {
            const placeholder = window.document.createElement('div');
            placeholder.className = 'cv-page-placeholder';
            placeholder.style.aspectRatio = `${firstImage.width} / ${firstImage.height}`;
            placeholder.textContent = `Loading page ${number}…`;
            slot.append(placeholder);
          }
          slots.push(slot);
        }
        const old = preview;
        pages.replaceChildren(...slots);
        preview = model;
        candidate = null;
        loadingTask = null;
        currentVersion = version;
        void release(old);
        showLive();

        const enqueue = (slot: HTMLLIElement) => {
          if (slot.dataset['cvQueued'] || slot.dataset['cvRendered']) return;
          slot.dataset['cvQueued'] = 'true';
          model.queue = model.queue.then(async () => {
            if (model.closed) return;
            try {
              const image = await renderImage(model.document, Number(slot.dataset['cvPage']), model);
              if (model.closed) return;
              slot.replaceChildren(image);
              slot.dataset['cvRendered'] = 'true';
            } catch {
              if (model.closed) return;
              const warning = window.document.createElement('p');
              warning.className = 'cv-page-error';
              warning.textContent = 'This page could not be displayed. View the full CV on Google Drive above.';
              slot.replaceChildren(warning);
            }
          });
        };
        if ('IntersectionObserver' in window) {
          model.observer = new IntersectionObserver((entries) => {
            entries.filter((entry) => entry.isIntersecting).forEach((entry) => {
              model.observer?.unobserve(entry.target);
              enqueue(entry.target as HTMLLIElement);
            });
          }, { rootMargin: '600px 0px' });
          slots.slice(1).forEach((slot) => model.observer?.observe(slot));
        } else slots.slice(1).forEach(enqueue);
      } catch {
        if (disposed) return;
        root.dataset['cvState'] = 'fallback';
        message.hidden = false;
        status.textContent = 'Showing the last available preview. View the latest CV on Google Drive above.';
        retry.hidden = false;
        // Import failures should be retryable after a temporary network outage.
        libraryPromise = null;
      } finally {
        window.clearTimeout(timer);
        pendingFetch = null;
        if (candidate) await release(candidate);
        else if (loadingTask) await loadingTask.destroy();
      }
    })().finally(() => { inFlight = null; });
    return inFlight;
  };

  const start = () => {
    if (started) return;
    started = true;
    void refresh();
    interval = window.setInterval(() => {
      if (window.document.visibilityState === 'visible') void refresh();
    }, refreshMs);
  };
  retry.addEventListener('click', () => { void refresh(true); });
  window.document.addEventListener('visibilitychange', () => {
    if (started && window.document.visibilityState === 'visible') void refresh();
  });
  window.addEventListener('pagehide', (event) => {
    if (event.persisted) return;
    disposed = true;
    pendingFetch?.abort();
    window.clearInterval(interval);
    void release(preview);
  });
  if ('IntersectionObserver' in window) {
    const initialObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        initialObserver.disconnect();
        start();
      }
    }, { rootMargin: '700px 0px' });
    initialObserver.observe(root);
  } else start();
}

export function initialiseLiveCv() {
  document.querySelectorAll<HTMLElement>('[data-live-cv]').forEach(attachLiveCv);
}
