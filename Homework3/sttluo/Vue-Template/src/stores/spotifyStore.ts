import { defineStore } from 'pinia';
import * as d3 from 'd3';
import { SpotifyTrack } from '../types';

// 定义 State 的接口，明确告诉 TS 我们有哪些状态
interface SpotifyState {
    data: SpotifyTrack[];
    loading: boolean;
    selectedGenre: string | null; // 明确添加这个类型
}

export const useSpotifyStore = defineStore('spotify', {
    // 显式指定返回类型为 SpotifyState
    state: (): SpotifyState => ({
        data: [],
        loading: false,
        selectedGenre: null, // 现在 TS 知道这是合法的属性了
    }),

    getters: {
        filteredData: (state): SpotifyTrack[] => {
            if (!state.selectedGenre) return state.data;
            
            return state.data.filter(track => 
                track.artist_genres.includes(state.selectedGenre!)
            );
        }
    },

    actions: {
        setSelectedGenre(genre: string | null) {
            // Toggle逻辑：如果点击已选中的，则取消选中
            if (this.selectedGenre === genre) {
                this.selectedGenre = null;
            } else {
                this.selectedGenre = genre;
            }
        },

        async loadData() {
            if (this.data.length > 0) return;
            this.loading = true;
            
            try {
                // 确保路径文件名正确
                const rawData = await d3.csv('/data/spotify_data_clean.csv');

                this.data = rawData.map((d: any) => {
                    let genres: string[] = [];
                    const rawGenreString = d.artist_genres;

                    if (rawGenreString) {
                        // 清洗数据：移除 Python 风格的符号，分割逗号
                        const cleanStr = String(rawGenreString).replace(/[\[\]'"]/g, "");
                        genres = cleanStr.split(',')
                            .map((s: string) => s.trim())
                            .filter((s: string) => s !== "");
                    }

                    return {
                        track_id: d.track_id,
                        track_name: d.track_name,
                        track_popularity: +d.track_popularity || 0,
                        artist_name: d.artist_name,
                        artist_popularity: +d.artist_popularity || 0,
                        artist_genres: genres, 
                        album_type: d.album_type,
                        // 兼容处理时长
                        track_duration_min: d.track_duration_min 
                            ? +d.track_duration_min 
                            : (+d.track_duration_ms / 60000)
                    } as SpotifyTrack;
                });
            } catch (error) {
                console.error("Failed to load CSV:", error);
            } finally {
                this.loading = false;
            }
        }
    }
});


// // src/stores/spotifyStore.ts
// import { defineStore } from 'pinia';
// import * as d3 from 'd3';
// import { SpotifyTrack } from '../types';

// export const useSpotifyStore = defineStore('spotify', {
//     state: () => ({
//         data: [] as SpotifyTrack[],
//         loading: false,
//     }),

//      // New: Track the currently selected genre for filtering
//         // 新增：记录当前选中的流派，用于联动过滤
//         selectedGenre: null as string | null,
//     }),
    
//     getters: {
//         // Getter: Return data filtered by the selected genre
//         // Getter: 返回根据选中流派过滤后的数据
//         filteredData: (state) => {
//             if (!state.selectedGenre) return state.data;
            
//             return state.data.filter(track => 
//                 track.artist_genres.includes(state.selectedGenre!)
//             );
//         }
//     },
    
//     actions: {
//          // Action to set or toggle the selected genre
//         // Action: 设置或切换选中的流派
//         setSelectedGenre(genre: string | null) {
//             // If clicking the same genre, unselect it (toggle behavior)
//             // 如果点击同一个流派，则取消选中（切换功能）
//             if (this.selectedGenre === genre) {
//                 this.selectedGenre = null;
//             } else {
//                 this.selectedGenre = genre;
//             }
//         },

//         async loadData() {
//             if (this.data.length > 0) return;
//             this.loading = true;
            
//             try {
//                 const rawData = await d3.csv('/data/spotify_data clean.csv');

//                 this.data = rawData.map(d => {
//                     let genres: string[] = [];
//                     const rawGenreString = d.artist_genres;

//                     if (d.artist_genres) {
//                         let cleanStr = d.artist_genres.replace(/[\[\]']/g, ""); 
//                         // genres = cleanStr.split(',').map(g => g.trim()).filter(g => g !== "");
//                         genres = cleanStr.split(',').map((s: string) => s.trim()).filter((s: string) => s !== "");
//                     }

//                     return {
//                         track_id: d.track_id,
//                         track_name: d.track_name,
//                         track_number: +d.track_number, 
//                         track_popularity: +d.track_popularity,
//                         explicit: d.explicit === 'TRUE' || d.explicit === 'True',
//                         artist_name: d.artist_name,
//                         artist_popularity: +d.artist_popularity,
//                         artist_followers: +d.artist_followers,
//                         artist_genres: genres,
//                         album_id: d.album_id,
//                         album_name: d.album_name,
//                         album_release_date: d.album_release_date,
//                         album_total_tracks: +d.album_total_tracks,
//                         album_type: d.album_type,
//                         track_duration_min: +d.track_duration_min
//                     };
//                 }).filter(d => {
//                     return d.track_id && !isNaN(d.track_popularity) && !isNaN(d.track_duration_min);
//                 }) as SpotifyTrack[];

//                 console.log("Data loaded:", this.data.length, "rows");
//                 console.log("Sample row:", this.data[0]);

//             } catch (error) {
//                 console.error("Failed to load data:", error);
//             } finally {
//                 this.loading = false;
//             }
//         }
//     },
    
//     getters: {
//         topGenres: (state) => {
//             const genreCounts: Record<string, number> = {};
//             state.data.forEach(track => {
//                 track.artist_genres.forEach(genre => {
//                     if (genre) {
//                         genreCounts[genre] = (genreCounts[genre] || 0) + 1;
//                     }
//                 });
//             });
            
//             return Object.entries(genreCounts)
//                 .map(([genre, count]) => ({ genre, count }))
//                 .sort((a, b) => b.count - a.count)
//                 .slice(0, 10);
//         }
//     }
// });