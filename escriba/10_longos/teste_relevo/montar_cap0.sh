#!/bin/bash
# Mixagem (voz + trilha com ducking + efeitos) e montagem final (cor + grão + vinheta + camada gráfica)
set -e; cd "$(dirname "$0")"; DUR=57.2; VOZ=${VOZ:-../L01_o-caso-davi/producao/cap0_voz.mp3}; mkdir -p out
lufs() { ffmpeg -hide_banner -i "$1" -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1 | awk '{print $2}'; }
# 1) voz tratada (sem loudnorm dinâmico: ganho linear até -16 LUFS, para não "bombear" as pausas)
ffmpeg -y -hide_banner -loglevel error -i "$VOZ" -af "aresample=48000,pan=stereo|c0=c0|c1=c0,highpass=f=60,equalizer=f=180:t=q:w=1:g=1.5,equalizer=f=3200:t=q:w=1:g=1.2,acompressor=threshold=-22dB:ratio=2.5:attack=10:release=150:makeup=2" out/c0_voz_t.wav
GV=$(python3 -c "print(-16 - ($(lufs out/c0_voz_t.wav)))")
ffmpeg -y -hide_banner -loglevel error -i out/c0_voz_t.wav -af "volume=${GV}dB,adelay=300|300,apad=whole_dur=$DUR,atrim=0:$DUR" out/c0_voz.wav
# 2) mixagem: trilha com ducking pela voz + efeitos
ffmpeg -y -hide_banner -loglevel error -i out/c0_voz.wav -i music_cap0.wav -i sfx_cap0.wav -filter_complex "
[0:a]asplit=2[v1][vk];
[1:a]volume=0.5[m];[m][vk]sidechaincompress=threshold=0.03:ratio=5:attack=40:release=450[md];
[2:a]volume=0.6[s];
[v1][md][s]amix=inputs=3:normalize=0,atrim=0:$DUR[out]" -map "[out]" -ar 48000 out/c0_mix_pre.wav
# 3) ganho linear até -14 LUFS + limitador de pico em -1 dB
GM=$(python3 -c "print(-14 - ($(lufs out/c0_mix_pre.wav)))")
ffmpeg -y -hide_banner -loglevel error -i out/c0_mix_pre.wav -af "volume=${GM}dB,alimiter=limit=0.89:attack=5:release=60:level=disabled" -ar 48000 out/c0_mix.wav
echo "ganho voz ${GV} dB · ganho mix ${GM} dB"
ffmpeg -y -hide_banner -loglevel error -framerate 24 -i frames0/f%05d.png -f concat -safe 0 -i overlay_cap0.ffconcat -i out/c0_mix.wav -filter_complex "
[0:v]colorbalance=rs=-0.03:gs=-0.01:bs=0.05:rh=0.04:gh=0.01:bh=-0.04,eq=contrast=1.06:saturation=1.06:gamma=1.05,unsharp=5:5:0.35,noise=alls=7:allf=t+u,vignette=angle=PI/5:mode=forward[bg];
[1:v]fps=24,format=rgba[ov];[bg][ov]overlay=0:0:format=auto:shortest=1,format=yuv420p[v]" \
 -map "[v]" -map 2:a -c:v libx264 -preset slow -crf 17 -profile:v high -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -movflags +faststart -t $DUR out/L01_cap0_master.mp4
ffmpeg -y -hide_banner -loglevel error -i out/L01_cap0_master.mp4 -c:v libx264 -preset slow -crf 21 -maxrate 9M -bufsize 18M -c:a copy -movflags +faststart out/L01_cap0_abertura.mp4
ls -la out
