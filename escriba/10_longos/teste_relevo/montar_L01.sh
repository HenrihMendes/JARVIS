#!/bin/bash
# L01 completo: junta os vídeos dos capítulos (diretor.js), monta a voz (9 narrações no lugar), mixa com a trilha e aplica a camada gráfica.
# Antes: node diretor.js planos/L01_capN.json (N = 0..8) · python3 audio_L01.py · (camada) OVL=overlay_L01.html ... node overlay.js
set -e; cd "$(dirname "$0")"; mkdir -p out; P=../L01_o-caso-davi/producao
DUR=$(python3 -c "import json; print(json.load(open('planos/L01_linha.json'))['total'])")
lufs() { ffmpeg -hide_banner -i "$1" -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1 | awk '{print $2}'; }
# 1) vídeo: capítulos em sequência
ARGS=(); FC=""; for k in 0 1 2 3 4 5 6 7 8; do ARGS+=(-i out_v2/cap$k/video.mp4)
  VK=$(python3 -c "import json; L=json.load(open('planos/L01_linha.json')); V={'0': L['cap0'], **L['V']}; V['8'] = L['total'] - L['O']['8']; print(V['$k'])")
  FC+="[$k:v]fps=24,trim=duration=$VK,setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration=0.2,trim=duration=$VK,settb=1/24,format=yuv420p,setsar=1[v$k];"; done
FC+="[v0][v1][v2][v3][v4][v5][v6][v7][v8]concat=n=9:v=1:a=0[v]"
ffmpeg -y -hide_banner -loglevel error "${ARGS[@]}" -filter_complex "$FC" -map "[v]" -c:v libx264 -crf 14 -preset medium -pix_fmt yuv420p out_v2/L01_video.mp4
echo "vídeo: $(ffprobe -v error -show_entries format=duration -of csv=p=0 out_v2/L01_video.mp4) s (esperado $DUR)"
# 2) voz: cada narração no seu ponto (abertura em 0,3 s; capítulo k em O[k] + 0,3 s)
FCV=""; ARGV=(); i=0
for k in 0 1 2 3 4 5 6 7 8; do ms=$(python3 -c "import json; L=json.load(open('planos/L01_linha.json')); print(int(round((L['O']['$k'] + 0.3) * 1000)))")
  ARGV+=(-i $P/cap${k}_voz.mp3); FCV+="[$i:a]aresample=48000,pan=mono|c0=c0,adelay=$ms[a$i];"; i=$((i+1)); done
FCV+="[a0][a1][a2][a3][a4][a5][a6][a7][a8]amix=inputs=9:normalize=0,apad=whole_dur=$DUR,atrim=0:$DUR,pan=stereo|c0=c0|c1=c0,highpass=f=60,equalizer=f=180:t=q:w=1:g=1.5,equalizer=f=3200:t=q:w=1:g=1.2,acompressor=threshold=-22dB:ratio=2.5:attack=10:release=150:makeup=2[vo]"
ffmpeg -y -hide_banner -loglevel error "${ARGV[@]}" -filter_complex "$FCV" -map "[vo]" out/L01_voz_t.wav
GV=$(python3 -c "print(-16 - ($(lufs out/L01_voz_t.wav)))"); ffmpeg -y -hide_banner -loglevel error -i out/L01_voz_t.wav -af "volume=${GV}dB" out/L01_voz.wav
# 3) mixagem: trilha com ducking pela voz + efeitos; ganho linear até -14 LUFS + limitador
ffmpeg -y -hide_banner -loglevel error -i out/L01_voz.wav -i music_L01.wav -i sfx_L01.wav -filter_complex "
[0:a]asplit=2[v1][vk];[1:a]volume=0.5[m];[m][vk]sidechaincompress=threshold=0.03:ratio=5:attack=40:release=450[md];[2:a]volume=0.6[s];
[v1][md][s]amix=inputs=3:normalize=0,atrim=0:$DUR[out]" -map "[out]" -ar 48000 out/L01_mix_pre.wav
GM=$(python3 -c "print(-14 - ($(lufs out/L01_mix_pre.wav)))")
ffmpeg -y -hide_banner -loglevel error -i out/L01_mix_pre.wav -af "volume=${GM}dB,alimiter=limit=0.89:attack=5:release=60:level=disabled" -ar 48000 out/L01_mix.wav
echo "ganho voz ${GV} dB · ganho mix ${GM} dB"
# 4) final: cor + grão + vinheta + camada gráfica
ffmpeg -y -hide_banner -loglevel error -i out_v2/L01_video.mp4 -f concat -safe 0 -i overlay_L01.ffconcat -i out/L01_mix.wav -filter_complex "
[0:v]colorbalance=rs=-0.03:gs=-0.01:bs=0.05:rh=0.04:gh=0.01:bh=-0.04,eq=contrast=1.06:saturation=1.06:gamma=1.05,unsharp=5:5:0.35,noise=alls=7:allf=t+u,vignette=angle=PI/5:mode=forward[bg];
[1:v]fps=24,format=rgba[ov];[bg][ov]overlay=0:0:format=auto:shortest=1,format=yuv420p[v]" \
 -map "[v]" -map 2:a -c:v libx264 -preset slow -crf 18 -profile:v high -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -movflags +faststart -t $DUR out/L01_O_caso_Davi.mp4
ls -la out/L01_O_caso_Davi.mp4
