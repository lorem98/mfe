<template>
  <div class="dashboard">
    <!-- ── Header ────────────────────────────────────────────────── -->
    <div class="dashboard-header">
      <div>
        <h2 class="dashboard-title">Analytics Dashboard</h2>
        <p class="dashboard-sub">
          Rendered by <strong>Vue 3</strong> + <strong>Chart.js</strong> —
          mounted into the React container via
          <strong>Webpack Module Federation</strong>.
        </p>
      </div>
      <span class="badge">Vue 3</span>
    </div>

    <!-- ── KPI cards ─────────────────────────────────────────────── -->
    <div class="stats-grid">
      <div v-for="stat in stats" :key="stat.label" class="stat-card">
        <span class="stat-icon">{{ stat.icon }}</span>
        <span class="stat-value">{{ stat.value }}</span>
        <span class="stat-label">{{ stat.label }}</span>
        <span :class="['stat-trend', stat.up ? 'up' : 'down']">
          {{ stat.up ? "▲" : "▼" }} {{ stat.trend }}
        </span>
      </div>
    </div>

    <!-- ── Charts ────────────────────────────────────────────────── -->
    <div class="charts-grid">
      <div class="chart-card">
        <h3 class="chart-title">Monthly Signups</h3>
        <div class="chart-wrapper">
          <canvas ref="barChartRef"></canvas>
        </div>
      </div>

      <div class="chart-card">
        <h3 class="chart-title">Plan Distribution</h3>
        <div class="chart-wrapper">
          <canvas ref="doughnutChartRef"></canvas>
        </div>
      </div>
    </div>

    <!-- ── Recent activity table ─────────────────────────────────── -->
    <div class="table-card">
      <h3 class="chart-title">Recent Activity</h3>
      <table class="activity-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Action</th>
            <th>Plan</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in activity" :key="row.id">
            <td>{{ row.user }}</td>
            <td>{{ row.action }}</td>
            <td>{{ row.plan }}</td>
            <td>{{ row.date }}</td>
            <td>
              <span :class="['status-badge', row.status.toLowerCase()]">
                {{ row.status }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from "vue";
import Chart from "chart.js/auto";

export default {
  name: "Dashboard",
  setup() {
    const barChartRef = ref(null);
    const doughnutChartRef = ref(null);
    let barInstance = null;
    let doughnutInstance = null;

    const stats = [
      { icon: "👥", label: "Total Users", value: "12,450", trend: "8.2%", up: true },
      { icon: "🟢", label: "Active Now", value: "1,230", trend: "3.1%", up: true },
      { icon: "💸", label: "Revenue", value: "$45,230", trend: "12.5%", up: true },
      { icon: "📉", label: "Churn Rate", value: "2.4%", trend: "0.3%", up: false },
    ];

    const activity = [
      { id: 1, user: "alice@example.com", action: "Sign up", plan: "Pro", date: "2026-05-06", status: "Active" },
      { id: 2, user: "bob@example.com", action: "Upgrade", plan: "Enterprise", date: "2026-05-05", status: "Active" },
      { id: 3, user: "carol@example.com", action: "Sign up", plan: "Free", date: "2026-05-05", status: "Pending" },
      { id: 4, user: "dave@example.com", action: "Cancel", plan: "Pro", date: "2026-05-04", status: "Inactive" },
      { id: 5, user: "eve@example.com", action: "Sign up", plan: "Pro", date: "2026-05-03", status: "Active" },
    ];

    onMounted(() => {
      barInstance = new Chart(barChartRef.value, {
        type: "bar",
        data: {
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          datasets: [
            {
              label: "New signups",
              data: [120, 190, 300, 250, 420, 380],
              backgroundColor: "rgba(63, 81, 181, 0.55)",
              borderColor: "rgba(63, 81, 181, 1)",
              borderWidth: 1,
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "top" },
          },
          scales: {
            y: { beginAtZero: true },
          },
        },
      });

      doughnutInstance = new Chart(doughnutChartRef.value, {
        type: "doughnut",
        data: {
          labels: ["Free", "Pro", "Enterprise"],
          datasets: [
            {
              data: [65, 25, 10],
              backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
              hoverOffset: 8,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom" },
          },
        },
      });
    });

    onUnmounted(() => {
      barInstance?.destroy();
      doughnutInstance?.destroy();
    });

    return { barChartRef, doughnutChartRef, stats, activity };
  },
};
</script>

<style scoped>
.dashboard {
  padding: 24px;
  background: #f5f6fa;
  min-height: 100vh;
}

/* Header */
.dashboard-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
}

.dashboard-title {
  font-size: 1.6rem;
  font-weight: 700;
  margin: 0 0 4px;
  color: #1a1a2e;
}

.dashboard-sub {
  font-size: 0.85rem;
  color: #666;
  margin: 0;
}

.badge {
  background: #42b883;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 12px;
  letter-spacing: 0.5px;
}

/* KPI cards */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 10px;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  font-size: 1.4rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a2e;
}

.stat-label {
  font-size: 0.8rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-trend {
  font-size: 0.8rem;
  font-weight: 600;
}

.stat-trend.up {
  color: #27ae60;
}

.stat-trend.down {
  color: #e74c3c;
}

/* Charts */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.chart-card,
.table-card {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.chart-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 16px;
  color: #1a1a2e;
}

.chart-wrapper {
  position: relative;
  height: 240px;
}

/* Activity table */
.activity-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.activity-table th {
  text-align: left;
  padding: 8px 12px;
  border-bottom: 2px solid #eee;
  color: #888;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
}

.activity-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f0;
  color: #333;
}

.activity-table tr:last-child td {
  border-bottom: none;
}

.status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.active {
  background: #e6f9f0;
  color: #27ae60;
}

.status-badge.pending {
  background: #fff8e1;
  color: #f39c12;
}

.status-badge.inactive {
  background: #fdecea;
  color: #e74c3c;
}
</style>
