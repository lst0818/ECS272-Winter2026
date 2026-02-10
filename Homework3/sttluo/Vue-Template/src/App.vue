
<template>
  <v-app> 
    <v-main>
      <div class="dashboard-layout">
        <header class="header">
          <h1>Spotify Visual Analytics</h1>
        </header>

        <div class="content">
            <!-- Context (Scatter) -->
            <div class="view-panel overview">
                <ScatterOverview />
            </div>

            <!-- Focus -->
            <div class="view-panel focus-left">
                <GenreBarChart />
            </div>
            <div class="view-panel focus-right">
                <ParallelCoordinates />
            </div>
        </div>
      </div>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useSpotifyStore } from './stores/spotifyStore';
import ScatterOverview from './components/ScatterOverview.vue';
import GenreBarChart from './components/GenreBarChart.vue';
import ParallelCoordinates from './components/ParallelCoordinates.vue';

const store = useSpotifyStore();

onMounted(() => {
    store.loadData();
});
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 20px;
  background: #f0f2f5;
}

.content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1.5fr 1fr; 
  gap: 20px;
  grid-template-areas: 
    "overview overview"
    "bar parallel";
}

.view-panel {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  padding: 10px;
  overflow: hidden;
}

.overview { grid-area: overview; }
.focus-left { grid-area: bar; }
.focus-right { grid-area: parallel; }
</style>