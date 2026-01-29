// src/stores/spotifyStore.ts
import { defineStore } from 'pinia';
import * as d3 from 'd3';
import { SpotifyTrack } from '../types';

export const useSpotifyStore = defineStore('spotify', {
    state: () => ({
        data: [] as SpotifyTrack[],
        loading: false,
    }),
    
    actions: {
        async loadData() {
            if (this.data.length > 0) return;
            this.loading = true;
            
            try {
                const rawData = await d3.csv('/data/spotify_data clean.csv');

                this.data = rawData.map(d => {
                    let genres: string[] = [];
                    if (d.artist_genres) {
                        let cleanStr = d.artist_genres.replace(/[\[\]']/g, ""); 
                        genres = cleanStr.split(',').map(g => g.trim()).filter(g => g !== "");
                    }

                    return {
                        track_id: d.track_id,
                        track_name: d.track_name,
                        track_number: +d.track_number, 
                        track_popularity: +d.track_popularity,
                        explicit: d.explicit === 'TRUE' || d.explicit === 'True',
                        artist_name: d.artist_name,
                        artist_popularity: +d.artist_popularity,
                        artist_followers: +d.artist_followers,
                        artist_genres: genres,
                        album_id: d.album_id,
                        album_name: d.album_name,
                        album_release_date: d.album_release_date,
                        album_total_tracks: +d.album_total_tracks,
                        album_type: d.album_type,
                        track_duration_min: +d.track_duration_min
                    };
                }).filter(d => {
                    return d.track_id && !isNaN(d.track_popularity) && !isNaN(d.track_duration_min);
                }) as SpotifyTrack[];

                console.log("Data loaded:", this.data.length, "rows");
                console.log("Sample row:", this.data[0]);

            } catch (error) {
                console.error("Failed to load data:", error);
            } finally {
                this.loading = false;
            }
        }
    },
    
    getters: {
        topGenres: (state) => {
            const genreCounts: Record<string, number> = {};
            state.data.forEach(track => {
                track.artist_genres.forEach(genre => {
                    if (genre) {
                        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
                    }
                });
            });
            
            return Object.entries(genreCounts)
                .map(([genre, count]) => ({ genre, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);
        }
    }
});