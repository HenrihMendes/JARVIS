#!/bin/bash
# Baixa as fotos (licenças em CREDITOS.md) do Wikimedia Commons e gera versões em proc/ (orientação EXIF corrigida).
# Regras do Wikimedia (aprendidas em 11/11/2026):
#  - o User-Agent PRECISA ter contato (site ou e-mail), senão volta 429 "robot policy";
#  - mesmo identificado, o IP compartilhado da nuvem é limitado: usar MINIATURAS em tamanho padrão (1920 px) e pausas longas.
# Uso: WIKI_UA="NomeDoApp/1.0 (https://link-do-canal; email-de-contato)" bash baixar.sh
cd "$(dirname "$0")"; UA=${WIKI_UA:-"EscribaPesquisa/1.0 (https://youtube.com/@escribatv.oficial) curl/8"}; T=https://upload.wikimedia.org/wikipedia/commons/thumb
get(){ [ -s "$1" ] && return; local n=${2#*/*/}; for k in 1 2 3 4 5 6; do code=$(curl -sS -m 180 -A "$UA" -o "$1" -w "%{http_code}" "$T/$2/1920px-$n"); [ "$code" = "200" ] && { echo "ok: $1"; sleep 20; return; }; rm -f "$1"; echo "$1: $code, nova tentativa em $((k*60)) s"; sleep $((k*60)); done; echo "falhou: $1"; }
# usadas na abertura (P08) primeiro
get tel_dan_portao.jpg "a/a6/Tel_Dan_-_Israelite_Gate.jpg"
get estela_mesa_louvre.jpg "1/15/Mesha_stele_%28Louvre%2C_AO_5066%29.jpg"
get lista_sisaque.jpg "4/48/Shishak-List_-1914344462.jpg"
# as que faltavam desde a 1ª sessão (para os caps. 3 a 6)
get estela_tel_dan.jpg "7/7e/Tel_dan_inscription.JPG"
get karnak_portal_bubastita.jpg "3/33/Karnak_Tempel_Bubastis-Portal_01.JPG"
get khirbet_qeiyafa.jpg "a/aa/View_of_Khirbet_Qeiyafa.jpg"
get vale_de_ela.jpg "5/54/The_Elah_valley.jpg"
get obelisco_negro.jpg "3/31/Black_Obelisk%2C_four_faces.jpg"
mkdir -p proc && python3 -c "
from PIL import Image, ImageOps; import glob
for f in glob.glob('*.jpg'):
    im = ImageOps.exif_transpose(Image.open(f)).convert('RGB'); im.thumbnail((2560, 2560)); im.save('proc/' + f, quality=92)"
echo FIM
