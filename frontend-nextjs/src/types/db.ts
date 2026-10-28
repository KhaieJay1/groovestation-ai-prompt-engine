export interface Song {
    song_id: string;
    title: string;
    prompt_version_id: string;
    style_id: string;
    suno_link: string;
    generated_date: string;
    duration_seconds: number;
    subjective_rating: number;
    similarity_tag: string;
    approved_for_release: boolean;
    release_date: string;
    platform_youtube: string;
    platform_spotify: string;
    download_status: 'Pending' | 'Downloaded' | 'Failed';
    local_file_path: string;
    notes: string;
    style_name?: string;
    style_color?: string;
}

export interface Style {
    style_id: string;
    style_name: string;
    color_tag: string;
}

export interface Playlist {
    id: number;
    name: string;
    collection_name?: string;
    status: string;
    youtube_title?: string;
    view_count?: number;
    youtube_link?: string;
}
