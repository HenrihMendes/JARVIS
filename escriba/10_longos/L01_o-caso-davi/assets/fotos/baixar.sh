#!/bin/bash
# Baixa as fotos (licenças em CREDITOS.md) do Wikimedia Commons e gera versões em proc/ (orientação EXIF corrigida, até 2560 px)
cd "$(dirname "$0")"; UA="DocResearchScript/1.0 (non-commercial research)"; B=https://upload.wikimedia.org/wikipedia/commons
get(){ [ -s "$1" ] && return; for k in 1 2 3 4 5 6; do code=$(curl -sS -m 180 -A "$UA" -o "$1" -w "%{http_code}" "$2"); [ "$code" = "200" ] && return; rm -f "$1"; sleep $((k*30)); done; echo "falhou: $1"; }
get estela_tel_dan.jpg "$B/7/7e/Tel_dan_inscription.JPG"
get estela_mesa_louvre.jpg "$B/1/15/Mesha_stele_%28Louvre%2C_AO_5066%29.jpg"
get karnak_portal_bubastita.jpg "$B/3/33/Karnak_Tempel_Bubastis-Portal_01.JPG"
get lista_sisaque.jpg "$B/4/48/Shishak-List_-1914344462.jpg"
get khirbet_qeiyafa.jpg "$B/a/aa/View_of_Khirbet_Qeiyafa.jpg"
get vale_de_ela.jpg "$B/5/54/The_Elah_valley.jpg"
get tel_dan_portao.jpg "$B/a/a6/Tel_Dan_-_Israelite_Gate.jpg"
get obelisco_negro.jpg "$B/3/31/Black_Obelisk%2C_four_faces.jpg"
mkdir -p proc && python3 -c "
from PIL import Image, ImageOps; import glob
for f in glob.glob('*.jpg'):
    im = ImageOps.exif_transpose(Image.open(f)).convert('RGB'); im.thumbnail((2560, 2560)); im.save('proc/' + f, quality=92)"
