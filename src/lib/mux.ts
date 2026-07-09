export function getMuxPlaybackUrl(playbackId?: string) {
  if (!playbackId) return '';
  return `https://stream.mux.com/${playbackId}.m3u8`;
}
