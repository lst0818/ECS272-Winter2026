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

// Use FILTERED data from store
// 使用 Store 中被过滤后的数据
const displayData = computed(() => {
    // If filtered data is too large, slice it. If filtered by genre, show all (usually < 200)
    // 如果数据太大就截取。如果已经按流派过滤了，通常数据量不大，可以全显示
    const data = store.filteredData;
    return data.length > 200 ? data.slice(0, 200) : data;
});

const canRender = computed(() => !isEmpty(displayData.value) && size.value.width > 0);

function onResize() {
    const target = chartContainer.value;
    if (!target) return;
    size.value = { width: target.clientWidth, height: target.clientHeight };
}

function initChart() {
    const svg = d3.select(chartContainer.value).select('svg');
    svg.selectAll('*').remove();

    if (displayData.value.length === 0) return;

    const width = size.value.width - margin.left - margin.right;
    const height = size.value.height - margin.top - margin.bottom;
    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    const dimensions = ['track_duration_min', 'track_popularity', 'artist_popularity'];
    
    // Y Scales need to be based on GLOBAL data extent to keep context steady
    // Y 轴比例尺必须基于全局数据范围，保持上下文稳定，不要因为过滤而跳变
    const yScales: Record<string, d3.ScaleLinear<number, number>> = {};
    dimensions.forEach(dim => {
        const domain = d3.extent(store.data, (d: any) => +d[dim]) as [number, number];
        if (domain[0] === domain[1]) domain[1] = domain[0] + 1;
        yScales[dim] = d3.scaleLinear().domain(domain).range([height, 0]);
    });

    const xScale = d3.scalePoint().range([0, width]).padding(1).domain(dimensions);

    const lineGenerator = (d: any) => d3.line()(dimensions.map(p => [+xScale(p)!, yScales[p](+d[p])]));

    // Draw paths with transition (Update pattern)
    // 绘制路径，加入过渡
    g.selectAll('path')
        .data(displayData.value, (d: any) => d.track_id) // Key by ID for correct update
        .join(
            enter => enter.append('path')
                .attr('d', lineGenerator)
                .style('fill', 'none')
                .style('stroke', '#4e79a7')
                .style('opacity', 0)
                .call(enter => enter.transition().duration(1000).style('opacity', 0.4)),
            update => update
                .call(update => update.transition().duration(1000).style('stroke', '#FF5722').style('opacity', 0.6)),
            exit => exit.transition().duration(500).style('opacity', 0).remove()
        );

    // Axes
    g.selectAll('myAxis').data(dimensions).enter().append('g')
        .attr('transform', d => `translate(${xScale(d)}, 0)`)
        .each(function(d) { d3.select(this).call(d3.axisLeft(yScales[d])); })
        .append('text').attr('y', -9).text(d => d).style('fill', 'black').style('font-size', '0.8rem');
        
    svg.append('text').attr('x', size.value.width/2).attr('y', 20).attr('text-anchor', 'middle').text('Multivariate Analysis (Filtered)');
}

watch([displayData, size], () => { if (canRender.value) initChart(); }, { deep: true });
// ... Resize logic same as above
const debouncedOnResize = debounce(onResize, 100);
onMounted(() => { window.addEventListener('resize', debouncedOnResize); onResize(); });
onBeforeUnmount(() => { window.removeEventListener('resize', debouncedOnResize); });
</script>

<template><div class="chart-container" ref="chartContainer"><svg width="100%" height="100%"></svg></div></template>
<style scoped>.chart-container { width: 100%; height: 100%; }</style>


<!-- <script setup lang="ts">
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
</style> -->