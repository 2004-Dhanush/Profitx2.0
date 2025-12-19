document.addEventListener('DOMContentLoaded', () => {

    // ================= PART 1: DATA ENTRY & STORAGE =================

    const dateInput = document.getElementById('dateInput');
    const investmentInput = document.getElementById('investInput');
    const cashInput = document.getElementById('cashInput');
    const gpayInput = document.getElementById('gpayInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const historyTableBody = document.getElementById('historyTableBody');

    let entries = JSON.parse(localStorage.getItem('profit_entries')) || [];

    if (historyTableBody) {
        if (dateInput) dateInput.valueAsDate = new Date();
        renderTable();
        if (uploadBtn) uploadBtn.addEventListener('click', addEntry);
    }

    function addEntry() {
        const date = dateInput.value;
        const investment = parseFloat(investmentInput.value);
        const cash = parseFloat(cashInput.value);
        const gpay = parseFloat(gpayInput.value);

        if (!date || isNaN(investment) || isNaN(cash) || isNaN(gpay)) {
            alert('Fill all fields correctly');
            return;
        }

        const profit = (cash + gpay) - investment;

        entries.push({
            id: Date.now(),
            date,
            investment,
            cash,
            gpay,
            profit
        });

        localStorage.setItem('profit_entries', JSON.stringify(entries));
        renderTable();
        updateDashboard(); // 🔹 update cards + chart
        clearInputs();
    }

    function deleteEntry(id) {
        entries = entries.filter(e => e.id !== id);
        localStorage.setItem('profit_entries', JSON.stringify(entries));
        renderTable();
        updateDashboard(); // 🔹 update cards + chart
    }

    window.triggerDelete = function (id) {
        if (confirm('Delete this entry?')) deleteEntry(id);
    };

    function renderTable() {
        if (!historyTableBody) return;

        historyTableBody.innerHTML = '';

        [...entries]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .forEach(e => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${e.date}</td>
                    <td>${e.investment}</td>
                    <td>${e.cash}</td>
                    <td>${e.gpay}</td>
                    <td class="${e.profit >= 0 ? 'profit-positive' : 'profit-negative'}">${e.profit}</td>
                    <td>
                        <button onclick="triggerDelete(${e.id})">
                            <span class="material-icons-round">delete</span>
                        </button>
                    </td>`;
                historyTableBody.appendChild(row);
            });
    }

    function clearInputs() {
        if (investmentInput) investmentInput.value = '';
        if (cashInput) cashInput.value = '';
        if (gpayInput) gpayInput.value = '';
    }

    // ================= PART 2: DASHBOARD =================

    const chartCanvas = document.getElementById('incomeChart');

    const displayCash = document.getElementById('displayCash');
    const displayGPay = document.getElementById('displayGPay');
    const displayTotal = document.getElementById('displayTotal');
    const displayTotalInvest = document.getElementById('displayTotalInvest');
    const displayTotalProfit = document.getElementById('displayTotalProfit');

    const todayTime = document.getElementById('displayTime');
    const todayDate = document.getElementById('displayDate');
    const displayTodayProfit = document.getElementById('displayTodayProfit');
    const displayTodayInvest = document.getElementById('displayTodayInvest');

    const monthFilter = document.getElementById('monthFilter');
    const yearFilter = document.getElementById('yearFilter');

    let profitChartInstance = null;

    // 🔹 Live Clock
    updateDateTime();
    setInterval(updateDateTime, 1000);

    function updateDateTime() {
        if (!todayTime || !todayDate) return;

        const now = new Date();
        todayTime.textContent = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });

        todayDate.textContent = now.toLocaleDateString('en-GB', {
            weekday: 'long',
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    // 🔹 Dashboard Totals + Chart
    updateDashboard();

    // 🔹 Apply filter event
    if (monthFilter) monthFilter.addEventListener('change', updateDashboard);
    if (yearFilter) yearFilter.addEventListener('change', updateDashboard);

    function updateDashboard() {
        let sumCash = 0;
        let sumGPay = 0;
        let sumInvest = 0;
        let sumProfit = 0; // 🔹 For monthly profit

        const map = new Map();

        const selectedMonth = monthFilter?.value || '';
        const selectedYear = yearFilter?.value || '';

        // 🔹 Filter entries based on selected month/year
        const filteredEntries = entries.filter(e => {
            const [y, m] = e.date.split('-');
            if (selectedYear && selectedMonth) return y === selectedYear && m === selectedMonth;
            if (selectedYear) return y === selectedYear;
            if (selectedMonth) return m === selectedMonth;
            return true;
        });

        filteredEntries.forEach(e => {
            sumCash += e.cash;
            sumGPay += e.gpay;
            sumInvest += e.investment;
            sumProfit += e.profit;

            map.set(e.date, (map.get(e.date) || 0) + e.profit);
        });

        if (displayCash) displayCash.textContent = formatCurrency(sumCash);
    if (displayGPay) displayGPay.textContent = formatCurrency(sumGPay);
    if (displayTotal) displayTotal.textContent = formatCurrency(sumCash + sumGPay);
    if (displayTotalInvest) displayTotalInvest.textContent = formatCurrency(sumInvest);

    // 🔹 Monthly Profit Card
    if (displayTotalProfit) displayTotalProfit.textContent = formatCurrency(sumProfit);

    // 🔹 Update filtered table if needed
    renderFilteredTable(filteredEntries);

    // 🔹 Update tfoot totals
    const totalInvestFooter = document.getElementById('total-invest');
    const totalCashFooter = document.getElementById('total-cash');
    const totalGPayFooter = document.getElementById('total-gpay');
    const totalProfitFooter = document.getElementById('total-profit');

    if (totalInvestFooter) totalInvestFooter.textContent = formatCurrency(sumInvest);
    if (totalCashFooter) totalCashFooter.textContent = formatCurrency(sumCash);
    if (totalGPayFooter) totalGPayFooter.textContent = formatCurrency(sumGPay);
    if (totalProfitFooter) totalProfitFooter.textContent = formatCurrency(sumProfit);
        // 🔹 Chart
        if (!chartCanvas || typeof Chart === 'undefined') return;
        const labels = [...map.keys()].sort();
        const data = labels.map(d => map.get(d));
        renderChart(labels, data);
    }

    function renderFilteredTable(filteredEntries) {
        if (!historyTableBody) return;
        historyTableBody.innerHTML = '';

        filteredEntries
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .forEach(e => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${e.date}</td>
                    <td>${e.investment}</td>
                    <td>${e.cash}</td>
                    <td>${e.gpay}</td>
                    <td class="${e.profit >= 0 ? 'profit-positive' : 'profit-negative'}">${e.profit}</td>
                    <td>
                        <button onclick="triggerDelete(${e.id})">
                            <span class="material-icons-round">delete</span>
                        </button>
                    </td>`;
                historyTableBody.appendChild(row);
            });
    }

function renderChart(labels, data) {
    if (profitChartInstance) profitChartInstance.destroy();

    profitChartInstance = new Chart(chartCanvas, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Profit',
                data,
                borderColor: '#84cc16',
                backgroundColor: 'rgba(132,204,22,0.3)',
                fill: true,
                tension: 0.3,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,

            // ⭐ IMPORTANT FIX
            interaction: {
                mode: 'index',
                intersect: false
            },

            plugins: {
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function (context) {
                            return `Date: ${context.label} | Profit: ₹${context.parsed.y.toLocaleString('en-IN')}`;
                        }
                    }
                }
            },

            scales: {
                y: {
                    ticks: {
                        callback: value => '₹' + value.toLocaleString('en-IN')
                    }
                }
            }
        }
    });
}


    // 🔹 Today Card
    if (displayTodayProfit) {
        updateTodayCard();
        setInterval(updateTodayCard, 60000);
    }

    function updateTodayCard() {
        const today = new Date().toISOString().slice(0, 10);
        let p = 0, i = 0;

        entries.filter(e => e.date === today).forEach(e => {
            p += e.profit;
            i += e.investment;
        });

        displayTodayProfit.textContent = formatCurrency(p);
        if (displayTodayInvest) displayTodayInvest.textContent = formatCurrency(i);
    }

    function formatCurrency(num) {
        return '₹' + num.toLocaleString('en-IN');
    }

});
