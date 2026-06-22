// ==================== API LAYER ====================
const API_BASE = window.location.origin + '/api';

const API = {
  async bookAppointment(data) {
    const res = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Booking failed');
    return json;
  },

  async checkSlot(date, time, state, city) {
    const params = new URLSearchParams({ date, time, state, city });
    const res = await fetch(`${API_BASE}/appointments/check-slot?${params}`);
    const json = await res.json();
    return json.available;
  },

  async login(email, password) {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Login failed');
    localStorage.setItem('prokip_token', json.token);
    localStorage.setItem('prokip_admin', JSON.stringify(json.admin));
    return json;
  },

  getToken() { return localStorage.getItem('prokip_token'); },
  getSession() {
    const a = localStorage.getItem('prokip_admin');
    return a ? JSON.parse(a) : null;
  },
  logout() {
    localStorage.removeItem('prokip_token');
    localStorage.removeItem('prokip_admin');
  },

  _authHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`
    };
  },

  async getAppointments(filters = {}) {
    const params = new URLSearchParams();
    if (filters.date) params.set('date', filters.date);
    if (filters.state) params.set('state', filters.state);
    if (filters.city) params.set('city', filters.city);
    if (filters.search) params.set('search', filters.search);
    if (filters.page) params.set('page', filters.page);
    if (filters.limit) params.set('limit', filters.limit);

    const res = await fetch(`${API_BASE}/admin/appointments?${params}`, {
      headers: this._authHeaders()
    });
    if (res.status === 401) { this.logout(); Router.navigate('/admin/login'); throw new Error('Session expired'); }
    return await res.json();
  },

  async getStats() {
    const res = await fetch(`${API_BASE}/admin/appointments/stats`, { headers: this._authHeaders() });
    if (res.status === 401) { this.logout(); Router.navigate('/admin/login'); throw new Error('Session expired'); }
    return await res.json();
  },

  async getGrouped() {
    const res = await fetch(`${API_BASE}/admin/appointments/grouped`, { headers: this._authHeaders() });
    if (res.status === 401) { this.logout(); Router.navigate('/admin/login'); throw new Error('Session expired'); }
    return await res.json();
  },

  async getFilters() {
    const res = await fetch(`${API_BASE}/admin/filters`, { headers: this._authHeaders() });
    return await res.json();
  },

  async deleteAppointment(id) {
    const res = await fetch(`${API_BASE}/admin/appointments/${id}`, {
      method: 'DELETE',
      headers: this._authHeaders()
    });
    if (!res.ok) { const j = await res.json(); throw new Error(j.error); }
    return await res.json();
  },

  getExportUrl(filters = {}) {
    const params = new URLSearchParams();
    if (filters.date) params.set('date', filters.date);
    if (filters.state) params.set('state', filters.state);
    if (filters.city) params.set('city', filters.city);
    if (filters.search) params.set('search', filters.search);
    // We'll handle auth via fetch for export
    return `${API_BASE}/admin/appointments/export?${params}`;
  }
};

// ==================== ROUTER ====================
const Router = {
  routes: {},
  register(path, handler) { this.routes[path] = handler; },
  navigate(path) { window.location.hash = path; },
  start() {
    const render = () => {
      const hash = window.location.hash.slice(1) || '/spotlight';
      const handler = this.routes[hash];
      if (handler) {
        document.getElementById('app').innerHTML = handler();
        if (window.__afterRender) { window.__afterRender(); window.__afterRender = null; }
      } else {
        Router.navigate('/spotlight');
      }
    };
    window.addEventListener('hashchange', render);
    render();
  }
};

// ==================== NIGERIAN STATES & CITIES ====================
const STATES_CITIES = {
  "Abia":["Aba","Umuahia","Ohafia"],"Adamawa":["Yola","Mubi","Jimeta","Numan"],"Akwa Ibom":["Uyo","Eket","Ikot Ekpene","Oron"],
  "Anambra":["Awka","Onitsha","Nnewi","Ekwulobia"],"Bauchi":["Bauchi","Azare","Misau"],"Bayelsa":["Yenagoa","Ogbia","Brass"],
  "Benue":["Makurdi","Gboko","Otukpo"],"Borno":["Maiduguri","Biu","Bama"],"Cross River":["Calabar","Ikom","Ogoja"],
  "Delta":["Asaba","Warri","Sapele","Ughelli"],"Ebonyi":["Abakaliki","Afikpo","Onueke"],"Edo":["Benin City","Auchi","Ekpoma"],
  "Ekiti":["Ado-Ekiti","Ikere","Ijero"],"Enugu":["Enugu","Nsukka","Agbani"],"FCT":["Abuja","Gwagwalada","Kuje","Bwari"],
  "Gombe":["Gombe","Kaltungo","Billiri"],"Imo":["Owerri","Orlu","Okigwe"],"Jigawa":["Dutse","Hadejia","Gumel"],
  "Kaduna":["Kaduna","Zaria","Kafanchan"],"Kano":["Kano","Wudil","Gaya"],"Katsina":["Katsina","Daura","Funtua"],
  "Kebbi":["Birnin Kebbi","Argungu","Yauri"],"Kogi":["Lokoja","Okene","Idah"],"Kwara":["Ilorin","Offa","Jebba"],
  "Lagos":["Lagos","Ikeja","Lekki","Victoria Island","Surulere","Yaba","Ikoyi","Ajah","Epe","Badagry"],
  "Nasarawa":["Lafia","Keffi","Akwanga"],"Niger":["Minna","Bida","Suleja"],"Ogun":["Abeokuta","Sagamu","Ijebu-Ode"],
  "Ondo":["Akure","Ondo","Owo"],"Osun":["Osogbo","Ile-Ife","Ilesa"],"Oyo":["Ibadan","Ogbomoso","Oyo"],
  "Plateau":["Jos","Bukuru","Pankshin"],"Rivers":["Port Harcourt","Bonny","Obio-Akpor"],"Sokoto":["Sokoto","Tambuwal","Wurno"],
  "Taraba":["Jalingo","Wukari","Takum"],"Yobe":["Damaturu","Potiskum","Gashua"],"Zamfara":["Gusau","Kaura Namoda","Talata Mafara"]
};

// ==================== DATE HELPERS ====================
function getBookingDates() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const dates = [];
  for (let d = 25; d <= 30; d++) {
    const date = new Date(year, month, d);
    if (date.getMonth() === month) {
      dates.push({ value: `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`, label: `${getMonthName(month)} ${d}, ${year}` });
    }
  }
  return dates;
}
function getMonthName(m) { return ['January','February','March','April','May','June','July','August','September','October','November','December'][m]; }
const TIME_SLOTS = ['8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM'];

// ==================== PAGES ====================

// --- PUBLIC: SPOTLIGHT LANDING + FORM ---
Router.register('/spotlight', () => {
  const dates = getBookingDates();
  const stateOptions = Object.keys(STATES_CITIES).sort().map(s => `<option value="${s}">${s}</option>`).join('');

  window.__afterRender = () => {
    const stateEl = document.getElementById('state');
    const cityEl = document.getElementById('city');
    if (stateEl) {
      stateEl.addEventListener('change', () => {
        const cities = STATES_CITIES[stateEl.value] || [];
        cityEl.innerHTML = '<option value="">Select City</option>' + cities.map(c => `<option value="${c}">${c}</option>`).join('');
      });
    }

    const form = document.getElementById('bookingForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<span class="inline-block animate-spin mr-2">⏳</span> Booking...';

        const fd = new FormData(form);
        const data = Object.fromEntries(fd.entries());

        // Client-side validation
        const required = ['client_name','business_name','email','phone','business_address','state','city','appointment_date','appointment_time'];
        for (const f of required) {
          if (!data[f] || !data[f].trim()) {
            showToast('Please fill in all required fields.', 'error');
            btn.disabled = false; btn.textContent = 'Book Appointment';
            return;
          }
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
          showToast('Please enter a valid email address.', 'error');
          btn.disabled = false; btn.textContent = 'Book Appointment';
          return;
        }

        try {
          await API.bookAppointment(data);
          Router.navigate('/spotlight/thank-you');
        } catch (err) {
          showToast(err.message, 'error');
        } finally {
          btn.disabled = false; btn.textContent = 'Book Appointment';
        }
      });
    }
  };

  return `
    <nav class="bg-white shadow-sm sticky top-0 z-50">
      <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-prokip-600 rounded-lg flex items-center justify-center"><span class="text-white font-bold text-sm">P</span></div>
          <span class="font-bold text-xl text-prokip-800">Prokip</span>
        </div>
        <a href="#/admin/login" class="text-sm text-gray-500 hover:text-prokip-600 transition">Admin</a>
      </div>
    </nav>

    <section class="hero-gradient text-white py-20 px-4">
      <div class="max-w-4xl mx-auto text-center fade-in">
        <div class="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
          <span class="text-yellow-300">⭐</span><span class="text-sm font-medium">You've Been Selected</span>
        </div>
        <h1 class="text-3xl md:text-5xl font-extrabold leading-tight mb-6">Prokip Customer<br>Spotlight Series</h1>
        <p class="text-lg md:text-xl text-prokip-100 max-w-2xl mx-auto leading-relaxed">We are excited to feature outstanding businesses across Nigeria that are growing, operating with excellence, and using Prokip to improve their daily operations.</p>
      </div>
    </section>

    <section class="py-16 px-4 bg-white">
      <div class="max-w-4xl mx-auto fade-in">
        <p class="text-lg text-gray-600 text-center leading-relaxed max-w-3xl mx-auto">
          As part of this spotlight, our media team will visit your business location to create a short professional video highlighting your <strong class="text-gray-800">business journey</strong>, <strong class="text-gray-800">growth story</strong>, and how <strong class="text-prokip-700">Prokip</strong> supports your operations.
        </p>
      </div>
    </section>

    <section class="py-16 px-4 bg-gray-50">
      <div class="max-w-5xl mx-auto">
        <h2 class="text-2xl md:text-3xl font-bold text-center mb-3">What You'll Receive</h2>
        <p class="text-gray-500 text-center mb-12">By participating, your business will enjoy these benefits</p>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${[
            {icon:'🎬',title:'Professional Video',desc:'A professionally produced customer spotlight video at no cost'},
            {icon:'📱',title:'Social Media Clips',desc:'Edited social media clips and professional photos'},
            {icon:'📢',title:'Brand Exposure',desc:"Exposure across Prokip's social media platforms, website, and business community"},
            {icon:'🏆',title:'Featured Business',desc:'Recognition as a Prokip Featured Business'},
            {icon:'🛡️',title:'Digital Badge',desc:'A digital Prokip Featured Business Badge'},
            {icon:'💎',title:'Prokip Premium',desc:'One year complimentary access to Prokip Premium worth ₦180,000'},
            {icon:'🎁',title:'Merch Package',desc:'Prokip-branded business merchandise package'},
          ].map(b => `
            <div class="benefit-card bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div class="text-3xl mb-3">${b.icon}</div>
              <h3 class="font-semibold text-lg mb-2">${b.title}</h3>
              <p class="text-gray-500 text-sm leading-relaxed">${b.desc}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <section class="py-16 px-4 bg-white" id="booking">
      <div class="max-w-2xl mx-auto">
        <h2 class="text-2xl md:text-3xl font-bold text-center mb-3">Book Your Appointment</h2>
        <p class="text-gray-500 text-center mb-10">Select your preferred date and time for our media team to visit.<br>Available dates: <strong>25th – 30th</strong> · <strong>8:00 AM – 4:00 PM</strong></p>
        <form id="bookingForm" class="space-y-5">
          <div class="grid md:grid-cols-2 gap-5">
            <div><label class="block text-sm font-medium text-gray-700 mb-1">Client Name <span class="text-red-500">*</span></label><input type="text" name="client_name" required class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-prokip-500 focus:border-prokip-500 outline-none transition" placeholder="Your full name"></div>
            <div><label class="block text-sm font-medium text-gray-700 mb-1">Business Name <span class="text-red-500">*</span></label><input type="text" name="business_name" required class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-prokip-500 focus:border-prokip-500 outline-none transition" placeholder="Your business name"></div>
          </div>
          <div class="grid md:grid-cols-2 gap-5">
            <div><label class="block text-sm font-medium text-gray-700 mb-1">Email Address <span class="text-red-500">*</span></label><input type="email" name="email" required class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-prokip-500 focus:border-prokip-500 outline-none transition" placeholder="you@example.com"></div>
            <div><label class="block text-sm font-medium text-gray-700 mb-1">Phone Number <span class="text-red-500">*</span></label><input type="tel" name="phone" required class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-prokip-500 focus:border-prokip-500 outline-none transition" placeholder="080XXXXXXXX"></div>
          </div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Business Address <span class="text-red-500">*</span></label><input type="text" name="business_address" required class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-prokip-500 focus:border-prokip-500 outline-none transition" placeholder="Full business address"></div>
          <div class="grid md:grid-cols-2 gap-5">
            <div><label class="block text-sm font-medium text-gray-700 mb-1">State <span class="text-red-500">*</span></label><select id="state" name="state" required class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-prokip-500 focus:border-prokip-500 outline-none transition bg-white"><option value="">Select State</option>${stateOptions}</select></div>
            <div><label class="block text-sm font-medium text-gray-700 mb-1">City <span class="text-red-500">*</span></label><select id="city" name="city" required class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-prokip-500 focus:border-prokip-500 outline-none transition bg-white"><option value="">Select City</option></select></div>
          </div>
          <div class="grid md:grid-cols-2 gap-5">
            <div><label class="block text-sm font-medium text-gray-700 mb-1">Preferred Date <span class="text-red-500">*</span></label><select name="appointment_date" required class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-prokip-500 focus:border-prokip-500 outline-none transition bg-white"><option value="">Select Date</option>${dates.map(d=>`<option value="${d.value}">${d.label}</option>`).join('')}</select></div>
            <div><label class="block text-sm font-medium text-gray-700 mb-1">Preferred Time <span class="text-red-500">*</span></label><select name="appointment_time" required class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-prokip-500 focus:border-prokip-500 outline-none transition bg-white"><option value="">Select Time</option>${TIME_SLOTS.map(t=>`<option value="${t}">${t}</option>`).join('')}</select></div>
          </div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Notes or Special Instructions <span class="text-gray-400">(optional)</span></label><textarea name="notes" rows="3" class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-prokip-500 focus:border-prokip-500 outline-none transition" placeholder="Any additional information..."></textarea></div>
          <button type="submit" class="w-full bg-prokip-600 hover:bg-prokip-700 text-white font-semibold py-4 rounded-lg transition shadow-lg shadow-prokip-600/25 text-lg">Book Appointment</button>
        </form>
      </div>
    </section>

    <footer class="bg-prokip-900 text-prokip-200 py-8 px-4 text-center text-sm"><p>© ${new Date().getFullYear()} Prokip. All rights reserved.</p></footer>
    <div id="toast-container" class="fixed top-4 right-4 z-[100] space-y-2"></div>
  `;
});

// --- THANK YOU ---
Router.register('/spotlight/thank-you', () => {
  return `
    <div class="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div class="bg-white rounded-2xl shadow-lg p-10 max-w-lg text-center fade-in">
        <div class="w-20 h-20 bg-prokip-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-10 h-10 text-prokip-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <h1 class="text-2xl font-bold mb-4 text-gray-800">Appointment Submitted!</h1>
        <p class="text-gray-500 leading-relaxed mb-8">Thank you for participating in the <strong class="text-prokip-700">Prokip Customer Spotlight Series</strong>. Our team will review your selected time and contact you if any clarification is needed.</p>
        <a href="#/spotlight" class="inline-block bg-prokip-600 hover:bg-prokip-700 text-white font-semibold px-8 py-3 rounded-lg transition">Back to Home</a>
      </div>
    </div>
  `;
});

// --- ADMIN LOGIN ---
Router.register('/admin/login', () => {
  if (API.getSession()) { Router.navigate('/admin/spotlight-appointments'); return '<div></div>'; }

  window.__afterRender = () => {
    const form = document.getElementById('loginForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true; btn.textContent = 'Signing in...';
        try {
          await API.login(form.email.value.trim(), form.password.value);
          Router.navigate('/admin/spotlight-appointments');
        } catch (err) {
          showToast(err.message, 'error');
        } finally {
          btn.disabled = false; btn.textContent = 'Sign In';
        }
      });
    }
  };

  return `
    <div class="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div class="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md fade-in">
        <div class="text-center mb-8">
          <div class="w-12 h-12 bg-prokip-600 rounded-xl flex items-center justify-center mx-auto mb-4"><span class="text-white font-bold text-lg">P</span></div>
          <h1 class="text-2xl font-bold">Admin Login</h1>
          <p class="text-gray-500 text-sm mt-1">Sign in to manage appointments</p>
        </div>
        <form id="loginForm" class="space-y-4">
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" name="email" required value="admin@prokip.com" class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-prokip-500 focus:border-prokip-500 outline-none transition"></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Password</label><input type="password" name="password" required value="admin123" class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-prokip-500 focus:border-prokip-500 outline-none transition"></div>
          <button type="submit" class="w-full bg-prokip-600 hover:bg-prokip-700 text-white font-semibold py-3 rounded-lg transition">Sign In</button>
        </form>
        <p class="text-xs text-gray-400 text-center mt-4">Default: admin@prokip.com / admin123</p>
      </div>
    </div>
    <div id="toast-container" class="fixed top-4 right-4 z-[100] space-y-2"></div>
  `;
});

// --- ADMIN DASHBOARD ---
Router.register('/admin/spotlight-appointments', () => {
  if (!API.getSession()) { Router.navigate('/admin/login'); return '<div></div>'; }
  const session = API.getSession();

  window.__afterRender = () => { loadDashboard(); };

  return `
    <nav class="bg-white shadow-sm sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-prokip-600 rounded-lg flex items-center justify-center"><span class="text-white font-bold text-sm">P</span></div>
          <span class="font-bold text-lg text-prokip-800">Prokip Admin</span>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-500">${esc(session.name)}</span>
          <button onclick="API.logout(); Router.navigate('/admin/login');" class="text-sm text-red-500 hover:text-red-700 font-medium transition">Logout</button>
        </div>
      </div>
    </nav>
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div id="summaryCards" class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"></div>
      <div class="flex gap-2 mb-6 border-b border-gray-200">
        <button id="tabTable" onclick="switchTab('table')" class="px-4 py-2 text-sm font-medium border-b-2 border-prokip-600 text-prokip-700 -mb-px">Table View</button>
        <button id="tabCity" onclick="switchTab('city')" class="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 -mb-px">City Grouping</button>
      </div>
      <div id="filtersBar" class="flex flex-wrap gap-3 mb-6">
        <input type="text" id="searchInput" placeholder="Search name, business, email, phone..." class="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-prokip-500 outline-none flex-1 min-w-[200px]">
        <select id="filterDate" class="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"><option value="">All Dates</option></select>
        <select id="filterState" class="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"><option value="">All States</option></select>
        <select id="filterCity" class="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"><option value="">All Cities</option></select>
        <button onclick="exportCSV()" class="px-4 py-2 bg-prokip-600 text-white rounded-lg text-sm font-medium hover:bg-prokip-700 transition flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          Export CSV
        </button>
      </div>
      <div id="tableView" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-100">
              <tr>
                <th class="px-4 py-3 text-left font-medium text-gray-500">Customer</th>
                <th class="px-4 py-3 text-left font-medium text-gray-500">Business</th>
                <th class="px-4 py-3 text-left font-medium text-gray-500">Contact</th>
                <th class="px-4 py-3 text-left font-medium text-gray-500">Location</th>
                <th class="px-4 py-3 text-left font-medium text-gray-500">Appointment</th>
                <th class="px-4 py-3 text-left font-medium text-gray-500">Submitted</th>
                <th class="px-4 py-3 text-left font-medium text-gray-500"></th>
              </tr>
            </thead>
            <tbody id="tableBody" class="divide-y divide-gray-50"></tbody>
          </table>
        </div>
        <div id="emptyState" class="hidden p-12 text-center text-gray-400"><p class="text-lg mb-1">No appointments yet</p><p class="text-sm">Appointments will appear here once customers book their slots.</p></div>
      </div>
      <div id="cityView" class="hidden space-y-6"></div>
    </div>
    <div id="toast-container" class="fixed top-4 right-4 z-[100] space-y-2"></div>
  `;
});

// ==================== DASHBOARD LOGIC ====================
let currentTab = 'table';
let currentFilters = {};
let allAppointments = [];

function switchTab(tab) {
  currentTab = tab;
  document.getElementById('tabTable').className = tab==='table' ? 'px-4 py-2 text-sm font-medium border-b-2 border-prokip-600 text-prokip-700 -mb-px' : 'px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 -mb-px';
  document.getElementById('tabCity').className = tab==='city' ? 'px-4 py-2 text-sm font-medium border-b-2 border-prokip-600 text-prokip-700 -mb-px' : 'px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 -mb-px';
  document.getElementById('tableView').classList.toggle('hidden', tab!=='table');
  document.getElementById('cityView').classList.toggle('hidden', tab!=='city');
  if (tab === 'city') loadCityView();
}

async function loadDashboard() {
  try {
    // Load stats
    const stats = await API.getStats();
    document.getElementById('summaryCards').innerHTML = `
      <div class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"><p class="text-sm text-gray-500 mb-1">Total Appointments</p><p class="text-3xl font-bold text-gray-800">${stats.totalAppointments}</p></div>
      <div class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"><p class="text-sm text-gray-500 mb-1">Total States</p><p class="text-3xl font-bold text-gray-800">${stats.totalStates}</p></div>
      <div class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"><p class="text-sm text-gray-500 mb-1">Total Cities</p><p class="text-3xl font-bold text-gray-800">${stats.totalCities}</p></div>
      <div class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"><p class="text-sm text-gray-500 mb-1">Busiest City</p><p class="text-xl font-bold text-gray-800">${stats.busiestCity ? stats.busiestCity.name : '—'}</p>${stats.busiestCity ? `<p class="text-xs text-gray-400 mt-1">${stats.busiestCity.count} appointment${stats.busiestCity.count>1?'s':''}</p>`:''}</div>
    `;

    // Load filters
    const filters = await API.getFilters();
    document.getElementById('filterDate').innerHTML = '<option value="">All Dates</option>' + filters.dates.map(d=>`<option value="${d}">${d}</option>`).join('');
    document.getElementById('filterState').innerHTML = '<option value="">All States</option>' + filters.states.map(s=>`<option value="${s}">${s}</option>`).join('');
    document.getElementById('filterCity').innerHTML = '<option value="">All Cities</option>' + filters.cities.map(c=>`<option value="${c}">${c}</option>`).join('');

    // Attach filter listeners
    let debounceTimer;
    ['searchInput','filterDate','filterState','filterCity'].forEach(id => {
      const el = document.getElementById(id);
      el.addEventListener('input', () => { clearTimeout(debounceTimer); debounceTimer = setTimeout(applyFilters, 300); });
      el.addEventListener('change', applyFilters);
    });

    await applyFilters();
  } catch (err) {
    console.error(err);
  }
}

async function applyFilters() {
  const search = document.getElementById('searchInput')?.value || '';
  const date = document.getElementById('filterDate')?.value || '';
  const state = document.getElementById('filterState')?.value || '';
  const city = document.getElementById('filterCity')?.value || '';
  currentFilters = { search, date, state, city };

  try {
    const result = await API.getAppointments(currentFilters);
    allAppointments = result.appointments;
    renderTable(allAppointments);
    if (currentTab === 'city') loadCityView();
  } catch (err) {
    console.error(err);
  }
}

function renderTable(data) {
  const tbody = document.getElementById('tableBody');
  const empty = document.getElementById('emptyState');
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = '';
    empty?.classList.remove('hidden');
    return;
  }
  empty?.classList.add('hidden');

  tbody.innerHTML = data.map(a => `
    <tr class="hover:bg-gray-50 transition">
      <td class="px-4 py-3"><div class="font-medium text-gray-800">${esc(a.client_name)}</div></td>
      <td class="px-4 py-3 text-gray-600">${esc(a.business_name)}</td>
      <td class="px-4 py-3"><div class="text-gray-600">${esc(a.email)}</div><div class="text-gray-400 text-xs">${esc(a.phone)}</div></td>
      <td class="px-4 py-3"><div class="text-gray-600">${esc(a.city)}, ${esc(a.state)}</div><div class="text-gray-400 text-xs">${esc(a.business_address)}</div></td>
      <td class="px-4 py-3"><span class="inline-flex items-center gap-1 bg-prokip-50 text-prokip-700 px-2 py-1 rounded-md text-xs font-medium">${a.appointment_date} · ${a.appointment_time}</span></td>
      <td class="px-4 py-3 text-gray-400 text-xs">${new Date(a.created_at).toLocaleDateString()}</td>
      <td class="px-4 py-3">
        <button onclick="deleteApt(${a.id})" class="text-red-400 hover:text-red-600 transition" title="Delete">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </button>
      </td>
    </tr>
  `).join('');
}

async function loadCityView() {
  const container = document.getElementById('cityView');
  if (!container) return;
  try {
    const result = await API.getGrouped();
    const grouped = result.grouped;
    const keys = Object.keys(grouped);
    if (keys.length === 0) {
      container.innerHTML = '<div class="p-12 text-center text-gray-400 bg-white rounded-xl border border-gray-100"><p>No appointments to display</p></div>';
      return;
    }
    container.innerHTML = keys.sort().map(city => {
      const apts = grouped[city];
      return `
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="bg-prokip-50 px-5 py-3 flex items-center justify-between border-b border-prokip-100">
            <h3 class="font-semibold text-prokip-800">📍 ${esc(city)}</h3>
            <span class="bg-prokip-600 text-white text-xs font-medium px-2.5 py-1 rounded-full">${apts.length} appointment${apts.length>1?'s':''}</span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50"><tr><th class="px-4 py-2 text-left font-medium text-gray-500">Time</th><th class="px-4 py-2 text-left font-medium text-gray-500">Business</th><th class="px-4 py-2 text-left font-medium text-gray-500">Customer</th><th class="px-4 py-2 text-left font-medium text-gray-500">Phone</th><th class="px-4 py-2 text-left font-medium text-gray-500">Address</th></tr></thead>
              <tbody class="divide-y divide-gray-50">${apts.map(a=>`
                <tr class="hover:bg-gray-50"><td class="px-4 py-2"><span class="bg-prokip-50 text-prokip-700 px-2 py-0.5 rounded text-xs font-medium">${a.appointment_date}<br>${a.appointment_time}</span></td><td class="px-4 py-2 font-medium text-gray-800">${esc(a.business_name)}</td><td class="px-4 py-2 text-gray-600">${esc(a.client_name)}</td><td class="px-4 py-2 text-gray-600">${esc(a.phone)}</td><td class="px-4 py-2 text-gray-500 text-xs">${esc(a.business_address)}</td></tr>
              `).join('')}</tbody>
            </table>
          </div>
        </div>`;
    }).join('');
  } catch (err) { console.error(err); }
}

async function deleteApt(id) {
  if (!confirm('Delete this appointment?')) return;
  try {
    await API.deleteAppointment(id);
    showToast('Appointment deleted.', 'success');
    await applyFilters();
    // Refresh stats
    const stats = await API.getStats();
    document.getElementById('summaryCards').querySelector('div:first-child p:last-child').textContent = stats.totalAppointments;
  } catch (err) { showToast(err.message, 'error'); }
}

async function exportCSV() {
  try {
    const url = API.getExportUrl(currentFilters);
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${API.getToken()}` } });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `prokip-appointments-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('CSV exported successfully!', 'success');
  } catch (err) { showToast(err.message, 'error'); }
}

// ==================== UTILS ====================
function esc(str) { const d = document.createElement('div'); d.textContent = str||''; return d.innerHTML; }

function showToast(msg, type='info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const colors = { error:'bg-red-500', success:'bg-prokip-600', info:'bg-gray-700' };
  const toast = document.createElement('div');
  toast.className = `${colors[type]} text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium fade-in max-w-sm`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity='0'; toast.style.transition='opacity 0.3s'; setTimeout(()=>toast.remove(),300); }, 4000);
}

// ==================== START ====================
Router.start();
