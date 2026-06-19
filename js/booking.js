/* =========================================================
   Alma Rent a Car - Motor de Reservas Público
   Conexión directa al backend: https://alma-backend-0m1p.onrender.com
   ========================================================= */

// URL base de la API pública
const API_BASE = 'https://alma-backend-0m1p.onrender.com/api';

class BookingEngine {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 4;
    this.vehicles = [];
    this.filteredVehicles = [];
    this.selectedVehicle = null;
    this.dates = { start: '', end: '', startTime: '10:00', endTime: '10:00' };
    this.client = { name: '', lastName: '', phone: '', email: '' };
    this.categories = [];

    this.init();
  }

  async init() {
    this.bindEvents();
    this.updateStepIndicator();
    try {
      const res = await fetch(`${API_BASE}/public/settings`);
      if (res.ok) this.settings = await res.json();
      const resLoc = await fetch(`${API_BASE}/public/settings/locations`);
      if (resLoc.ok) this.locationFees = await resLoc.json();
    } catch (e) {
      console.warn('Could not load settings');
    }
  }

  bindEvents() {
    // Search form
    const searchBtn = document.getElementById('booking-search-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleSearch();
      });
    }

    // Search form - Enter key
    const searchForm = document.getElementById('booking-search-form');
    if (searchForm) {
      searchForm.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleSearch();
        }
      });
    }

    // Back buttons
    document.querySelectorAll('[data-action="back"]').forEach(btn => {
      btn.addEventListener('click', () => this.prevStep());
    });

    // Customer form submission
    const customerForm = document.getElementById('customer-form');
    if (customerForm) {
      customerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleBookingSubmit();
      });
    }

    // New booking button
    const newBookingBtn = document.getElementById('new-booking-btn');
    if (newBookingBtn) {
      newBookingBtn.addEventListener('click', () => this.reset());
    }

    // Terms & Conditions modal
    const openTermsBtn = document.getElementById('open-terms-modal');
    const termsModal = document.getElementById('terms-modal');
    const closeTermsBtn = document.getElementById('close-terms-modal');
    const acceptTermsBtn = document.getElementById('accept-terms-btn');

    if (openTermsBtn && termsModal) {
      openTermsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        termsModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        // Load terms content
        const contentDiv = document.getElementById('terms-modal-content');
        fetch('terminos.html')
          .then(res => res.text())
          .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const main = doc.querySelector('main') || doc.querySelector('.container') || doc.querySelector('section') || doc.body;
            contentDiv.innerHTML = main.innerHTML;
          })
          .catch(() => {
            contentDiv.innerHTML = '<p style="color:#ef4444;">No se pudieron cargar los términos. <a href="terminos.html" target="_blank" style="color:#f97316;">Abrir en nueva pestaña</a></p>';
          });
      });

      // Close modal
      if (closeTermsBtn) {
        closeTermsBtn.addEventListener('click', () => {
          termsModal.style.display = 'none';
          document.body.style.overflow = '';
        });
      }
      if (acceptTermsBtn) {
        acceptTermsBtn.addEventListener('click', () => {
          termsModal.style.display = 'none';
          document.body.style.overflow = '';
          const cb = document.getElementById('terms-checkbox');
          if (cb) cb.checked = true;
        });
      }
      // Close on backdrop click
      termsModal.addEventListener('click', (e) => {
        if (e.target === termsModal) {
          termsModal.style.display = 'none';
          document.body.style.overflow = '';
        }
      });
    }
  }

  /* ── STEP NAVIGATION ── */
  goToStep(step) {
    this.currentStep = step;
    this.updateStepIndicator();
    this.showCurrentStep();
    this.scrollToWidget();
  }

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.goToStep(this.currentStep + 1);
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.goToStep(this.currentStep - 1);
    }
  }

  updateStepIndicator() {
    document.querySelectorAll('.step-dot').forEach((dot, idx) => {
      dot.classList.remove('active', 'completed');
      if (idx + 1 === this.currentStep) {
        dot.classList.add('active');
      } else if (idx + 1 < this.currentStep) {
        dot.classList.add('completed');
      }
    });
  }

  showCurrentStep() {
    document.querySelectorAll('.booking-step-content').forEach(el => {
      el.classList.remove('active');
    });
    const step = document.getElementById(`booking-step-${this.currentStep}`);
    if (step) {
      step.classList.add('active');
    }
  }

  scrollToWidget() {
    const widget = document.querySelector('.booking-section');
    if (widget) {
      widget.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /* ── STEP 1: SEARCH ── */
  async handleSearch() {
    const startDate = document.getElementById('booking-start-date');
    const endDate = document.getElementById('booking-end-date');
    const startTime = document.getElementById('booking-start-time');
    const endTime = document.getElementById('booking-end-time');
    const pickupLoc = document.getElementById('booking-pickup-location');
    const dropoffLoc = document.getElementById('booking-dropoff-location');

    if (!startDate || !endDate) return;

    this.dates.start = startDate.value;
    this.dates.end = endDate.value;
    this.dates.startTime = startTime ? startTime.value : '10:00';
    this.dates.endTime = endTime ? endTime.value : '10:00';
    this.pickupLocation = pickupLoc ? pickupLoc.value : 'Salta Ciudad';
    this.dropoffLocation = dropoffLoc ? dropoffLoc.value : 'Salta Ciudad';

    // Validate dates
    if (!this.dates.start || !this.dates.end) {
      this.showAlert('Por favor, seleccioná las fechas de retiro y devolución.');
      return;
    }

    const start = new Date(`${this.dates.start}T${this.dates.startTime}:00`);
    const end = new Date(`${this.dates.end}T${this.dates.endTime}:00`);
    const today = new Date();

    if (start < today) {
      this.showAlert('La fecha de retiro no puede ser anterior a hoy.');
      return;
    }

    if (end <= start) {
      this.showAlert('La fecha de devolución debe ser posterior a la de retiro.');
      return;
    }

    // Show loading state
    const searchBtn = document.getElementById('booking-search-btn');
    const originalText = searchBtn.innerHTML;
    searchBtn.innerHTML = '<span class="spinner"></span> Buscando...';
    searchBtn.disabled = true;

    try {
      await this.fetchVehicles();
      this.goToStep(2);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      this.showAlert('Error al buscar vehículos. Por favor, intentá de nuevo en unos segundos.');
    } finally {
      searchBtn.innerHTML = originalText;
      searchBtn.disabled = false;
    }
  }

  async fetchVehicles() {
    const response = await fetch(`${API_BASE}/public/vehicles`);
    if (!response.ok) throw new Error('Error al obtener vehículos');

    this.vehicles = await response.json();
    this.filteredVehicles = [...this.vehicles];

    // Extract unique categories
    this.categories = [...new Set(this.vehicles.map(v => v.category?.name).filter(Boolean))];

    this.renderCategoryFilters();
    this.renderVehicles();
  }

  renderCategoryFilters() {
    const container = document.getElementById('category-filters');
    if (!container) return;

    let html = '<button class="category-filter-btn active" data-category="all">Todos</button>';
    this.categories.forEach(cat => {
      html += `<button class="category-filter-btn" data-category="${cat}">${cat}</button>`;
    });

    container.innerHTML = html;

    // Bind filter events
    container.querySelectorAll('.category-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.category-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const category = btn.dataset.category;
        if (category === 'all') {
          this.filteredVehicles = [...this.vehicles];
        } else {
          this.filteredVehicles = this.vehicles.filter(v => v.category?.name === category);
        }
        this.renderVehicles();
      });
    });
  }

  renderVehicles() {
    const container = document.getElementById('vehicles-grid');
    if (!container) return;

    if (this.filteredVehicles.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding: 3rem; grid-column: 1/-1;">
          <i class="fas fa-car" style="font-size: 3rem; color: var(--color-gray-200); margin-bottom: 1rem;"></i>
          <p style="color: var(--color-gray-400);">No hay vehículos disponibles en esta categoría.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.filteredVehicles.map(v => `
      <div class="vehicle-card ${this.selectedVehicle?.id === v.id ? 'selected' : ''}" 
           data-vehicle-id="${v.id}" onclick="bookingEngine.selectVehicle(${v.id})">
        <div class="vehicle-card-img">
          ${v.category?.name ? `<span class="vehicle-category-badge">${v.category.name}</span>` : ''}
          <i class="fas fa-car" style="font-size: 4rem; color: var(--color-gray-300);"></i>
        </div>
        <div class="vehicle-card-info">
          <h4 class="vehicle-card-name">${v.make || ''} ${v.model || ''}</h4>
          ${v.description ? `<p style="font-size: 0.8rem; color: #666; margin-top: 5px; margin-bottom: 10px; line-height: 1.3;">${v.description.replace(/\n/g, '<br>')}</p>` : ''}
          <div class="vehicle-card-specs">
            <span><i class="fas fa-calendar-alt"></i> ${v.year || '-'}</span>
            <span><i class="fas fa-palette"></i> ${v.color || '-'}</span>
            ${v.transmission ? `<span><i class="fas fa-cog"></i> ${v.transmission === 'AUTOMATIC' ? 'Auto' : 'Manual'}</span>` : ''}
          </div>
          <div class="vehicle-card-footer">
            <div class="vehicle-price">
              USD $${v.pricePerDay || 0}<span>/día</span>
            </div>
            <button class="btn btn-sm ${this.selectedVehicle?.id === v.id ? 'btn-primary' : 'btn-outline'}">
              ${this.selectedVehicle?.id === v.id ? 'Seleccionado' : 'Elegir'}
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  selectVehicle(vehicleId) {
    this.selectedVehicle = this.vehicles.find(v => v.id === vehicleId);
    this.renderVehicles();
    this.updateBookingSummary();

    // Automatically go to step 3 after a brief visual feedback
    setTimeout(() => this.goToStep(3), 400);
  }

  /* ── STEP 3: CUSTOMER DATA ── */
  updateBookingSummary() {
    const summary = document.getElementById('booking-summary');
    if (!summary || !this.selectedVehicle) return;

    const days = this.calculateDays();
    let baseTotal = days * (this.selectedVehicle.pricePerDay || 0);
    
    let extraCostsHTML = '';
    let totalExtras = 0;

    // Check out of hours
    if (this.settings && this.settings.OUT_OF_HOURS_FEE) {
      const fee = parseFloat(this.settings.OUT_OF_HOURS_FEE);
      if (fee > 0) {
        const isOutOfHours = (timeStr) => {
          const [h, m] = timeStr.split(':').map(Number);
          const t = h + (m||0)/60;
          const [sh, sm] = (this.settings.OUT_OF_HOURS_START || '08:00').split(':').map(Number);
          const st = sh + (sm||0)/60;
          const [eh, em] = (this.settings.OUT_OF_HOURS_END || '20:00').split(':').map(Number);
          const et = eh + (em||0)/60;
          return t < st || t > et;
        };

        if (isOutOfHours(this.dates.startTime)) {
          totalExtras += fee;
          extraCostsHTML += `<div class="booking-summary-row" style="color:#d97706; font-size:0.85rem;"><span>Retiro Fuera de Hora</span><span>USD $${fee}</span></div>`;
        }
        if (isOutOfHours(this.dates.endTime)) {
          totalExtras += fee;
          extraCostsHTML += `<div class="booking-summary-row" style="color:#d97706; font-size:0.85rem;"><span>Devolución Fuera de Hora</span><span>USD $${fee}</span></div>`;
        }
      }
    }

    // Check location fees
    if (this.locationFees && this.pickupLocation && this.dropoffLocation && this.pickupLocation !== this.dropoffLocation) {
      const locFee = this.locationFees.find(f => f.pickupLocation === this.pickupLocation && f.dropoffLocation === this.dropoffLocation);
      if (locFee) {
        totalExtras += locFee.fee;
        extraCostsHTML += `<div class="booking-summary-row" style="color:#2563eb; font-size:0.85rem;"><span>Drop-off (${this.pickupLocation} a ${this.dropoffLocation})</span><span>USD $${locFee.fee}</span></div>`;
      }
    }

    const total = baseTotal + totalExtras;

    const formatDate = (dateStr, timeStr) => {
      if (!dateStr) return '-';
      const d = new Date(dateStr + 'T12:00:00');
      return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' }) + ' ' + (timeStr || '');
    };

    summary.innerHTML = `
      <h4><i class="fas fa-receipt" style="color: var(--color-primary);"></i> Resumen de tu Reserva</h4>
      <div class="booking-summary-row">
        <span>Vehículo</span>
        <strong>${this.selectedVehicle.make} ${this.selectedVehicle.model}</strong>
      </div>
      <div class="booking-summary-row">
        <span>Retiro</span>
        <span style="font-size:0.9rem; text-align:right;">${formatDate(this.dates.start, this.dates.startTime)}<br/><small>${this.pickupLocation}</small></span>
      </div>
      <div class="booking-summary-row">
        <span>Devolución</span>
        <span style="font-size:0.9rem; text-align:right;">${formatDate(this.dates.end, this.dates.endTime)}<br/><small>${this.dropoffLocation}</small></span>
      </div>
      <div class="booking-summary-row">
        <span>Duración</span>
        <span>${days} día${days !== 1 ? 's' : ''} (USD $${this.selectedVehicle.pricePerDay}/día)</span>
      </div>
      ${extraCostsHTML}
      <div class="booking-summary-row total">
        <span>Total Estimado</span>
        <span>USD $${total.toFixed(2)}</span>
      </div>
    `;
  }

  calculateDays() {
    if (!this.dates.start || !this.dates.end) return 0;
    
    // Parse dates with times
    const start = new Date(`${this.dates.start}T${this.dates.startTime}:00`);
    const end = new Date(`${this.dates.end}T${this.dates.endTime}:00`);
    
    const ONE_HOUR = 60 * 60 * 1000;
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const durationMs = end - start;
    
    if (durationMs <= 0) return 0;
    
    let fullDays = Math.floor(durationMs / ONE_DAY);
    const remainder = durationMs % ONE_DAY;
    
    if (remainder > ONE_HOUR) {
      fullDays += 1;
    }
    
    return Math.max(fullDays, 1);
  }

  /* ── STEP 3: SUBMIT BOOKING ── */
  async handleBookingSubmit() {
    // Gather customer data
    const nameInput = document.getElementById('client-name');
    const lastNameInput = document.getElementById('client-lastname');
    const phoneInput = document.getElementById('client-phone');
    const emailInput = document.getElementById('client-email');

    this.client = {
      name: nameInput?.value?.trim() || '',
      lastName: lastNameInput?.value?.trim() || '',
      phone: phoneInput?.value?.trim() || '',
      email: emailInput?.value?.trim() || ''
    };

    // Validate
    if (!this.client.name || !this.client.phone) {
      this.showAlert('Por favor, completá al menos tu nombre y teléfono.');
      return;
    }

    // Validate terms checkbox
    const termsCheckbox = document.getElementById('terms-checkbox');
    if (termsCheckbox && !termsCheckbox.checked) {
      this.showAlert('Debés aceptar los Términos y Condiciones para continuar.');
      return;
    }

    if (!this.selectedVehicle) {
      this.showAlert('Error: no hay vehículo seleccionado. Volvé al paso anterior.');
      return;
    }

    // Get selected payment method
    const paymentMethodEl = document.querySelector('input[name="payment-method"]:checked');
    const paymentMethod = paymentMethodEl ? paymentMethodEl.value : 'mercadopago';

    // Submit
    const submitBtn = document.getElementById('booking-submit-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner"></span> Enviando...';
    submitBtn.disabled = true;

    try {
      const response = await fetch(`${API_BASE}/public/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: this.selectedVehicle.id,
          startDate: this.dates.start,
          endDate: this.dates.end,
          pickupTime: this.dates.startTime,
          dropoffTime: this.dates.endTime,
          pickupLocation: this.pickupLocation,
          dropoffLocation: this.dropoffLocation,
          customerName: this.client.name,
          customerLastName: this.client.lastName,
          customerPhone: this.client.phone,
          customerEmail: this.client.email,
          paymentMethod: paymentMethod
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al crear la reserva');
      }

      const booking = await response.json();
      this.showSuccessStep(booking);

    } catch (error) {
      console.error('Booking error:', error);
      this.showAlert(`Error: ${error.message}. Por favor, intentá de nuevo.`);
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  }

  showSuccessStep(booking) {
    const successBookingId = document.getElementById('success-booking-id');
    if (successBookingId && booking?.id) {
      successBookingId.textContent = `#${String(booking.id).padStart(5, '0')}`;
    }

    const paymentUrl = booking?.paymentUrl || booking?.mp_init_point || booking?.mp_sandbox_init_point;
    
    // Mostramos el paso 4
    this.goToStep(4);

    // Si tenemos URL de pago, redirigimos automáticamente
    if (paymentUrl) {
      const successDiv = document.querySelector('.booking-success');
      if (successDiv) {
        // Añadir mensaje de redirección
        const redirectMsg = document.createElement('div');
        redirectMsg.innerHTML = `
          <div style="margin-top: 2rem; padding: 1.5rem; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
            <div class="spinner spinner-dark" style="margin-bottom: 1rem;"></div>
            <h4 style="color: #334155; margin-bottom: 0.5rem;">Redirigiendo al pago...</h4>
            <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 1rem;">Aguardá un momento mientras te conectamos de forma segura.</p>
            <a href="${paymentUrl}" class="btn btn-primary" style="font-size: 0.9rem;">Si no te redirige, hacé clic acá</a>
          </div>
        `;
        successDiv.appendChild(redirectMsg);
      }
      
      // Redirección después de 2 segundos para que el usuario pueda ver el mensaje de éxito
      setTimeout(() => {
        window.location.href = paymentUrl;
      }, 2000);
    }
  }

  /* ── RESET ── */
  reset() {
    this.currentStep = 1;
    this.selectedVehicle = null;
    this.dates = { start: '', end: '', startTime: '10:00', endTime: '10:00' };
    this.client = { name: '', lastName: '', phone: '', email: '' };
    const termsCheckbox = document.getElementById('terms-checkbox');
    if (termsCheckbox) termsCheckbox.checked = false;

    // Clear form fields
    const fields = ['booking-start-date', 'booking-end-date', 'client-name', 'client-lastname', 'client-phone', 'client-email'];
    fields.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

    // Re-enable submit button
    const submitBtn = document.getElementById('booking-submit-btn');
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Confirmar Reserva';
      submitBtn.disabled = false;
    }

    this.updateStepIndicator();
    this.showCurrentStep();
    this.scrollToWidget();
  }

  /* ── UTILITIES ── */
  showAlert(message) {
    // Create a nice toast notification
    let toast = document.getElementById('booking-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'booking-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%) translateY(120%);
        background: #1e293b;
        color: white;
        padding: 16px 28px;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        z-index: 10000;
        font-size: 0.95rem;
        max-width: 90%;
        text-align: center;
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        border-left: 4px solid var(--color-primary);
      `;
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.transform = 'translateX(-50%) translateY(0)';

    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.style.transform = 'translateX(-50%) translateY(120%)';
    }, 4000);
  }
}

// Global instance
let bookingEngine;
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.booking-widget')) {
    bookingEngine = new BookingEngine();
  }
});

// Set min date on date inputs to today
document.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  const startDate = document.getElementById('booking-start-date');
  const endDate = document.getElementById('booking-end-date');

  if (startDate) {
    startDate.setAttribute('min', today);
    startDate.addEventListener('change', () => {
      if (endDate) {
        endDate.setAttribute('min', startDate.value);
        if (endDate.value && endDate.value <= startDate.value) {
          endDate.value = '';
        }
      }
    });
  }
  if (endDate) {
    endDate.setAttribute('min', today);
  }
});
