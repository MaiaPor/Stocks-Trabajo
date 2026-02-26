const STORAGE_KEY = 'stock_submissions_v1';

const suppliersData = [
  {
    id: 'coca',
    name: 'Coca',
    products: [
      {
        id: 'coca-600',
        name: 'Coca 600ml',
        image:
          'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'coca-15',
        name: 'Coca 1.5L',
        image:
          'https://images.unsplash.com/photo-1596803244618-8c4f0ef4dbe8?auto=format&fit=crop&w=400&q=80',
      },
    ],
  },
  {
    id: 'baires',
    name: 'Baires',
    products: [
      {
        id: 'baires-agua',
        name: 'Agua Baires',
        image:
          'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'baires-soda',
        name: 'Soda Baires',
        image:
          'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?auto=format&fit=crop&w=400&q=80',
      },
    ],
  },
  {
    id: 'brancor',
    name: 'Brancor',
    products: [
      {
        id: 'brancor-queso',
        name: 'Queso Cremoso',
        image:
          'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'brancor-yogur',
        name: 'Yogur Firme',
        image:
          'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400&q=80',
      },
    ],
  },
];

const suppliersPanel = document.getElementById('suppliersPanel');
const stockTableBody = document.querySelector('#stockTable tbody');
const saveBtn = document.getElementById('saveBtn');
const statusMsg = document.getElementById('statusMsg');
const periodSelect = document.getElementById('periodSelect');
const productAvgTableBody = document.querySelector('#productAvgTable tbody');
const providerAvgTableBody = document.querySelector('#providerAvgTable tbody');

let activeSupplierId = suppliersData[0].id;
let chart;

function updateDateTime() {
  const now = new Date();
  const time = now.toLocaleTimeString('es-AR');
  const date = now.toLocaleDateString('es-AR');
  document.getElementById('clock').textContent = time;
  document.getElementById('date').textContent = date;
}

function renderSupplierTabs() {
  suppliersPanel.innerHTML = '';

  suppliersData.forEach((supplier) => {
    const btn = document.createElement('button');
    btn.className = `supplier-tab ${supplier.id === activeSupplierId ? 'active' : ''}`;
    btn.textContent = supplier.name;
    btn.type = 'button';

    btn.addEventListener('click', () => {
      activeSupplierId = supplier.id;
      renderSupplierTabs();
      renderStockTable();
    });

    suppliersPanel.appendChild(btn);
  });
}

function renderStockTable() {
  const supplier = suppliersData.find((s) => s.id === activeSupplierId);
  stockTableBody.innerHTML = '';

  supplier.products.forEach((product) => {
    const row = document.createElement('tr');

    row.innerHTML = `
      <td>
        <div class="product-label">
          <span>${product.name}</span>
          <span class="help-icon" aria-label="Ver foto de ${product.name}">
            ?
            <span class="tooltip">
              <img src="${product.image}" alt="Foto de ${product.name}" />
            </span>
          </span>
        </div>
      </td>
      <td><input type="number" min="0" data-product-id="${product.id}" data-field="exhibido" value="0" /></td>
      <td><input type="number" min="0" data-product-id="${product.id}" data-field="deposito" value="0" /></td>
    `;

    stockTableBody.appendChild(row);
  });
}

function getFormEntries() {
  const supplier = suppliersData.find((s) => s.id === activeSupplierId);
  const entries = [];

  supplier.products.forEach((product) => {
    const exhibidoInput = document.querySelector(
      `input[data-product-id="${product.id}"][data-field="exhibido"]`
    );
    const depositoInput = document.querySelector(
      `input[data-product-id="${product.id}"][data-field="deposito"]`
    );

    entries.push({
      supplierId: supplier.id,
      supplierName: supplier.name,
      productId: product.id,
      productName: product.name,
      exhibido: Number(exhibidoInput.value || 0),
      deposito: Number(depositoInput.value || 0),
    });
  });

  return entries;
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

function saveSubmission(newSubmission) {
  const submissions = readSubmissions();
  submissions.push(newSubmission);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
}

function getPeriodDays() {
  const map = {
    weekly: 7,
    biweekly: 15,
    monthly: 30,
  };

  return map[periodSelect.value] || 7;
}

function calculateSalesAverages() {
  const submissions = readSubmissions().sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );

  const periodDays = getPeriodDays();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - periodDays);

  const entriesByProduct = new Map();

  submissions.forEach((submission) => {
    submission.entries.forEach((entry) => {
      const arr = entriesByProduct.get(entry.productId) || [];
      arr.push({
        ...entry,
        createdAt: submission.createdAt,
      });
      entriesByProduct.set(entry.productId, arr);
    });
  });

  const productAverages = [];

  for (const [, entries] of entriesByProduct) {
    entries.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    let sumSold = 0;
    let points = 0;

    for (let i = 1; i < entries.length; i += 1) {
      const prev = entries[i - 1];
      const curr = entries[i];
      const date = new Date(curr.createdAt);

      if (date < cutoff) {
        continue;
      }

      const prevTotal = prev.exhibido + prev.deposito;
      const currTotal = curr.exhibido + curr.deposito;
      const sold = Math.max(prevTotal - currTotal, 0);

      sumSold += sold;
      points += 1;
    }

    const anyEntry = entries[0];

    productAverages.push({
      productId: anyEntry.productId,
      productName: anyEntry.productName,
      supplierName: anyEntry.supplierName,
      avgSold: points > 0 ? sumSold / points : 0,
    });
  }

  const providerMap = new Map();

  productAverages.forEach((item) => {
    const bucket = providerMap.get(item.supplierName) || { sum: 0, count: 0 };
    bucket.sum += item.avgSold;
    bucket.count += 1;
    providerMap.set(item.supplierName, bucket);
  });

  const providerAverages = Array.from(providerMap.entries()).map(([provider, val]) => ({
    provider,
    avgSold: val.count ? val.sum / val.count : 0,
  }));

  return {
    productAverages,
    providerAverages,
  };
}

function renderAverageTables() {
  const { productAverages, providerAverages } = calculateSalesAverages();

  productAvgTableBody.innerHTML = '';
  providerAvgTableBody.innerHTML = '';

  productAverages
    .sort((a, b) => b.avgSold - a.avgSold)
    .forEach((item) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.productName}</td>
        <td>${item.supplierName}</td>
        <td>${item.avgSold.toFixed(2)}</td>
      `;
      productAvgTableBody.appendChild(row);
    });

  providerAverages
    .sort((a, b) => b.avgSold - a.avgSold)
    .forEach((item) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.provider}</td>
        <td>${item.avgSold.toFixed(2)}</td>
      `;
      providerAvgTableBody.appendChild(row);
    });

  renderChart(productAverages);
}

function renderChart(productAverages) {
  const ctx = document.getElementById('salesChart');

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: productAverages.map((x) => x.productName),
      datasets: [
        {
          label: 'Promedio vendido',
          data: productAverages.map((x) => x.avgSold.toFixed(2)),
          borderColor: '#9a4aa8',
          backgroundColor: 'rgba(154, 74, 168, 0.2)',
          tension: 0.35,
          fill: true,
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

function onSave() {
  const now = new Date();
  const submission = {
    createdAt: now.toISOString(),
    createdAtPretty: now.toLocaleString('es-AR'),
    supplierId: activeSupplierId,
    entries: getFormEntries(),
  };

  saveSubmission(submission);
  renderAverageTables();

  statusMsg.textContent = `Datos guardados correctamente (${submission.createdAtPretty}).`;
}

saveBtn.addEventListener('click', onSave);
periodSelect.addEventListener('change', renderAverageTables);

updateDateTime();
setInterval(updateDateTime, 1000);
renderSupplierTabs();
renderStockTable();
renderAverageTables();
