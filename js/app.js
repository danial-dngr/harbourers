
    const openPreviews = {};
    let gridMode = false;
    let zIndex = 10;

    const safeStorage = (() => {
      try {
        const testKey = '__dngr_storage_test__';
        window.localStorage.setItem(testKey, '1');
        window.localStorage.removeItem(testKey);
        return window.localStorage;
      } catch (e) {
        const memoryStore = {};
        return {
          getItem: (key) => Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : null,
          setItem: (key, value) => { memoryStore[key] = String(value); },
          removeItem: (key) => { delete memoryStore[key]; },
          clear: () => { Object.keys(memoryStore).forEach((key) => delete memoryStore[key]); }
        };
      }
    })();


    const isMobileView = () => window.matchMedia('(max-width: 800px)').matches;

    const STORAGE_KEYS = {
      free: 'dngrPreviewMemoryV1',
      grid: 'dngrGridMemoryV1'
    };

    const readStore = (key) => {
      try { return JSON.parse(safeStorage.getItem(key) || '{}'); }
      catch(e) { return {}; }
    };

    const writeStore = (key, value) => {
      try { safeStorage.setItem(key, JSON.stringify(value)); }
      catch(e) {}
    };

    const saveFreePreviewState = (project, preview) => {
      if (gridMode || isMobileView()) return;
      const store = readStore(STORAGE_KEYS.free);
      store[project] = {
        top: preview.style.top,
        left: preview.style.left,
        width: preview.style.width,
        height: preview.style.height,
        transform: preview.style.transform,
        expanded: false
      };
      writeStore(STORAGE_KEYS.free, store);
    };

    const applyFreePreviewState = (project, preview) => {
      if (gridMode || isMobileView()) return false;
      const state = readStore(STORAGE_KEYS.free)[project];
      if (!state) return false;
      preview.style.top = state.top || '50%';
      preview.style.left = state.left || '50%';
      preview.style.width = state.width || '600px';
      preview.style.height = state.height || 'auto';
      preview.style.transform = state.transform || 'none';

      return true;
    };

    const saveGridPreviewState = (project, preview) => {
      if (!gridMode || isMobileView()) return;
      const store = readStore(STORAGE_KEYS.grid);
      store[project] = {
        colSpan: preview.dataset.colSpan,
        rowSpan: preview.dataset.rowSpan,
        colStart: preview.dataset.colStart,
        rowStart: preview.dataset.rowStart,
        expanded: false
      };
      writeStore(STORAGE_KEYS.grid, store);
    };

    const getGridPreviewState = (project) => {
      return readStore(STORAGE_KEYS.grid)[project] || null;
    };




    const freeModeSnapshot = {};

    const snapshotFreeModeLayout = () => {
      if (isMobileView()) return;

      Object.keys(openPreviews).forEach((project) => {
        const preview = openPreviews[project];
        if (!preview || preview.classList.contains('in-grid')) return;

        freeModeSnapshot[project] = {
          position: preview.style.position || 'absolute',
          top: preview.style.top || `${preview.offsetTop}px`,
          left: preview.style.left || `${preview.offsetLeft}px`,
          width: preview.style.width || `${preview.offsetWidth}px`,
          height: preview.style.height || preview.style.minHeight || 'auto',
          minHeight: preview.style.minHeight || '',
          maxHeight: preview.style.maxHeight || '',
          transform: preview.style.transform || 'none',
          zIndex: preview.style.zIndex || ''
        };
      });
    };

    const restoreFreeModeLayout = (project, preview) => {
      if (isMobileView()) return false;

      const state = freeModeSnapshot[project];
      if (!state) return false;

      preview.style.position = 'absolute';
      preview.style.top = state.top;
      preview.style.left = state.left;
      preview.style.width = state.width;
      preview.style.height = state.height;
      preview.style.minHeight = state.minHeight;
      preview.style.maxHeight = state.maxHeight;
      preview.style.transform = state.transform || 'none';
      preview.style.zIndex = state.zIndex || `${++zIndex}`;
      preview.style.overflowX = 'hidden';
      preview.style.overflowY = 'auto';

      return true;
    };


    // Theme toggle
    const invertBtn = document.getElementById('invertBtn');
    const savedDarkMode = safeStorage.getItem('darkMode') === 'true';
    if (savedDarkMode) document.body.classList.add('dark-mode');
    invertBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      safeStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    });

    // Grid toggle
    const gridBtn = document.getElementById('gridBtn');
    const gridContainer = document.getElementById('gridContainer');
    const mobileStackContainer = document.getElementById('mobileStackContainer');
    gridBtn.addEventListener('click', () => {
      if (isMobileView()) return;

      const enteringGrid = !gridMode;
      if (enteringGrid) snapshotFreeModeLayout();

      gridMode = enteringGrid;
      gridContainer.classList.toggle('active', gridMode);

      if (gridMode) reorganizePreviewsInGrid();
      else resetPreviewsToAbsolute();
    });

    // Free mode dragging
    const makeDraggable = (element) => {
      let isDragging = false, sx, sy, ex, ey;
      const start = (e) => {
        if (gridMode || isMobileView()) return;

        const target = e.target;
        const isInteractive =
          target.closest('button') ||
          target.closest('.preview-blurb') ||
          target.closest('.preview-image-wrapper') ||
          target.closest('video') ||
          target.closest('img');

        if (isInteractive) return;

        isDragging = true;
        sx = e.touches ? e.touches[0].clientX : e.clientX;
        sy = e.touches ? e.touches[0].clientY : e.clientY;
        ex = element.offsetLeft;
        ey = element.offsetTop;
        element.style.cursor = 'grabbing';
        element.style.zIndex = `${++zIndex}`;
      };
      const move = (e) => {
        if (!isDragging || gridMode || isMobileView()) return;

        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;

        const bounds = getViewportBoundsForFreePreview();
        const rect = element.getBoundingClientRect();

        const width = rect.width || element.offsetWidth || 600;
        const height = rect.height || element.offsetHeight || 360;

        const maxLeft = Math.max(bounds.minX, bounds.maxX - width);
        const maxTop = Math.max(bounds.minY, bounds.maxY - height);

        let nextLeft = ex + (cx - sx);
        let nextTop = ey + (cy - sy);

        nextLeft = Math.max(bounds.minX, Math.min(nextLeft, maxLeft));
        nextTop = Math.max(bounds.minY, Math.min(nextTop, maxTop));

        element.style.left = `${nextLeft}px`;
        element.style.top  = `${nextTop}px`;
        element.style.transform = 'none';
      };
      const stop = () => {
        if (isDragging) constrainFreePreviewToViewport(element);
        if (isDragging && element.dataset.project) saveFreePreviewState(element.dataset.project, element);
        isDragging = false;
        element.style.cursor = gridMode ? 'default' : 'grab';
      };
      element.addEventListener('mousedown', start); element.addEventListener('mousemove', move);
      element.addEventListener('mouseup', stop); element.addEventListener('mouseleave', stop);
      element.addEventListener('touchstart', start, {passive:false});
      element.addEventListener('touchmove', move, {passive:false});
      element.addEventListener('touchend', stop); element.addEventListener('touchcancel', stop);
    };

    // === CMS CONTENT LOADER ===
    // The original HARBOURER preview/grid/drawing engines below are unchanged.
    let projectData = {};

    const escapeCMSHTML = (value='') => String(value)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');

    const cssSafe = (value, fallback='') => String(value ?? fallback).replace(/[<>;]/g,'');

    const styleVarsForSection = (section) => {
      const vars = [];
      const set = (name, value) => { if (value !== undefined && value !== null && value !== '') vars.push(`${name}:${cssSafe(value)}`); };
      set('--cms-width', section.width || '100%');
      set('--cms-max-width', section.maxWidth || 'none');
      set('--cms-mt', `${Number(section.marginTop || 0)}px`);
      set('--cms-mr', `${Number(section.marginRight || 0)}px`);
      set('--cms-mb', `${Number(section.marginBottom ?? 12)}px`);
      set('--cms-ml', `${Number(section.marginLeft || 0)}px`);
      set('--cms-x', `${Number(section.offsetX || 0)}px`);
      set('--cms-y', `${Number(section.offsetY || 0)}px`);
      set('--cms-left', section.left ?? '0%');
      set('--cms-top', typeof section.top === 'number' ? `${section.top}px` : (section.top || '0px'));
      set('--cms-rotate', `${Number(section.rotate || 0)}deg`);
      set('--cms-z', Number(section.zIndex ?? 1));
      set('--cms-opacity', Number(section.opacity ?? 1));
      set('--cms-fit', section.fit || 'contain');
      set('--cms-position', section.objectPosition || '50% 50%');
      set('--cms-font-size', `${Number(section.fontSize || 11)}px`);
      set('--cms-leading', Number(section.leading || 1.4));
      set('--cms-tracking', `${Number(section.tracking ?? .3)}px`);
      set('--cms-text-align', section.textAlign || 'left');
      set('--cms-transform', section.case || 'uppercase');
      set('--cms-columns', Number(section.columns || 1));
      set('--cms-column-gap', `${Number(section.columnGap || 16)}px`);
      set('--cms-overlap', `${Number(section.overlap || -30)}px`);
      set('--cms-marquee-speed', `${Number(section.marqueeSpeed || 12)}s`);
      set('--cms-mobile-width', section.mobileWidth || '100%');
      return vars.join(';');
    };

    const classesForSection = (section) => {
      const c = ['cms-block'];
      const mode = section.layoutMode || 'flow';
      c.push(mode === 'free' ? 'cms-free' : 'cms-flow');
      if (section.fullBleed) c.push('cms-fullbleed');
      if (section.sticky) c.push('cms-sticky');
      if (section.allowOverlap) c.push('cms-overlap');
      if (section.hidden) c.push('cms-hidden');
      c.push('cms-opacity');
      return c.join(' ');
    };

    const blockToLegacyHTML = (section) => {
      if (!section || !section.type) return '';
      if (section.type === 'legacy-html') return section.html || '';

      const cls = classesForSection(section);
      const style = styleVarsForSection(section);
      const styleAttr = style ? ` style="${style}"` : '';

      if (section.type === 'text') {
        const wrap = section.wrap || 'pretty';
        const vertical = section.vertical ? ' vertical' : '';
        if (section.marquee) {
          return `<span class="${cls} cms-text cms-marquee wrap-${wrap}${vertical}"${styleAttr}><span>${escapeCMSHTML(section.text || '')}</span></span>`;
        }
        return `<span class="${cls} cms-text wrap-${wrap}${vertical}"${styleAttr}>${escapeCMSHTML(section.text || '')}</span>`;
      }

      if (section.type === 'spacer') {
        return `<span class="${cls}" style="${style};height:${Number(section.height || 40)}px"></span>`;
      }

      if (section.type === 'embed') {
        return `<span class="${cls} cms-embed"${styleAttr}>${section.html || ''}</span>`;
      }

      const floatClass = section.float === 'left' ? ' float-left' : section.float === 'right' ? ' float-right' : '';
      const shapeClass = section.shape ? ` shape-${section.shape}` : '';

      if (section.type === 'image' || section.type === 'svg') {
        if (section.type === 'svg' && section.code) {
          return `<span class="${cls} cms-inline-svg${floatClass}${shapeClass}"${styleAttr}>${section.code}</span>`;
        }
        return `<img class="${cls} cms-media cms-media-object${floatClass}${shapeClass}" src="${escapeCMSHTML(section.src || '')}" alt="${escapeCMSHTML(section.alt || '')}"${styleAttr}>`;
      }

      if (section.type === 'video') {
        return `<video class="${cls} cms-media cms-media-object" src="${escapeCMSHTML(section.src || '')}" controls loop muted playsinline ${section.autoplay === false ? '' : 'autoplay'}${styleAttr}></video>`;
      }

      if (section.type === 'lottie') {
        return `<lottie-player class="${cls} cms-lottie${floatClass}${shapeClass}" src="${escapeCMSHTML(section.src || '')}" background="transparent" speed="${Number(section.speed || 1)}" ${section.loop === false ? '' : 'loop'} ${section.autoplay === false ? '' : 'autoplay'}${styleAttr}></lottie-player>`;
      }
      return '';
    };

    const compileProjectToLegacyShape = (project) => {
      const sections = Array.isArray(project.sections) ? project.sections : [];
      const primaryIndex = sections.findIndex((s) =>
        s && ['image','svg','video'].includes(s.type) &&
        (s.role === 'primary' || !s.float || s.float === 'none')
      );

      const primary = primaryIndex >= 0 ? sections[primaryIndex] : null;
      const image = primary?.src || '';

      const remaining = sections.filter((_, index) => index !== primaryIndex);
      const blurb = remaining.map(blockToLegacyHTML).join('') + '<span class="cms-clear"></span>';

      return {
        ...project,
        image,
        blurb: blurb || 'DETAILS COMING SOON.'
      };
    };

    const populateProjectMenu = (projects) => {
      const projectList = document.getElementById('projectList');
      if (!projectList) return;
      projectList.innerHTML = '';

      projects
        .filter((project) => project.published !== false)
        .sort((a,b) => Number(a.order || 0) - Number(b.order || 0))
        .forEach((project, index) => {
          const item = document.createElement('li');
          item.dataset.project = project.name;
          item.dataset.category = project.category || 'PROJECTS';
          const number = project.number || String(index + 1).padStart(2,'0');
          item.innerHTML = `<span>${escapeCMSHTML(number)}</span>${escapeCMSHTML(project.menuLabel || project.name)}`;
          projectList.appendChild(item);
        });
    };

    const bindCMSProjectClicks = () => {
      document.querySelectorAll('#projectList li[data-project]').forEach((item) => {
        item.addEventListener('click', () => {
          const project = item.getAttribute('data-project');
          createPreviewContainer(project);
        });
      });
    };

    const loadCMSContent = async () => {
      const response = await fetch('content/projects.json', {cache:'no-store'});
      if (!response.ok) throw new Error(`projects.json returned ${response.status}`);

      const manifest = await response.json();
      const slugs = Array.isArray(manifest.projects) ? manifest.projects : [];

      const loaded = await Promise.all(
        slugs.map(async (slug, index) => {
          try {
            const projectResponse = await fetch(`content/projects/${encodeURIComponent(slug)}.json`, {cache:'no-store'});
            if (!projectResponse.ok) throw new Error(`HTTP ${projectResponse.status}`);

            const project = await projectResponse.json();
            return {
              ...project,
              id: project.id || slug,
              order: index + 1,
              number: String(index + 1).padStart(2, '0')
            };
          } catch (error) {
            console.error(`HARBOURERS: could not load project "${slug}"`, error);
            return null;
          }
        })
      );

      const projects = loaded.filter(Boolean);

      projectData = Object.fromEntries(
        projects.map((project) => [project.name, compileProjectToLegacyShape(project)])
      );

      populateProjectMenu(projects);
      bindCMSProjectClicks();
      requestAnimationFrame(updateProjectMenuHeading);
    };


    /* === Helpers === */
    const getGridMetrics = () => {
      const styles = getComputedStyle(gridContainer);
      const root = getComputedStyle(document.documentElement);
      const cols = parseInt(root.getPropertyValue('--swiss-columns')) || 12;
      const gap = parseFloat(styles.gap || styles.columnGap || '15') || 15;
      const rect = gridContainer.getBoundingClientRect();
      const colWidth = (rect.width - gap * (cols - 1)) / cols;
      const rh = parseFloat(root.getPropertyValue('--swiss-row')) || 12;
      const effCol = colWidth + gap;
      const effRow = rh + gap;
      const containerHeight = rect.height;
      return { cols, gap, colWidth, rh, effCol, effRow, containerHeight };
    };

    const autoSizeRowSpan = (preview, minRows=1) => {
      if (!gridMode) return;
      const { rh, gap } = getGridMetrics();
      const h = preview.getBoundingClientRect().height;
      const rows = Math.max(minRows, Math.round((h + gap) / (rh + gap)));
      preview.dataset.rowSpan = String(rows);
      preview.style.gridRow = `span ${rows}`;
    };

    const createMediaEl = (src, alt) => {
      const isVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(src);
      if (isVideo) {
        const v = document.createElement('video');
        v.src = src; v.controls = true; v.loop = true; v.muted = true; v.playsInline = true; v.autoplay = true;
        v.setAttribute('aria-label', alt || 'Project video'); v.preload = 'metadata';
        return v;
      } else {
        const img = document.createElement('img');
        img.src = src; img.alt = alt || 'Project image'; img.loading = 'lazy'; img.draggable = false;
        return img;
      }
    };

    const ensureAutoSizeOnMediaLoad = (preview, minRows=1) => {
      const imgs = preview.querySelectorAll('img');
      const vids = preview.querySelectorAll('video');
      const fit = () => autoSizeRowSpan(preview, minRows);

      imgs.forEach(img => img.complete ? fit() : img.addEventListener('load', fit, {once:true}));
      vids.forEach(v => (v.readyState >= 2) ? fit() : v.addEventListener('loadeddata', fit, {once:true}));

      if (window.ResizeObserver) {
        if (preview._ro) { try { preview._ro.disconnect(); } catch(e){} }
        const ro = new ResizeObserver(() => { if (gridMode) autoSizeRowSpan(preview, minRows); });
        ro.observe(preview);
        preview._ro = ro;
      }
    };

    const approxSpansFromPixels = (pxWidth, pxHeight) => {
      const { cols, effCol, effRow } = getGridMetrics();
      const colSpan = Math.min(cols, Math.max(1, Math.round(pxWidth / effCol)));
      const rowSpan = Math.max(1, Math.round(pxHeight / effRow));
      return { colSpan, rowSpan };
    };

    const getRandomGridSizeForMedia = (src) => {
      const sizes = [
        { colSpan: 2, rowSpan: 18 },
        { colSpan: 3, rowSpan: 20 },
        { colSpan: 3, rowSpan: 23 },
        { colSpan: 4, rowSpan: 21 },
        { colSpan: 4, rowSpan: 24 },
        { colSpan: 5, rowSpan: 26 }
      ];

      const wideSizes = [
        { colSpan: 4, rowSpan: 16 },
        { colSpan: 5, rowSpan: 18 },
        { colSpan: 5, rowSpan: 20 }
      ];

      const tallSizes = [
        { colSpan: 2, rowSpan: 26 },
        { colSpan: 3, rowSpan: 29 },
        { colSpan: 3, rowSpan: 32 }
      ];

      const videoSizes = [
        { colSpan: 4, rowSpan: 22 },
        { colSpan: 5, rowSpan: 24 },
        { colSpan: 5, rowSpan: 26 }
      ];

      const source = (src || '').toLowerCase();
      const isVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(source);

      const isWide =
        source.includes('front') ||
        source.includes('screen') ||
        source.includes('screenshot') ||
        source.includes('landscape') ||
        source.includes('wide') ||
        source.includes('holding') ||
        source.includes('built');

      const isTall =
        source.includes('portrait') ||
        source.includes('poster') ||
        source.includes('vertical');

      if (isVideo) return videoSizes[Math.floor(Math.random() * videoSizes.length)];
      if (isWide) return wideSizes[Math.floor(Math.random() * wideSizes.length)];
      if (isTall) return tallSizes[Math.floor(Math.random() * tallSizes.length)];

      return sizes[Math.floor(Math.random() * sizes.length)];
    };

    const addGridResizer = (preview) => {
      if (preview.querySelector('.grid-resize')) return;
      const handle = document.createElement('div');
      handle.className = 'grid-resize';
      preview.appendChild(handle);

      const onDown = (e) => {
        if (!gridMode) return;
        e.preventDefault();
        const start = e.touches ? e.touches[0] : e;
        const startX = start.clientX, startY = start.clientY;
        const { cols, effCol, effRow } = getGridMetrics();
        let startColSpan = parseInt(preview.dataset.colSpan || '1', 10);
        let startRowSpan = parseInt(preview.dataset.rowSpan || '1', 10);

        const onMove = (ev) => {
          if (!gridMode) return;
          const p = ev.touches ? ev.touches[0] : ev;
          const dx = p.clientX - startX, dy = p.clientY - startY;

          let newCol = Math.round((startColSpan * effCol + dx) / effCol);
          let newRow = Math.round((startRowSpan * effRow + dy) / effRow);

          const minRows = Math.max(1, Math.ceil(350 / effRow)); /* enforce 350px min */
          newCol = Math.max(1, Math.min(cols, newCol));
          newRow = Math.max(minRows, newRow);

          preview.dataset.colSpan = String(newCol);
          preview.dataset.rowSpan = String(newRow);
          preview.style.gridColumn = `span ${newCol}`;
          preview.style.gridRow = `span ${newRow}`;
        };

        const onUp = () => {
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup', onUp);
          window.removeEventListener('touchmove', onMove);
          window.removeEventListener('touchend', onUp);
          window.removeEventListener('touchcancel', onUp);
          const { effRow } = getGridMetrics();
          autoSizeRowSpan(preview, Math.max(1, Math.ceil(350/effRow)));
          if (preview.dataset.project) saveGridPreviewState(preview.dataset.project, preview);
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        window.addEventListener('touchmove', onMove, {passive:false});
        window.addEventListener('touchend', onUp);
        window.addEventListener('touchcancel', onUp);
      };

      handle.addEventListener('mousedown', onDown);
      handle.addEventListener('touchstart', onDown, {passive:false});
    };

    const makeGridMovable = (preview) => {
      const onDown = (e) => {
        if (!gridMode) return;
        if (e.target && e.target.classList.contains('grid-resize')) return;
        e.preventDefault(); e.stopPropagation();

        const start = e.touches ? e.touches[0] : e;
        const { cols, effCol, effRow } = getGridMetrics();
        const rect = gridContainer.getBoundingClientRect();
        const colSpan = parseInt(preview.dataset.colSpan || '1', 10);
        const rowSpan = parseInt(preview.dataset.rowSpan || '1', 10);
        preview.classList.add('dragging');

        const onMove = (ev) => {
          if (!gridMode) return;
          const p = ev.touches ? ev.touches[0] : ev;
          const x = p.clientX - rect.left;
          const y = p.clientY - rect.top;
          let colStart = Math.floor(x / effCol) + 1;
          let rowStart = Math.floor(y / effRow) + 1;
          colStart = Math.max(1, Math.min(cols - colSpan + 1, colStart));
          rowStart = Math.max(1, rowStart);
          preview.dataset.colStart = String(colStart);
          preview.dataset.rowStart = String(rowStart);
          preview.style.gridColumn = `${colStart} / span ${colSpan}`;
          preview.style.gridRow = `${rowStart} / span ${rowSpan}`;
        };

        const onUp = () => {
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup', onUp);
          window.removeEventListener('touchmove', onMove);
          window.removeEventListener('touchend', onUp);
          window.removeEventListener('touchcancel', onUp);
          preview.classList.remove('dragging');
          const { effRow } = getGridMetrics();
          autoSizeRowSpan(preview, Math.max(1, Math.ceil(350/effRow)));
          if (preview.dataset.project) saveGridPreviewState(preview.dataset.project, preview);
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        window.addEventListener('touchmove', onMove, {passive:false});
        window.addEventListener('touchend', onUp);
        window.addEventListener('touchcancel', onUp);
      };

      preview.addEventListener('mousedown', onDown);
      preview.addEventListener('touchstart', onDown, {passive:false});
    };

    const reorganizePreviewsInGrid = () => {
      gridContainer.innerHTML = '';
      const keys = Object.keys(openPreviews);
      const count = keys.length;
      const { cols, effRow, containerHeight } = getGridMetrics();
      const minRows = Math.max(1, Math.ceil(350 / effRow)); /* 350px min */

      keys.forEach((project) => {
        const preview = openPreviews[project];
        gridContainer.appendChild(preview);

        preview.classList.add('in-grid');
        preview.style.position = 'relative';
        preview.style.transform = 'none';
        preview.style.top = 'auto';
        preview.style.left = 'auto';
        preview.style.width = '100%';
        preview.style.height = 'auto';

        let colSpan, rowSpan;
        if (count === 1) {
          colSpan = cols;
          rowSpan = Math.max(minRows, Math.ceil(containerHeight / effRow));
        } else {
          const media = preview.querySelector('img, video');
          const src = media ? media.getAttribute('src') : '';
          const randomSize = getRandomGridSizeForMedia(src);

          colSpan = Math.min(cols, randomSize.colSpan);
          rowSpan = Math.max(minRows, randomSize.rowSpan);
        }

        const savedGridState = getGridPreviewState(project);
        if (savedGridState) {
          colSpan = parseInt(savedGridState.colSpan || colSpan, 10);
          rowSpan = parseInt(savedGridState.rowSpan || rowSpan, 10);
        }

        preview.dataset.colSpan = String(colSpan);
        preview.dataset.rowSpan = String(rowSpan);

        if (savedGridState && savedGridState.colStart && savedGridState.rowStart) {
          preview.dataset.colStart = savedGridState.colStart;
          preview.dataset.rowStart = savedGridState.rowStart;
          preview.style.gridColumn = `${savedGridState.colStart} / span ${colSpan}`;
          preview.style.gridRow = `${savedGridState.rowStart} / span ${rowSpan}`;
        } else {
          preview.style.gridColumn = `span ${colSpan}`;
          preview.style.gridRow = `span ${rowSpan}`;
        }

        addGridResizer(preview);
        makeGridMovable(preview);

        requestAnimationFrame(() => {
          ensureAutoSizeOnMediaLoad(preview, minRows);
          autoSizeRowSpan(preview, minRows);
        });
      });
    };

    const resetPreviewsToAbsolute = () => {
      Object.keys(openPreviews).forEach((project) => {
        const preview = openPreviews[project];
        if (preview._ro) { try { preview._ro.disconnect(); } catch(e){} delete preview._ro; }
        const h = preview.querySelector('.grid-resize');
        if (h) h.remove();
        preview.classList.remove('in-grid', 'dragging');

        document.body.appendChild(preview);
        preview.style.gridColumn = 'auto';
        preview.style.gridRow = 'auto';

        const restoredSnapshot = restoreFreeModeLayout(project, preview);

        if (!restoredSnapshot) {
          preview.style.position = 'absolute';
          preview.style.top = '50%';
          preview.style.left = '50%';
          preview.style.transform = 'translate(-50%, -50%)';
          preview.style.width = '600px';
          preview.style.height = 'auto';
        }
      });
    };


    const getViewportBoundsForFreePreview = () => {
      const margin = 20;
      const headerBottom = 80;
      const footerTop = window.innerHeight * 0.8 - 10;

      return {
        margin,
        minX: margin,
        minY: headerBottom,
        maxX: Math.max(margin, window.innerWidth - margin),
        maxY: Math.max(headerBottom + 260, footerTop)
      };
    };

    const getInitialFreePreviewSize = (src) => {
      const source = (src || '').toLowerCase();
      const isVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(source);

      const isWide =
        source.includes('front') ||
        source.includes('screen') ||
        source.includes('screenshot') ||
        source.includes('landscape') ||
        source.includes('wide') ||
        source.includes('holding') ||
        source.includes('built');

      const isTall =
        source.includes('portrait') ||
        source.includes('poster') ||
        source.includes('vertical');

      const maxWidth = Math.max(260, Math.min(760, window.innerWidth - 40));

      if (isVideo) return { width: Math.min(640, maxWidth), minHeight: 360 };
      if (isWide) return { width: Math.min(720, maxWidth), minHeight: 340 };
      if (isTall) return { width: Math.min(460, maxWidth), minHeight: 500 };

      return { width: Math.min(560 + Math.round(Math.random() * 120), maxWidth), minHeight: 360 };
    };

    const constrainFreePreviewToViewport = (preview) => {
      if (gridMode || isMobileView()) return;

      const bounds = getViewportBoundsForFreePreview();
      const rect = preview.getBoundingClientRect();

      let left = preview.offsetLeft;
      let top = preview.offsetTop;

      const width = rect.width || parseFloat(preview.style.width) || 600;
      const usableHeight = Math.max(260, bounds.maxY - bounds.minY);
      const height = Math.min(rect.height || 360, usableHeight);

      preview.style.maxHeight = `${usableHeight}px`;
      preview.style.overflowY = 'auto';
      preview.style.overflowX = 'hidden';

      const maxLeft = Math.max(bounds.minX, bounds.maxX - width);
      const maxTop = Math.max(bounds.minY, bounds.maxY - height);

      left = Math.max(bounds.minX, Math.min(left, maxLeft));
      top = Math.max(bounds.minY, Math.min(top, maxTop));

      preview.style.left = `${left}px`;
      preview.style.top = `${top}px`;
      preview.style.transform = 'none';
    };

    const placeFreePreviewRandomly = (project, preview, data) => {
      if (gridMode || isMobileView()) return;

      const remembered = applyFreePreviewState(project, preview);
      if (remembered) {
        constrainFreePreviewToViewport(preview);
        return;
      }

      const size = getInitialFreePreviewSize(data.image);
      const bounds = getViewportBoundsForFreePreview();

      const usableHeight = Math.max(260, bounds.maxY - bounds.minY);

      preview.style.width = `${size.width}px`;
      preview.style.minHeight = `${Math.min(size.minHeight, usableHeight)}px`;
      preview.style.maxHeight = `${usableHeight}px`;
      preview.style.height = 'auto';
      preview.style.overflowY = 'auto';
      preview.style.overflowX = 'hidden';
      preview.style.transform = 'none';

      const approxHeight = Math.min(Math.max(size.minHeight, 320), Math.max(320, bounds.maxY - bounds.minY));
      const maxLeft = Math.max(bounds.minX, bounds.maxX - size.width);
      const maxTop = Math.max(bounds.minY, bounds.maxY - approxHeight);

      const left = bounds.minX + Math.round(Math.random() * Math.max(0, maxLeft - bounds.minX));
      const top = bounds.minY + Math.round(Math.random() * Math.max(0, maxTop - bounds.minY));

      preview.style.left = `${left}px`;
      preview.style.top = `${top}px`;
    };

    const createPreviewContainer = (project) => {
      const data = projectData[project] || { image: '', blurb: 'DETAILS COMING SOON.' };

      if (openPreviews[project]) {
        const p = openPreviews[project];

        if (isMobileView()) {
          p.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (!gridMode) {
          p.style.top = '50%';
          p.style.left = '50%';
          p.style.transform = 'translate(-50%, -50%)';
        }

        return;
      }

      const preview = document.createElement('div');
      preview.className = 'preview';
      preview.dataset.project = project;
      preview.style.top = '50%';
      preview.style.left = '50%';
      preview.style.transform = 'translate(-50%, -50%)';
      preview.style.zIndex = `${++zIndex}`;

      // Title above media (as requested)
      preview.innerHTML = `
        <div class="preview-header">
          <div class="preview-title">${project}</div>
          <button class="close-button" title="Close"></button>
        </div>
        <div class="preview-image-wrapper"></div>
        <p class="preview-blurb">${data.blurb}</p>
      `;

      const mediaWrap = preview.querySelector('.preview-image-wrapper');
      mediaWrap.appendChild(createMediaEl(data.image, `${project} Media`));

      preview.addEventListener('wheel', (e) => {
        if (!gridMode && !isMobileView()) {
          e.stopPropagation();
        }
      }, { passive: true });
preview.querySelector('.close-button').addEventListener('click', () => {
        if (preview._ro) { try { preview._ro.disconnect(); } catch(e){} delete preview._ro; }
        if (preview._freeRO) { try { preview._freeRO.disconnect(); } catch(e){} delete preview._freeRO; }
        preview.remove();
        delete openPreviews[project];
        const activeItemToRemove = document.querySelector(`#projectList li[data-project="${CSS.escape(project)}"]`);
        if (activeItemToRemove) activeItemToRemove.classList.remove('is-active');
        const activeItem = document.querySelector(`#projectList li[data-project="${CSS.escape(project)}"]`);
        if (activeItem) activeItem.classList.remove('is-active');
      });

      makeDraggable(preview);

      if (gridMode) {
        gridContainer.appendChild(preview);
        preview.classList.add('in-grid');

        // Determine if this will be the only one open
        const countBefore = Object.keys(openPreviews).length; // number already open (before adding this)
        const { cols, effRow, containerHeight } = getGridMetrics();
        const minRows = Math.max(1, Math.ceil(350 / effRow));

        let colSpan, rowSpan;
        if (countBefore === 0) {
          // This is the only one → fill the viewable area
          colSpan = cols;
          rowSpan = Math.max(minRows, Math.ceil(containerHeight / effRow));
          preview.style.transform = 'translate(0,0)';
        } else {
          // Otherwise open where it fits, with randomized sizing reduced to roughly 70%
          const randomSize = getRandomGridSizeForMedia(data.image);

          colSpan = Math.min(cols, randomSize.colSpan);
          rowSpan = Math.max(minRows, randomSize.rowSpan);
        }

        const savedGridState = getGridPreviewState(project);
        if (savedGridState) {
          colSpan = parseInt(savedGridState.colSpan || colSpan, 10);
          rowSpan = parseInt(savedGridState.rowSpan || rowSpan, 10);
        }

        preview.dataset.colSpan = String(colSpan);
        preview.dataset.rowSpan = String(rowSpan);

        if (savedGridState && savedGridState.colStart && savedGridState.rowStart) {
          preview.dataset.colStart = savedGridState.colStart;
          preview.dataset.rowStart = savedGridState.rowStart;
          preview.style.gridColumn = `${savedGridState.colStart} / span ${colSpan}`;
          preview.style.gridRow = `${savedGridState.rowStart} / span ${rowSpan}`;
        } else {
          preview.style.gridColumn = `span ${colSpan}`;
          preview.style.gridRow = `span ${rowSpan}`;
        }

        addGridResizer(preview);
        makeGridMovable(preview);

        ensureAutoSizeOnMediaLoad(preview, minRows);
        requestAnimationFrame(() => autoSizeRowSpan(preview, minRows));
      } else if (isMobileView()) {
        mobileStackContainer.appendChild(preview);
        requestAnimationFrame(() => {
          preview.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      } else {
        document.body.appendChild(preview);
        placeFreePreviewRandomly(project, preview, data);

        if (window.ResizeObserver) {
          const freeRO = new ResizeObserver(() => {
            constrainFreePreviewToViewport(preview);
            saveFreePreviewState(project, preview);
          });
          freeRO.observe(preview);
          preview._freeRO = freeRO;
        }
      }

      openPreviews[project] = preview;
      const activeItem = document.querySelector(`#projectList li[data-project="${CSS.escape(project)}"]`);
      if (activeItem) activeItem.classList.add('is-active');
};



    const closeAllPreviews = () => {
      Object.keys(openPreviews).forEach((project) => {
        const preview = openPreviews[project];
        if (!preview) return;

        if (preview._ro) {
          try { preview._ro.disconnect(); } catch(e) {}
          delete preview._ro;
        }

        if (preview._freeRO) {
          try { preview._freeRO.disconnect(); } catch(e) {}
          delete preview._freeRO;
        }

        preview.remove();
        delete openPreviews[project];
      });

      document.querySelectorAll('#projectList li.is-active').forEach((item) => {
        item.classList.remove('is-active');
      });
    };

    const updateProjectMenuHeading = () => {
      const list = document.getElementById('projectList');
      const heading = document.getElementById('projectMenuHeading');
      if (!list || !heading) return;

      if (list.scrollTop < 4) {
        heading.textContent = 'PROJECTS';
        return;
      }

      const items = Array.from(list.querySelectorAll('li[data-project]'));
      if (!items.length) {
        heading.textContent = 'PROJECTS';
        return;
      }

      const listTop = list.getBoundingClientRect().top;
      let active = items[0];

      for (const item of items) {
        const rect = item.getBoundingClientRect();
        if (rect.top <= listTop + 10) {
          active = item;
        } else {
          break;
        }
      }

      heading.textContent = (active.dataset.category || 'PROJECTS').toUpperCase();
    };

    const initialiseMenuControls = () => {
      const closeAllBtn = document.getElementById('closeAllBtn');
      const projectListEl = document.getElementById('projectList');

      if (closeAllBtn) {
        closeAllBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          closeAllPreviews();
        };
      }

      if (projectListEl) {
        projectListEl.addEventListener('scroll', updateProjectMenuHeading, { passive: true });
        projectListEl.addEventListener('wheel', () => requestAnimationFrame(updateProjectMenuHeading), { passive: true });
        projectListEl.addEventListener('touchmove', () => requestAnimationFrame(updateProjectMenuHeading), { passive: true });
        requestAnimationFrame(updateProjectMenuHeading);
      }
    };

    initialiseMenuControls();
    loadCMSContent().catch((error) => {
      console.error('HARBOURERS CMS content failed to load:', error);
      const heading = document.getElementById('projectMenuHeading');
      if (heading) heading.textContent = 'CONTENT ERROR';
    });
    // project clicks are bound after CMS content loads


    // Refit on resize in grid
    window.addEventListener('resize', () => {
      if (!gridMode) {
        Object.values(openPreviews).forEach(p => constrainFreePreviewToViewport(p));
        return;
      }

      const { effRow } = getGridMetrics();
      const minRows = Math.max(1, Math.ceil(350 / effRow));
      Object.values(openPreviews).forEach(p => autoSizeRowSpan(p, minRows));
    });

    // Prevent image ghost dragging
    document.addEventListener('dragstart', (e) => {
      if (e.target && e.target.tagName === 'IMG') e.preventDefault();
    });


    /* === Final repair: drawing/contact === */
    const setupContactPanel = () => {
      const overlay=document.getElementById('contactPanel'), toggle=document.getElementById('contactToggleBtn'), close=document.getElementById('closeContactBtn'), canvas=document.getElementById('contactCanvas');
      const status=document.getElementById('contactStatus'), clearBtn=document.getElementById('clearDrawingBtn'), downloadBtn=document.getElementById('downloadDrawingBtn'), sendBtn=document.getElementById('sendContactBtn'), undoBtn=document.getElementById('undoDrawingBtn'), redoBtn=document.getElementById('redoDrawingBtn');
      const captionInput=document.getElementById('drawingCaption'), captionPreview=document.getElementById('drawingCaptionPreview'), yearEl=document.getElementById('copyrightYear');
      const tools=document.querySelectorAll('.draw-tool'), swatches=document.querySelectorAll('.colour-swatch');
      if(yearEl) yearEl.textContent=new Date().getFullYear();
      if(!overlay||!toggle||!canvas) return;
      const ctx=canvas.getContext('2d',{willReadFrequently:true}); let drawing=false, tool='pen', colour='#111111', last=null; const undoStack=[], redoStack=[], MAX_HISTORY=30;
      const setStatus=t=>{if(!status)return;status.textContent=t;clearTimeout(setStatus._timer);setStatus._timer=setTimeout(()=>status.textContent='',2200)};
      const saveHistory=()=>{try{undoStack.push(ctx.getImageData(0,0,canvas.width,canvas.height));if(undoStack.length>MAX_HISTORY)undoStack.shift();redoStack.length=0}catch(e){}};
      const seedCanvas=(record=false)=>{if(record)saveHistory();ctx.fillStyle='#f4f0e5';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='rgba(0,0,0,.06)';for(let x=0;x<canvas.width;x+=8){for(let y=0;y<canvas.height;y+=8){ctx.beginPath();ctx.arc(x+Math.random()*1.5,y+Math.random()*1.5,.8,0,Math.PI*2);ctx.fill();}}};
      const undoDrawing=()=>{if(!undoStack.length)return setStatus('NOTHING TO UNDO');redoStack.push(ctx.getImageData(0,0,canvas.width,canvas.height));ctx.putImageData(undoStack.pop(),0,0);setStatus('UNDO')};
      const redoDrawing=()=>{if(!redoStack.length)return setStatus('NOTHING TO REDO');undoStack.push(ctx.getImageData(0,0,canvas.width,canvas.height));ctx.putImageData(redoStack.pop(),0,0);setStatus('REDO')};
      const drawCaptionToCanvas=()=>{const text=(captionInput?.value||'').trim().toUpperCase();if(!text)return;ctx.save();ctx.font='14px monospace';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillStyle='rgba(0,0,0,.68)';ctx.fillText(text.slice(0,90),canvas.width/2,canvas.height-18);ctx.restore()};
      const getPoint=e=>{const r=canvas.getBoundingClientRect(),s=e.touches?e.touches[0]:e;return{x:Math.floor(((s.clientX-r.left)/r.width)*canvas.width),y:Math.floor(((s.clientY-r.top)/r.height)*canvas.height)}};
      const hexToRgba=h=>{const c=h.replace('#','');return[parseInt(c.slice(0,2),16),parseInt(c.slice(2,4),16),parseInt(c.slice(4,6),16),255]};
      const floodFill=(x,y,fillHex)=>{if(x<0||y<0||x>=canvas.width||y>=canvas.height)return;saveHistory();const img=ctx.getImageData(0,0,canvas.width,canvas.height),data=img.data,w=canvas.width,h=canvas.height,start=(y*w+x)*4,target=[data[start],data[start+1],data[start+2],data[start+3]],fill=hexToRgba(fillHex),tol=42;const same=i=>(Math.abs(data[i]-target[0])+Math.abs(data[i+1]-target[1])+Math.abs(data[i+2]-target[2])+Math.abs(data[i+3]-target[3]))<=tol;const stack=[[x,y]],seen=new Uint8Array(w*h);while(stack.length){const [px,py]=stack.pop();if(px<0||py<0||px>=w||py>=h)continue;const p=py*w+px;if(seen[p])continue;seen[p]=1;const i=p*4;if(!same(i))continue;data[i]=fill[0];data[i+1]=fill[1];data[i+2]=fill[2];data[i+3]=255;stack.push([px+1,py],[px-1,py],[px,py+1],[px,py-1]);}ctx.putImageData(img,0,0);setStatus('FILLED')};
      const drawTo=p=>{if(!last){last=p;return}ctx.save();ctx.globalCompositeOperation='source-over';ctx.strokeStyle=tool==='eraser'?'#f4f0e5':colour;ctx.lineWidth=tool==='eraser'?22:5.6;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(p.x,p.y);ctx.stroke();if(tool==='pen'){ctx.fillStyle='rgba(0,0,0,.18)';for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(p.x+(Math.random()-.5)*16,p.y+(Math.random()-.5)*16,Math.random()*1.4,0,Math.PI*2);ctx.fill();}}ctx.restore();last=p};
      const startDrawing=e=>{e.preventDefault();const p=getPoint(e);if(tool==='fill'){floodFill(p.x,p.y,colour);return}saveHistory();drawing=true;last=p};
      const moveDrawing=e=>{if(!drawing)return;e.preventDefault();drawTo(getPoint(e))}; const stopDrawing=()=>{drawing=false;last=null};
      toggle.addEventListener('click',()=>{overlay.classList.toggle('active');toggle.classList.toggle('active',overlay.classList.contains('active'))}); close?.addEventListener('click',()=>{overlay.classList.remove('active');toggle.classList.remove('active')});
      tools.forEach(b=>b.addEventListener('click',()=>{tool=b.dataset.tool;tools.forEach(x=>x.classList.toggle('active',x===b))})); swatches.forEach(b=>b.addEventListener('click',()=>{colour=b.dataset.colour;swatches.forEach(x=>x.classList.toggle('active',x===b))}));
      captionInput?.addEventListener('input',()=>{if(captionPreview)captionPreview.textContent=captionInput.value}); clearBtn?.addEventListener('click',()=>{seedCanvas(true);setStatus('DRAWING CLEARED')}); undoBtn?.addEventListener('click',undoDrawing); redoBtn?.addEventListener('click',redoDrawing);
      downloadBtn?.addEventListener('click',()=>{saveHistory();drawCaptionToCanvas();const a=document.createElement('a');a.download='harbourer-contact-drawing.png';a.href=canvas.toDataURL('image/png');a.click();setStatus('DRAWING SAVED')});
      sendBtn?.addEventListener('click',()=>{saveHistory();drawCaptionToCanvas();const name=document.getElementById('contactName')?.value||'',email=document.getElementById('contactEmail')?.value||'',message=document.getElementById('contactMessage')?.value||'',caption=captionInput?.value||'';const subject=encodeURIComponent(`HARBOURER CONTACT — ${name||'NEW MESSAGE'}`);const body=encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}\n\nDrawing Caption:\n${caption}\n\nDrawing:\nPlease attach the saved PNG drawing.`);window.location.href=`mailto:danial@dngrgoods.com?subject=${subject}&body=${body}`;setStatus('EMAIL PREPARED')});
      canvas.addEventListener('mousedown',startDrawing);canvas.addEventListener('mousemove',moveDrawing);window.addEventListener('mouseup',stopDrawing);canvas.addEventListener('touchstart',startDrawing,{passive:false});canvas.addEventListener('touchmove',moveDrawing,{passive:false});canvas.addEventListener('touchend',stopDrawing);canvas.addEventListener('touchcancel',stopDrawing);seedCanvas(false);
    };


    // Centre text reel: intentionally simple half-line steps.
    const centreReel = document.getElementById('centreReel');
    const centreReelTrack = document.getElementById('centreReelTrack');
    if (centreReel && centreReelTrack) {
      let reelStep = 0;
      const originalLineCount = Math.floor(centreReelTrack.children.length / 2);
      const tickReel = () => {
        const firstLine = centreReelTrack.firstElementChild;
        if (!firstLine) return;
        const lineHeight = firstLine.getBoundingClientRect().height || 24;
        reelStep += 0.5;
        centreReelTrack.style.transform = `translateY(${-reelStep * lineHeight}px)`;
        if (reelStep >= originalLineCount) {
          setTimeout(() => {
            centreReelTrack.style.transition = 'none';
            reelStep = 0;
            centreReelTrack.style.transform = 'translateY(0)';
            requestAnimationFrame(() => requestAnimationFrame(() => {
              centreReelTrack.style.transition = '';
            }));
          }, 90);
        }
      };
      setInterval(tickReel, 430);
    }

    setupContactPanel();

  