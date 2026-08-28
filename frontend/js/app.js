(() => {
  const saved = JSON.parse(localStorage.getItem('astralink-state') || '{}');
  const state = {
    locked: saved.locked ?? true,
    lights: saved.lights ?? false,
    fuelPrice: saved.fuelPrice ?? 7.45,
    confirm: saved.confirm ?? true,
    alerts: saved.alerts ?? true,
    dark: saved.dark ?? false,
    mapsPreference: saved.mapsPreference ?? 'apple'
  };
  const tankCapacity = 52;
  const currentFuel = 26.4;
  const fuelNeeded = tankCapacity - currentFuel;
  const commandButtons = Object.fromEntries([...document.querySelectorAll('[data-command]')].map(button => [button.dataset.command, button]));
  const toast = document.getElementById('toast');
  let toastTimer;

  document.addEventListener('contextmenu', event => {
    if (!event.target.closest('input,textarea')) event.preventDefault();
  });
  document.addEventListener('dragstart', event => event.preventDefault());
  document.querySelectorAll('img').forEach(image => { image.draggable = false; });

  function persist() {
    localStorage.setItem('astralink-state', JSON.stringify(state));
  }

  function haptic(pattern = 12) {
    navigator.vibrate?.(pattern);
  }

  function prepareVehicleCutout() {
    const source = document.getElementById('vehicleSource');
    const canvas = document.getElementById('vehicleCanvas');
    const draw = () => {
      const width = source.naturalWidth;
      const height = source.naturalHeight;
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(source, 0, 0);
      try {
        const image = context.getImageData(0, 0, width, height);
        const pixels = image.data;
        const visited = new Uint8Array(width * height);
        const queue = new Int32Array(width * height);
        let head = 0;
        let tail = 0;
        const isBackground = index => {
          const offset = index * 4;
          const r = pixels[offset];
          const g = pixels[offset + 1];
          const b = pixels[offset + 2];
          return Math.min(r, g, b) > 205 && Math.max(r, g, b) - Math.min(r, g, b) < 42;
        };
        const add = index => {
          if (index < 0 || index >= visited.length || visited[index] || !isBackground(index)) return;
          visited[index] = 1;
          queue[tail++] = index;
        };
        for (let x = 0; x < width; x += 1) { add(x); add((height - 1) * width + x); }
        for (let y = 0; y < height; y += 1) { add(y * width); add(y * width + width - 1); }
        while (head < tail) {
          const index = queue[head++];
          const x = index % width;
          if (x > 0) add(index - 1);
          if (x < width - 1) add(index + 1);
          add(index - width);
          add(index + width);
        }
        for (let index = 0; index < visited.length; index += 1) if (visited[index]) pixels[index * 4 + 3] = 0;
        for (let pass = 0; pass < 2; pass += 1) {
          const fringe = [];
          for (let index = width; index < visited.length - width; index += 1) {
            if (visited[index]) continue;
            const offset = index * 4;
            const low = Math.min(pixels[offset], pixels[offset + 1], pixels[offset + 2]);
            const high = Math.max(pixels[offset], pixels[offset + 1], pixels[offset + 2]);
            if (low < 196 || high - low > 48) continue;
            if (visited[index - 1] || visited[index + 1] || visited[index - width] || visited[index + width]) fringe.push(index);
          }
          fringe.forEach(index => { visited[index] = 1; pixels[index * 4 + 3] = 0; });
        }
        context.putImageData(image, 0, 0);
        document.getElementById('vehicleSheetCar').src = canvas.toDataURL('image/png');
      } catch (_) {}
    };
    if (source.complete && source.naturalWidth) draw(); else source.addEventListener('load', draw, { once: true });
  }

  function showToast(title, detail) {
    clearTimeout(toastTimer);
    document.getElementById('toastTitle').textContent = title;
    document.getElementById('toastDetail').textContent = detail;
    toast.classList.add('show');
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function render() {
    commandButtons.lock.classList.toggle('active', state.locked);
    commandButtons.unlock.classList.toggle('active', !state.locked);
    commandButtons.lights.classList.toggle('active', state.lights);
    commandButtons.lock.setAttribute('aria-pressed', state.locked);
    commandButtons.unlock.setAttribute('aria-pressed', !state.locked);
    commandButtons.lights.setAttribute('aria-pressed', state.lights);
    document.getElementById('statusSummary').textContent = `${state.locked ? 'Locked' : 'Unlocked'} · Everything closed`;
    document.getElementById('sheetStatusTitle').textContent = state.locked ? 'Vehicle secured' : 'Vehicle unlocked';
    document.getElementById('doorStatus').textContent = state.locked ? 'Locked' : 'Unlocked';
    document.getElementById('lightStatus').textContent = state.lights ? 'On' : 'Off';
    const total = (fuelNeeded * state.fuelPrice).toFixed(2);
    document.getElementById('refillPreview').textContent = `Est. refill ${total} RON`;
    document.getElementById('refillTotal').textContent = `${total} RON`;
    document.getElementById('fuelPrice').value = state.fuelPrice.toFixed(2);
    document.body.classList.toggle('dark', state.dark);
    document.querySelectorAll('[data-setting]').forEach(toggle => {
      const enabled = Boolean(state[toggle.dataset.setting]);
      toggle.classList.toggle('on', enabled);
      toggle.setAttribute('aria-checked', enabled);
    });
    document.querySelectorAll('[data-maps-preference]').forEach(button => {
      const active = button.dataset.mapsPreference === state.mapsPreference;
      button.classList.toggle('active', active);
      button.setAttribute('aria-checked', String(active));
    });
  }

  function hornSound() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const context = new AudioContext();
      const gain = context.createGain();
      gain.gain.setValueAtTime(.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(.12, context.currentTime + .025);
      gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + .34);
      gain.connect(context.destination);
      [196, 246.9].forEach(frequency => {
        const oscillator = context.createOscillator();
        oscillator.type = 'sawtooth';
        oscillator.frequency.value = frequency;
        oscillator.connect(gain);
        oscillator.start();
        oscillator.stop(context.currentTime + .35);
      });
      setTimeout(() => context.close(), 500);
    } catch (_) {}
  }

  async function runCommand(command, button) {
    if (button.disabled) return;
    button.disabled = true;
    button.classList.add('working');
    haptic();
    await new Promise(resolve => setTimeout(resolve, 560));
    if (command === 'lock') {
      state.locked = true;
      showToast('Vehicle locked', 'Doors are secure and monitored.');
    } else if (command === 'unlock') {
      state.locked = false;
      showToast('Vehicle unlocked', 'All doors are ready to open.');
    } else if (command === 'lights') {
      state.lights = !state.lights;
      showToast(state.lights ? 'Lights switched on' : 'Lights switched off', state.lights ? 'Exterior lights are illuminated.' : 'Exterior lights are now off.');
    } else {
      hornSound();
      haptic([25, 25, 25]);
      showToast('Horn sounded', 'A short signal was sent to the vehicle.');
    }
    persist();
    render();
    button.classList.remove('working');
    button.disabled = false;
  }

  function showPage(pageName) {
    document.querySelectorAll('.page').forEach(page => page.classList.toggle('active', page.dataset.page === pageName));
    document.querySelectorAll('.tab').forEach(tab => {
      const active = tab.dataset.tab === pageName;
      tab.classList.toggle('active', active);
      if (active) tab.setAttribute('aria-current', 'page'); else tab.removeAttribute('aria-current');
    });
    localStorage.setItem('astralink-page', pageName);
    if (pageName === 'home') document.querySelector('[data-page="home"]').scrollTop = 0;
    if (pageName === 'location') window.setTimeout(() => locationMap?.invalidateSize(), 30);
    haptic(7);
  }

  function openSheet(name) {
    const backdrop = document.querySelector(`[data-sheet="${name}"]`);
    if (!backdrop) return;
    backdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    const sheet = backdrop.querySelector('.bottom-sheet');
    sheet.style.transform = '';
    sheet.classList.remove('is-dragging', 'is-settling');
    sheet.setAttribute('tabindex', '-1');
    requestAnimationFrame(() => {
      sheet.focus();
      if (name === 'trip') renderTripMap(currentTripName);
    });
  }

  function closeSheet(backdrop) {
    const sheet = backdrop.querySelector('.bottom-sheet');
    sheet.classList.add('is-settling');
    sheet.style.transform = `translateY(${Math.max(window.innerHeight, sheet.offsetHeight)}px)`;
    backdrop.style.backgroundColor = 'rgba(21,24,31,0)';
    window.setTimeout(() => {
      backdrop.hidden = true;
      backdrop.style.backgroundColor = '';
      sheet.style.transform = '';
      sheet.classList.remove('is-dragging', 'is-settling');
      if (!document.querySelector('.sheet-backdrop:not([hidden])')) document.body.style.overflow = '';
    }, 220);
  }

  document.querySelectorAll('[data-tab]').forEach(tab => tab.addEventListener('click', () => showPage(tab.dataset.tab)));
  document.querySelectorAll('[data-open-sheet]').forEach(button => button.addEventListener('click', () => openSheet(button.dataset.openSheet)));
  document.querySelectorAll('.sheet-close').forEach(button => button.addEventListener('click', () => closeSheet(button.closest('.sheet-backdrop'))));
  document.querySelectorAll('.sheet-backdrop').forEach(backdrop => backdrop.addEventListener('click', event => { if (event.target === backdrop) closeSheet(backdrop); }));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') document.querySelectorAll('.sheet-backdrop:not([hidden])').forEach(closeSheet);
  });
  function enableRemoteCommand(button) {
    const requiresHold = ['lock', 'unlock'].includes(button.dataset.command);
    if (!requiresHold) {
      button.addEventListener('click', () => runCommand(button.dataset.command, button));
      return;
    }
    let timer = null;
    let completed = false;
    const clearHold = () => {
      window.clearTimeout(timer);
      timer = null;
      button.classList.remove('holding');
    };
    button.addEventListener('pointerdown', event => {
      if (button.disabled) return;
      completed = false;
      if (!state.confirm) {
        completed = true;
        runCommand(button.dataset.command, button);
        return;
      }
      button.classList.add('holding');
      try { button.setPointerCapture(event.pointerId); } catch (_) {}
      timer = window.setTimeout(() => {
        completed = true;
        clearHold();
        haptic([12, 35, 18]);
        runCommand(button.dataset.command, button);
      }, 900);
    });
    button.addEventListener('pointerup', () => {
      const releasedEarly = Boolean(timer) && !completed;
      clearHold();
      if (releasedEarly) showToast('Press and hold', `Hold to ${button.dataset.command} the vehicle.`);
    });
    button.addEventListener('pointercancel', clearHold);
    button.addEventListener('lostpointercapture', clearHold);
    button.addEventListener('click', event => event.preventDefault());
  }
  Object.values(commandButtons).forEach(enableRemoteCommand);

  document.addEventListener('touchmove', event => {
    const activePage = document.querySelector('.page.active')?.dataset.page;
    if (activePage === 'settings' && !event.target.closest('.bottom-sheet,input,textarea,select,[contenteditable="true"]')) event.preventDefault();
  }, { passive: false });

  document.querySelectorAll('.bottom-sheet').forEach(sheet => {
    const grabber = sheet.querySelector('.grabber');
    const header = sheet.querySelector('.sheet-header');
    let gesture = null;
    let candidate = null;
    const canDragAnywhere = ['fuel', 'status'].includes(sheet.closest('.sheet-backdrop').dataset.sheet);
    sheet.addEventListener('pointerdown', event => {
      if (event.target.closest('button,input,select,textarea,a')) return;
      const topSurface = event.target.closest('.grabber,.sheet-header');
      if (!topSurface && !canDragAnywhere) return;
      candidate = { x:event.clientX, y:event.clientY, time:performance.now(), pointerId:event.pointerId };
    });
    sheet.addEventListener('pointermove', event => {
      if (!candidate && !gesture) return;
      if (!gesture) {
        const dx = event.clientX - candidate.x;
        const dy = event.clientY - candidate.y;
        if (dy < -7 || Math.abs(dx) > Math.abs(dy) + 5) { candidate = null; return; }
        if (dy < 7) return;
        gesture = { y:candidate.y, time:candidate.time, delta:0, pointerId:candidate.pointerId };
        try { sheet.setPointerCapture(candidate.pointerId); } catch (_) {}
        sheet.classList.add('is-dragging');
      }
      gesture.delta = Math.max(0, event.clientY - gesture.y);
      sheet.style.transform = `translateY(${gesture.delta}px)`;
      sheet.closest('.sheet-backdrop').style.backgroundColor = `rgba(21,24,31,${Math.max(0, .28 - gesture.delta / 700)})`;
    });
    const endGesture = event => {
      candidate = null;
      if (!gesture) return;
      const velocity = gesture.delta / Math.max(1, performance.now() - gesture.time);
      const shouldClose = gesture.delta > 72 || velocity > .45;
      const pointerId = gesture.pointerId;
      gesture = null;
      try { sheet.releasePointerCapture(pointerId); } catch (_) {}
      sheet.classList.remove('is-dragging');
      if (shouldClose) closeSheet(sheet.closest('.sheet-backdrop'));
      else {
        sheet.classList.add('is-settling');
        sheet.style.transform = '';
        sheet.closest('.sheet-backdrop').style.backgroundColor = '';
        window.setTimeout(() => sheet.classList.remove('is-settling'), 230);
      }
    };
    sheet.addEventListener('pointerup', endGesture);
    sheet.addEventListener('pointercancel', endGesture);
  });

  const notificationList = document.getElementById('notificationList');
  const notificationState = JSON.parse(localStorage.getItem('astralink-notifications') || '{"read":["parked","trip","status"],"removed":[]}');
  const saveNotificationState = () => localStorage.setItem('astralink-notifications', JSON.stringify(notificationState));
  function updateNotificationInbox() {
    const articles = [...notificationList.querySelectorAll('article')];
    articles.forEach(article => article.classList.toggle('unread', !notificationState.read.includes(article.dataset.notification)));
    const unreadCount = articles.filter(article => article.classList.contains('unread')).length;
    document.querySelector('.alert-dot').hidden = unreadCount === 0;
    document.getElementById('markAllRead').disabled = articles.length === 0;
    document.getElementById('notificationEmpty').hidden = articles.length > 0;
    notificationList.hidden = articles.length === 0;
  }
  notificationState.removed.forEach(id => notificationList.querySelector(`[data-notification="${id}"]`)?.remove());
  document.getElementById('markAllRead').addEventListener('click', () => {
    const articles = [...notificationList.querySelectorAll('article')];
    articles.forEach((article, index) => {
      const id = article.dataset.notification;
      if (!notificationState.removed.includes(id)) notificationState.removed.push(id);
      window.setTimeout(() => article.classList.add('removing'), index * 35);
      window.setTimeout(() => { article.remove(); updateNotificationInbox(); }, 250 + index * 35);
    });
    saveNotificationState();
    showToast('Notifications cleared', 'Your notification inbox is empty.');
  });
  notificationList.addEventListener('click', event => {
    const article = event.target.closest('article');
    if (!article || article.dataset.justSwiped === 'true') return;
    if (!notificationState.read.includes(article.dataset.notification)) notificationState.read.push(article.dataset.notification);
    saveNotificationState();
    updateNotificationInbox();
  });
  notificationList.querySelectorAll('article').forEach(article => {
    let swipe = null;
    article.addEventListener('pointerdown', event => {
      swipe = { x:event.clientX, y:event.clientY, delta:0, horizontal:false };
      article.dataset.justSwiped = 'false';
    });
    article.addEventListener('pointermove', event => {
      if (!swipe) return;
      const dx = event.clientX - swipe.x;
      const dy = event.clientY - swipe.y;
      if (!swipe.horizontal && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
        swipe.horizontal = true;
        article.setPointerCapture(event.pointerId);
        article.classList.add('swiping');
      }
      if (!swipe.horizontal) return;
      const limited = Math.max(-118, Math.min(0, dx));
      swipe.delta = limited < -82 ? -82 + (limited + 82) * .28 : limited;
      article.style.transform = `translateX(${swipe.delta}px)`;
    });
    const finishNotificationSwipe = event => {
      if (!swipe) return;
      const remove = swipe.horizontal && swipe.delta < -64;
      article.dataset.justSwiped = String(swipe.horizontal);
      swipe = null;
      article.classList.remove('swiping');
      try { article.releasePointerCapture(event.pointerId); } catch (_) {}
      if (remove) {
        const id = article.dataset.notification;
        if (!notificationState.removed.includes(id)) notificationState.removed.push(id);
        article.classList.add('removing');
        saveNotificationState();
        window.setTimeout(() => { article.remove(); updateNotificationInbox(); }, 210);
      } else {
        article.classList.add('settling');
        article.style.transform = 'translateX(0)';
        window.setTimeout(() => { article.classList.remove('settling'); article.style.transform = ''; }, 300);
      }
      window.setTimeout(() => { article.dataset.justSwiped = 'false'; }, 80);
    };
    article.addEventListener('pointerup', finishNotificationSwipe);
    article.addEventListener('pointercancel', finishNotificationSwipe);
  });
  updateNotificationInbox();

  function updateFuelPrice(rawValue, formatInput = false) {
    const input = document.getElementById('fuelPrice');
    const price = Number.parseFloat(String(rawValue).replace(',', '.'));
    if (!Number.isFinite(price) || price < 0) return;
    state.fuelPrice = price;
    persist();
    const total = (fuelNeeded * state.fuelPrice).toFixed(2);
    document.getElementById('refillTotal').textContent = `${total} RON`;
    document.getElementById('refillPreview').textContent = `Est. refill ${total} RON`;
    if (formatInput) input.value = state.fuelPrice.toFixed(2);
    renderFuelActivity();
  }

  const fuelPriceInput = document.getElementById('fuelPrice');
  fuelPriceInput.addEventListener('focus', event => event.target.select());
  fuelPriceInput.addEventListener('input', event => updateFuelPrice(event.target.value));
  fuelPriceInput.addEventListener('blur', event => updateFuelPrice(event.target.value, true));
  document.querySelectorAll('[data-price-step]').forEach(button => button.addEventListener('click', () => {
    const next = Math.max(0, state.fuelPrice + Number(button.dataset.priceStep));
    updateFuelPrice(next, true);
    haptic(6);
  }));

  document.querySelectorAll('[data-setting]').forEach(toggle => toggle.addEventListener('click', () => {
    const key = toggle.dataset.setting;
    state[key] = !state[key];
    persist();
    render();
    haptic(8);
  }));
  document.querySelectorAll('[data-maps-preference]').forEach(button => button.addEventListener('click', () => {
    state.mapsPreference = button.dataset.mapsPreference;
    persist();
    render();
    haptic(7);
    showToast(`${button.textContent.trim()} Maps selected`, 'Directions will open in your preferred maps app.');
  }));

  let currentTripName = 'City centre';
  const tripList = document.getElementById('tripList');
  const monthTripListMarkup = tripList.innerHTML;
  function openTripRow(row) {
    const title = row.dataset.trip;
    currentTripName = title;
    const route = row.querySelector('.trip-copy strong').textContent.split(' → ');
    document.getElementById('tripTitle').textContent = title;
    document.getElementById('tripRouteStart').textContent = route[0];
    document.getElementById('tripRouteEnd').textContent = route[1];
    document.getElementById('tripDetailDistance').textContent = row.querySelector('.trip-distance b').textContent;
    openSheet('trip');
  }
  tripList.addEventListener('click', event => {
    const row = event.target.closest('[data-trip]');
    if (row) openTripRow(row);
  });

  function restoreMonthTrips() {
    tripList.innerHTML = monthTripListMarkup;
    document.getElementById('driveListTitle').textContent = 'Recent drives';
  }

  function renderTripsForRange(start, end, count) {
    const label = periodLabel(start, end);
    document.getElementById('driveListTitle').textContent = count ? `Drives · ${label}` : 'No drives recorded';
    if (!count) {
      tripList.innerHTML = '<div class="empty-trips"><img class="ion" src="./assets/icons/car-sport-outline.svg" alt=""><strong>The Astra stayed parked</strong><small>No journeys were recorded in this period.</small></div>';
      return;
    }
    const routes = [
      ['City centre','Home','City centre','12.8','7.1','24 min',''],
      ['Office','Office','Home','15.4','7.8','31 min','blue'],
      ['Turda','Cluj-Napoca','Turda','34.6','6.5','49 min','green'],
      ['Airport','Home','Airport','18.1','7.3','28 min','purple']
    ];
    tripList.innerHTML = routes.slice(0, Math.min(count, routes.length)).map((route, index) => `<button class="trip-row" type="button" data-trip="${route[0]}"><span class="trip-route-icon ${route[6]}"><img class="ion" src="./assets/icons/trail-sign-outline.svg" alt=""></span><span class="trip-copy"><strong>${route[1]} → ${route[2]}</strong><small>${label} · ${9 + index * 3}:${index ? '35' : '10'} · ${route[5]}</small></span><span class="trip-distance"><b>${route[3]} km</b><small>${route[4]} L/100 km</small></span></button>`).join('');
  }

  const vehiclePosition = [44.4275, 26.1025];
  const mapHint = document.getElementById('mapHint');
  const streetTiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Tiles &copy; Esri' });
  const satelliteTiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Tiles &copy; Esri' });
  const locationMap = L.map('liveMap', { center: vehiclePosition, zoom: 16, zoomControl: false, touchZoom: true, scrollWheelZoom: true, doubleClickZoom: true, dragging: true, attributionControl: true, bounceAtZoomLimits: false });
  streetTiles.addTo(locationMap);
  const vehicleIcon = L.divIcon({ className: 'leaflet-vehicle-marker', html: '<div class="leaflet-vehicle-pin"><span><img src="./assets/icons/car-sport-outline.svg" alt=""></span><i></i></div>', iconSize: [58, 70], iconAnchor: [29, 62] });
  const vehicleMarker = L.marker(vehiclePosition, { icon: vehicleIcon, keyboard: false }).addTo(locationMap);
  const trafficIncidentIcon = L.divIcon({ className:'traffic-incident-marker', html:'<span>!</span>', iconSize:[22,22], iconAnchor:[11,11] });
  const trafficOverlay = L.layerGroup([
    L.polyline([[44.4301,26.0978],[44.4292,26.0997],[44.4282,26.1012]], { color:'#fff', weight:8, opacity:.72, className:'traffic-road' }),
    L.polyline([[44.4301,26.0978],[44.4292,26.0997],[44.4282,26.1012]], { color:'#ff9f0a', weight:4, opacity:.94, className:'traffic-road' }),
    L.polyline([[44.4275,26.1025],[44.4284,26.1051],[44.4293,26.1074]], { color:'#fff', weight:8, opacity:.72, className:'traffic-road' }),
    L.polyline([[44.4275,26.1025],[44.4284,26.1051],[44.4293,26.1074]], { color:'#ff453a', weight:4, opacity:.94, className:'traffic-road' }),
    L.polyline([[44.4258,26.0997],[44.4267,26.1012],[44.4279,26.1038]], { color:'#ffd60a', weight:4, opacity:.9, className:'traffic-road' }),
    L.marker([44.4285,26.1053], { icon:trafficIncidentIcon, keyboard:false })
  ]);
  let activeBaseLayer = streetTiles;

  const freshness = document.getElementById('mapFreshness');
  function updateMapFreshness(fromVehicle = false) {
    const positionKey = 'astralink-position-refresh-v2';
    if (!localStorage.getItem(positionKey)) localStorage.setItem(positionKey, new Date(Date.now() - 120000).toISOString());
    if (fromVehicle) localStorage.setItem(positionKey, new Date().toISOString());
    const online = navigator.onLine;
    freshness.classList.toggle('offline', !online);
    const savedRefresh = localStorage.getItem(positionKey);
    const ageMinutes = savedRefresh ? Math.max(0, Math.floor((Date.now() - new Date(savedRefresh).getTime()) / 60000)) : 0;
    freshness.querySelector('strong').textContent = online ? (ageMinutes < 1 ? 'Position updated just now' : `Position updated ${ageMinutes} min ago`) : `Offline · last position ${ageMinutes < 1 ? 'just now' : `${ageMinutes} min ago`}`;
  }
  streetTiles.on('load', () => updateMapFreshness());
  satelliteTiles.on('load', () => updateMapFreshness());
  window.addEventListener('online', () => updateMapFreshness());
  window.addEventListener('offline', () => updateMapFreshness());
  locationMap.on('movestart zoomstart', () => mapHint.classList.add('hidden'));
  updateMapFreshness();

  document.getElementById('mapZoomIn').addEventListener('click', () => { locationMap.zoomIn(); haptic(5); });
  document.getElementById('mapZoomOut').addEventListener('click', () => { locationMap.zoomOut(); haptic(5); });

  const layerButton = document.getElementById('layerButton');
  const layerPicker = document.getElementById('layerPicker');
  layerButton.addEventListener('click', () => {
    layerPicker.hidden = !layerPicker.hidden;
    layerButton.setAttribute('aria-expanded', String(!layerPicker.hidden));
  });
  document.querySelectorAll('[data-map-layer]').forEach(button => button.addEventListener('click', () => {
    const type = button.dataset.mapLayer;
    if (type === 'satellite' && activeBaseLayer !== satelliteTiles) {
      locationMap.removeLayer(activeBaseLayer);
      activeBaseLayer = satelliteTiles.addTo(locationMap);
    } else if (type !== 'satellite' && activeBaseLayer !== streetTiles) {
      locationMap.removeLayer(activeBaseLayer);
      activeBaseLayer = streetTiles.addTo(locationMap);
    }
    if (type === 'traffic') trafficOverlay.addTo(locationMap); else trafficOverlay.removeFrom(locationMap);
    document.querySelectorAll('[data-map-layer]').forEach(item => item.classList.toggle('active', item === button));
    layerPicker.hidden = true;
    layerButton.setAttribute('aria-expanded', 'false');
    showToast(`${button.textContent.trim()} map`, 'Map layer updated.');
  }));

  document.getElementById('locateVehicle').addEventListener('click', () => {
    locationMap.flyTo(vehiclePosition, 17, { duration: .65 });
    vehicleMarker.getElement()?.querySelector('.leaflet-vehicle-pin')?.animate([{ transform:'scale(.86)' }, { transform:'scale(1.08)' }, { transform:'scale(1)' }], { duration:700, easing:'ease-out' });
    updateMapFreshness(true);
    showToast('Vehicle located', 'Position refreshed with 8 m accuracy.');
  });

  document.getElementById('directionsButton').addEventListener('click', () => {
    const destination = `${vehiclePosition[0]},${vehiclePosition[1]}`;
    const url = state.mapsPreference === 'google'
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`
      : `https://maps.apple.com/?daddr=${encodeURIComponent(destination)}&dirflg=d`;
    showToast(`Opening ${state.mapsPreference === 'google' ? 'Google' : 'Apple'} Maps`, 'Directions to your Astra are ready.');
    window.open(url, '_blank', 'noopener');
  });
  async function shareVehicleLocation() {
    const shareData = { title: 'Astra H location', text: 'Astra H is parked near Piața Unirii, Bucharest.' };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(shareData.text);
        showToast('Location copied', 'Parking address copied to the clipboard.');
      }
    } catch (_) {}
  }
  ['shareLocation', 'shareLocationCard'].forEach(id => document.getElementById(id).addEventListener('click', shareVehicleLocation));

  const tripRoutes = {
    'City centre': [[46.7857,23.6005],[46.7848,23.5972],[46.7835,23.5942],[46.7819,23.5914],[46.7807,23.5894],[46.7801,23.5877],[46.7808,23.5863],[46.7820,23.5868],[46.7825,23.5885],[46.7818,23.5900],[46.7806,23.5894],[46.7798,23.5876],[46.7805,23.5855],[46.7822,23.5848],[46.7835,23.5865],[46.7838,23.5895],[46.7829,23.5920],[46.7814,23.5936]],
    Office: [[46.7814,23.5936],[46.7825,23.5958],[46.7838,23.5982],[46.7857,23.6005]],
    Turda: [[46.7857,23.6005],[46.766,23.608],[46.741,23.623],[46.714,23.653],[46.690,23.706],[46.666,23.781]],
    Airport: [[46.7857,23.6005],[46.788,23.617],[46.790,23.641],[46.787,23.665],[46.785,23.687]]
  };
  let tripMap;
  let tripRouteLayer;
  function renderTripMap(name) {
    const points = tripRoutes[name] || tripRoutes['City centre'];
    if (!tripMap) {
      tripMap = L.map('tripMap', { zoomControl:false, attributionControl:true, touchZoom:true, scrollWheelZoom:true, dragging:true });
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', { maxZoom:19, attribution:'Tiles &copy; Esri' }).addTo(tripMap);
    }
    if (tripRouteLayer) tripRouteLayer.remove();
    const startIcon = L.divIcon({ className:'', html:'<div class="route-dot"></div>', iconSize:[13,13], iconAnchor:[7,7] });
    const endIcon = L.divIcon({ className:'', html:'<div class="route-dot end"></div>', iconSize:[13,13], iconAnchor:[7,7] });
    tripRouteLayer = L.layerGroup([L.polyline(points, { color:'#0a84ff', weight:5, opacity:.92, lineCap:'round', lineJoin:'round' }), L.marker(points[0], {icon:startIcon}), L.marker(points.at(-1), {icon:endIcon})]).addTo(tripMap);
    window.setTimeout(() => { tripMap.invalidateSize(); tripMap.fitBounds(L.latLngBounds(points), { padding:[26,26], maxZoom:15 }); }, 40);
  }

  const periodData = {
    June: ['JUNE TOTAL', '392.8', '10 trips', '7.6 L/100 km', '9 h 08 min'],
    July: ['JULY TOTAL', '541.4', '15 trips', '7.2 L/100 km', '12 h 36 min'],
    August: ['AUGUST TOTAL', '486.2', '12 trips', '7.4 L/100 km', '11 h 24 min']
  };
  const monthlyFuelData = {
    June: { volume:54.2, refillDate:'18 Jun', refill:27.0 },
    July: { volume:81.5, refillDate:'24 Jul', refill:31.2 },
    August: { volume:68.7, refillDate:'22 Aug', refill:24.3 }
  };
  let fuelSelection = { type:'month', monthName:'August' };
  let calendarDate = new Date(2026, 7, 1);
  let rangeStart = null;
  let rangeEnd = null;
  const calendarPanel = document.getElementById('calendarPanel');
  const calendarButton = document.getElementById('tripCalendar');

  function renderFuelActivity() {
    const title = document.getElementById('fuelActivityTitle');
    const volume = document.getElementById('fuelActivityVolume');
    const primaryLabel = document.getElementById('fuelActivityPrimaryLabel');
    const primary = document.getElementById('fuelActivityPrimary');
    const cost = document.getElementById('fuelActivityCost');
    const note = document.getElementById('fuelActivityNote');
    if (fuelSelection.type === 'range') {
      const distance = Number.parseFloat(fuelSelection.summary[1]) || 0;
      const consumption = Number.parseFloat(fuelSelection.summary[3]) || 0;
      const used = distance * consumption / 100;
      title.textContent = fuelSelection.label;
      volume.textContent = `${used.toFixed(1)} L`;
      primaryLabel.textContent = 'Fuel used';
      primary.textContent = `${used.toFixed(2)} L`;
      cost.textContent = `${(used * state.fuelPrice).toFixed(2)} RON`;
      note.textContent = 'Estimated from the recorded distance and average consumption for this period.';
      return;
    }
    const data = monthlyFuelData[fuelSelection.monthName] || { volume:0, refillDate:'No refill', refill:0 };
    title.textContent = `${fuelSelection.monthName} overview`;
    volume.textContent = `${data.volume.toFixed(1)} L`;
    primaryLabel.textContent = data.refill ? `Last refill · ${data.refillDate}` : 'No refill detected';
    primary.textContent = data.refill ? `+${data.refill.toFixed(1)} L` : '—';
    cost.textContent = `${(data.volume * state.fuelPrice).toFixed(2)} RON`;
    note.textContent = 'Estimated from tank readings saved when the engine switches off.';
  }

  function selectMonth(year, month) {
    const monthName = new Date(year, month, 1).toLocaleString('en', { month:'long' });
    const data = periodData[monthName] || [`${monthName.toUpperCase()} TOTAL`, '0.0', '0 trips', 'No driving', '0 min'];
    rangeStart = null;
    rangeEnd = null;
    fuelSelection = { type:'month', monthName };
    applyTripSummary(data, `${monthName} ${year}`);
    restoreMonthTrips();
    renderFuelActivity();
  }

  function dayMetrics(year, month, day) {
    const seed = (year + month * 17 + day * 31) % 97;
    const trips = seed % 4;
    const distance = trips ? 5.8 + (seed * 2.17) % 71 : 0;
    const consumption = trips ? 6.2 + (seed % 19) / 10 : 0;
    const minutes = trips ? 18 + (seed * 7) % 104 : 0;
    return { trips, distance, consumption, minutes };
  }

  function formatDuration(minutes) {
    return minutes >= 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${minutes} min`;
  }

  function calendarValue(date) {
    return new Date(date.year, date.month, date.day).getTime();
  }

  function sameCalendarDate(first, second) {
    return Boolean(first && second && first.year === second.year && first.month === second.month && first.day === second.day);
  }

  function periodLabel(start, end) {
    const first = new Date(start.year, start.month, start.day);
    const last = new Date(end.year, end.month, end.day);
    const firstLabel = first.toLocaleString('en', { day:'numeric', month:'short' });
    const lastLabel = last.toLocaleString('en', { day:'numeric', month:'short' });
    return firstLabel === lastLabel ? firstLabel : `${firstLabel} – ${lastLabel}`;
  }

  function rangeSummary(start, end) {
    const cursor = new Date(start.year, start.month, start.day);
    const final = new Date(end.year, end.month, end.day);
    let trips = 0;
    let distance = 0;
    let fuel = 0;
    let minutes = 0;
    while (cursor <= final) {
      const metrics = dayMetrics(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
      trips += metrics.trips;
      distance += metrics.distance;
      fuel += metrics.distance * metrics.consumption / 100;
      minutes += metrics.minutes;
      cursor.setDate(cursor.getDate() + 1);
    }
    const consumption = distance ? fuel / distance * 100 : 0;
    return [`${periodLabel(start, end).toUpperCase()} TOTAL`, distance.toFixed(1), `${trips} ${trips === 1 ? 'trip' : 'trips'}`, trips ? `${consumption.toFixed(1)} L/100 km` : 'No driving', formatDuration(minutes)];
  }

  function applyTripSummary(data, label) {
    document.getElementById('tripPeriodLabel').textContent = data[0];
    document.getElementById('tripPeriodDistance').innerHTML = `${data[1]} <small>km</small>`;
    document.getElementById('tripCountBadge').textContent = data[2];
    document.getElementById('tripAverage').textContent = data[3];
    document.getElementById('tripDuration').textContent = data[4];
    document.getElementById('driveListMeta').textContent = label;
  }

  function renderCalendar() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const monthName = calendarDate.toLocaleString('en', { month:'long' });
    document.getElementById('calendarMonth').textContent = `${monthName} ${year}`;
    const selectionHint = document.getElementById('calendarSelectionHint');
    if (!rangeStart) selectionHint.textContent = 'Select the first day of your period';
    else if (!rangeEnd) selectionHint.textContent = `Starts ${periodLabel(rangeStart, rangeStart)} · select the end date`;
    else selectionHint.textContent = `${periodLabel(rangeStart, rangeEnd)} selected`;
    const days = document.getElementById('calendarDays');
    days.replaceChildren();
    const leading = (new Date(year, month, 1).getDay() + 6) % 7;
    for (let i = 0; i < leading; i += 1) days.append(document.createElement('i'));
    const count = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= count; day += 1) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = day;
      const picked = { year, month, day };
      const value = calendarValue(picked);
      const inRange = rangeStart && rangeEnd && value >= calendarValue(rangeStart) && value <= calendarValue(rangeEnd);
      const isStart = sameCalendarDate(picked, rangeStart);
      const isEnd = sameCalendarDate(picked, rangeEnd);
      button.classList.toggle('today', year === 2026 && month === 7 && day === 28);
      button.classList.toggle('in-range', Boolean(inRange));
      button.classList.toggle('range-start', isStart);
      button.classList.toggle('range-end', isEnd);
      button.setAttribute('aria-selected', String(isStart || isEnd || Boolean(inRange)));
      button.setAttribute('aria-label', `${day} ${monthName} ${year}`);
      button.addEventListener('click', () => {
        if (!rangeStart || rangeEnd) {
          rangeStart = picked;
          rangeEnd = null;
          renderCalendar();
          haptic(5);
          return;
        }
        if (calendarValue(picked) < calendarValue(rangeStart)) {
          rangeEnd = rangeStart;
          rangeStart = picked;
        } else {
          rangeEnd = picked;
        }
        const data = rangeSummary(rangeStart, rangeEnd);
        const label = periodLabel(rangeStart, rangeEnd);
        applyTripSummary(data, label);
        renderTripsForRange(rangeStart, rangeEnd, Number.parseInt(data[2], 10));
        fuelSelection = { type:'range', label, summary:data };
        renderFuelActivity();
        calendarPanel.hidden = true;
        calendarButton.setAttribute('aria-expanded', 'false');
        haptic(6);
      });
      days.append(button);
    }
  }

  function openCalendar() {
    calendarPanel.hidden = !calendarPanel.hidden;
    calendarButton.setAttribute('aria-expanded', String(!calendarPanel.hidden));
    if (!calendarPanel.hidden) renderCalendar();
  }

  calendarButton.addEventListener('click', openCalendar);
  document.getElementById('calendarPrevious').addEventListener('click', () => {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    renderCalendar();
  });
  document.getElementById('calendarNext').addEventListener('click', () => {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    renderCalendar();
  });
  document.getElementById('calendarAll').addEventListener('click', () => {
    selectMonth(calendarDate.getFullYear(), calendarDate.getMonth());
    calendarPanel.hidden = true;
    calendarButton.setAttribute('aria-expanded', 'false');
  });
  renderFuelActivity();

  document.getElementById('decodeVin').addEventListener('click', () => {
    const input = document.getElementById('vinInput');
    const vin = input.value.trim().toUpperCase();
    input.value = vin;
    const valid = /^[A-HJ-NPR-Z0-9]{17}$/.test(vin);
    document.getElementById('vinError').hidden = valid;
    document.getElementById('vinResult').hidden = !valid;
    document.getElementById('vinSourceNote').hidden = !valid;
    if (!valid) {
      haptic([20, 30, 20]);
      return;
    }
    const yearCodes = { '4': '2004', '5': '2005', '6': '2006', '7': '2007', '8': '2008', '9': '2009', A: '2010' };
    const factoryCodes = { '2':'Bochum, Germany', '5':'Antwerp, Belgium', '8':'Ellesmere Port, UK' };
    document.getElementById('vinModel').textContent = vin.includes('AH') ? 'Astra H' : 'Opel vehicle';
    document.getElementById('vinBody').textContent = vin.includes('AHL') ? 'Caravan / Estate' : 'Body code requires build data';
    document.getElementById('vinYear').textContent = yearCodes[vin[9]] || 'Decoded';
    document.getElementById('vinFactory').textContent = factoryCodes[vin[10]] || `Factory code ${vin[10]}`;
    showToast('VIN decoded', 'Vehicle information is ready to review.');
  });

  document.getElementById('saveVehicleName').addEventListener('click', () => {
    const input = document.getElementById('vehicleNameInput');
    const name = input.value.trim() || 'Astra H Caravan';
    input.value = name;
    document.getElementById('vehicleDetailsTitle').textContent = name;
    document.querySelector('.vehicle-profile div strong').textContent = name;
    localStorage.setItem('astralink-vehicle-name', name);
    showToast('Vehicle updated', `Name changed to ${name}.`);
  });
  document.getElementById('installHelp').addEventListener('click', () => openSheet('install'));

  const initialPage = ['home', 'location', 'trips', 'settings'].includes(localStorage.getItem('astralink-page')) ? localStorage.getItem('astralink-page') : 'home';
  const savedVehicleName = localStorage.getItem('astralink-vehicle-name');
  if (savedVehicleName) {
    document.getElementById('vehicleNameInput').value = savedVehicleName;
    document.getElementById('vehicleDetailsTitle').textContent = savedVehicleName;
    document.querySelector('.vehicle-profile div strong').textContent = savedVehicleName;
  }
  prepareVehicleCutout();
  render();
  showPage(initialPage);
  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
})();
