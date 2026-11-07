#!/usr/bin/env bash
# Deploy the portfolio to a VPS over SSH.
#
#   ./portfolio/deploy.sh <ssh-host> [port]
#
# <ssh-host> is a Host from your ~/.ssh/config (e.g. hermes). The site is
# copied to ~/srikar-portfolio on the server and served on [port] (default 8080)
# with Python's built-in web server. Re-run it any time to update the site.
set -euo pipefail

HOST="${1:?usage: deploy.sh <ssh-host> [port]}"
PORT="${2:-8080}"
DIR="srikar-portfolio"
HERE="$(cd "$(dirname "$0")" && pwd)"

echo "→ Copying site to $HOST:~/$DIR"
rsync -az --delete --exclude 'deploy.sh' --exclude 'README.md' "$HERE/" "$HOST:$DIR/"

echo "→ (Re)starting web server on port $PORT"
ssh "$HOST" "cd ~/$DIR && (pkill -f 'http.server $PORT' || true) && nohup python3 -m http.server $PORT --bind 0.0.0.0 > server.log 2>&1 < /dev/null &"

ADDR="$(ssh -G "$HOST" | awk '/^hostname /{print $2}')"
sleep 1
if ssh "$HOST" "curl -fsS -o /dev/null http://localhost:$PORT/"; then
  echo "✓ Live at http://$ADDR:$PORT"
  echo "  (If it doesn't load, open port $PORT in the VPS firewall, e.g. 'sudo ufw allow $PORT'.)"
else
  echo "✗ Server didn't respond. Check ~/$DIR/server.log on $HOST." >&2
  exit 1
fi
