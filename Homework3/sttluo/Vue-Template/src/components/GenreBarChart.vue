<script setup lang="ts">
import * as d3 from 'd3';
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { isEmpty, debounce } from 'lodash';
import { useSpotifyStore } from '../stores/spotifyStore';
import { ComponentSize, Margin } from '../types';

interface GenreCount { genre: string; count: number; }

const store = useSpotifyStore();
const size = ref<ComponentSize>({ width: 0, height: 0 });
const margin: Margin = { left: 120, right: 20, top: 40, bottom: 30 };
const chartContainer = ref<HTMLElement | null>(null);

// Calculate Top 10 Genres (Same as before)
const processedData = computed<GenreCount[]>(() => {
    if (isEmpty(store.data)) return [];
    const counts: Record<string, number> = {};
    store.data.forEach((d) => {
        d.artist_genres.forEach(g => { if (g) counts[g] = (counts[g] || 0) + 1; });
    });
    return Object.entries(counts).map(([k, v]) => ({ genre: k, count: v }))
        .sort((a, b) => b.count - a.count).slice(0, 10);
});

// Watch the selected genre from store to update bar colors
// 监听 Store 中的选中流派，用于更新柱子颜色
const selectedGenre = computed(() => store.selectedGenre);

function onResize() {
    const target = chartContainer.value;
    if (!target) return;
    size.value = { width: target.clientWidth, height: target.clientHeight };
}

function initChart() {
    if (!chartContainer.value) return;
    const svg = d3.select(chartContainer.value).select('svg');
    svg.selectAll('*').remove();

    const width = size.value.width - margin.left - margin.right;
    const height = size.value.height - margin.top - margin.bottom;
    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    const yScale = d3.scaleBand().range([0, height]).domain(processedData.value.map(d => d.genre)).padding(0.2);
    const xScale = d3.scaleLinear().range([0, width]).domain([0, d3.max(processedData.value, d => d.count) || 0]);

    g.append('g').call(d3.axisLeft(yScale));
    g.append('g').attr('transform', `translate(0, ${height})`).call(d3.axisBottom(xScale).ticks(5));

    // Draw Bars with Click Interaction
    const bars = g.selectAll('rect')
        .data(processedData.value)
        .join('rect')
        .attr('x', 0)
        .attr('y', d => yScale(d.genre) as number)
        // Initial state for animation (width 0) / 动画初始状态
        .attr('width', 0) 
        .attr('height', yScale.bandwidth())
        .attr('fill', d => d.genre === selectedGenre.value ? '#FF5722' : '#1DB954') // Check selection
        .style('cursor', 'pointer'); // Change cursor to indicate clickability

    // --- Interaction 3: Coordinated Filtering (Requirements: Add filtering interaction) ---
    bars.on('click', (event, d) => {
        // Toggle selection in Store
        store.setSelectedGenre(d.genre);
    });

    // --- Animation: Enter Transition (Requirements: Animated transitions) ---
    // Make bars grow from left to right on load
    // 加载时让柱子从左向右生长
    bars.transition()
        .duration(800)
        .attr('width', d => xScale(d.count));

    svg.append('text').attr('x', size.value.width/2).attr('y', 20).attr('text-anchor', 'middle').text('Top 10 Genres (Click to Filter)');
}

// Watch for selection changes to update color ONLY (Substrate Transformation / Visual Change)
// 监听选择变化，只更新颜色
watch(selectedGenre, (newVal) => {
    const svg = d3.select(chartContainer.value).select('svg');
    svg.selectAll('rect')
        .transition().duration(200)
        .attr('fill', (d: any) => d.genre === newVal ? '#FF5722' : '#1DB954');
});

watch([processedData, size], () => { if (processedData.value.length) initChart(); }, { deep: true });
const debouncedOnResize = debounce(onResize, 100);
onMounted(() => { window.addEventListener('resize', debouncedOnResize); onResize(); });
onBeforeUnmount(() => { window.removeEventListener('resize', debouncedOnResize); });
</script>

<template>
    <div class="chart-container" ref="chartContainer"><svg width="100%" height="100%"></svg></div>
</template>

<style scoped>.chart-container { width: 100%; height: 100%; min-height: 200px; }</style>



<!-- <script setup lang="ts">
import * as d3 from 'd3';
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { isEmpty, debounce } from 'lodash';
import { useSpotifyStore } from '../stores/spotifyStore';
import { ComponentSize, Margin } from '../types';

interface GenreCount {
    genre: string;
    count: number;
}

const store = useSpotifyStore();
const size = ref<ComponentSize>({ width: 0, height: 0 });
const margin: Margin = { left: 120, right: 20, top: 40, bottom: 30 };

const chartContainer = ref<HTMLElement | null>(null);

const processedData = computed<GenreCount[]>(() => {
    if (isEmpty(store.data)) return [];

    const counts: Record<string, number> = {};

    store.data.forEach((d) => {
        const rawGenre = d.artist_genres;
        
        
        rawGenre.forEach(g => {
            if (g && g !== "") {
                counts[g] = (counts[g] || 0) + 1;
            }
        });
    });

    const result = Object.entries(counts)
        .map(([key, val]) => ({ genre: key, count: val }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    
    console.log("GenreBarChart Calculated Data:", result);

    return result;
});

const canRender = computed(() => !isEmpty(processedData.value) && size.value.width > 0 && size.value.height > 0);

function onResize() {
    const target = chartContainer.value;
    if (!target) return;
    size.value = { width: target.clientWidth, height: target.clientHeight };
}

function initChart() {
    if (!chartContainer.value) return;
    
    const svg = d3.select(chartContainer.value).select('svg');
    svg.selectAll('*').remove(); 

    const width = size.value.width - margin.left - margin.right;
    const height = size.value.height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);


    const yScale = d3.scaleBand()
        .range([0, height])
        .domain(processedData.value.map(d => d.genre))
        .padding(0.2); 

    const xScale = d3.scaleLinear()
        .range([0, width])
        .domain([0, d3.max(processedData.value, d => d.count) || 0]);

    g.append('g')
        .call(d3.axisLeft(yScale))
        .selectAll("text")
        .style("font-size", "0.75rem")
        .style("font-family", "Arial, sans-serif");

    g.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).ticks(5));

    g.selectAll('rect')
        .data(processedData.value)
        .join('rect')
        .attr('x', 0)
        .attr('y', d => yScale(d.genre) as number)
        .attr('width', d => xScale(d.count))
        .attr('height', yScale.bandwidth())
        .attr('fill', '#1DB954') 
        .attr('opacity', 0.8)
        .on('mouseover', function() { d3.select(this).attr('opacity', 1); })
        .on('mouseout', function() { d3.select(this).attr('opacity', 0.8); });

    g.selectAll('.label')
        .data(processedData.value)
        .join('text')
        .attr('class', 'label')
        .attr('x', d => xScale(d.count) + 5)
        .attr('y', d => (yScale(d.genre) as number) + yScale.bandwidth() / 2)
        .attr('dy', '0.35em')
        .text(d => d.count)
        .style('font-size', '0.7rem')
        .style('fill', '#555');

    svg.append('text')
        .attr('x', size.value.width / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .style('font-family', 'sans-serif')
        .text('Top 10 Artist Genres');
}

watch(
    [processedData, size],
    () => {
        if (canRender.value) initChart();
    },
    { deep: true }
);

const debouncedOnResize = debounce(onResize, 100);

onMounted(() => {
    window.addEventListener('resize', debouncedOnResize);
    onResize();
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', debouncedOnResize);
});
</script>

<template>
    <div class="chart-container" ref="chartContainer">
        <svg width="100%" height="100%"></svg>
    </div>
</template>

<style scoped>
.chart-container {
    width: 100%;
    height: 100%;
    min-height: 200px; 
}
</style> -->