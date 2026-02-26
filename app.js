const STORAGE_KEY = 'stock_submissions_v2';
const ROWS_PER_SUPPLIER = 10;

const providerNames = ['Coca', 'Baires', 'Brancor', 'Dany B.', 'Leo', 'Raz C.', 'Raz V.'];

function buildSuppliers() {
  return providerNames.map((name, providerIndex) => {
    const providerId = `prov-${providerIndex + 1}`;
    const products = Array.from({ length: ROWS_PER_SUPPLIER }).map((_, productIndex) => ({
      id: `${providerId}-prod-${productIndex + 1}`,
      name: `Producto ${productIndex + 1}`,
      imageSlot: null,
    }));

    return {
      id: providerId,
      name,
      products,
    };
  });
}

function todayClock() {
  const now = new Date();
  return {
    time: now.toLocaleTimeString('es-AR'),
    date: now.toLocaleDateString('es-AR'),
  };
}

function getPeriodDays(periodValue) {
  const map = { weekly: 7, biweekly: 15, monthly: 30 };
  return map[periodValue] || 30;
}

function readSubmissions() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveSubmissions(submissions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
}

function createInitialDraft(suppliers) {
  const draft = {};

  suppliers.forEach((supplier) => {
    draft[supplier.id] = {};

    supplier.products.forEach((product) => {
      draft[supplier.id][product.id] = {
        exhibido: 0,
        deposito: 0,
      };
    });
  });

  return draft;
}

function calculateAverages(submissions, periodDays, supplierFilter, productFilter) {
  const sorted = [...submissions].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - periodDays);

  const byProduct = new Map();

  sorted.forEach((submission) => {
    submission.entries.forEach((entry) => {
      if (supplierFilter !== 'all' && entry.supplierId !== supplierFilter) {
        return;
      }
      if (productFilter !== 'all' && entry.productId !== productFilter) {
        return;
      }

      const list = byProduct.get(entry.productId) || [];
      list.push({
        ...entry,
        createdAt: submission.createdAt,
      });
      byProduct.set(entry.productId, list);
    });
  });

  const productAverages = [];

  for (const [, points] of byProduct) {
    points.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    let soldSum = 0;
    let soldCount = 0;

    for (let i = 1; i < points.length; i += 1) {
      const previous = points[i - 1];
      const current = points[i];
      const currentDate = new Date(current.createdAt);

      if (currentDate < cutoff) {
        continue;
      }

      const previousTotal = previous.exhibido + previous.deposito;
      const currentTotal = current.exhibido + current.deposito;
      const sold = Math.max(previousTotal - currentTotal, 0);

      soldSum += sold;
      soldCount += 1;
    }

    const reference = points[0];

    productAverages.push({
      productId: reference.productId,
      productName: reference.productName,
      supplierId: reference.supplierId,
      supplierName: reference.supplierName,
      averageSold: soldCount > 0 ? soldSum / soldCount : 0,
    });
  }

  const byProvider = new Map();

  productAverages.forEach((item) => {
    const bucket = byProvider.get(item.supplierId) || {
      supplierName: item.supplierName,
      sum: 0,
      count: 0,
    };

    bucket.sum += item.averageSold;
    bucket.count += 1;
    byProvider.set(item.supplierId, bucket);
  });

  const providerAverages = Array.from(byProvider.values()).map((bucket) => ({
    supplierName: bucket.supplierName,
    averageSold: bucket.count ? bucket.sum / bucket.count : 0,
  }));

  return {
    productAverages,
    providerAverages,
  };
}

export function initApp() {
  const suppliers = buildSuppliers();

  const suppliersPanel = document.getElementById('suppliersPanel');
  const stockTableBody = document.querySelector('#stockTable tbody');
  const saveBtn = document.getElementById('saveBtn');
  const statusMsg = document.getElementById('statusMsg');
  const resetBtn = document.getElementById('resetBtn');

  const analysisSupplier = document.getElementById('analysisSupplier');
  const analysisProduct = document.getElementById('analysisProduct');
  const analysisPeriod = document.getElementById('analysisPeriod');

  const productAvgTableBody = document.querySelector('#productAvgTable tbody');
  const providerAvgTableBody = document.querySelector('#providerAvgTable tbody');

  let activeSupplierId = suppliers[0].id;
  let draft = createInitialDraft(suppliers);
  let chart;

  function updateClock() {
    const values = todayClock();
    document.getElementById('clock').textContent = values.time;
    document.getElementById('date').textContent = values.date;
  }

  function renderSupplierTabs() {
    suppliersPanel.innerHTML = '';

    suppliers.forEach((supplier) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `supplier-tab ${supplier.id === activeSupplierId ? 'active' : ''}`;
      button.textContent = supplier.name;

      button.addEventListener('click', () => {
        activeSupplierId = supplier.id;
        renderSupplierTabs();
        renderStockTable();
      });

      suppliersPanel.appendChild(button);
    });
  }

  function renderStockTable() {
    const supplier = suppliers.find((item) => item.id === activeSupplierId);
    stockTableBody.innerHTML = '';

    supplier.products.forEach((product) => {
      const values = draft[supplier.id][product.id];
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <div class="product-label">
            <span>${product.name}</span>
            <span class="help-icon" aria-label="Imagen pendiente para ${product.name}">
              ?
              <span class="tooltip">
                <span class="image-placeholder">Espacio para imagen<br/>pendiente de carga</span>
              </span>
            </span>
          </div>
        </td>
        <td>
          <input type="number" min="0" data-product-id="${product.id}" data-field="exhibido" value="${values.exhibido}" />
        </td>
        <td>
          <input type="number" min="0" data-product-id="${product.id}" data-field="deposito" value="${values.deposito}" />
        </td>
      `;
      stockTableBody.appendChild(row);
    });

    const inputs = stockTableBody.querySelectorAll('input[type="number"]');
    inputs.forEach((input) => {
      input.addEventListener('input', () => {
        const { productId, field } = input.dataset;
        draft[activeSupplierId][productId][field] = Number(input.value || 0);
      });
    });
  }

  function buildEntriesForActiveSupplier() {
    const supplier = suppliers.find((item) => item.id === activeSupplierId);

    return supplier.products.map((product) => ({
      supplierId: supplier.id,
      supplierName: supplier.name,
      productId: product.id,
      productName: product.name,
      exhibido: Number(draft[supplier.id][product.id].exhibido || 0),
      deposito: Number(draft[supplier.id][product.id].deposito || 0),
    }));
  }

  function renderSupplierFilter() {
    analysisSupplier.innerHTML = '<option value="all">Todos los proveedores</option>';

    suppliers.forEach((supplier) => {
      const option = document.createElement('option');
      option.value = supplier.id;
      option.textContent = supplier.name;
      analysisSupplier.appendChild(option);
    });
  }

  function renderProductFilter() {
    const selectedSupplier = analysisSupplier.value;
    analysisProduct.innerHTML = '<option value="all">Todos los productos</option>';

    const products = selectedSupplier === 'all'
      ? suppliers.flatMap((supplier) =>
          supplier.products.map((product) => ({
            id: product.id,
            label: `${supplier.name} - ${product.name}`,
          }))
        )
      : suppliers
          .find((supplier) => supplier.id === selectedSupplier)
          .products.map((product) => ({
            id: product.id,
            label: product.name,
          }));

    products.forEach((product) => {
      const option = document.createElement('option');
      option.value = product.id;
      option.textContent = product.label;
      analysisProduct.appendChild(option);
    });
  }

  function renderChart(items) {
    const canvas = document.getElementById('salesChart');

    if (chart) {
      chart.destroy();
    }

    chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: items.map((item) => `${item.supplierName} • ${item.productName}`),
        datasets: [
          {
            label: 'Promedio vendido',
            data: items.map((item) => Number(item.averageSold.toFixed(2))),
            borderColor: '#9a4aa8',
            backgroundColor: 'rgba(154, 74, 168, 0.2)',
            fill: true,
            tension: 0.32,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }

  function renderNoDataRow(tableBody, text, columns) {
    tableBody.innerHTML = `<tr><td colspan="${columns}">${text}</td></tr>`;
  }

  function renderAnalytics() {
    const periodDays = getPeriodDays(analysisPeriod.value);
    const submissions = readSubmissions();

    const result = calculateAverages(
      submissions,
      periodDays,
      analysisSupplier.value,
      analysisProduct.value
    );

    const productItems = result.productAverages.sort((a, b) => b.averageSold - a.averageSold);
    const providerItems = result.providerAverages.sort((a, b) => b.averageSold - a.averageSold);

    productAvgTableBody.innerHTML = '';
    providerAvgTableBody.innerHTML = '';

    if (!productItems.length) {
      renderNoDataRow(productAvgTableBody, 'Sin datos para los filtros elegidos.', 3);
    } else {
      productItems.forEach((item) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${item.productName}</td>
          <td>${item.supplierName}</td>
          <td>${item.averageSold.toFixed(2)}</td>
        `;
        productAvgTableBody.appendChild(row);
      });
    }

    if (!providerItems.length) {
      renderNoDataRow(providerAvgTableBody, 'Sin datos para los filtros elegidos.', 2);
    } else {
      providerItems.forEach((item) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${item.supplierName}</td>
          <td>${item.averageSold.toFixed(2)}</td>
        `;
        providerAvgTableBody.appendChild(row);
      });
    }

    renderChart(productItems);
  }

  function onSave() {
    const now = new Date();
    const newSubmission = {
      createdAt: now.toISOString(),
      createdAtPretty: now.toLocaleString('es-AR'),
      supplierId: activeSupplierId,
      entries: buildEntriesForActiveSupplier(),
    };

    const submissions = readSubmissions();
    submissions.push(newSubmission);
    saveSubmissions(submissions);

    renderAnalytics();
    statusMsg.textContent = `Guardado: ${newSubmission.createdAtPretty}.`;
  }

  function onReset() {
    const accepted = window.confirm(
      'Esto eliminará TODOS los datos históricos guardados. ¿Deseás continuar?'
    );

    if (!accepted) {
      return;
    }

    localStorage.removeItem(STORAGE_KEY);
    renderAnalytics();
    statusMsg.textContent = 'Se eliminaron todos los datos guardados.';
  }

  saveBtn.addEventListener('click', onSave);
  resetBtn.addEventListener('click', onReset);

  analysisSupplier.addEventListener('change', () => {
    renderProductFilter();
    renderAnalytics();
  });

  analysisProduct.addEventListener('change', renderAnalytics);
  analysisPeriod.addEventListener('change', renderAnalytics);

  updateClock();
  setInterval(updateClock, 1000);

  renderSupplierTabs();
  renderStockTable();
  renderSupplierFilter();
  renderProductFilter();
  renderAnalytics();
}
