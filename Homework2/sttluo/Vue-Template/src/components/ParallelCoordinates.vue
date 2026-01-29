<script setup lang="ts">
import * as d3 from 'd3';
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { isEmpty, debounce } from 'lodash';
import { useSpotifyStore } from '../stores/spotifyStore';
import { ComponentSize, Margin } from '../types';

const store = useSpotifyStore();
const size = ref<ComponentSize>({ width: 0, height: 0 });
const margin: Margin = { left: 30, right: 30, top: 40, bottom: 20 };

const chartContainer = ref<HTMLElement | null>(null);

const subsetData = computed(() => {
    if (isEmpty(store.data)) return [];
    return store.data.slice(0, 200); 
});

const canRender = computed(() => !isEmpty(subsetData.value) && size.value.width > 0 && size.value.height > 0);

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

    const dimensions = ['track_duration_min', 'track_popularity', 'artist_popularity'];
    

    const yScales: Record<string, d3.ScaleLinear<number, number>> = {};
    dimensions.forEach(dim => {
        const domain = d3.extent(store.data, (d: any) => +d[dim]) as [number, number];
        yScales[dim] = d3.scaleLinear()
            .domain(domain)
            .range([height, 0]);
    });

    
    const xScale = d3.scalePoint()
        .range([0, width])
        .padding(1)
        .domain(dimensions);

    
    const lineGenerator = (d: any) => {
        return d3.line()(dimensions.map(p => [xScale(p) as number, yScales[p](d[p])]));
    };

    
    g.selectAll('path')
        .data(subsetData.value)
        .join('path')
        .attr('d', lineGenerator)
        .style('fill', 'none')
        .style('stroke', '#4e79a7')
        .style('opacity', 0.4);

    
    g.selectAll('myAxis')
        .data(dimensions)
        .enter()
        .append('g')
        .attr('transform', d => `translate(${xScale(d)}, 0)`)
        .each(function(d) { d3.select(this).call(d3.axisLeft(yScales[d])); })
        
        .append('text')
        .style('text-anchor', 'middle')
        .attr('y', -9)
        .text(d => d)
        .style('fill', 'black')
        .style('font-size', '0.55rem');
    
    
    svg.append('text')
        .attr('x', size.value.width / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .text('Multivariate Analysis (Sampled)');
}

watch(
    [subsetData, size],
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
path {
    transition: opacity 0.2s;
}
</style>