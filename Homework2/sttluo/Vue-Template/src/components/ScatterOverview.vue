<script setup lang="ts">
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
</style>