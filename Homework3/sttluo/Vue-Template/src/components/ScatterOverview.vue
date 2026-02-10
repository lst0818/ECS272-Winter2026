<script setup lang="ts">
import * as d3 from 'd3';
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { isEmpty, debounce } from 'lodash';
import { useSpotifyStore } from '../stores/spotifyStore';
import { ComponentSize, Margin } from '../types';

const store = useSpotifyStore();
const size = ref<ComponentSize>({ width: 0, height: 0 });
const margin: Margin = { left: 50, right: 20, top: 40, bottom: 50 };

const chartContainer = ref<HTMLElement | null>(null);
// Ref for the tooltip element
// 用于 tooltip 的 DOM 引用
const tooltip = ref<HTMLElement | null>(null);

// Use raw data for the base plot, but we will style them based on filtered state
// 使用原始数据绘制底图，但我们会根据过滤状态改变样式
const allData = computed(() => store.data);
const selectedGenre = computed(() => store.selectedGenre);

const canRender = computed(() => !isEmpty(allData.value) && size.value.width > 0 && size.value.height > 0);

function onResize() {
    const target = chartContainer.value;
    if (!target) return;
    size.value = { width: target.clientWidth, height: target.clientHeight };
}

function initChart() {
    const svg = d3.select(chartContainer.value).select('svg');
    svg.selectAll('*').remove();

    const width = size.value.width - margin.left - margin.right;
    const height = size.value.height - margin.top - margin.bottom;
    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    const xScale = d3.scaleLinear().domain([0, 100]).range([0, width]);
    const yScale = d3.scaleLinear().domain([0, 100]).range([height, 0]);
    const colorScale = d3.scaleOrdinal().domain(['album', 'single', 'compilation']).range(['#1DB954', '#191414', '#FF5722']);

    g.append('g').attr('transform', `translate(0, ${height})`).call(d3.axisBottom(xScale));
    g.append('g').call(d3.axisLeft(yScale));

    // Draw Circles
    const circles = g.selectAll('circle')
        .data(allData.value)
        .join('circle')
        .attr('cx', d => xScale(d.artist_popularity))
        .attr('cy', d => yScale(d.track_popularity))
        .attr('r', 3)
        .attr('fill', d => colorScale(d.album_type) as string)
        .attr('opacity', 0.5); // Default opacity

    // --- Interaction 1: Tooltip (Requirements: Tooltip) ---
    circles
        .on('mouseover', (event, d) => {
            if (!tooltip.value) return;
            
            // Highlight the hovered circle
            d3.select(event.currentTarget).attr('r', 6).attr('stroke', 'black');

            // Show Tooltip
            tooltip.value.style.opacity = '1';
            tooltip.value.style.left = `${event.pageX + 10}px`;
            tooltip.value.style.top = `${event.pageY - 10}px`;
            tooltip.value.innerHTML = `
                <strong>${d.track_name}</strong><br/>
                Artist: ${d.artist_name}<br/>
                Popularity: ${d.track_popularity}
            `;
        })
        .on('mouseout', (event) => {
            if (!tooltip.value) return;
            
            // Restore circle
            d3.select(event.currentTarget).attr('r', 3).attr('stroke', 'none');
            // Hide Tooltip
            tooltip.value.style.opacity = '0';
        });

    // Titles (omitted for brevity, same as HW2)
    svg.append('text').attr('x', size.value.width/2).attr('y', 20).attr('text-anchor', 'middle').text('Overview: Artist vs Track Popularity');
}

// --- Interaction 2: Animated Transition (Requirements: Animation & Filtering) ---
// Watch for changes in the selected genre to trigger animation
// 监听选中流派的变化以触发动画
watch(selectedGenre, (newGenre) => {
    const svg = d3.select(chartContainer.value).select('svg');
    
    // Select all circles and apply transition
    // 选中所有圆点并应用过渡效果
    svg.selectAll('circle')
        .transition() // Start animation
        .duration(750) // Duration 750ms (Requirements: "Make transitions as long as needed")
        .style('opacity', (d: any) => {
            // If no genre selected, show all (0.5). If selected, dim others to 0.05
            // 如果没选流派，显示所有(0.5)。如果选了，把不相关的淡化到 0.05
            if (!newGenre) return 0.5;
            return d.artist_genres.includes(newGenre) ? 1 : 0.05;
        })
        .attr('r', (d: any) => {
             if (!newGenre) return 3;
             return d.artist_genres.includes(newGenre) ? 5 : 2; // Make selected larger
        });
});

watch([allData, size], () => { if (canRender.value) initChart(); }, { deep: true });

const debouncedOnResize = debounce(onResize, 100);
onMounted(() => { window.addEventListener('resize', debouncedOnResize); onResize(); });
onBeforeUnmount(() => { window.removeEventListener('resize', debouncedOnResize); });
</script>

<template>
    <div class="chart-container" ref="chartContainer">
        <svg width="100%" height="100%"></svg>
        <!-- Tooltip Element -->
        <div ref="tooltip" class="tooltip"></div>
    </div>
</template>

<style scoped>
.chart-container { width: 100%; height: 100%; position: relative; }

/* Tooltip Styles */
.tooltip {
    position: absolute;
    background-color: white;
    border: 1px solid #ddd;
    padding: 8px;
    border-radius: 4px;
    pointer-events: none; /* Prevent tooltip from blocking mouse events */
    opacity: 0;
    transition: opacity 0.2s;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    font-size: 0.8rem;
    z-index: 10;
}
</style>

<!-- <script setup lang="ts">
import * as d3 from 'd3';
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { isEmpty, debounce } from 'lodash';
import { useSpotifyStore } from '../stores/spotifyStore';
import { ComponentSize, Margin, SpotifyTrack } from '../types';

const store = useSpotifyStore();
const size = ref<ComponentSize>({ width: 0, height: 0 });
const margin: Margin = { left: 50, right: 20, top: 40, bottom: 50 };

const chartContainer = ref<HTMLElement | null>(null);


const spotifyData = computed(() => store.data);


const canRender = computed(() => !isEmpty(spotifyData.value) && size.value.width > 0 && size.value.height > 0);

function onResize() {
    const target = chartContainer.value;
    if (!target) return;
    size.value = { width: target.clientWidth, height: target.clientHeight };
}

function initChart() {
    
    const svg = d3.select(chartContainer.value).select('svg');
    svg.selectAll('*').remove(); 

    const width = size.value.width - margin.left - margin.right;
    const height = size.value.height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    const xScale = d3.scaleLinear()
        .domain([0, 100])
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0]);

    const colorScale = d3.scaleOrdinal()
        .domain(['album', 'single', 'compilation'])
        .range(['#1DB954', '#191414', '#FF5722']);

    g.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));

    g.append('g')
        .call(d3.axisLeft(yScale));

    g.selectAll('circle')
        .data(spotifyData.value)
        .join('circle')
        .attr('cx', (d) => xScale(d.artist_popularity))
        .attr('cy', (d) => yScale(d.track_popularity))
        .attr('r', 3)
        .attr('fill', (d) => colorScale(d.album_type) as string)
        .attr('opacity', 0.5);

    svg.append('text')
        .attr('x', size.value.width / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .text('Overview: Artist vs Track Popularity');

    g.append('text')
        .attr('transform', `translate(${width / 2}, ${height + 35})`)
        .style('text-anchor', 'middle')
        .style('font-size', '0.8rem')
        .text('Artist Popularity');

    g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -35)
        .attr('x', -height / 2)
        .style('text-anchor', 'middle')
        .style('font-size', '0.8rem')
        .text('Track Popularity');
    
    const legend = svg.append('g').attr('transform', `translate(${size.value.width - 100}, 20)`);
    ['album', 'single'].forEach((type, i) => {
        legend.append('circle').attr('cy', i*15).attr('r', 4).style('fill', colorScale(type) as string);
        legend.append('text').attr('x', 10).attr('y', i*15 + 4).text(type).style('font-size', '10px');
    });
}

watch(
    [spotifyData, size],
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
}
</style> -->