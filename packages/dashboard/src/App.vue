<template>
  <div class="dashboard-shell">
    <DashboardView />
  </div>
</template>

<script>
import DashboardView from "./components/Dashboard.vue";

export default {
  name: "App",
  components: { DashboardView },
};
</script>

<style>
/* Reset applied only within this Vue app's root element. */
.dashboard-shell {
  box-sizing: border-box;
  font-family: "Roboto", Arial, sans-serif;
}

.dashboard-shell *,
.dashboard-shell *::before,
.dashboard-shell *::after {
  box-sizing: inherit;
}
</style>
